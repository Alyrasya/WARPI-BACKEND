import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '#/product/entities/product.entity';
import { Category } from '#/category/entities/category.entity';
import { Transaction } from '#/transaction/entities/transaction.entity';
import { Order } from './entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    Product,
    Category,
    Transaction,
    Order
  ])],
  controllers: [OrderController],
  providers: [OrderService]
})
export class OrderModule {}
