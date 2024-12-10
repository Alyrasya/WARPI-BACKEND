import { Body, Controller, Delete, Param, Post, Put } from '@nestjs/common';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { OrderService } from './order.service';
import { EditOrderQuantityDto } from './dto/edit-order';

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

  @Put('/edit-quantity/:id_order')
  async editOrderQuantity(
    @Param('id_order') id_order: string,
    @Body() editOrderQuantityDto: EditOrderQuantityDto,
  ) {
    const { action, qty } = editOrderQuantityDto;
  
    return this.orderService.editOrderQuantity(id_order, action, qty);
  }

  @Delete('/delete/:id_order')
  async deleteOrder(@Param('id_order') id_order: string) {
    return this.orderService.deleteOrder(id_order);
  }
}
