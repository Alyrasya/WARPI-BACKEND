import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '#/order/entities/order.entity';
import { Product } from '#/product/entities/product.entity';
import { Cart } from '#/cart/entities/cart.entity';
import { User } from '#/user/entities/user.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async addToCart(id_user: string, id_product: string[]) {
    // Cek apakah user dengan id_user ada
    const user = await this.userRepository.findOne({
      where: { id: id_user },
      relations: ['cart'], // Pastikan relasi dengan cart sudah diatur
    });
    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }
  
    // Cek apakah user memiliki id_cart
    const cart = user.cart;
    if (!cart) {
      throw new BadRequestException('User ini tidak memiliki cart');
    }
  
    const orders: any[] = [];
  
    for (const productId of id_product) {
      const product = await this.productRepository.findOne({
        where: { id: productId },
        relations: ['category'],
      });
      if (!product) {
        throw new NotFoundException(`Produk dengan id ${productId} tidak ditemukan`);
      }
  
      if (product.stock <= 0) {
        throw new BadRequestException(`Produk dengan id ${productId} sudah habis stoknya`);
      }
  
      // Cari apakah produk sudah ada di cart
      let existingOrder = await this.orderRepository.findOne({
        where: { cart: { id: cart.id }, product: { id: productId } },
        relations: ['product', 'product.category'],
      });
  
      if (existingOrder) {
        // Jika produk sudah ada, tambahkan qty dan kurangi stok
        existingOrder.qty += 1;
        existingOrder.total_price_order = existingOrder.qty * product.price;
        await this.orderRepository.save(existingOrder);
  
        // Kurangi stok produk
        product.stock -= 1;
        await this.productRepository.save(product);
  
        // Tambahkan detail tambahan dalam response
        orders.push({
          id_order: existingOrder.id,
          id_cart: cart.id,
          id_product: existingOrder.product.id,
          product_name: existingOrder.product.product_name,
          category: existingOrder.product.category.category_name,
          qty: existingOrder.qty,
          total_price_order: existingOrder.total_price_order,
          createdAt: existingOrder.createdAt,
          updatedAt: existingOrder.updatedAt,
        });
      } else {
        // Jika produk belum ada di cart, buat order baru
        const newOrder = this.orderRepository.create({
          cart,
          product,
          qty: 1,
          total_price_order: product.price,
        });
  
        const savedOrder = await this.orderRepository.save(newOrder);
  
        // Kurangi stok produk
        product.stock -= 1;
        await this.productRepository.save(product);
  
        // Tambahkan detail tambahan dalam response
        orders.push({
          id_order: savedOrder.id,
          id_cart: cart.id,
          id_product: savedOrder.product.id,
          product_name: savedOrder.product.product_name,
          category: savedOrder.product.category.category_name,
          qty: savedOrder.qty,
          total_price_order: savedOrder.total_price_order,
          createdAt: savedOrder.createdAt,
          updatedAt: savedOrder.updatedAt,
        });
      }
    }
  
    return {
      data: orders,
    };
  }
}