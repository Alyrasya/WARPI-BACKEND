import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '#/transaction/entities/transaction.entity';
import { Cart } from '#/cart/entities/cart.entity';
import { User } from '#/user/entities/user.entity';


@Injectable()
export class TransactionService {
  userRepository: any;
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


  async createTransaction(id_user: string, username: string): Promise<Transaction> {
    // Cari user berdasarkan id_user
    const user = await this.userRepository.findOne({
      where: { id: id_user },
      relations: ['cart', 'cart.order'],
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const cart = user.cart;
    if (!cart || !cart.order || cart.order.length === 0) {
      throw new BadRequestException('Cart kosong atau tidak valid');
    }

    // Hitung total_price_transaction dari total_price_order dalam cart
    const totalPriceTransaction = cart.order.reduce(
      (total, order) => total + order.total_price_order,
      0,
    );

    // Buat nomor transaksi (no_order) yang di-reset setiap hari
    const today = new Date();
    const datePart = today.toISOString().slice(0, 10).replace(/-/g, ''); // Format: YYYYMMDD
    const lastTransaction = await this.transactionRepository.findOne({
      where: {
        createdAt: today, // Hanya ambil transaksi hari ini
      },
      order: { createdAt: 'DESC' }, // Urutkan berdasarkan waktu terbaru
    });
    const lastOrderNumber = String(lastTransaction?.no_order || '').split('-')[1] || '0';
    const nextOrderNumber = Number(`${datePart}${String(Number(lastOrderNumber) + 1).padStart(4, '0')}`);

    // Buat entitas transaksi baru
    const transaction = this.transactionRepository.create({
      no_order: nextOrderNumber,
      cart: cart,
      customer: user,
      total_price_transaction: totalPriceTransaction,
      payment_status: 'unpaid',
      name_order: username, // Gunakan username dari token
    });

    // Simpan transaksi
    const savedTransaction = await this.transactionRepository.save(transaction);

    return savedTransaction;
  }
}
