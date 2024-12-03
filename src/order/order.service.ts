import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '#/order/entities/order.entity';
import { Product } from '#/product/entities/product.entity';

@Injectable()
export class OrderService {
  constructor(
  ) {}

}