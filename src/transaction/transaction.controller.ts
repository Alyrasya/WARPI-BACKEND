import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { TransactionService } from './transaction.service';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  // Endpoint untuk mendapatkan detail transaksi berdasarkan ID transaksi
  @Get(':id/getById')
  async getTransactionById(@Param('id') id: string) {
    const transaction = await this.transactionService.getTransactionById(id);
    
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    return transaction;
  }
}
