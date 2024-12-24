import { Body, Controller, Delete, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { OrderService } from './order.service';
import { EditOrderQuantityDto } from './dto/edit-order';
import { JwtAuthGuard } from '#/auth/jwt-auth.guard';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  //Customer
  @Post('add/:id_user')
  @UseGuards(JwtAuthGuard)
  async addToCart(
    @Param('id_user') id_user: string,
    @Body() addToCartDto: AddToCartDto,
  ) {
    const { id_product } = addToCartDto;
    return this.orderService.addToCart(id_user, id_product);
  }

  //Customer
  @Put('/edit-quantity/:id_order')
  @UseGuards(JwtAuthGuard)
  async editOrderQuantity(
    @Param('id_order') id_order: string,
    @Body() editOrderQuantityDto: EditOrderQuantityDto,
  ) {
    const { action, qty } = editOrderQuantityDto;
  
    return this.orderService.editOrderQuantity(id_order, action, qty);
  }

  //Customer
  @Delete('/delete/:id_order')
  @UseGuards(JwtAuthGuard)
  async deleteOrder(@Param('id_order') id_order: string) {
    return this.orderService.deleteOrder(id_order);
  }
}
