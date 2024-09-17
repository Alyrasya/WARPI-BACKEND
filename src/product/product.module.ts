import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Category } from '#/category/entities/category.entity';
import { Order } from '#/order/entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category, Order])],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService]
})
export class ProductModule {}
