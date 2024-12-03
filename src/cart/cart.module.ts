import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { Product } from '#/product/entities/product.entity';
import { User } from '#/user/entities/user.entity';
import { Order } from '#/order/entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cart,Product,User,Order])],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService]
})
export class CartModule {}
