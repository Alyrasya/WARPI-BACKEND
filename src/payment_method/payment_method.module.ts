import { Module } from '@nestjs/common';
import { PaymentMethodService } from './payment_method.service';
import { PaymentMethodController } from './payment_method.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentMethod } from './entities/payment_method.entity';
import { Transaction } from '#/transaction/entities/transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentMethod,Transaction]),
  ],
  controllers: [PaymentMethodController],
  providers: [PaymentMethodService]
})
export class PaymentMethodModule {}
