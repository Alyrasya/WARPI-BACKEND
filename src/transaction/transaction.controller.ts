import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { TransactionService } from './transaction.service';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  // Endpoint untuk mendapatkan detail transaksi berdasarkan ID transaksi
  @Get(':transactionId')
  async getTransactionById(@Param('transactionId') transactionId: string) {
    const transaction = await this.transactionService.getTransactionById(transactionId);
    
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${transactionId} not found`);
    }

    return transaction;
  }
}
