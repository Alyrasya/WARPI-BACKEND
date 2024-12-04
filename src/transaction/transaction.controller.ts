<<<<<<< HEAD
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
=======
import { Controller, Post, Param, UseGuards, Req } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { Transaction } from './entities/transaction.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @UseGuards(JwtAuthGuard) // Melindungi endpoint dengan JWT Guard
  @Post(':id_user')
  async createTransaction(
    @Param('id_user') id_user: string,
    @Req() req: any, // Mendapatkan request object
  ): Promise<Transaction> {
    // Mengambil username dari payload token
    const username = req.user?.username;

    if (!username) {
      throw new Error('Username tidak ditemukan dalam token.');
    }

    // Panggil service untuk membuat transaksi
    return await this.transactionService.createTransaction(id_user, username);
>>>>>>> fb61dda70eb5636874b578e462c08d529f6a8a74
  }
}
