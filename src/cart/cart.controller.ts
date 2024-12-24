  import { Controller, Get, Param, UseGuards } from '@nestjs/common';
  import { CartService } from './cart.service';
import { JwtAuthGuard } from '#/auth/jwt-auth.guard';

  @Controller('cart')
  export class CartController {
    constructor(private readonly cartService: CartService) {}

  //Customer
  @UseGuards(JwtAuthGuard)
  @Get('getById/:id_user')
  async getByIdCartUser(@Param('id_user') id_user: string) {
    return await this.cartService.getByIdCartUser(id_user);
  }
}
