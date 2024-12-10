import { Controller, Post, Param, UseGuards, Req, Put, Body, Get, HttpException, HttpStatus, Query } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { PaymentStatus, Transaction } from './entities/transaction.entity';
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

  @Get('getById/:id')
  async getByIdTransaction(@Param('id') id: string){
    try {
      return await this.transactionService.getByIdTransaction(id);
    } catch (error) {
      console.error('Kesalahan saat mengambil data transaksi:', error.message);
      throw new HttpException(
        'Terjadi kesalahan saat mengambil data transaksi.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

@Get('getAllTransactionCashier')
async getAllTransactionCashier(
  @Query('page') page: number = 1,
  @Query('page_size') page_size: number = 10,
  @Query('no_order') no_order?: number,
  @Query('name_order') name_order?: string,
  @Query('payment_status') payment_status?: PaymentStatus,
) {
  // Panggil service untuk mendapatkan transaksi
  const transactions = await this.transactionService.getAllTransactioncashier(
    page,
    page_size,
    no_order,
    name_order,
    payment_status,
  );

  return transactions;
}

}
