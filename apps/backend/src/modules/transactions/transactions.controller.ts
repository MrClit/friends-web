import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

/**
 * Controller for nested routes under events
 * Handles: /api/events/:eventId/transactions
 */
@Controller('events/:eventId/transactions')
export class EventTransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * GET /api/events/:eventId/transactions
   * Get all transactions for an event
   */
  @Get()
  findByEvent(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.transactionsService.findByEvent(eventId);
  }

  /**
   * GET /api/events/:eventId/transactions/paginated
   * Get paginated transactions grouped by unique dates
   */
  @Get('paginated')
  findByEventPaginated(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Query('numberOfDates', new ParseIntPipe({ optional: true }))
    numberOfDates?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.transactionsService.findByEventPaginated(
      eventId,
      numberOfDates,
      offset,
    );
  }

  /**
   * POST /api/events/:eventId/transactions
   * Create a new transaction for an event
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(eventId, createTransactionDto);
  }
}

/**
 * Controller for individual transaction operations
 * Handles: /api/transactions/:id
 */
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * GET /api/transactions/:id
   * Get a single transaction by ID
   */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.transactionsService.findOne(id);
  }

  /**
   * PATCH /api/transactions/:id
   * Update a transaction
   */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(id, updateTransactionDto);
  }

  /**
   * DELETE /api/transactions/:id
   * Delete a transaction
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.transactionsService.remove(id);
  }
}
