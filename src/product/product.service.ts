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
      return await this.productRepository.save(newProduct);
    } catch (error) {
      // Tangani kesalahan yang tidak terduga
      console.error('Error occurred while saving the product:', error);
      throw new InternalServerErrorException('An unexpected error occurred while saving the product');
    }
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.productRepository.preload({
      id,
      ...updateProductDto,
    });

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

  async getAllProduct(): Promise<{ product: Product[], total: number }> {
    const [product, total] = await this.productRepository
    .createQueryBuilder('product')
    .getManyAndCount();
    return { product, total }; 
  }

  //Digunakan untuk melihat detail product
  async getByIdProduct(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where:{id},
      // relations:{category:true}
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async filterByName(product_name: string): Promise<Product[]> {
    // Validasi input untuk memastikan product_name disediakan dan tidak kosong
    if (!product_name || product_name.trim().length === 0) {
      throw new BadRequestException('Product name must be provided');
    }

    // Query builder untuk pencarian case-insensitive menggunakan ILIKE
    const products = await this.productRepository
      .createQueryBuilder('product')
      .where('product.product_name ILIKE :name', { name: `%${product_name}%` })
      .getMany();

    // Jika tidak ada produk yang ditemukan, lempar NotFoundException
    if (products.length === 0) {
      throw new NotFoundException('No product found with the given name');
    }

    return products;
  }

  async countProducts(): Promise<number> {
    return await this.productRepository.count();
  }
}