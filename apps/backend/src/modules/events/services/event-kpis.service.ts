import { Injectable, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Decimal from 'decimal.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.type';
import { Event } from '../entities/event.entity';
import { TransactionsService } from '../../transactions/transactions.service';
import { EventKPIsDto } from '../dto/event-kpis.dto';

Decimal.set({ rounding: Decimal.ROUND_HALF_EVEN });

@Injectable()
export class EventKPIsService {
  private readonly logger = new Logger(EventKPIsService.name);
  private static readonly POT_PARTICIPANT_ID = '0';

  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    private readonly transactionsService: TransactionsService,
  ) {}

  /**
   * Get KPIs for a specific event
   *
   * Calculation uses three layers:
   *
   * Layer A: Pot balance (unchanged from original)
   *   potBalance = totalCashContributions - totalCompensations - potExpenses
   *   Reconciliation: inflows - outflows == potBalance
   *
   * Layer B: Net contribution per participant (for KPI Contributions)
   *   participantNetContribution[i] = contributions[i] + expenses[i] - compensations[i]
   *   totalContributions = Σ participantNetContribution[i]
   *
   * Layer C: Pending delta vs target (for KPI Pending)
   *   participantPending[i] = participantNetContribution[i] - contributionTarget[i]
   *   pendingToCompensate = Σ participantPending[i]  (can be negative)
   */
  async getKPIs(eventId: string, actor: AuthenticatedUser): Promise<EventKPIsDto> {
    try {
      this.logger.log(`Calculating KPIs for event: ${eventId}`);

      const event = await this.eventRepository.findOne({ where: { id: eventId } });
      if (!event) {
        throw new NotFoundException(`Event with ID ${eventId} not found`);
      }

      const transactions = await this.transactionsService.findByEvent(eventId, actor);

      // ========================
      // Layer A: Pot balance logic
      // ========================
      let totalCashContributions = new Decimal(0);
      let totalExpenses = new Decimal(0);
      let totalCompensations = new Decimal(0);
      let potExpenses = new Decimal(0);

      const participantDirectContributions: Record<string, Decimal> = {};
      const participantDirectExpenses: Record<string, Decimal> = {};
      const participantDirectCompensations: Record<string, Decimal> = {};
      const potExpensesTransactions: Array<{ id: string; title: string; amount: number; date: string }> = [];

      for (const transaction of transactions) {
        const { participantId, paymentType, amount } = transaction;
        const decAmount = new Decimal(String(amount));

        if (!decAmount.isFinite()) {
          this.logger.warn(`Skipping transaction ${transaction.id} due to invalid amount: ${String(amount)}`);
          continue;
        }

        if (participantId !== EventKPIsService.POT_PARTICIPANT_ID) {
          if (participantDirectContributions[participantId] === undefined) {
            participantDirectContributions[participantId] = new Decimal(0);
            participantDirectExpenses[participantId] = new Decimal(0);
            participantDirectCompensations[participantId] = new Decimal(0);
          }

          switch (paymentType) {
            case 'contribution':
              totalCashContributions = totalCashContributions.plus(decAmount);
              participantDirectContributions[participantId] = participantDirectContributions[participantId].plus(decAmount);
              break;
            case 'expense':
              totalExpenses = totalExpenses.plus(decAmount);
              participantDirectExpenses[participantId] = participantDirectExpenses[participantId].plus(decAmount);
              break;
            case 'compensation':
              totalCompensations = totalCompensations.plus(decAmount);
              participantDirectCompensations[participantId] = participantDirectCompensations[participantId].plus(decAmount);
              break;
          }
        } else if (paymentType === 'expense') {
          potExpenses = potExpenses.plus(decAmount);
          totalExpenses = totalExpenses.plus(decAmount);

          const dateValue =
            transaction.date instanceof Date ? transaction.date.toISOString() : String(transaction.date);
          const normalizedDate = dateValue.includes('T') ? dateValue.split('T')[0] : dateValue;

          potExpensesTransactions.push({
            id: transaction.id,
            title: transaction.title,
            amount: decAmount.toNumber(),
            date: normalizedDate,
          });
        }
      }

      // ========================
      // Layer B & C: Per-participant net contribution and pending vs target
      // ========================

      const targetByParticipantId: Record<string, Decimal> = {};
      const eventParticipants = event.participants ?? [];
      for (const p of eventParticipants) {
        if (p.type === 'user' || p.type === 'guest') {
          targetByParticipantId[p.id] = new Decimal(String(p.contributionTarget ?? 0));
        }
      }

      const participantContributions: Record<string, Decimal> = {};
      const participantExpenses: Record<string, Decimal> = {};
      const participantCompensations: Record<string, Decimal> = {};
      const participantPending: Record<string, Decimal> = {};
      const participantBalances: Record<string, Decimal> = {};

      for (const p of eventParticipants) {
        if (p.type !== 'pot') {
          participantContributions[p.id] = new Decimal(0);
          participantExpenses[p.id] = new Decimal(0);
          participantCompensations[p.id] = new Decimal(0);
          participantBalances[p.id] = new Decimal(0);
        }
      }

      for (const transaction of transactions) {
        const { participantId, paymentType, amount } = transaction;
        const decAmount = new Decimal(String(amount));

        if (!decAmount.isFinite() || participantId === EventKPIsService.POT_PARTICIPANT_ID) {
          continue;
        }

        if (participantContributions[participantId] === undefined) {
          participantContributions[participantId] = new Decimal(0);
          participantExpenses[participantId] = new Decimal(0);
          participantCompensations[participantId] = new Decimal(0);
          participantBalances[participantId] = new Decimal(0);
        }

        switch (paymentType) {
          case 'contribution':
            participantContributions[participantId] = participantContributions[participantId].plus(decAmount);
            participantBalances[participantId] = participantBalances[participantId].plus(decAmount);
            break;
          case 'expense':
            participantExpenses[participantId] = participantExpenses[participantId].plus(decAmount);
            participantBalances[participantId] = participantBalances[participantId].plus(decAmount);
            break;
          case 'compensation':
            participantCompensations[participantId] = participantCompensations[participantId].plus(decAmount);
            participantBalances[participantId] = participantBalances[participantId].minus(decAmount);
            break;
        }
      }

      let totalNetContribution = new Decimal(0);
      let totalPendingToCompensate = new Decimal(0);

      for (const participantId of Object.keys(participantContributions)) {
        const netContribution = participantContributions[participantId]
          .plus(participantExpenses[participantId])
          .minus(participantCompensations[participantId]);
        const target = targetByParticipantId[participantId] ?? new Decimal(0);

        participantContributions[participantId] = netContribution;
        participantPending[participantId] = netContribution.minus(target);

        totalNetContribution = totalNetContribution.plus(netContribution);
        totalPendingToCompensate = totalPendingToCompensate.plus(participantPending[participantId]);
      }

      // ========================
      // Final KPI values
      // ========================
      const potBalance = totalCashContributions.minus(totalCompensations).minus(potExpenses);

      const participantNetWithPot: Record<string, number> = {};
      for (const participantId of Object.keys(participantContributions)) {
        const cashContribution = participantDirectContributions[participantId] ?? new Decimal(0);
        const compensation = participantDirectCompensations[participantId] ?? new Decimal(0);
        participantNetWithPot[participantId] = cashContribution.minus(compensation).toNumber();
      }

      const inflowsTotal = totalCashContributions;
      const outflowsTotal = totalCompensations.plus(potExpenses);
      const isConsistent = inflowsTotal.minus(outflowsTotal).equals(potBalance);

      if (!isConsistent) {
        this.logger.warn(
          `Pot balance reconciliation mismatch for event ${eventId}: inflows=${inflowsTotal.toFixed(2)}, outflows=${outflowsTotal.toFixed(2)}, potBalance=${potBalance.toFixed(2)}`,
        );
      }

      return {
        totalExpenses: totalExpenses.toNumber(),
        totalContributions: totalNetContribution.toNumber(),
        totalCompensations: totalCompensations.toNumber(),
        potBalance: potBalance.toNumber(),
        pendingToCompensate: totalPendingToCompensate.toNumber(),
        participantBalances: toNumberRecord(participantBalances),
        participantContributions: toNumberRecord(participantContributions),
        participantExpenses: toNumberRecord(participantExpenses),
        participantCompensations: toNumberRecord(participantCompensations),
        participantPending: toNumberRecord(participantPending),
        potExpenses: potExpenses.toNumber(),
        balanceBreakdown: {
          inflows: {
            total: inflowsTotal.toNumber(),
            contributionsByParticipant: toNumberRecord(participantDirectContributions),
          },
          outflows: {
            total: outflowsTotal.toNumber(),
            compensationsTotal: totalCompensations.toNumber(),
            compensationsByParticipant: toNumberRecord(participantDirectCompensations),
            potExpensesTotal: potExpenses.toNumber(),
            potExpensesTransactions,
          },
          participantNetWithPot,
          reconciliation: {
            inflows: inflowsTotal.toNumber(),
            outflows: outflowsTotal.toNumber(),
            potBalance: potBalance.toNumber(),
            isConsistent,
          },
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const err = error as Error;
      this.logger.error(`Failed to calculate KPIs for event ${eventId}: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Failed to calculate KPIs');
    }
  }
}

function toNumberRecord(record: Record<string, Decimal>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [k, v] of Object.entries(record)) {
    result[k] = v.toNumber();
  }
  return result;
}
