import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { PaymentStatus, Transaction } from '#/transaction/entities/transaction.entity';
import { Cart } from '#/cart/entities/cart.entity';
import { User } from '#/user/entities/user.entity';
import { Order } from '#/order/entities/order.entity';
import { PaymentMethod } from '#/payment_method/entities/payment_method.entity';
import { EditTransactionDto } from './dto/edit-transaction.dto';
import { Role } from '#/role/entities/role.entity'; // Pastikan untuk mengimpor enum Role


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
        .where('transaction.payment_status = :status', { status: 'paid' })
        .getRawOne();

      return result?.total ? parseFloat(result.total) : 0;
    } catch (error) {
      throw new BadRequestException('Error calculating total income');
    }
  }

  async createTransaction(id_user: string, username: string) {
    try {
        // Find the user by ID and include their cart, order, and related product details
        const user = await this.userRepository.findOne({
            where: { id: id_user },
            relations: ['cart', 'cart.order', 'cart.order.product', 'role'],
        });

        if (!user) {
            throw new NotFoundException('User tidak ditemukan');
        }

        // Ensure the user has the 'customer' role before proceeding
        if (user.role.role_name !== 'customer') {
            throw new BadRequestException('Hanya pengguna dengan role customer yang bisa melakukan transaksi');
        }

        // Check if the cart exists and has orders
        const cart = user.cart;
        if (!cart || !cart.order || cart.order.length === 0) {
            throw new BadRequestException('Cart kosong atau tidak valid');
        }

        // Ensure the cart is not already associated with a completed transaction
        const existingTransaction = await this.transactionRepository.findOne({
            where: { cart: cart, payment_status: 'unpaid' },
        });

        if (existingTransaction) {
            throw new BadRequestException('Cart ini sudah digunakan dalam transaksi yang belum dibayar');
        }

        // Calculate the total price of the transaction
        const totalPriceTransaction = cart.order.reduce((total, order) => {
            const price = parseFloat(order.total_price_order?.toString() ?? '0');
            if (isNaN(price)) {
                throw new BadRequestException(`Total price order tidak valid: ${order.total_price_order}`);
            }
            return total + price;
        }, 0);

        if (isNaN(totalPriceTransaction)) {
            throw new BadRequestException('Nilai transaksi tidak valid');
        }

        // Get the start and end of the current day
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

        // Find the last transaction for the current day
        const [lastTransactionToday] = await this.transactionRepository.find({
            where: { createdAt: Between(startOfDay, endOfDay) },
            order: { no_order: 'DESC' },
            take: 1,
        });

        const lastOrderNumberToday = lastTransactionToday?.no_order || 0;
        const nextOrderNumber = lastOrderNumberToday + 1;

        // Create the new transaction
        const transaction = this.transactionRepository.create({
            no_order: nextOrderNumber,
            cart: cart,
            customer: user,
            total_price_transaction: totalPriceTransaction,
            payment_status: 'unpaid',
            name_order: username,
        });

        const savedTransaction = await this.transactionRepository.save(transaction);

        // Remove all orders from the cart after transaction is created
        await this.orderRepository.remove(cart.order);
        cart.order = []; // Clear the cart's order items
        await this.cartRepository.save(cart);

        // Prepare the response
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
    } catch (error) {
        console.error('Error detail:', error);
        throw new InternalServerErrorException('Terjadi kesalahan saat menyimpan transaksi');
    }
  }

  async editTransaction(
    id_transaction: string,
    id_user: string, // Changed parameter to id_user
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

    // Find the user based on id_user and check if the role is 'Cashier'
    const user = await this.userRepository.findOne({ where: { id: id_user } });
    if (!user) {
        throw new NotFoundException('User not found');
    }

    if (user.role !== Role.Cashier) {
        throw new NotFoundException('User is not authorized to edit this transaction');
    }

    transaction.cashier = user;

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

    return {
        transaction: updatedTransaction,
    };
  }
}
