import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '#/product/entities/product.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  // Fungsi untuk membuat kategori
  async createCategory(data: CreateCategoryDto){
    const { category_name } = data;

    const existingCategory = await this.categoryRepository.findOne({
      where: { category_name },
    });

    if (existingCategory) {
      throw new ConflictException('Category Sudah Ada');
    }

    try{
      const newCategory = this.categoryRepository.create(data);

      const category = await this.categoryRepository.save(newCategory);
      return category
    }
    catch{
      throw new InternalServerErrorException('Terjadi kesalahan pada server');
    }
  }

  // Fungsi untuk mengedit kategori berdasarkan ID
  async editCategory(id: string, data: UpdateCategoryDto){
    try {
        const category = await this.getByIdCategory(id);
        if (!category) {
            throw new NotFoundException('Kategori tidak ditemukan');
        }

        const { category_name, status_category } = data;
        let isUpdated = false;

        if (category_name !== undefined && category.category_name !== category_name) {
            category.category_name = category_name;
            isUpdated = true;
        }

        if (status_category !== undefined && category.status_category !== status_category) {
            category.status_category = status_category;
            isUpdated = true;
        }

        if (!isUpdated) return category;

        const updatedCategory = await this.categoryRepository.save(category);

        // Perbarui nama kategori di semua produk yang terkait, jika nama kategori diubah
        if (category_name !== undefined) {
            await this.updateProductsCategoryName(updatedCategory.id, updatedCategory.category_name);
        }

        return updatedCategory;

    } catch (error) {
        console.error('Error saat memperbarui kategori:', error.message);
        throw new Error(`Gagal memperbarui kategori: ${error.message}`);
    }
  }

  // Metode untuk memperbarui nama kategori di produk terkait
  private async updateProductsCategoryName(id_category: string, newCategoryName: string) {
    try {
        const products = await this.productRepository.find({ where: { category: { id: id_category } } });

        for (const product of products) {
            product.category_name = newCategoryName;
            await this.productRepository.save(product);
        }

    } catch (error) {
        console.error('Error saat memperbarui nama kategori di produk:', error.message);
        throw new Error(`Gagal memperbarui nama kategori di produk terkait: ${error.message}`);
    }
  }

  // Fungsi untuk mendapatkan kategori berdasarkan ID
  async getByIdCategory(id: string){
    const category = await this.categoryRepository.findOneBy({ id });
  
    if (!category) {
      throw new NotFoundException('Kategori tidak ditemukan'); // Ganti dengan exception handling yang sesuai
    }
    return category;
  }

  //Fungsi untuk mendapatkan seluruh kategori
  async getAllCategory(page: number, page_size: number, category_name?: string) {
    const query = this.categoryRepository
      .createQueryBuilder('category')
      .select([
        'category.id',
        'category.category_name',
        'category.status_category',
        'category.createdAt'
      ]);
  
    if (category_name) {
      query.where('category.category_name ILIKE :category_name', { category_name: `%${category_name}%` });
    }

    query.orderBy('category.createdAt', 'ASC');
  
    // Paginasi: Skip dan Take
    query.skip((page - 1) * page_size).take(page_size);
  
    const [categories, totalCount] = await query.getManyAndCount(); 

    if (totalCount === 0) {
      throw new NotFoundException(
          category_name
              ? `Kategori dengan nama '${category_name}' tidak ditemukan`
              : `Kategori tidak ditemukan`
      );
    }

    return { data: categories, totalCount };
  }
  
  //Fungsi untuk mendapatkan produk berdasarkan ID kategori
  async detailCategory(id: string, page: number, page_size: number, product_name?: string){

    const category = await this.categoryRepository.findOne({
        where: { id },
        relations: ['product'],
    });

    if (!category) {
        throw new NotFoundException('Kategori tidak ditemukan');
    }

    const query = this.productRepository
        .createQueryBuilder('product')
        .select([
            'product.id',
            'product.product_name',
            'category.category_name',
            'product.stock',
            'product.price',
            'product.product_photo',
            'product.status_product',
            'product.createdAt'
        ])
        .innerJoin('product.category', 'category')
        .where('category.id = :id', { id });

        if (product_name) {
          query.where('product.product_name ILIKE :product_name', { product_name: `%${product_name}%` });
        }

    query.skip((page - 1) * page_size).take(page_size);

    query.orderBy('product.createdAt', 'ASC');

    const [products, totalCount] = await query.getManyAndCount();

    if (totalCount === 0) {
      throw new NotFoundException(
          product_name
              ? `Product dengan nama '${product_name}' tidak ditemukan`
              : `Product tidak ditemukan`
      );
    }

    return { data: products, totalCount };
  }

  //Fungsi untuk menghitung total kategori
  async countCategories(){
    return await this.categoryRepository.count();
  }
}
