import { Controller, Get, Post, Body, Put, Param, Query, ParseUUIDPipe, NotFoundException, BadRequestException } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Product } from '#/product/entities/product.entity';

@Controller('category')
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
  ) {}

  @Post('create')
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.createCategory(createCategoryDto);
  }

  @Put(':id/edit')
  async updateCategory(
    @Param('id', new ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.updateCategory(id, updateCategoryDto);
  }

  @Get('getAll')
  async getAllCategories(
    @Query('page') page: number,
    @Query('page_size') page_size: number,
    @Query('category_name') category_name?: string
  ) {
    // Validasi sederhana untuk memastikan 'page' dan 'page_size' adalah angka yang valid
    if (!page || !page_size || page <= 0 || page_size <= 0) {
      throw new BadRequestException('Page and page_size must be positive numbers');
    }

    // Panggil service untuk mendapatkan data kategori dengan paginasi
    const { data, totalCount } = await this.categoryService.getAllCategory(
      page,
      page_size,
      category_name
    );

    return {
      data, // Mengembalikan data kategori
      totalCount, // Mengembalikan total count kategori
    };
  }

  @Get(':id/detail')
  async getProductsByCategory(
    @Param('id') id: string,
    @Query('product_name') product_name?: string, // Query optional untuk pencarian product_name
  ): Promise<Product[]> {
    try {
      // Memanggil service detailCategory untuk mendapatkan produk berdasarkan id kategori dan pencarian produk
      const products = await this.categoryService.detailCategory(id, product_name);
      return products;
    } catch (error) {
      // Jika ada error, lemparkan NotFoundException jika sesuai
      if (error instanceof NotFoundException) {
        throw error;
      }
      // Jika error lain, lempar pesan default
      throw new Error('Error while retrieving products');
    }
  }
}
