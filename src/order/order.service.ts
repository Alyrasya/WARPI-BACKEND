import { Injectable, NotFoundException, BadRequestException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '#/cart/entities/cart.entity';
import { Order } from '#/order/entities/order.entity';
import { Product } from '#/product/entities/product.entity';
import { async } from 'rxjs/internal/scheduler/async';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,

    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async addToCart(id_cart: string, id_product: string[]) {
    // Cek apakah cart dengan id_cart ada
    const cart = await this.cartRepository.findOne({ where: { id: id_cart } });
    if (!cart) {
      throw new NotFoundException('Cart tidak ditemukan');
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
        where: { cart: { id: id_cart }, product: { id: productId } },
        relations: ['product', 'product.category'], // Tambahkan relasi untuk kategori
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
          id_cart: id_cart,
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
          id_cart: id_cart,
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

  async editOrderQuantity(
    id_order: string,
    action?: 'increment' | 'decrement',
    qty?: number,
  ): Promise<any> {
    // Cari order berdasarkan id_order
    const order = await this.orderRepository.findOne({
      where: { id: id_order },
      relations: ['product', 'cart'],
    });
  
    if (!order) {
      throw new NotFoundException(`Order dengan id ${id_order} tidak ditemukan`);
    }
  
    const product = order.product;
  
    if (qty !== undefined) {
      // Atur kuantitas secara manual
      if (qty < 0) {
        throw new BadRequestException('Kuantitas tidak boleh negatif');
      }
  
      const qtyDifference = qty - order.qty;
  
      if (qtyDifference > 0) {
        // Tambah kuantitas
        if (product.stock < qtyDifference) {
          throw new BadRequestException('Stok produk tidak mencukupi untuk menambah kuantitas');
        }
        product.stock -= qtyDifference;
      } else {
        // Kurangi kuantitas
        const absDifference = Math.abs(qtyDifference);
        product.stock += absDifference;
      }
  
      order.qty = qty;
  
      if (order.qty === 0) {
        // Jika kuantitas 0, hapus order
        await this.orderRepository.remove(order);
        await this.productRepository.save(product);
        return { message: `Order dengan id ${id_order} telah dihapus karena kuantitas mencapai 0` };
      }
  
      order.total_price_order = order.qty * product.price;
    } else if (action) {
      // Tambahkan atau kurangi kuantitas berdasarkan action
      if (action === 'increment') {
        if (product.stock <= 0) {
          throw new BadRequestException(`Stok produk dengan id ${product.id} sudah habis`);
        }
        order.qty += 1;
        product.stock -= 1;
      } else if (action === 'decrement') {
        order.qty -= 1;
  
        if (order.qty === 0) {
          await this.orderRepository.remove(order);
          product.stock += 1;
          await this.productRepository.save(product);
          return { message: `Order dengan id ${id_order} telah dihapus karena kuantitas mencapai 0` };
        }
  
        product.stock += 1;
      }
  
      order.total_price_order = order.qty * product.price;
    } else {
      throw new BadRequestException('Harap berikan parameter action atau qty');
    }
  
    // Simpan perubahan pada order dan produk
    await this.orderRepository.save(order);
    await this.productRepository.save(product);
  
    return {
      id_order: order.id,
      id_cart: order.cart.id,
      id_product: product.id,
      product_name: product.product_name,
      qty: order.qty,
      total_price_order: order.total_price_order,
      updatedAt: order.updatedAt,
    };
  }

  async deleteOrder(id_order: string): Promise<{ message: string }> {
    // Cari order berdasarkan id_order
    const order = await this.orderRepository.findOne({
      where: { id: id_order },
      relations: ['product'],
    });
  
    if (!order) {
      throw new NotFoundException(`Order dengan id ${id_order} tidak ditemukan`);
    }
  
    const product = order.product;
  
    // Kembalikan stok produk yang dipesan
    product.stock += order.qty;
  
    // Hapus order
    await this.orderRepository.remove(order);
  
    // Simpan perubahan stok produk
    await this.productRepository.save(product);
  
    return { message: `Order dengan id ${id_order} berhasil dihapus` };
  }
  
}

