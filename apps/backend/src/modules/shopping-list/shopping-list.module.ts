import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShoppingListService } from './shopping-list.service';
import { EventShoppingItemsController, ShoppingItemsController } from './shopping-list.controller';
import { ShoppingItem } from './entities/shopping-item.entity';
import { EventAccessModule } from '../event-access/event-access.module';

@Module({
  // The Event entity is deliberately absent: event access goes through EventAccessModule instead of a
  // second repository over the events table.
  imports: [TypeOrmModule.forFeature([ShoppingItem]), EventAccessModule],
  controllers: [EventShoppingItemsController, ShoppingItemsController],
  // RequestContextService is not declared here on purpose: it lives in the global RequestContextModule
  // so the middleware and this module's services share the same AsyncLocalStorage instance.
  providers: [ShoppingListService],
  exports: [ShoppingListService],
})
export class ShoppingListModule {}
