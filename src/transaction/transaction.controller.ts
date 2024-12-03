import { Controller, Get, NotFoundException, Param } from '@nestjs/common';

@Controller('transaction')
export class TransactionController {
  transactionService: any;
  constructor() {}

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
