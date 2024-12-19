import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '#/order/entities/order.entity';
import { User } from '#/user/entities/user.entity';
import { PaymentMethod } from '#/payment_method/entities/payment_method.entity';
import { Transaction } from './entities/transaction.entity';
import { Cart } from '#/cart/entities/cart.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    Transaction,
    Order,
    User,
    PaymentMethod,
    Cart
  ])],
  controllers: [TransactionController],
  providers: [TransactionService],
  exports: [TransactionService]
})
export class TransactionModule {}