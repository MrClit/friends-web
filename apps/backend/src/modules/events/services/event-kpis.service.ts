import { Injectable, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.type';
import { Event } from '../entities/event.entity';
import { TransactionsService } from '../../transactions/transactions.service';
import { EventKPIsDto } from '../dto/event-kpis.dto';

@Injectable()
export class EventKPIsService {
  private readonly logger = new Logger(EventKPIsService.name);
  private static readonly POT_PARTICIPANT_ID = '0';
  private static readonly RECONCILIATION_TOLERANCE = 0.000001;

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

      // Fetch event with participants to access contribution targets
      const event = await this.eventRepository.findOne({ where: { id: eventId } });
      if (!event) {
        throw new NotFoundException(`Event with ID ${eventId} not found`);
      }

      // Get all transactions for the event
      const transactions = await this.transactionsService.findByEvent(eventId, actor);

      // ========================
      // Layer A: Pot balance logic
      // ========================
      let totalCashContributions = 0; // Only direct contributions paid in
      let totalExpenses = 0;
      let totalCompensations = 0;
      let potExpenses = 0;

      const participantDirectContributions: Record<string, number> = {}; // For pot balance calc
      const participantDirectExpenses: Record<string, number> = {}; // For pot balance calc
      const participantDirectCompensations: Record<string, number> = {}; // For pot balance calc
      const potExpensesTransactions: Array<{ id: string; title: string; amount: number; date: string }> = [];

      // First pass: aggregate for pot balance layer
      transactions.forEach((transaction) => {
        const { participantId, paymentType, amount } = transaction;
        const numAmount = Number(amount);

        if (!Number.isFinite(numAmount)) {
          this.logger.warn(`Skipping transaction ${transaction.id} due to invalid amount: ${String(amount)}`);
          return;
        }

        if (participantId !== EventKPIsService.POT_PARTICIPANT_ID) {
          if (participantDirectContributions[participantId] === undefined) {
            participantDirectContributions[participantId] = 0;
            participantDirectExpenses[participantId] = 0;
            participantDirectCompensations[participantId] = 0;
          }

          switch (paymentType) {
            case 'contribution':
              totalCashContributions += numAmount;
              participantDirectContributions[participantId] += numAmount;
              break;
            case 'expense':
              totalExpenses += numAmount;
              participantDirectExpenses[participantId] += numAmount;
              break;
            case 'compensation':
              totalCompensations += numAmount;
              participantDirectCompensations[participantId] += numAmount;
              break;
          }
        } else if (paymentType === 'expense') {
          potExpenses += numAmount;
          totalExpenses += numAmount;

          const dateValue =
            transaction.date instanceof Date ? transaction.date.toISOString() : String(transaction.date);
          const normalizedDate = dateValue.includes('T') ? dateValue.split('T')[0] : dateValue;

          potExpensesTransactions.push({
            id: transaction.id,
            title: transaction.title,
            amount: numAmount,
            date: normalizedDate,
          });
        }
      });

      // ========================
      // Layer B & C: Per-participant net contribution and pending vs target
      // ========================

      // Build target map from event participants
      const targetByParticipantId: Record<string, number> = {};
      const eventParticipants = event.participants ?? [];
      for (const p of eventParticipants) {
        if (p.type === 'user' || p.type === 'guest') {
          targetByParticipantId[p.id] = p.contributionTarget ?? 0;
        }
      }

      const participantContributions: Record<string, number> = {}; // Net: C + E - R
      const participantExpenses: Record<string, number> = {};
      const participantCompensations: Record<string, number> = {};
      const participantPending: Record<string, number> = {}; // Net contribution - target
      const participantBalances: Record<string, number> = {}; // Old semantics: C + E - R (same as net contribution)

      // Initialize maps for all non-pot participants (ensures all appear in output)
      for (const p of eventParticipants) {
        if (p.type !== 'pot') {
          participantContributions[p.id] = 0;
          participantExpenses[p.id] = 0;
          participantCompensations[p.id] = 0;
          participantBalances[p.id] = 0;
        }
      }

      // Second pass: calculate net contribution per participant
      let totalNetContribution = 0;
      let totalPendingToCompensate = 0;
      transactions.forEach((transaction) => {
        const { participantId, paymentType, amount } = transaction;
        const numAmount = Number(amount);

        if (!Number.isFinite(numAmount) || participantId === EventKPIsService.POT_PARTICIPANT_ID) {
          return;
        }

        if (participantContributions[participantId] === undefined) {
          participantContributions[participantId] = 0;
          participantExpenses[participantId] = 0;
          participantCompensations[participantId] = 0;
          participantBalances[participantId] = 0;
        }

        switch (paymentType) {
          case 'contribution':
            participantContributions[participantId] += numAmount;
            participantBalances[participantId] += numAmount;
            break;
          case 'expense':
            participantExpenses[participantId] += numAmount;
            participantBalances[participantId] += numAmount;
            break;
          case 'compensation':
            participantCompensations[participantId] += numAmount;
            participantBalances[participantId] -= numAmount;
            break;
        }
      });

      // Calculate net contribution per participant (C + E - R) and pending vs target
      for (const participantId of Object.keys(participantContributions)) {
        const netContribution =
          participantContributions[participantId] +
          participantExpenses[participantId] -
          participantCompensations[participantId];
        const target = targetByParticipantId[participantId] ?? 0;

        // Update participantContributions to reflect net (not just cash contributions)
        participantContributions[participantId] = netContribution;

        // Calculate pending: how much this participant still owes/is owed vs their target
        participantPending[participantId] = netContribution - target;

        totalNetContribution += netContribution;
        totalPendingToCompensate += participantPending[participantId];
      }

      // ========================
      // Final KPI values
      // ========================
      const potBalance = totalCashContributions - totalCompensations - potExpenses;
      const pendingToCompensate = totalPendingToCompensate;

      // Build participantNetWithPot for balance breakdown (unchanged semantics)
      const participantNetWithPot: Record<string, number> = {};
      Object.keys(participantContributions).forEach((participantId) => {
        const cashContribution = participantDirectContributions[participantId] || 0;
        const compensation = participantDirectCompensations[participantId] || 0;
        participantNetWithPot[participantId] = cashContribution - compensation;
      });

      // Pot balance reconciliation (using cash contributions for pot formula)
      const inflowsTotal = totalCashContributions;
      const outflowsTotal = totalCompensations + potExpenses;
      const isConsistent =
        Math.abs(inflowsTotal - outflowsTotal - potBalance) <= EventKPIsService.RECONCILIATION_TOLERANCE;

      if (!isConsistent) {
        this.logger.warn(
          `Pot balance reconciliation mismatch for event ${eventId}: inflows=${inflowsTotal}, outflows=${outflowsTotal}, potBalance=${potBalance}`,
        );
      }

      return {
        totalExpenses,
        totalContributions: totalNetContribution, // Net: C + E - R summed
        totalCompensations,
        potBalance,
        pendingToCompensate, // Sum of (net contribution - target) for all participants
        participantBalances,
        participantContributions, // Now reflects net contribution, not just cash
        participantExpenses,
        participantCompensations,
        participantPending, // Now reflects pending vs target
        potExpenses,
        balanceBreakdown: {
          inflows: {
            total: inflowsTotal,
            contributionsByParticipant: participantDirectContributions, // Only cash contributions for balance
          },
          outflows: {
            total: outflowsTotal,
            compensationsTotal: totalCompensations,
            compensationsByParticipant: participantDirectCompensations,
            potExpensesTotal: potExpenses,
            potExpensesTransactions,
          },
          participantNetWithPot,
          reconciliation: {
            inflows: inflowsTotal,
            outflows: outflowsTotal,
            potBalance,
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
