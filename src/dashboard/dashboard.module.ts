import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Product } from '#/product/entities/product.entity';
import { Category } from '#/category/entities/category.entity';
import { User } from '#/user/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryService } from '#/category/category.service';
import { ProductService } from '#/product/product.service';
import { UserService } from '#/user/user.service';
import { Role } from '#/role/entities/role.entity';
import { Transaction } from '#/transaction/entities/transaction.entity';
import { TransactionService } from '#/transaction/transaction.service';
import { Order } from '#/order/entities/order.entity';
import { Cart } from '#/cart/entities/cart.entity';
import { PaymentMethod } from '#/payment_method/entities/payment_method.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    Product,
    Category,
    User,
    Role,
    Transaction,
    Order,
    Cart,
    PaymentMethod,
  ])],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    CategoryService,
    ProductService,
    UserService,
    TransactionService
  ]
})
export class DashboardModule {}
