import { Body, Controller, Param, Post } from '@nestjs/common';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { OrderService } from './order.service';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('add/:id_user')
  async addToCart(
    @Param('id_user') id_user: string,
    @Body() addToCartDto: AddToCartDto,
  ) {
    const { id_product } = addToCartDto;
    return this.orderService.addToCart(id_user, id_product);
  }

}
