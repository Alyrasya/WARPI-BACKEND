import { Controller,Post, Body, Put, Param, BadRequestException, Delete, Get, NotFoundException } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('create')
    async createOrder(@Body() createOrderDto: CreateOrderDto) {
        return await this.orderService.createOrder(createOrderDto);
    }

    @Put('edit/:orderId')
    async editOrder(
      @Param('orderId') orderId: string,
      @Body() editOrderDto: UpdateOrderDto
    ): Promise<string> {
      const { actionOrQty, qty } = editOrderDto;
      
      try {
        await this.orderService.editOrder(orderId, actionOrQty ?? qty);
        return 'Order updated successfully.';
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw new BadRequestException(error.message);
        } else if (error instanceof NotFoundException) {
          throw new NotFoundException(error.message);
        } else {
          throw new BadRequestException('An unexpected error occurred.');
        }
      }
    }
    

  // Endpoint untuk menghapus pesanan (Delete Order)
  @Delete('delete/:orderId')
  async deleteOrder(
    @Param('orderId') orderId: string
  ): Promise<string> {
    return this.orderService.deleteOrder(orderId);
  }

  @Get('orders')
  async getAllOrders(): Promise<any[]>{
    return this.orderService.getAllOrders();
  }

}
