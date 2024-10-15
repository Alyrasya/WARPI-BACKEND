import { Controller,Post, Body, Put, Param, BadRequestException, Delete, Get, NotFoundException } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

    @Post('create')
      async createOrder(@Body() createOrderDto: CreateOrderDto) {
          return await this.orderService.createOrder(createOrderDto);
    }

    @Put(':id/edit')
    async editOrder(
      @Param('id') id: string,
      @Body() editOrderDto: UpdateOrderDto
    ): Promise<string> {
      const { actionOrQty, qty } = editOrderDto;
    
      try {
        // Panggil service dengan parameter orderId dan actionOrQty atau qty
        await this.orderService.editOrder(id, actionOrQty ?? qty);
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
    @Delete(':id/delete')
    async deleteOrder(
      @Param('id') id: string
    ): Promise<string> {
      return this.orderService.deleteOrder(id);
    }

    @Get('getAll')
    async getAllOrders(): Promise<any[]>{
      return this.orderService.getAllOrders();
    }

    @Put(':transactionId/edit-unpaid')
    async editStatusOrder(@Param('transactionId') transactionId: string) {
      try {
        await this.orderService.editStatusOrder(transactionId);
        return { message: 'Payment status updated to unpaid' };
      } catch (error) {
        if (error.message === 'Transaction not found') {
          throw new NotFoundException(error.message);
        }
        throw new BadRequestException(error.message);
      }
    }
}
