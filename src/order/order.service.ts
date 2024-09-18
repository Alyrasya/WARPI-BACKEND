import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Order } from '#/order/entities/order.entity';
import { Product } from '#/product/entities/product.entity';
import { Transaction } from '#/transaction/entities/transaction.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
    ) {}

    async createOrder(createOrderDto: CreateOrderDto): Promise<Transaction> {
      const { products, orderers_name } = createOrderDto;
  
      // 1. Dapatkan tanggal awal dan akhir untuk hari ini
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
  
      // 2. Hitung jumlah transaksi hari ini
      const countTransactionsToday = await this.transactionRepository.count({
          where: {
              createdAt: Between(todayStart, todayEnd),
          },
      });
  
      // 3. Set no_order menjadi jumlah transaksi hari ini + 1
      const no_order = countTransactionsToday + 1;
  
      let total_price_transaction = 0;
  
      // 4. Buat transaksi baru
      const newTransaction = this.transactionRepository.create({
          orderers_name,
          no_order,
          total_price_transaction: 0, // Untuk sementara 0
          payment_status: 'unpaid',   // Status default bisa diatur
          createdAt: new Date(),
      });
      const savedTransaction = await this.transactionRepository.save(newTransaction);
  
      // 5. Iterasi produk yang dibeli dan buat order
      for (const productOrder of products) {
          const { product_id, qty } = productOrder; // Ambil qty dari DTO
  
          // Cek apakah produk ada di database
          const product = await this.productRepository.findOne({ where: { id: product_id } });
          if (!product) {
              throw new BadRequestException(`Product with ID ${product_id} not found`);
          }
  
          // Cek apakah stok cukup
          if (product.stock < qty) {
              throw new BadRequestException(`Insufficient stock for product ID ${product_id}`);
          }
  
          // Hitung total harga per produk
          const total_price_order = product.price * qty;
  
          // Tambahkan total_price_order ke total transaksi
          total_price_transaction += total_price_order;
  
          // Kurangi stok produk
          product.stock -= qty;
          await this.productRepository.save(product);
  
          // Buat order baru
          const newOrder = this.orderRepository.create({
              product_id,
              transaction_id: savedTransaction.id,  // Assign ID transaksi
              qty, // Set sesuai qty yang diinput
              total_price_order,
          });
  
          // Simpan order ke database
          await this.orderRepository.save(newOrder);
      }
  
      // 6. Update total_price_transaction setelah semua order selesai
      savedTransaction.total_price_transaction = total_price_transaction;
      await this.transactionRepository.save(savedTransaction);
  
      // 7. Kembalikan transaksi yang telah dibuat
      return savedTransaction;
  }
  

    async editOrder(orderId: string, actionOrQty?: 'increment' | 'decrement' | number): Promise<string> {
      try {
        const order = await this.orderRepository.findOne({ where: { id: orderId } });
        if (!order) {
          throw new NotFoundException(`Order not found.`);
        }
    
        const product = await this.productRepository.findOne({ where: { id: order.product_id } });
        if (!product) {
          throw new NotFoundException(`Product not found.`);
        }
    
        if (typeof actionOrQty === 'number') {
          const newQty = actionOrQty;
          const qtyDifference = newQty - order.qty;
    
          if (qtyDifference > 0) {
            if (product.stock < qtyDifference) {
              throw new BadRequestException(`Insufficient stock.`);
            }
            product.stock -= qtyDifference;
          } else if (qtyDifference < 0) {
            product.stock += Math.abs(qtyDifference);
          }
    
          order.qty = newQty;
    
          if (order.qty <= 0) {
            await this.orderRepository.delete(orderId);
          } else {
            order.total_price_order = parseFloat((product.price * order.qty).toFixed(2));
            await this.orderRepository.save(order);
          }
        } else {
          const action = actionOrQty as 'increment' | 'decrement';
    
          if (action === 'increment') {
            if (product.stock < 1) {
              throw new BadRequestException(`Insufficient stock.`);
            }
            order.qty += 1;
            product.stock -= 1;
          } else if (action === 'decrement') {
            order.qty -= 1;
            product.stock += 1;
          }
    
          if (order.qty <= 0) {
            await this.orderRepository.delete(orderId);
          } else {
            order.total_price_order = parseFloat((product.price * order.qty).toFixed(2));
            await this.orderRepository.save(order);
          }
        }
    
        await this.productRepository.save(product);
    
        const transaction = await this.transactionRepository.findOne({ where: { id: order.transaction_id } });
        if (!transaction) {
          throw new NotFoundException(`Transaction not found.`);
        }
        
        const allOrders = await this.orderRepository.find({ where: { transaction_id: transaction.id } });
        const total_price_transaction = allOrders.reduce((sum, order) => {
          return sum + parseFloat(order.total_price_order.toString());
        }, 0);
    
        transaction.total_price_transaction = parseFloat(total_price_transaction.toFixed(2));
        await this.transactionRepository.save(transaction);
    
        return `Order ${orderId} updated successfully.`;
      } catch (error) {
        if (error instanceof BadRequestException || error instanceof NotFoundException) {
          throw error;
        } else {
          throw new BadRequestException('An unexpected error occurred.');
        }
      }
    }
    
    async deleteOrder(orderId: string): Promise<string> {
      try {
        // Cari order berdasarkan ID
        const order = await this.orderRepository.findOne({ where: { id: orderId } });
    
        if (!order) {
          throw new BadRequestException(`Order with ID ${orderId} not found`);
        }
    
        // Dapatkan product terkait
        const product = await this.productRepository.findOne({ where: { id: order.product_id } });
    
        if (!product) {
          throw new BadRequestException(`Product with ID ${order.product_id} not found`);
        }
    
        // Kembalikan stok produk
        product.stock += order.qty;
        await this.productRepository.save(product);
    
        // Hapus order
        await this.orderRepository.remove(order);
    
        // Update total harga transaksi
        const transaction = await this.transactionRepository.findOne({ where: { id: order.transaction_id } });
        if (!transaction) {
          throw new BadRequestException(`Transaction with ID ${order.transaction_id} not found`);
        }
    
        const orders = await this.orderRepository.find({ where: { transaction_id: transaction.id } });
    
        // Jika masih ada order yang tersisa, update total transaksi
        if (orders.length > 0) {
          transaction.total_price_transaction = orders.reduce((total, currentOrder) => total + currentOrder.total_price_order, 0);
        } else {
          // Jika semua order dihapus, set total harga ke 0
          transaction.total_price_transaction = 0;
        }
    
        await this.transactionRepository.save(transaction);
    
        return 'Order deleted successfully.';
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw new BadRequestException(error.message);
        } else {
          throw new BadRequestException('An unexpected error occurred.');
        }
      }
    }

    async getAllOrders(): Promise<any[]> {
      // Mengambil semua order beserta relasi dengan transaksi
      const orders = await this.orderRepository.find({
        relations: ['transaction'], // Mengambil relasi transaction
      });
    
      // Mengembalikan data orders dengan format yang menyertakan transaction_id
      return orders.map(order => ({
        order_id: order.id,
        product_id: order.product_id,
        qty: order.qty,
        total_price_order: order.total_price_order,
        transaction_id: order.transaction_id, // Menyertakan transaction_id
      }));
    }

    async getByIdCategory(id: string): Promise<Order> {
      const orders = await this.orderRepository.findOneBy({ id });
  
      if (!orders) {
        throw new NotFoundException('Order not found'); // Ganti dengan exception handling yang sesuai
      }
      return orders;
    }
}
