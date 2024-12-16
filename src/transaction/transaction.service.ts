import { Injectable, NotFoundException, BadRequestException, HttpStatus, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { PaymentStatus, Transaction } from '#/transaction/entities/transaction.entity';
import { Cart } from '#/cart/entities/cart.entity';
import { User } from '#/user/entities/user.entity';
import { Order } from '#/order/entities/order.entity';
import { PaymentMethod } from '#/payment_method/entities/payment_method.entity';
import { Role } from '#/role/entities/role.entity';

@Injectable()
export class TransactionService {
  getAllTransactionsByUserAndStatus: any;
  getTransactionById: any;
 
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
  ) {}

  async countPaidTransactions(){
    return await this.transactionRepository.count({
      where: { payment_status: 'paid' },
    });
  }

  async countTotalMonthlyIncome(){
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      const result = await this.transactionRepository
        .createQueryBuilder('transaction')
        .select('SUM(transaction.total_price_transaction)', 'total')
        .where('transaction.payment_status = :payment_status', { payment_status: 'paid' })
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
        .where('transaction.payment_status = :payment_status', { payment_status: 'paid' })
        .getRawOne();

      return result?.total ? parseFloat(result.total) : 0;
    } catch (error) {
      throw new BadRequestException('Error calculating total income');
    }
  }

  //Customer
  async createTransaction(id_user: string, username: string) {
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

    // Buat transaksi baru
    const transaction = this.transactionRepository.create({
        no_order: nextOrderNumber,
        cart: cart,
        customer: user,
        total_price_transaction: totalPriceTransaction,
        payment_status: 'unpaid',
        name_order: username,
    });

    const savedTransaction = await this.transactionRepository.save(transaction);

    // Hubungkan setiap order dengan transaksi baru
    cart.order.forEach(order => {
        order.transaction = savedTransaction; // Setel relasi transaksi pada order
    });

    // Simpan perubahan pada order dengan relasi transaksi
    await this.orderRepository.save(cart.order);

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

    // Kosongkan cart user setelah pemetaan data transaksi
    cart.order = []; // Mengosongkan referensi order di cart tetapi tidak menghapus data order dari database
    await this.cartRepository.save(cart); // Simpan perubahan cart

    return response;
  }

  //Cashier
  async editTransaction(
    id_transaction: string,
    id_user: string,
    cash: number | null,
    action: 'paid' | 'pending',
    id_method: string,
) {
    const transaction = await this.transactionRepository.findOne({
        where: { id: id_transaction },
        relations: ['paymentMethod', 'cashier', 'cart.user'],
    });

    if (!transaction) {
        throw new NotFoundException('Transaction not found');
    }

    const cashier = await this.userRepository.findOne({ where: { id: id_user } });
    if (!cashier || cashier.role !== Role.Cashier) {
        throw new NotFoundException('Cashier not found or unauthorized');
    }

    transaction.cashier = cashier;

    const paymentMethod = await this.paymentMethodRepository.findOne({ where: { id: id_method } });
    if (!paymentMethod) {
        throw new NotFoundException('Payment method not found');
    }

    transaction.paymentMethod = paymentMethod;

    const cart = transaction.cart;
    if (cart) {
        const customer = cart.user;
        if (customer) {
            transaction.customer = customer;
        }
    }

    if (paymentMethod.method_name === 'cash') {
        if (cash === null) {
            throw new Error('Cash value must be provided for cash transactions');
        }
        if (cash < (transaction.total_price_transaction ?? 0)) {
            throw new Error('Cash amount must be equal to or greater than the total price of the transaction');
        }
        transaction.cash = cash;
        transaction.change_money = parseFloat((cash - (transaction.total_price_transaction ?? 0)).toFixed(2));
    } else if (paymentMethod.method_name === 'qris') {
        transaction.cash = transaction.total_price_transaction ?? 0;
        transaction.change_money = 0;
    } else {
        throw new Error('Unsupported payment method');
    }

    transaction.payment_status = action === 'paid' ? PaymentStatus.Paid : PaymentStatus.Pending;

    const updatedTransaction = await this.transactionRepository.save(transaction);

    return { transaction: updatedTransaction };
  }

  //Customer
  async getAllHistory(){
    return await this.transactionRepository.find({
      relations: ['paymentMethod', 'cart', 'cart.user', 'cashier', 'customer'],
      order: { createdAt: 'DESC' },
    });
  }

  //Admin
  async getAllTransaction(
    page: number,
    page_size: number,
    name_order?: string,
    method_name?: string,
    start_date?: string,
    end_date?: string,
  ) {
    const query = this.transactionRepository
      .createQueryBuilder('transaction')
      .select([
        'transaction.id',
        'transaction.no_order',
        'transaction.name_order',
        'transaction.total_price_transaction',
        'transaction.cash',
        'transaction.change_money',
        'transaction.payment_status',
        'paymentMethod.method_name',
        'transaction.createdAt',
      ])
      .innerJoin('transaction.paymentMethod', 'paymentMethod')
      .where('transaction.payment_status = :payment_status', { payment_status: 'paid' })
  
    if (name_order) {
      query.andWhere('transaction.name_order LIKE :name_order', { name_order: `%${name_order}%` });
    }
    if (method_name) {
      query.andWhere('paymentMethod.method_name = :method_name', { method_name });
    }

    if (start_date && end_date) {
      const formattedStartDate = new Date(start_date).toISOString().split('T')[0] + 'T00:00:00.000+07';
      const formattedEndDate = new Date(end_date).toISOString().split('T')[0] + 'T23:59:59.999+07';
    
      console.log(`Start Date: ${formattedStartDate}, End Date: ${formattedEndDate}`);
      
      query.andWhere(
        `transaction.createdAt AT TIME ZONE 'Asia/Jakarta' >= :start_date 
         AND transaction.createdAt AT TIME ZONE 'Asia/Jakarta' <= :end_date`,
        {
          start_date: formattedStartDate,
          end_date: formattedEndDate,
        }
      );
    }
    
    query.orderBy('transaction.createdAt', 'ASC');

    query.skip((page - 1) * page_size).take(page_size);

    const [transactions, totalCount] = await query.getManyAndCount();
  
    return {
      data: transactions,
      totalCount,
    };
  }  
  
  //Admin
  async getByIdTransaction(id: string){
    try {
      const transaction = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select([
        'transaction.id',
        'transaction.no_order',
        'transaction.name_order',
        'transaction.total_price_transaction',
        'transaction.cash',
        'transaction.change_money',
        'transaction.payment_status',
        'paymentMethod.method_name',
        'transaction.createdAt',
      ])
      .innerJoin('transaction.paymentMethod', 'paymentMethod')
        .leftJoinAndSelect('transaction.order', 'order')
        .leftJoinAndSelect('order.product', 'product')
        .where('transaction.id = :id', { id })
        .getOne();

      if (!transaction) {
        throw new HttpException('Transaksi tidak ditemukan.', HttpStatus.NOT_FOUND);
      }

      return transaction;
    } catch (error) {
      console.error('Kesalahan saat mengambil transaksi oleh ID:', error.message);
      throw new HttpException(
        'Terjadi kesalahan saat mengambil transaksi.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  // async getAllTransactionsByUserAndStatus(
  //   id_user: string,
  // ): Promise<Transaction[]> {
  //   return await this.transactionRepository.find({
  //     where: [
  //       { customer: { id: id_user } },
  //       { cashier: { id: id_user } },
  //     ],
  //     relations: ['paymentMethod', 'cart', 'cashier', 'customer'],
  //     order: { createdAt: 'DESC' }, // Mengurutkan berdasarkan tanggal transaksi terbaru
  //   });
  // }
  //Cashier
  async getAllTransactionCashier(
    page: number,
    page_size: number,
    name_order?: string,
    payment_status?: PaymentStatus
  ) {
    const query = this.transactionRepository
      .createQueryBuilder('transaction')
      .select([
        'transaction.id',
        'transaction.no_order',
        'transaction.name_order',
        'transaction.total_price_transaction',
        'transaction.cash',
        'transaction.change_money',
        'transaction.payment_status',
        'paymentMethod.method_name',
        'transaction.createdAt',
      ])
      .leftJoin('transaction.paymentMethod', 'paymentMethod');
  
    if (name_order) {
      query.andWhere('transaction.name_order LIKE :name_order', { name_order: `%${name_order}%` });
    }
  
    if (payment_status) {
      query.andWhere('transaction.payment_status::text = :payment_status', { payment_status });
    }
  
    query.orderBy('transaction.createdAt', 'ASC');
    query.skip((page - 1) * page_size).take(page_size);
  
    const [transactions, totalCount] = await query.getManyAndCount();
  
    return {
      data: transactions,
      totalCount,
    };
  }
}