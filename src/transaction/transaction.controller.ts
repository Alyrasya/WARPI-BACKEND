import { Controller, Post, Param, UseGuards, Req, Put, Body } from '@nestjs/common';
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
  ): Promise<Transaction> {
    // Mengambil username dari payload token
    const username = req.user?.username;

    if (!username) {
      throw new Error('Username tidak ditemukan dalam token.');
    }

    return await this.transactionService.createTransaction(id_user, username);
  }

  @Put('edit/:id_transaction/:id_cashier')
  async editTransaction(
      @Param('id_transaction') id_transaction: string,
      @Param('id_cashier') id_cashier: string,
      @Body() editTransactionDto: EditTransactionDto,
  ) {
      const updatedTransactionData = await this.transactionService.editTransaction(
          id_transaction,
          id_cashier,  // Get cashier ID from parameter
          editTransactionDto.cash ?? null,
          editTransactionDto.action,
          editTransactionDto.id_method,  // Get id_method from body
      );

      return {
          message: 'Transaction updated successfully',
          data: updatedTransactionData,
      };
  }
}
