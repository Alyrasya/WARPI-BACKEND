import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository} from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { Order } from '#/order/entities/order.entity';

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
      totalPriceOrder: order.qty * order.product.price,
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
}