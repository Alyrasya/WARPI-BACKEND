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
  }
}
