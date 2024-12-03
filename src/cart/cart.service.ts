import { Injectable, NotFoundException } from '@nestjs/common';
import { AddToCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { Cart } from './entities/cart.entity';
import { Product, StatusProduct } from '#/product/entities/product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '#/order/entities/order.entity';

@Injectable()
export class CartService {
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>;
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>;
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>;

async addToCart(addToCartDto: AddToCartDto): Promise<Cart> {
    const { userId,productId, qty } = addToCartDto;

    const product = await this.productRepository.findOne({ where: { id: productId } });

    if (!product || product.status_product !== StatusProduct.ACTIVE) {
        throw new Error("Product is unavailable.");
    }

    if (product.stock < qty) {
        throw new Error("Insufficient stock.");
    }

    let cart = await this.cartRepository.findOne({
        where: { user: { id: userId } },
        relations: ['order'],
    });

    if (!cart) {
        cart = this.cartRepository.create({ user: { id: userId }, order: [] });
        cart = await this.cartRepository.save(cart);
    }

    const order = this.orderRepository.create({
        product,
        qty,
        total_price_order: product.price * qty,
        cart,
    });

    product.stock -= qty;
    await this.productRepository.save(product);

    cart.order.push(order);
    return this.cartRepository.save(cart);
}

async getAllCartsByUserId(userId: string): Promise<Cart[]> {
    const carts = await this.cartRepository.find({
        where: { user: { id: userId } },
        relations: ['order', 'product', 'transaction'], // Relasi yang diperlukan
    });

    if (!carts.length) {
        throw new NotFoundException(`No carts found for user with ID ${userId}`);
    }

    return carts;
}


async deleteProductFromCart(userId: string, productId: string): Promise<Cart> {
  const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['order', 'order.product', 'transaction'],
  });

  if (!cart) {
      throw new Error('Cart not found.');
  }

  // Pastikan belum diorder
  if (cart.transaction) {
      throw new Error('Cannot delete product from cart. Cart has been ordered.');
  }

  // Cari order yang berisi produk
  const orderIndex = cart.order.findIndex(order => order.product.id === productId);

  if (orderIndex === -1) {
      throw new Error('Product not found in cart.');
  }

  const [removedOrder] = cart.order.splice(orderIndex, 1);

  // Kembalikan stok produk
  const product = await this.productRepository.findOne({ where: { id: productId } });
  product.stock += removedOrder.qty;
  await this.productRepository.save(product);

  return this.cartRepository.save(cart);
}


async editProductQuantityInCart(userId: string, productId: string, newQuantity: number): Promise<Cart> {
  const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['order', 'order.product', 'transaction'],
  });

  if (!cart) {
      throw new Error('Cart not found.');
  }

  // Pastikan belum diorder
  if (cart.transaction) {
      throw new Error('Cannot edit product quantity. Cart has been ordered.');
  }

  const order = cart.order.find(order => order.product.id === productId);

  if (!order) {
      throw new Error('Product not found in cart.');
  }

  const product = await this.productRepository.findOne({ where: { id: productId } });

  // Hitung stok lama dan stok baru
  const oldQuantity = order.qty;
  const quantityDifference = newQuantity - oldQuantity;

  if (product.stock < quantityDifference) {
      throw new Error('Insufficient stock for the requested quantity.');
  }

  // Update kuantitas
  product.stock -= quantityDifference;
  order.qty = newQuantity;
  order.total_price_order = newQuantity * product.price;

  await this.productRepository.save(product);
  return this.cartRepository.save(cart);
}




  findAll() {
    return `This action returns all cart`;
  }

  findOne(id: number) {
    return `This action returns a #${id} cart`;
  }
}
