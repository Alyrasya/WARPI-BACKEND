import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository} from 'typeorm';
import { Transaction } from './entities/transaction.entity';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async countPaidTransactions(){
    return await this.transactionRepository.count({
      where: { payment_status: 'paid' },
    });
  }

  async countTotalMonthlyIncome(){
    try {
      // Mendapatkan bulan dan tahun saat ini
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // Bulan dimulai dari 0, jadi perlu +1
      const currentYear = currentDate.getFullYear();

      // Mendapatkan total dari transaksi yang berstatus "paid" untuk bulan dan tahun saat ini
      const result = await this.transactionRepository
        .createQueryBuilder('transaction')
        .select('SUM(transaction.total_price_transaction)', 'total')
        .where('transaction.payment_status = :status', { status: 'paid' })
        .andWhere('EXTRACT(MONTH FROM transaction.created_at) = :month', { month: currentMonth })
        .andWhere('EXTRACT(YEAR FROM transaction.created_at) = :year', { year: currentYear })
        .getRawOne();

      return result?.total ? parseFloat(result.total) : 0;
    } catch (error) {
      throw new BadRequestException('Error calculating monthly income');
    }
  }

  async countTotalAllIncome(){
    try {
      const result = await this.transactionRepository
        .createQueryBuilder('transaction')
        .select('SUM(transaction.total_price_transaction)', 'total')
        .where('transaction.payment_status = :status', { status: 'paid' }) // Parameter fixed
        .getRawOne();

      // Jika tidak ada transaksi, atau totalnya null, kembalikan 0
      return result?.total ? parseFloat(result.total) : 0;
    } catch (error) {
      throw new BadRequestException('Error calculating total income');
    }
  }
}