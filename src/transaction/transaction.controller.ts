import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { TransactionService } from './transaction.service';

@Controller('transaction')
export class TransactionController {
  constructor() {}

<<<<<<< HEAD
  // Endpoint untuk mendapatkan detail transaksi berdasarkan ID transaksi
  @Get(':id/getById')
  async getTransactionById(@Param('id') id: string) {
    const transaction = await this.transactionService.getTransactionById(id);
    
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    return transaction;
  }
=======
>>>>>>> 5e56ead5f9d45582eb8f70a45e03ec4f68ec9a7b
}
