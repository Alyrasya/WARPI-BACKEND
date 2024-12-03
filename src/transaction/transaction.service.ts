import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Transaction } from '#/transaction/entities/transaction.entity';
import { Cart } from '#/cart/entities/cart.entity';
import { User } from '#/user/entities/user.entity';
import { Order } from '#/order/entities/order.entity';


@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
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

  async createTransaction(id_user: string, username: string): Promise<any> {
    const user = await this.userRepository.findOne({
        where: { id: id_user },
        relations: ['cart', 'cart.order', 'cart.order.product'],
    });

    if (!user) {
        throw new NotFoundException('User tidak ditemukan');
    }

    const cart = user.cart;
    if (!cart || !cart.order || cart.order.length === 0) {
        throw new BadRequestException('Cart kosong atau tidak valid');
    }

    // Hitung total_price_transaction dari total_price_order dalam cart
    const totalPriceTransaction = cart.order.reduce((total, order) => {
        const price = parseFloat(order.total_price_order.toString()); // Pastikan ini angka
        if (isNaN(price)) {
            throw new BadRequestException(`Total price order tidak valid: ${order.total_price_order}`);
        }
        return total + price;
    }, 0);

    // Ambil tanggal hari ini
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()); // 00:00:00
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59); // 23:59:59

    // Cari transaksi terakhir untuk hari ini
    const [lastTransactionToday] = await this.transactionRepository.find({
        where: {
            createdAt: Between(startOfDay, endOfDay), // Filter transaksi hari ini
        },
        order: { no_order: 'DESC' },
        take: 1,
    });

    const lastOrderNumberToday = lastTransactionToday?.no_order || 0; // Gunakan 0 jika tidak ada
    const nextOrderNumber = lastOrderNumberToday + 1;

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

    const savedTransaction = await this.transactionRepository.save(transaction);

    // Kosongkan cart user
    await this.orderRepository.remove(cart.order);
    cart.order = [];
    await this.cartRepository.save(cart); // Simpan perubahan cart

    // Membuat response detail transaksi
    const response = {
        id_transaction: savedTransaction.id,
        no_order: savedTransaction.no_order,
        total_price_transaction: savedTransaction.total_price_transaction,
        payment_status: savedTransaction.payment_status,
        customer: savedTransaction.name_order,
        orders: cart.order.map((order) => ({
            id_order: order.id,
            id_product: order.product.id,
            product_name: order.product.product_name,
            qty: order.qty,
            total_price_order: order.total_price_order,
        })),
    };

    return response;
  }
}  
