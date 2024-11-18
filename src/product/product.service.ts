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

  // Fungsi untuk membuat product
  async createProduct(data: CreateProductDto) {
    const category = await this.categoryRepository.findOne({
        where: { id: data.id_category },
    });

    if (!category) {
        throw new NotFoundException('Kategori Tidak Ditemukan');
    }

    // Periksa apakah produk dengan nama dan kategori yang sama sudah ada
    const existingProduct = await this.productRepository.findOne({
        where: {
            product_name: data.product_name,
            category: { id: data.id_category },
        },
        relations: ['category'],
    });

    if (existingProduct) {
        throw new ConflictException(
            `Produk dengan nama '${data.product_name}' pada kategori '${category.category_name}' sudah ada`
        );
    }

    try {
        // Buat produk baru dengan menyetel relasi kategori
        const newProduct = this.productRepository.create({
            ...data,
            stock: 0,
            category: category,
        });

        const product = await this.productRepository.save(newProduct);
        return product;
    } catch {
        throw new InternalServerErrorException('Terjadi kesalahan pada server');
    }
  }


  // Fungsi untuk mengedit product
  async updateProduct(id: string, data: UpdateProductDto){
    try{
      const product = await this.getByIdProduct(id);
      if (!product) {
        throw new NotFoundException('Product not found');
      }
    
      const { 
        product_name,
        description,
        price,
        stock,
        product_photo,
        status_product
      } = data;
      let isUpdated = false;

      // Validasi nilai negatif untuk stock dan price
      if (price !== undefined && product.price < 0) {
        throw new BadRequestException('Price tidak boleh nilai negatif');
      }
    
      if (stock !== undefined && product.stock < 0) {
        throw new BadRequestException('Stock tidak boleh nilai negatif');
      }
    
      // Hanya perbarui field yang diberikan (tidak overwrite dengan nilai kosong)
      if (product_name !== undefined && product.product_name !== product_name) {
        product.product_name = product_name;
        isUpdated = true;
      }
    
      if (description !== undefined && product.description !== description) {
        product.description = description;
        isUpdated = true;
      }
    
      if (price !== undefined && product.price !== price) {
        product.price = price;
        isUpdated = true;
      }
    
      if (stock !== undefined && product.stock !== stock) {
        product.stock = stock;
        isUpdated = true;
      }
    
      if (product_photo !== undefined && product.product_photo !== product_photo) {
        product.product_photo = product_photo;
        isUpdated = true;
      }
    
      if (status_product !== undefined && product.status_product !== status_product) {
        product.status_product = status_product;
        isUpdated = true;
      }

      if (!isUpdated) return product;
    
      const updateProduct = await this.productRepository.save(product);

      return updateProduct;
    }
    catch(error){
      console.error('Error saat memperbarui produk:', error.message);
      throw new Error(`Gagal memperbarui produk: ${error.message}`);
    }
  }    

  // Fungsi untuk melihat detail produk
  async getByIdProduct(id: string){
    const product = await this.productRepository.findOneBy({ id })

    if (!product) {
      throw new NotFoundException(`Produk dengan ID ${id} tidak ditemukan`);
    }
    return product;
  }
  
  // Fungsi untuk mendapatkan seluruh produk
  async getAllProduct(page: number, page_size: number, product_name?: string, category_name?: string){
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
    
    if (category_name) {
      query.where('product.category_name ILIKE :category_name', { category_name: `%${category_name}%` });
    }
    
    if (product_name) {
      query.andWhere('product.product_name ILIKE :product_name', { product_name: `%${product_name}%` });
    }
    
    query.skip((page - 1) * page_size).take(page_size);
    
    const [products, totalCount] = await query.getManyAndCount();
  
    if (totalCount === 0) {
      throw new NotFoundException(
        product_name
          ? `Produk dengan nama '${product_name}' tidak ditemukan`
          : `Produk tidak ditemukan` 
      );
    }
  
    return { data: products, totalCount };
  }   
  
  //Fungsi untuk menghitung total produk
  async countProducts(){
    return await this.productRepository.count();
  }
}