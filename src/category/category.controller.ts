import { Controller, Get, Post, Body, Put, Param, Query, ParseUUIDPipe, NotFoundException, BadRequestException, Res } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Product } from '#/product/entities/product.entity';
import { Category } from './entities/category.entity';
import { join } from 'path';
import { of } from 'rxjs';

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
  ): Promise<{ data: Category[]; totalCount: number }> {
    try {
      return await this.categoryService.getAllCategory(page, page_size, category_name);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error; // Lemparkan kembali jika tidak ditemukan
      }
      // Penanganan error lain
      throw new Error('Something went wrong');
    }
  }

  @Get(':id/detail')
  async getProductsByCategory(
    @Param('id') id: string,
    @Query('page') page: number,
    @Query('page_size') page_size: number,
    @Query('product_name') product_name?: string
  ){
    try {
      // Memanggil service detailCategory untuk mendapatkan produk berdasarkan id kategori dan pencarian produk
      const products = await this.categoryService.detailCategory(id, page, page_size, product_name);
      return products;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Error while retrieving products');
    }
  }

  @Get('upload/:image')
  getImage(@Param('image') imagePath: string, @Res() res:any){
    return of(
      res.sendFile(join(process.cwd(), `/src/product/photo_product/${imagePath}`))
    )
  }
}
