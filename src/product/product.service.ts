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
            stock: 0,
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
    // Cek apakah produk dengan ID tersebut ada
    const product = await this.getByIdProduct(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
  
    // Validasi nilai negatif untuk stock dan price
    if (updateProductDto.price !== undefined && updateProductDto.price < 0) {
      throw new BadRequestException('Price cannot be negative');
    }
  
    if (updateProductDto.stock !== undefined && updateProductDto.stock < 0) {
      throw new BadRequestException('Stock cannot be negative');
    }
  
    // Hanya perbarui field yang diberikan (tidak overwrite dengan nilai kosong)
    if (updateProductDto.product_name !== undefined && updateProductDto.product_name !== '') {
      product.product_name = updateProductDto.product_name;
    }
  
    if (updateProductDto.description !== undefined && updateProductDto.description !== '') {
      product.description = updateProductDto.description;
    }
  
    if (updateProductDto.price !== undefined) {
      product.price = updateProductDto.price;
    }
  
    if (updateProductDto.stock !== undefined) {
      product.stock = updateProductDto.stock;
    }
  
    if (updateProductDto.product_photo !== undefined && updateProductDto.product_photo !== '') {
      product.product_photo = updateProductDto.product_photo;
    }
  
    if (updateProductDto.status_product !== undefined) {
      product.status_product = updateProductDto.status_product;
    }
  
    // Simpan produk yang sudah diperbarui ke database
    return this.productRepository.save(product);
  }    

  // Digunakan untuk melihat detail product
  async getByIdProduct(id: string): Promise<Product> {
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
  
  async getAllProduct(page: number, page_size: number, product_name?: string, category_name?: string): Promise<{ data: any[]; totalCount: number }> {
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
      query.andWhere('product.product_name ILIKE :product_name', { product_name: `%${product_name}%` });
    }
    
    // Paginasi: Skip dan Take
    query.skip((page - 1) * page_size).take(page_size);
    
    const [products, totalCount] = await query.getManyAndCount();
  
    if (totalCount === 0) {
      throw new NotFoundException(
        product_name
          ? `Product with name '${product_name}' not found`
          : `No product found`
      );
    }
  
    return { data: products, totalCount };  // Mengembalikan hasil sebagai objek
  }   
  
  async countProducts(): Promise<number> {
    return await this.productRepository.count();
  }
}