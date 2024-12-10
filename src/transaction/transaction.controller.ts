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

  @Get('getAll')
  async getAllTransaction(
    @Query('page') page: number,
    @Query('page_size') page_size: number,
    @Query('name_order') name_order?: string,
    @Query('method_name') method_name?: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
  ): Promise<{ data: Transaction[]; totalCount: number }> {
    try {
      return await this.transactionService.getAllTransaction(
        page,
        page_size,
        name_order,
        method_name,
        start_date,
        end_date,
      );
    } catch (error) {
      console.error('Kesalahan saat mengambil data transaksi:', error.message);
      throw new HttpException(
        'Terjadi kesalahan saat mengambil data transaksi.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('history')
  async getAllHistory() {
    const transactions = await this.transactionService.getAllHistory();
    return {
      message: 'Transaction history fetched successfully',
      data: transactions,
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
    @Query('page') page: number,
    @Query('page_size') page_size: number,
    @Query('name_order') name_order?: string,
    @Query('payment_status') payment_status?: PaymentStatus // Tipe parameter disesuaikan dengan enum
  ) {
    return await this.transactionService.getAllTransactionCashier(
      page,
      page_size,
      name_order,
      payment_status
    );
  }
}