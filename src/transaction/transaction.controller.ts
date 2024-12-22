import { Controller, Post, Param, UseGuards, Req, Put, Body, Get, HttpException, HttpStatus, Query } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { PaymentStatus, Transaction } from './entities/transaction.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EditTransactionDto } from './dto/edit-transaction.dto';

@Controller('transaction')
export class TransactionController {
  [x: string]: any;
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
    @Query('no_order') no_order?: any,
    @Query('name_order') name_order?: any,
    @Query('method_name') method_name?: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
  ): Promise<{ data: Transaction[]; totalCount: number }> {
    try {
      return await this.transactionService.getAllTransaction(
        page,
        page_size,
        no_order,
        name_order,
        method_name,
        start_date,
        // end_date,
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

  @Get('/getAllTransactionCashier')
  async getAllTransactionCashier(
      @Query('page') page: number,
      @Query('page_size') page_size: number,
      @Query('name_order') name_order?: string,
      @Query('payment_status') payment_status?: PaymentStatus,
  ) {
      const pageNumber = page ? parseInt(page.toString(), 10) : 1;
      const pageSize = page_size ? parseInt(page_size.toString(), 10) : 10;

      const result = await this.transactionService.getAllTransactionCashier(
          pageNumber,
          pageSize,
          name_order,
          payment_status,
      );

      // Format response
      const formattedData = result.data.map(transaction => ({
          id: transaction.id,
          no_order: transaction.no_order,
          name_order: transaction.name_order,
          total_price_transaction: transaction.total_price_transaction,
          cash: transaction.cash,
          change_money: transaction.change_money,
          payment_status: transaction.payment_status,
          payment_method: transaction.paymentMethod?.method_name,
          createdAt: transaction.createdAt,
          orders: transaction.order?.map(order => ({
              qty: order.qty,
              product: {
                  id: order.product?.id,
                  name: order.product?.product_name, // Ensure product_name exists here
                  price: order.product?.price,
              },
          })),
      }));

      return {
          totalCount: result.totalCount,
          data: formattedData,
      };
  }
}