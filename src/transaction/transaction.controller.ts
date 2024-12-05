import { Controller, Post, Param, UseGuards, Req, Put, Body, Get, HttpException, HttpStatus, Query } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { Transaction } from './entities/transaction.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EditTransactionDto } from './dto/edit-transaction.dto';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create/:id_user')
  async createTransaction(
    @Param('id_user') id_user: string,
    @Req() req: any,
  ){
    const username = req.user?.username;

    if (!username) {
      throw new Error('Username tidak ditemukan dalam token.');
    }

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
          id_user,
          editTransactionDto.cash ?? null,
          editTransactionDto.action,
          editTransactionDto.id_method,
      );
      return {
          message: 'Transaction updated successfully',
          data: updatedTransaction,
      };
  }
}
