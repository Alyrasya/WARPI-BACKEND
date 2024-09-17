import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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
  async createCategory(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const { category_name } = createCategoryDto;

    // Cek apakah kategori dengan nama yang sama sudah ada
    const existingCategory = await this.categoryRepository.findOne({
      where: { category_name },
    });

    if (existingCategory) {
      // Jika kategori dengan nama yang sama sudah ada, lempar ConflictException
      throw new ConflictException('Category with this name already exists');
    }

    // Buat kategori baru
    const category = this.categoryRepository.create(createCategoryDto);

    // Simpan kategori ke database
    return this.categoryRepository.save(category);
  }

  // Fungsi untuk mengedit kategori berdasarkan ID
  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    // Ambil kategori berdasarkan ID
    const category = await this.getByIdCategory(id);
    if (!category) {
        throw new NotFoundException('Category not found');
    }

    let hasUpdates = false;

    // Perbarui kategori jika ada perubahan
    if (updateCategoryDto.category_name !== undefined) {
        category.category_name = updateCategoryDto.category_name;
        hasUpdates = true;
    }

    if (updateCategoryDto.status_category !== undefined) {
        category.status_category = updateCategoryDto.status_category;
        hasUpdates = true;
    }

    // Jika tidak ada pembaruan, kembalikan kategori yang sudah ada
    if (!hasUpdates) {
        return category;
    }

    // Simpan pembaruan kategori
    const updatedCategory = await this.categoryRepository.save(category);

    // Perbarui semua produk yang terkait dengan kategori ini
    await this.updateProductsCategoryName(updatedCategory.id, updatedCategory.category_name);

    return updatedCategory;
  }

  // Metode tambahan untuk memperbarui nama kategori di produk terkait
  private async updateProductsCategoryName(categoryId: string, newCategoryName: string): Promise<void> {
      // Temukan semua produk yang terkait dengan kategori ini
      const products = await this.productRepository.find({ where: { category: { id: categoryId } } });

      // Perbarui nama kategori di setiap produk
      for (const product of products) {
          product.category_name = newCategoryName;
          await this.productRepository.save(product);
      }
  }

  // Fungsi untuk mendapatkan semua kategori
  async getAllCategory(): Promise<{ category: Category[], total: number }> {
    const [category, total] = await this.categoryRepository
    .createQueryBuilder('category')
    .getManyAndCount();
    return { category, total };
  }

  // Fungsi untuk mencari kategori berdasarkan nama
  async filterByName(category_name: string): Promise<Category[]> {
    // Query builder untuk pencarian case-insensitive menggunakan ILIKE
    const categories = await this.categoryRepository
      .createQueryBuilder('category')
      .where('category.category_name ILIKE :category_name', { category_name: `%${category_name}%` })
      .getMany();

    // Jika tidak ada kategori yang ditemukan, lempar NotFoundException
    if (categories.length === 0) {
      throw new NotFoundException('No category found with the given name');
    }
    return categories;
  }
  
  // Fungsi untuk mendapatkan kategori berdasarkan ID
  async getByIdCategory(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOneBy({ id });

    if (!category) {
      throw new NotFoundException('Category not found'); // Ganti dengan exception handling yang sesuai
    }
    return category;
  }

  // Fungsi untuk menampilkan data product berdasarkan id category yang dipilih
  async detailCategory(id: string): Promise<Product[]> {
    // Temukan kategori berdasarkan ID dan sertakan relasi produk
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['product'], // Memuat produk yang terkait dengan kategori
    });

    // Jika kategori tidak ditemukan, lempar NotFoundException
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Kembalikan produk yang terkait dengan kategori
    return category.product;
  }

  async countCategories(): Promise<number> {
    return await this.categoryRepository.count();
  }
}
