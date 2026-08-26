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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ApiStandardResponse } from '../../common/decorators/api-standard-response.decorator';
import { ApiErrorResponseDto } from '../../common/dto/api-error-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { ShoppingListService } from './shopping-list.service';
import { CreateShoppingItemDto } from './dto/create-shopping-item.dto';
import { UpdateShoppingItemDto } from './dto/update-shopping-item.dto';
import { ShoppingItem } from './entities/shopping-item.entity';
import { RolesGuard } from '../auth/roles/roles.guard';
import { AuthGuard } from '@nestjs/passport/dist/auth.guard';

/**
 * Controller for nested routes under events
 * Handles: /api/events/:eventId/shopping-items
 */
@ApiTags('Event Shopping Items')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Unauthorized', type: ApiErrorResponseDto })
@ApiResponse({ status: 403, description: 'Forbidden', type: ApiErrorResponseDto })
@Controller('events/:eventId/shopping-items')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class EventShoppingItemsController {
  constructor(private readonly shoppingListService: ShoppingListService) {}

  /**
   * GET /api/events/:eventId/shopping-items
   * Get the whole shopping list of an event
   */
  @Get()
  @ApiOperation({ summary: 'Get the shopping list of an event' })
  @ApiParam({
    name: 'eventId',
    description: 'Event UUID',
    type: String,
    format: 'uuid',
  })
  @ApiStandardResponse(200, 'Shopping items retrieved successfully', ShoppingItem, true)
  @ApiResponse({ status: 404, description: 'Event not found', type: ApiErrorResponseDto })
  findByEvent(@Param('eventId', ParseUUIDPipe) eventId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.shoppingListService.findByEvent(eventId, user);
  }

  /**
   * POST /api/events/:eventId/shopping-items
   * Add a new item to the shopping list of an event
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add an item to the shopping list of an event' })
  @ApiParam({
    name: 'eventId',
    description: 'Event UUID',
    type: String,
    format: 'uuid',
  })
  @ApiStandardResponse(201, 'Shopping item created successfully', ShoppingItem)
  @ApiResponse({ status: 400, description: 'Invalid input', type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Event not found', type: ApiErrorResponseDto })
  create(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() createShoppingItemDto: CreateShoppingItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.shoppingListService.create(eventId, createShoppingItemDto, user);
  }
}

/**
 * Controller for individual shopping item operations
 * Handles: /api/shopping-items/:id
 */
@ApiTags('Shopping Items')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Unauthorized', type: ApiErrorResponseDto })
@ApiResponse({ status: 403, description: 'Forbidden', type: ApiErrorResponseDto })
@Controller('shopping-items')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ShoppingItemsController {
  constructor(private readonly shoppingListService: ShoppingListService) {}

  /**
   * PATCH /api/shopping-items/:id
   * Rename an item and/or toggle its purchased state
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Rename a shopping item or toggle its purchased state' })
  @ApiParam({
    name: 'id',
    description: 'Shopping item UUID',
    type: String,
    format: 'uuid',
  })
  @ApiStandardResponse(200, 'Shopping item updated successfully', ShoppingItem)
  @ApiResponse({ status: 400, description: 'Invalid input', type: ApiErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Shopping item not found', type: ApiErrorResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateShoppingItemDto: UpdateShoppingItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.shoppingListService.update(id, updateShoppingItemDto, user);
  }

  /**
   * DELETE /api/shopping-items/:id
   * Delete a shopping item
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a shopping item' })
  @ApiParam({
    name: 'id',
    description: 'Shopping item UUID',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'Shopping item deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Shopping item not found', type: ApiErrorResponseDto })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.shoppingListService.remove(id, user);
  }
}
