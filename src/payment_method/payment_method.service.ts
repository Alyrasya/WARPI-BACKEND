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

  // Fungsi untuk menampilkan seluruh data payment_method
  async getAllMethods(): Promise<PaymentMethod[]> {
    const paymentMethods = await this.paymentMethodRepository.find();

    if (!paymentMethods || paymentMethods.length === 0) {
      throw new NotFoundException('No payment methods found');
    }

    return paymentMethods;
  }

  // Fungsi untuk menampilkan data payment_method berdasarkan id
  async getMethodById(id: string): Promise<PaymentMethod> {
    const paymentMethod = await this.paymentMethodRepository.findOne({ where: { id } });

    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with ID ${id} not found`);
    }

    return paymentMethod;
  }
}
