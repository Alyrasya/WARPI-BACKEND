import { Controller, Post, Param, UseGuards, Req, Put, Body, Get } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { Transaction } from './entities/transaction.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EditTransactionDto } from './dto/edit-transaction.dto';

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

  @Put('edit/:id_transaction/:id_cashier')
  async editTransaction(
      @Param('id_transaction') id_transaction: string,
      @Param('id_cashier') id_cashier: string,
      @Body() editTransactionDto: EditTransactionDto,
  ) {
      const updatedTransaction = await this.transactionService.editTransaction(
          id_transaction,
          id_cashier,  // Menggunakan id_cashier dari parameter
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
  @Get('transactions/:id_user')
async getAllTransactionsByUserAndStatus(
  @Param('id_user') id_user: string,
): Promise<Transaction[]> {
  return this.transactionService.getAllTransactionsByUserAndStatus(id_user);
}

@Get(':id_transaction')
async getTransactionById(
  @Param('id_transaction') id_transaction: string,
): Promise<any> {
  const transaction = await this.transactionService.getTransactionById(id_transaction);

  if (!transaction) {
    return {
      status: 404,
      message: 'Transaction not found',
    };
  }

  return {
    status: 200,
    message: 'Transaction retrieved successfully',
    data: {
      id: transaction.id,
      total_price_transaction: transaction.total_price_transaction,
      change_money: transaction.change_money,
      cash: transaction.cash,
      name_order: transaction.name_order,
      no_order: transaction.no_order,
      payment_status: transaction.payment_status,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      paymentMethod: transaction.paymentMethod,
      cashier: transaction.cashier,
      customer: transaction.customer,
      cart: transaction.cart
        ? {
            id: transaction.cart.id,
            products: transaction.cart.order.map((order) => ({
              id: order.product.id,
              name: order.product.product_name,
              description: order.product.description,
              price: order.product.price,
              quantity: order.qty,
              total_price: order.total_price_order,
            })),
          }
        : null,
    },
  };
}

}





