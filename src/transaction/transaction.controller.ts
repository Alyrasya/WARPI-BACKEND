import { Controller, Post, Param, UseGuards, Req, Put, Body, Get } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { Transaction } from './entities/transaction.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EditTransactionDto } from './dto/edit-transaction.dto';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':id_user')
  async createTransaction(
    @Param('id_user') id_user: string,
    @Req() req: any,
  ): Promise<Transaction> {
    const username = req.user?.username;

    if (!username) {
      throw new Error('Username tidak ditemukan dalam token.');
    }

    // Panggil service untuk membuat transaksi
    return await this.transactionService.createTransaction(id_user, username);
  }

  @Put('edit/:id_transaction/:id_user')
  async editTransaction(
      @Param('id_transaction') id_transaction: string,
      @Param('id_user') id_user: string,
      @Body() editTransactionDto: EditTransactionDto,
  ) {
      const updatedTransaction = await this.transactionService.editTransaction(
          id_transaction,
          id_user,  // Menggunakan id_cashier dari parameter
          editTransactionDto.cash ?? null,
          editTransactionDto.action,
          editTransactionDto.id_method,  // Menggunakan id_method dari body
      );
      return {
          message: 'Transaction updated successfully',
          data: updatedTransaction,
      };
      
  }
  // @UseGuards(JwtAuthGuard) // Melindungi endpoint dengan JWT Guard
  @Get('history')
  async getAllTransactions() {
    const transactions = await this.transactionService.getAllTransactions();
    return {
      message: 'Transaction history fetched successfully',
      data: transactions,
    };
  }

}
