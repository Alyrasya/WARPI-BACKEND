import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '#/cart/entities/cart.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
  ) {}

  async getByIdCartUser(id_user: string): Promise<Cart | null> {
    return await this.cartRepository.findOne({
      where: {
        user: {
          id: id_user,
        },
      },
      relations: ['order', 'order.product'],
      order: {
        order: {
          createdAt: 'DESC', // Gunakan 'ASC' untuk urutan menaik
        },
      },
    });
  }
}
