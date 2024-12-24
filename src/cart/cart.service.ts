import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '#/cart/entities/cart.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
  ) {}
    
  async getByIdCartUser(id_user: string) {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: id_user } },
      relations: [
        'order',        // Relasi dengan Order
        'order.product' // Relasi Order dengan Product
      ],
    });

    if (!cart) {
      throw new NotFoundException('Cart not found for this user');
    }

    return cart;
  }
}
