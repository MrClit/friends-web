import { Injectable, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../entities/event.entity';
import { TransactionsService } from '../../transactions/transactions.service';
import { EventKPIsDto } from '../dto/event-kpis.dto';

@Injectable()
export class EventKPIsService {
  private readonly logger = new Logger(EventKPIsService.name);

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

      const POT_PARTICIPANT_ID = '0';

      // Calculate KPIs from transactions
      transactions.forEach((transaction) => {
        const { participantId, paymentType, amount } = transaction;
        // Ensure amount is a number
        const numAmount = Number(amount);

        // Skip pot participant for balance calculations
        if (participantId !== POT_PARTICIPANT_ID) {
          // Initialize participant balances if not exists
          if (!participantBalances[participantId]) {
            participantBalances[participantId] = 0;
            participantContributions[participantId] = 0;
            participantExpenses[participantId] = 0;
            participantCompensations[participantId] = 0;
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
              participantBalances[participantId] -= numAmount;
              break;
            case 'compensation':
              totalCompensations += numAmount;
              participantCompensations[participantId] += numAmount;
              participantBalances[participantId] -= numAmount;
              break;
          }
        } else if (paymentType === 'expense') {
          // Pot expenses (special case)
          potExpenses += numAmount;
          totalExpenses += numAmount;
        }
      });

      // Calculate pot balance and pending compensation
      const potBalance = totalContributions - totalCompensations - totalExpenses;
      const pendingToCompensate = totalExpenses - totalCompensations;

      // Calculate pending per participant (expenses - compensations)
      const participantPending: Record<string, number> = {};
      Object.keys(participantExpenses).forEach((participantId) => {
        const pending = participantExpenses[participantId] - (participantCompensations[participantId] || 0);
        if (pending > 0) {
          participantPending[participantId] = pending;
        }
      });

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
