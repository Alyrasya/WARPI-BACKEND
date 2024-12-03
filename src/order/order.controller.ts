import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { OrderService } from './order.service';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
  @Post('add-to-cart')
  async addToCart(@Body() addToCartDto: AddToCartDto) {
    const { id_cart, id_product } = addToCartDto;
    try {
      const result = await this.orderService.addToCart(id_cart, id_product);
      return {
        message: 'Produk berhasil ditambahkan ke keranjang',
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          message: 'Terjadi kesalahan saat menambahkan produk ke keranjang',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
