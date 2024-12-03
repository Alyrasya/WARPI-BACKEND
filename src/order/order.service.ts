import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '#/cart/entities/cart.entity';
import { Order } from '#/order/entities/order.entity';
import { Product } from '#/product/entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<Order[]> {
    const { idCart, products } = createOrderDto;

    // Validasi cart
    const cart = await this.cartRepository.findOne({
      where: { id: idCart },
      relations: ['user'],
    });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const orders: Order[] = [];

    // Proses setiap produk dalam array
    for (const { idProduct, qty } of products) {
      // Validasi product
      const product = await this.productRepository.findOne({ where: { id: idProduct } });
      if (!product) {
        throw new NotFoundException(`Product with id ${idProduct} not found`);
      }
      if (product.stock < qty) {
        throw new Error(`Not enough stock available for product ${product.product_name}`);
      }

      // Hitung total harga
      const totalPrice = product.price * qty;

      // Buat order untuk produk ini
      const order = this.orderRepository.create({
        cart,
        product,
        qty,
        total_price_order: totalPrice,
      });

      // Simpan order ke database
      const savedOrder = await this.orderRepository.save(order);

      // Update stok produk
      product.stock -= qty;
      await this.productRepository.save(product);

      orders.push(savedOrder);
    }

    return orders;
  }
}
