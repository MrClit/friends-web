import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { ShoppingItem } from './entities/shopping-item.entity';
import { CreateShoppingItemDto } from './dto/create-shopping-item.dto';
import { UpdateShoppingItemDto } from './dto/update-shopping-item.dto';
import { EventAccessService } from '../event-access/event-access.service';
import { RequestContextService } from '../../common/request-context/request-context.service';

/** Columns of a shopping item this service is allowed to write on an update. */
type ShoppingItemUpdate = Partial<Pick<ShoppingItem, 'name' | 'purchasedAt' | 'purchasedBy'>>;

@Injectable()
export class ShoppingListService {
  private readonly logger = new Logger(ShoppingListService.name);

  constructor(
    @InjectRepository(ShoppingItem)
    private readonly shoppingItemRepository: Repository<ShoppingItem>,
    private readonly eventAccessService: EventAccessService,
    private readonly requestContext: RequestContextService,
  ) {}

  private async findItemOrThrow(id: string): Promise<ShoppingItem> {
    const item = await this.shoppingItemRepository.findOne({ where: { id } });

    if (!item) {
      throw new NotFoundException(`Shopping item with ID ${id} not found`);
    }

    return item;
  }

  /**
   * Authorize an item through its parent event. A missing parent event is reported as a missing item on
   * purpose, so the response never reveals whether the event exists.
   */
  private async ensureCanAccessItem(item: ShoppingItem, actor: AuthenticatedUser): Promise<void> {
    if (this.eventAccessService.isAdmin(actor)) {
      return;
    }

    const event = await this.eventAccessService.findEvent(item.eventId);
    if (!event) {
      throw new NotFoundException(`Shopping item with ID ${item.id} not found`);
    }
    if (!this.eventAccessService.canAccessEvent(event, actor)) {
      throw new ForbiddenException(`Access to shopping item ${item.id} is not allowed`);
    }
  }

  /**
   * Get the whole shopping list of an event, in insertion order: a shopping list appends at the bottom.
   * Splitting pending from purchased is left to the client.
   */
  async findByEvent(eventId: string, actor: AuthenticatedUser): Promise<ShoppingItem[]> {
    try {
      this.logger.log(`Fetching shopping items for event: ${eventId}`);

      // Verify the event exists and the actor can access it
      await this.eventAccessService.loadAccessibleEvent(eventId, actor);

      const items = await this.shoppingItemRepository.find({
        where: { eventId },
        order: { createdAt: 'ASC' },
      });

      this.logger.log(`Found ${items.length} shopping items for event ${eventId}`);
      return items;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      const err = error as Error;
      this.logger.error(
        {
          msg: 'Failed to fetch shopping items for event',
          error: err.message,
          correlationId: this.requestContext.correlationId,
          actorId: actor.id,
          eventId,
        },
        err.stack,
      );
      throw new InternalServerErrorException('Failed to fetch shopping items');
    }
  }

  /**
   * Create a new item in the shopping list of an event
   */
  async create(
    eventId: string,
    createShoppingItemDto: CreateShoppingItemDto,
    actor: AuthenticatedUser,
  ): Promise<ShoppingItem> {
    try {
      this.logger.log(`Creating new shopping item for event ${eventId}`);

      // Verify the event exists and the actor can access it
      await this.eventAccessService.loadAccessibleEvent(eventId, actor);

      const item = this.shoppingItemRepository.create({
        name: createShoppingItemDto.name,
        eventId,
        createdBy: actor.id,
      });

      const savedItem = await this.shoppingItemRepository.save(item);
      this.logger.log(`Shopping item created successfully with ID: ${savedItem.id}`);
      return savedItem;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      const err = error as Error;
      this.logger.error(
        {
          msg: 'Failed to create shopping item',
          error: err.message,
          correlationId: this.requestContext.correlationId,
          actorId: actor.id,
          eventId,
          payload: { name: createShoppingItemDto.name },
        },
        err.stack,
      );
      throw new InternalServerErrorException('Failed to create shopping item');
    }
  }

  /**
   * Rename an item and/or toggle its purchased state. Any participant may edit any item, whoever
   * created it.
   */
  async update(
    id: string,
    updateShoppingItemDto: UpdateShoppingItemDto,
    actor: AuthenticatedUser,
  ): Promise<ShoppingItem> {
    try {
      this.logger.log(`Updating shopping item with ID: ${id}`);

      const item = await this.findItemOrThrow(id);
      await this.ensureCanAccessItem(item, actor);

      const updates = this.buildUpdate(item, updateShoppingItemDto, actor);

      if (Object.keys(updates).length > 0) {
        await this.shoppingItemRepository.update(id, updates);
      }

      const updatedItem = await this.findItemOrThrow(id);
      this.logger.log(`Shopping item ${id} updated successfully`);
      return updatedItem;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      const err = error as Error;
      this.logger.error(
        {
          msg: 'Failed to update shopping item',
          error: err.message,
          correlationId: this.requestContext.correlationId,
          actorId: actor.id,
          itemId: id,
          payload: updateShoppingItemDto,
        },
        err.stack,
      );
      throw new InternalServerErrorException('Failed to update shopping item');
    }
  }

  /**
   * Translate the request into the columns to write. The purchase attribution is derived here and never
   * taken from the client: marking an already purchased item again is a no-op, so the first buyer keeps
   * the credit and a duplicated request stays harmless.
   */
  private buildUpdate(item: ShoppingItem, dto: UpdateShoppingItemDto, actor: AuthenticatedUser): ShoppingItemUpdate {
    const updates: ShoppingItemUpdate = {};

    if (dto.name !== undefined) {
      updates.name = dto.name;
    }

    if (dto.purchased === true && item.purchasedAt === null) {
      updates.purchasedAt = new Date();
      updates.purchasedBy = actor.id;
    } else if (dto.purchased === false) {
      updates.purchasedAt = null;
      updates.purchasedBy = null;
    }

    return updates;
  }

  /**
   * Delete an item. Hard delete on purpose: unlike a transaction, a shopping item carries no audit
   * value and there is no restore path.
   */
  async remove(id: string, actor: AuthenticatedUser): Promise<void> {
    try {
      this.logger.log(`Deleting shopping item with ID: ${id}`);

      const item = await this.findItemOrThrow(id);
      await this.ensureCanAccessItem(item, actor);

      await this.shoppingItemRepository.delete(id);
      this.logger.log(`Shopping item ${id} deleted successfully`);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      const err = error as Error;
      this.logger.error(
        {
          msg: 'Failed to delete shopping item',
          error: err.message,
          correlationId: this.requestContext.correlationId,
          actorId: actor.id,
          itemId: id,
        },
        err.stack,
      );
      throw new InternalServerErrorException('Failed to delete shopping item');
    }
  }
}
