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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ApiStandardResponse } from '../../common/decorators/api-standard-response.decorator';
import { ApiErrorResponseDto } from '../../common/dto/api-error-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { Transaction } from './entities/transaction.entity';
import { RolesGuard } from '../auth/roles/roles.guard';
import { AuthGuard } from '@nestjs/passport/dist/auth.guard';

/**
 * Controller for nested routes under events
 * Handles: /api/events/:eventId/transactions
 */
@ApiTags('Event Transactions')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Unauthorized', type: ApiErrorResponseDto })
@ApiResponse({ status: 403, description: 'Forbidden', type: ApiErrorResponseDto })
@Controller('events/:eventId/transactions')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class EventTransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * GET /api/events/:eventId/transactions/paginated
   * Get paginated transactions grouped by unique dates
   * NOTE: This route must be declared BEFORE the generic GET / route
   * to avoid being captured by the more generic route pattern
   */
  @Get('paginated')
  @ApiOperation({ summary: 'Get paginated transactions grouped by dates' })
  @ApiParam({
    name: 'eventId',
    description: 'Event UUID',
    type: String,
    format: 'uuid',
  })
  @ApiStandardResponse(200, 'Paginated transactions retrieved successfully')
  @ApiResponse({ status: 404, description: 'Event not found', type: ApiErrorResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid query parameters', type: ApiErrorResponseDto })
  findByEventPaginated(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transactionsService.findByEventPaginated(eventId, query.numberOfDates, query.offset, user);
  }

  /**
   * GET /api/events/:eventId/transactions
   * Get all transactions for an event
   */
  @Get()
  @ApiOperation({ summary: 'Get all transactions for an event' })
  @ApiParam({
    name: 'eventId',
    description: 'Event UUID',
    type: String,
    format: 'uuid',
  })
  @ApiStandardResponse(200, 'Transactions retrieved successfully', Transaction, true)
  @ApiResponse({ status: 404, description: 'Event not found', type: ApiErrorResponseDto })
  findByEvent(@Param('eventId', ParseUUIDPipe) eventId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.transactionsService.findByEvent(eventId, user);
  }

  /**
   * POST /api/events/:eventId/transactions
   * Create a new transaction for an event
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new transaction for an event' })
  @ApiParam({
    name: 'eventId',
    description: 'Event UUID',
    type: String,
    format: 'uuid',
  })
  @ApiStandardResponse(201, 'Transaction created successfully', Transaction)
  @ApiResponse({ status: 400, description: 'Invalid input', type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Event not found', type: ApiErrorResponseDto })
  create(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() createTransactionDto: CreateTransactionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transactionsService.create(eventId, createTransactionDto, user);
  }
}

/**
 * Controller for individual transaction operations
 * Handles: /api/transactions/:id
 */
@ApiTags('Transactions')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Unauthorized', type: ApiErrorResponseDto })
@ApiResponse({ status: 403, description: 'Forbidden', type: ApiErrorResponseDto })
@Controller('transactions')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * GET /api/transactions/:id
   * Get a single transaction by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a single transaction by ID' })
  @ApiParam({
    name: 'id',
    description: 'Transaction UUID',
    type: String,
    format: 'uuid',
  })
  @ApiStandardResponse(200, 'Transaction retrieved successfully', Transaction)
  @ApiResponse({ status: 404, description: 'Transaction not found', type: ApiErrorResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.transactionsService.findOne(id, user);
  }

  /**
   * PATCH /api/transactions/:id
   * Update a transaction
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction' })
  @ApiParam({
    name: 'id',
    description: 'Transaction UUID',
    type: String,
    format: 'uuid',
  })
  @ApiStandardResponse(200, 'Transaction updated successfully', Transaction)
  @ApiResponse({ status: 400, description: 'Invalid input', type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Transaction not found', type: ApiErrorResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transactionsService.update(id, updateTransactionDto, user);
  }

  /**
   * DELETE /api/transactions/:id
   * Delete a transaction
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a transaction' })
  @ApiParam({
    name: 'id',
    description: 'Transaction UUID',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'Transaction deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Transaction not found', type: ApiErrorResponseDto })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.transactionsService.remove(id, user);
  }
}
