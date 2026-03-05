import { Injectable, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
   */
  async getKPIs(eventId: string): Promise<EventKPIsDto> {
    try {
      this.logger.log(`Calculating KPIs for event: ${eventId}`);

      // Ensure event exists
      const event = await this.eventRepository.findOne({ where: { id: eventId } });
      if (!event) {
        throw new NotFoundException(`Event with ID ${eventId} not found`);
      }

      // Get all transactions for the event
      const transactions = await this.transactionsService.findByEvent(eventId);

      // Initialize KPI values
      let totalExpenses = 0;
      let totalContributions = 0;
      let totalCompensations = 0;
      let potExpenses = 0;

      const participantBalances: Record<string, number> = {};
      const participantContributions: Record<string, number> = {};
      const participantExpenses: Record<string, number> = {};
      const participantCompensations: Record<string, number> = {};
      const participantPending: Record<string, number> = {};
      const potExpensesTransactions: Array<{ id: string; title: string; amount: number; date: string }> = [];

      // Calculate KPIs from transactions
      transactions.forEach((transaction) => {
        const { participantId, paymentType, amount } = transaction;
        // Ensure amount is a number
        const numAmount = Number(amount);

        if (!Number.isFinite(numAmount)) {
          this.logger.warn(`Skipping transaction ${transaction.id} due to invalid amount: ${String(amount)}`);
          return;
        }

        // Skip pot participant for balance calculations
        if (participantId !== EventKPIsService.POT_PARTICIPANT_ID) {
          // Initialize participant balances if not exists
          if (participantBalances[participantId] === undefined) {
            participantBalances[participantId] = 0;
            participantContributions[participantId] = 0;
            participantExpenses[participantId] = 0;
            participantCompensations[participantId] = 0;
            participantPending[participantId] = 0;
          }

          // Update balances based on payment type
          switch (paymentType) {
            case 'contribution':
              totalContributions += numAmount;
              participantContributions[participantId] += numAmount;
              participantBalances[participantId] += numAmount;
              break;
            case 'expense':
              totalExpenses += numAmount;
              participantExpenses[participantId] += numAmount;
              participantBalances[participantId] += numAmount;
              participantPending[participantId] += numAmount;
              break;
            case 'compensation':
              totalCompensations += numAmount;
              participantCompensations[participantId] += numAmount;
              participantBalances[participantId] -= numAmount;
              participantPending[participantId] -= numAmount;
              break;
          }
        } else if (paymentType === 'expense') {
          // Pot expenses (special case)
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

      // Calculate pot balance and pending compensation
      const potBalance = totalContributions - totalCompensations - potExpenses;
      const pendingToCompensate = totalExpenses - potExpenses - totalCompensations;

      const participantNetWithPot: Record<string, number> = {};
      Object.keys(participantBalances).forEach((participantId) => {
        participantNetWithPot[participantId] =
          participantContributions[participantId] - participantCompensations[participantId];
      });

      const inflowsTotal = totalContributions;
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
        totalContributions,
        totalCompensations,
        potBalance,
        pendingToCompensate,
        participantBalances,
        participantContributions,
        participantExpenses,
        participantCompensations,
        participantPending,
        potExpenses,
        balanceBreakdown: {
          inflows: {
            total: inflowsTotal,
            contributionsByParticipant: participantContributions,
          },
          outflows: {
            total: outflowsTotal,
            compensationsTotal: totalCompensations,
            compensationsByParticipant: participantCompensations,
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
