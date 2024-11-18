import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Query,
  ParseUUIDPipe,
  NotFoundException,
  Res,
  HttpCode,
  HttpStatus,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import { join } from 'path';
import { of } from 'rxjs';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createCategory(@Body() data: CreateCategoryDto) {
    return this.categoryService.createCategory(data);
  }

  @Put(':id/edit')
  async editCategory(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    try {
      const editProduct = await this.categoryService.editCategory(
        id,
        updateCategoryDto,
      );
      return editProduct;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Kategori tidak ditemukan');
      }
      if (error instanceof BadRequestException) {
        throw new BadRequestException(`Data tidak valid: ${error.message}`);
      }
      console.error(
        'Terjadi kesalahan saat memperbarui kategori:',
        error.message,
      );
      throw new HttpException(
        `Gagal memperbarui kategori: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('getAll')
  async getAllCategories(
    @Query('page') page: number,
    @Query('page_size') page_size: number,
    @Query('category_name') category_name?: string,
  ): Promise<{ data: Category[]; totalCount: number }> {
    try {
      return await this.categoryService.getAllCategory(
        page,
        page_size,
        category_name,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Kesalahan saat mengambil data kategori:', error.message);
      throw new HttpException(
        'Terjadi kesalahan saat mengambil data kategori.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/detail')
  async getProductsByCategory(
    @Param('id') id: string,
    @Query('page') page: number,
    @Query('page_size') page_size: number,
    @Query('product_name') product_name?: string,
  ) {
    try {
      return await this.categoryService.detailCategory(
        id,
        page,
        page_size,
        product_name,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(
        'Kesalahan saat mengambil data produk berdasarkan kategori:',
        error.message,
      );
      throw new HttpException(
        'Terjadi kesalahan saat mengambil data produk berdasarkan kategori.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('upload/:image')
  getImage(@Param('image') imagePath: string, @Res() res:any){
    return of(
      res.sendFile(join(process.cwd(), `/src/product/photo_product/${imagePath}`))
    )
  }
}
