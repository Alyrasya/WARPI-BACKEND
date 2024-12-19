  import { Controller, Get, Param } from '@nestjs/common';
  import { CartService } from './cart.service';

  @Controller('cart')
  export class CartController {
    constructor(private readonly cartService: CartService) {}

    @Get(':id_user')
    async getCartByUserId(@Param('id_user') id_user: string) {
      return await this.cartService.getByIdCartUser(id_user);   
    }
  }
