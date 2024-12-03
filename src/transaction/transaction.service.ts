import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '#/transaction/entities/transaction.entity';
import { Cart } from '#/cart/entities/cart.entity';
import { User } from '#/user/entities/user.entity';


@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
        (total, order) => {
            const price = parseFloat(order.total_price_order.toString()); // Pastikan ini angka
            if (isNaN(price)) {
                throw new BadRequestException(`Total price order tidak valid: ${order.total_price_order}`);
            }
            return total + price;
        },
        0,
    );

    // Debug totalPriceTransaction
    console.log('Total Price Transaction:', totalPriceTransaction);

    // Ambil transaksi terakhir
    const [lastTransaction] = await this.transactionRepository.find({
        order: { no_order: 'DESC' },
        take: 1,
    });

    const lastOrderNumber = lastTransaction?.no_order || 0;
    const nextOrderNumber = lastOrderNumber + 1;

    // Validasi nilai sebelum membuat entitas
    if (isNaN(totalPriceTransaction) || isNaN(nextOrderNumber)) {
        throw new BadRequestException('Nilai transaksi tidak valid');
    }

    const transaction = this.transactionRepository.create({
        no_order: nextOrderNumber,
        cart: cart,
        customer: user,
        total_price_transaction: totalPriceTransaction,
        payment_status: 'unpaid',
        name_order: username,
    });

    // Debug payload sebelum menyimpan
    console.log('Transaction payload:', transaction);

    const savedTransaction = await this.transactionRepository.save(transaction);

    return savedTransaction;
}




  
}
