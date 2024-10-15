import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository} from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { Order } from '#/order/entities/order.entity';
import { Product } from '#/product/entities/product.entity';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async getTransactionById(transactionId: string): Promise<any> {
    // Ambil transaksi beserta order dan produk terkait
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['orders', 'orders.product'], // Mengambil relasi order dan produk
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${transactionId} not found`);
    }

    const orders = transaction.orders.map(order => ({
      orderId: order.id,
      productName: order.product.product_name,
      quantity: order.qty,
      price: order.product.price, // Mengakses harga dari produk
      photo: order.product.product_photo,
    }));

    return {
      transactionId: transaction.id,
      orderName: transaction.orderers_name,
      noOrder: transaction.no_order,
      totalPriceTransaction: transaction.total_price_transaction,
      status: transaction.payment_status,
      createAt: transaction.createdAt,
      orders,
    };
  }

  async countPaidTransactions(): Promise<number> {
    return await this.transactionRepository.count({
      where: { payment_status: 'paid' }, // Filter for transactions with status 'paid'
    });
  }

  async countTotalMonthlyIncome(): Promise<number> {
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

      // Jika tidak ada transaksi, atau jika totalnya null, kembalikan 0
      return result?.total ? parseFloat(result.total) : 0;
    } catch (error) {
      throw new BadRequestException('Error calculating monthly income');
    }
  }

  async countTotalAllIncome(): Promise<number> {
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