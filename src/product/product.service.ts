import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Category } from '#/category/entities/category.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    // Periksa apakah kategori dengan nama yang diberikan ada
    const category = await this.categoryRepository.findOne({
      where: { id: createProductDto.id_category },
    });
  
    if (!category) {
      throw new NotFoundException('Category not found');
    }
  
    // Periksa apakah produk dengan nama yang sama sudah ada dalam kategori yang sama
    const existingProduct = await this.productRepository.findOne({
      where: {
        product_name: createProductDto.product_name,
        category: { id: createProductDto.id_category },
      },
    });
  
    if (existingProduct) {
      throw new ConflictException('Product with this name already exists in the specified category');
    }
  
    try {
      // Buat produk baru dan hubungkan dengan kategori
      const newProduct = this.productRepository.create({
        ...createProductDto,
        category_name: category.category_name,
        category, // Hubungkan kategori dengan produk
      });
  
      // Simpan produk dan tunggu hingga selesai
      const savedProduct = await this.productRepository.save(newProduct);
      return savedProduct;
    } catch (error) {
      // Tangani kesalahan yang tidak terduga
      console.error('Error occurred while saving the product:', error);
      throw new InternalServerErrorException('An unexpected error occurred while saving the product');
    }
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto): Promise<Product> {

    const product = await this.getByIdProduct(id);

    // Jika produk tidak ditemukan, lempar NotFoundException
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Periksa jika ada nilai baru dalam updateProductDto
    let hasUpdates = false;

    // Periksa dan perbarui setiap field jika ada nilai baru
    if (updateProductDto.product_name !== undefined) {
      product.product_name = updateProductDto.product_name;
      hasUpdates = true;
    }

    if (updateProductDto.price !== undefined) {
      product.price = updateProductDto.price;
      hasUpdates = true;
    }

    if (updateProductDto.description !== undefined) {
      product.description = updateProductDto.description;
      hasUpdates = true;
    }

    if (updateProductDto.status_product !== undefined) {
      product.status_product = updateProductDto.status_product;
      hasUpdates = true;
    }

    if (updateProductDto.product_photo !== undefined) {
      product.product_photo = updateProductDto.product_photo;
      hasUpdates = true;
    }

    if (updateProductDto.stock !== undefined) {
      product.stock = updateProductDto.stock;
      hasUpdates = true;
    }

    // Periksa dan perbarui field lain sesuai kebutuhan

    // Jika tidak ada pembaruan, kembalikan produk yang sudah ada
    if (!hasUpdates) {
      return product;
    }

    // Simpan dan kembalikan produk yang telah diperbarui
    return this.productRepository.save(product);
  }

  // Digunakan untuk melihat detail product
  async getByIdProduct(id: string): Promise<any> {
    const product = await this.productRepository
      .createQueryBuilder('product')
      .select([
        'product.product_name',
        'product.description',
        'product.price',
        'product.category_name',
        'product.status_product',
        'product.product_photo',
        'product.stock',
      ])
      .where('product.id = :id', { id }) // Tambahkan kondisi untuk mencari berdasarkan id
      .getOne();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }
  
  async getAllProduct(product_name?: string, category_name?: string): Promise<any[]> {
    const query = this.productRepository
      .createQueryBuilder('product')
      .select([
        'product.id',
        'product.product_name',
        'product.description',
        'product.price',
        'product.category_name',
        'product.status_product',
        'product.product_photo',
        'product.stock',
      ]);
  
    // Jika ada parameter category_name, tambahkan kondisi WHERE untuk filter kategori
    if (category_name && category_name.toLowerCase() !== 'all') {
      query.where('product.category_name = :category_name', { category_name });
    }
  
    // Jika ada parameter product_name, tambahkan kondisi ILIKE untuk pencarian
    if (product_name) {
      if (category_name && category_name.toLowerCase() !== 'all') {
        const productInCategory = await query
          .andWhere('product.product_name ILIKE :product_name', { product_name: `%${product_name}%` })
          .getMany();
  
        if (productInCategory.length === 0) {
          throw new Error(`Product with name "${product_name}" not found in the "${category_name}" category.`);
        }
  
        return productInCategory;
      } else {
        query.andWhere('product.product_name ILIKE :product_name', { product_name: `%${product_name}%` });
      }
    }
  
    const products = await query.getMany();
    return products;
  }  
  
  async countProducts(): Promise<number> {
    return await this.productRepository.count();
  }
}