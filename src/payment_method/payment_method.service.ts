import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { PaymentMethod } from './entities/payment_method.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PaymentMethodService {
  constructor(
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
  ) {}

  //Cashier
  async getAllMethods(): Promise<PaymentMethod[]> {
    const paymentMethods = await this.paymentMethodRepository.find();

    if (!paymentMethods || paymentMethods.length === 0) {
      throw new NotFoundException('No payment methods found');
    }

    return paymentMethods;
  }
}
