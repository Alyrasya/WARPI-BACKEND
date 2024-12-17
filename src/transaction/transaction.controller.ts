import { Controller, Post, Param, UseGuards, Req, Put, Body, Get, HttpException, HttpStatus, Query, Res } from '@nestjs/common';
import { Response } from 'express';
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

  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
  @Get(':id/getById')
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

  @Post('export')
  async exportTransactionsToExcel(
    @Res() res: Response,
    @Query('page') page: number = 1,
    @Query('page_size') page_size: number = 100,
    @Query('name_order') name_order?: string,
    @Query('method_name') method_name?: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
  ) {
    try {
      // Pastikan start_date dan end_date jika ada dikonversi menjadi format yang benar
      if (start_date) {
        start_date = new Date(start_date).toISOString();
      }
      if (end_date) {
        end_date = new Date(end_date).toISOString();
      }

      // Memanggil service untuk mendapatkan file path
      const filePath = await this.transactionService.exportTransactionsToExcel(
        page,
        page_size,
        name_order,
        method_name,
        start_date,
        end_date,
      );

      // Mengirim file ke client sebagai download
      res.download(filePath, 'transactions_report.xlsx', (err) => {
        if (err) {
          console.error('Error while downloading file:', err);
          res.status(500).send('Failed to download file');
        }
      });
    } catch (error) {
      console.error('Error exporting transactions:', error);
      res.status(500).send('Failed to export transactions');
    }
  }
} 