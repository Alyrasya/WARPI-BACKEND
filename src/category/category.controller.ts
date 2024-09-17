import { Controller, Get, Post, Body, Put, Param, Query, ParseUUIDPipe, NotFoundException } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Product } from '#/product/entities/product.entity';
import { Category } from './entities/category.entity';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.createCategory(createCategoryDto);
  }

  @Put(':id')
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.updateCategory(id, updateCategoryDto);
  }

  @Get()
  async getAllCategory() {
    return this.categoryService.getAllCategory();
  }

  @Get('filter/category')
  async filterByName(@Query('category_name') category_name: string) {
    return this.categoryService.filterByName(category_name);
  }

  @Get(':id')
  async getByIdCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoryService.getByIdCategory(id);
  }

  @Get(':id/product')
  async getProductsByCategory(@Param('id', ParseUUIDPipe) id: string): Promise<Product[]> {
    try {
      // Memanggil metode service untuk mendapatkan produk berdasarkan ID kategori
      return await this.categoryService.detailCategory(id);
    } catch (error) {
      // Menangani kesalahan jika kategori tidak ditemukan
      if (error instanceof NotFoundException) {
        throw error;
      }
      // Menangani kesalahan lain jika ada
      throw new Error('An unexpected error occurred');
    }
  }
}
