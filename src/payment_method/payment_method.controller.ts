import { Controller, Get, Param, NotFoundException, UseGuards } from '@nestjs/common';
import { PaymentMethodService } from './payment_method.service';
import { PaymentMethod } from './entities/payment_method.entity';
import { JwtAuthGuard } from '#/auth/jwt-auth.guard';

@Controller('payment-method')
export class PaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  //Cashier
  @Get('getAll')
  @UseGuards(JwtAuthGuard)
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
}
