import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { PaymentMethodService } from './payment_method.service';
import { PaymentMethod } from './entities/payment_method.entity';

@Controller('payment-method')
export class PaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  // Endpoint untuk menampilkan seluruh metode pembayaran
  @Get()
  async getAllMethods(): Promise<PaymentMethod[]> {
    try {
      return await this.paymentMethodService.getAllMethods();
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('No payment methods found');
      }
      throw error;
    }
  }

  // Endpoint untuk menampilkan metode pembayaran berdasarkan id
  @Get(':id')
  async getMethodById(@Param('id') id: string): Promise<PaymentMethod> {
    try {
      return await this.paymentMethodService.getMethodById(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`Payment method with ID ${id} not found`);
      }
      throw error;
    }
  }
}
