import { Controller, Post, Param, UseGuards, Req } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { Transaction } from './entities/transaction.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create/:id_user')
  async createTransaction(
    @Param('id_user') id_user: string,
    @Req() req: any,
  ): Promise<Transaction> {
    // Mengambil username dari payload token
    const username = req.user?.username;

    if (!username) {
      throw new Error('Username tidak ditemukan dalam token.');
    }

    return await this.transactionService.createTransaction(id_user, username);
  }
}
