import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Order } from '#/order/entities/order.entity';
import { Product } from '#/product/entities/product.entity';
import { Transaction } from '#/transaction/entities/transaction.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

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
      const { products } = createOrderDto;
    
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
        no_order,
        total_price_transaction: 0, // Untuk sementara 0
        payment_status: 'new',   // Status default bisa diatur
        createdAt: new Date(),
      });
      const savedTransaction = await this.transactionRepository.save(newTransaction);
    
      // 5. Iterasi produk yang dibeli dan buat order
      for (const productOrder of products) {
        const { product_id, qty = 1 } = productOrder; // Ambil qty dari DTO, default ke 1 jika tidak ada
    
        // Cek apakah produk ada di database
        const product = await this.productRepository.findOne({ where: { id: product_id } });
        if (!product) {
          throw new BadRequestException(`Product not found`);
        }
    
        // Cek apakah stok cukup
        if (product.stock < qty) {
          throw new BadRequestException(`Insufficient stock for product`);
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
    
    async editOrder(
      orderId: string, 
      actionOrQty?: 'increment' | 'decrement' | number
    ): Promise<string> {
      try {
        // Cari order berdasarkan ID
        const order = await this.getByIdOrder(orderId);
        if (!order) {
          throw new NotFoundException(`Order not found.`);
        }
    
        // Dapatkan product terkait
        const product = await this.productRepository.findOne({ where: { id: order.product_id } });
        if (!product) {
          throw new NotFoundException(`Product not found.`);
        }
    
        // Cari transaction terkait
        const transaction = await this.transactionRepository.findOne({ where: { id: order.transaction_id } });
        if (!transaction) {
          throw new NotFoundException(`Transaction not found.`);
        }
    
        // Logika pengelolaan qty atau action (increment/decrement)
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
        } else if (actionOrQty) {
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
    
        // Simpan perubahan pada product
        await this.productRepository.save(product);
    
        // Update total_price_transaction pada transaction
        const allOrders = await this.orderRepository.find({ where: { transaction_id: transaction.id } });
        const total_price_transaction = allOrders.reduce((sum, currentOrder) => {
          return sum + parseFloat(currentOrder.total_price_order.toString());
        }, 0);
    
        transaction.total_price_transaction = parseFloat(total_price_transaction.toFixed(2));
    
        // Mengubah payment_status dari 'new' ke 'unpaid' jika terjadi perubahan order
        if (transaction.payment_status === 'new') {
          transaction.payment_status = 'unpaid';
        }
    
        // Simpan perubahan pada transaction
        await this.transactionRepository.save(transaction);
    
        return `Order updated successfully.`;
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
        // Panggil getByIdOrder untuk mencari order
        const order = await this.getByIdOrder(orderId);
    
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
          throw new BadRequestException(`Transaction not found`);
        }
    
        const orders = await this.orderRepository.find({ where: { transaction_id: transaction.id } });
    
        // Jika masih ada order yang tersisa, update total transaksi
        if (orders.length > 0) {
          transaction.total_price_transaction = orders.reduce((total, currentOrder) => total + currentOrder.total_price_order, 0);
        } else {
          // Jika semua order dihapus, set total harga ke 0 dan hapus transaksi
          transaction.total_price_transaction = 0;
          await this.transactionRepository.remove(transaction);
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

    async getByIdOrder(id: string): Promise<Order> {
      const orders = await this.orderRepository.findOneBy({ id });
  
      if (!orders) {
        throw new NotFoundException('Order not found'); // Ganti dengan exception handling yang sesuai
      }
      return orders;
    }

    async editStatusOrder(transactionId: string): Promise<any> {
      // Ambil transaksi beserta order dan produk terkait
      const transaction = await this.transactionRepository.findOne({
        where: { id: transactionId },
        relations: ['orders', 'orders.product'], // Mengambil relasi order dan produk
      });
    
      // Jika transaksi tidak ditemukan, lemparkan error
      if (!transaction) {
        throw new NotFoundException(`Transaction not found`);
      }
    
      // Jika status transaksi 'new', ubah menjadi 'unpaid'
      if (transaction.payment_status === 'new') {
        transaction.payment_status = 'unpaid';
    
        // Simpan perubahan ke database
        await this.transactionRepository.save(transaction);
    
        // Map ulang orders untuk mengembalikan data yang sama seperti di getTransactionById
        const orders = transaction.orders.map(order => ({
          orderId: order.id,
          productName: order.product.product_name,
          quantity: order.qty,
          price: order.product.price, // Mengakses harga dari produk
          photo: order.product.product_photo,
        }));
    
        // Lempar pesan keberhasilan
        throw { message: 'Payment status updated to unpaid' };
      }
    
      // Jika status bukan 'new' atau sudah 'unpaid', lempar pesan bahwa status tidak dapat diubah
      throw { message: 'Payment status is already unpaid or cannot be changed' };
    }      
}
