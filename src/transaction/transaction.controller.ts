import { Controller, Post, Param, UseGuards, Req, Put, Body, InternalServerErrorException, BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionService } from './transaction.service';
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
  ) {
    // Mengambil username dari payload token
    const username = req.user?.username;

    if (!username) {
      throw new InternalServerErrorException('Username tidak ditemukan dalam token.');
    }

    try {
      // Memanggil service untuk membuat transaksi
      const result = await this.transactionService.createTransaction(id_user, username);
      return result;
    } catch (error) {
      console.error('Error saat membuat transaksi:', error);

      // Berikan informasi tambahan di sini jika diperlukan
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      } else {
        throw new InternalServerErrorException('Gagal membuat transaksi.');
      }
    }
  }

  @Put('edit/:id_transaction/:id_user')
  async editTransaction(
    @Param('id_transaction') id_transaction: string,
    @Param('id_user') id_user: string,
    @Body() editTransactionDto: EditTransactionDto,
  ) {
    const updatedTransactionData = await this.transactionService.editTransaction(
        id_transaction,
        id_user,
        editTransactionDto.cash ?? null,
        editTransactionDto.action,
        editTransactionDto.id_method,
    );

    return {
        message: 'Transaction updated successfully',
        data: updatedTransactionData,
    };
  }
}
