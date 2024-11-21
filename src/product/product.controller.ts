import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { diskStorage } from 'multer';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Express } from 'express';
import { Product } from './entities/product.entity';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('product_photo', {
    storage: diskStorage({
      destination: './src/product/photo_product',
      filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}${extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    }),
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new HttpException('Invalid file type. Only jpg, jpeg, and png are allowed.', HttpStatus.BAD_REQUEST), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 2 * 1024 * 1024, // 2 MB
    },
  }))
  async createProduct(
    @Body() data: CreateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      if (file) {
        data.product_photo = file.filename;
      }
      return await this.productService.createProduct(data);
    } catch (error) {
      console.error('Error pembuatan produk:', error.message);

      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error pembuatan produk: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id/edit')
  @UseInterceptors(
    FileInterceptor('product_photo', {
      storage: diskStorage({
        destination: './src/product/photo_product',
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.mimetype)) {
          cb(
            new BadRequestException(
              'Jenis berkas tidak valid. Hanya jpg, jpeg, dan png yang diperbolehkan.',
            ),
            false,
          );
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
    }),
  )
  async updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      // Jika ada file yang di-upload, tambahkan ke DTO
      if (file) {
        updateProductDto.product_photo = file.filename;
      }

          // Panggil service untuk mengupdate produk
          const updatedProduct = await this.productService.updateProduct(id, updateProductDto);
          return updatedProduct;

      } catch (error) {
          if (error instanceof NotFoundException) {
              throw new NotFoundException('Produk tidak ditemukan');
          }
          if (error instanceof BadRequestException) {
              throw new BadRequestException(`Data tidak valid: ${error.message}`);
          }
          console.error('Terjadi kesalahan saat memperbarui produk:', error.message);
          throw new HttpException(`Gagal memperbarui produk: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
      }
  }

  @Get('getAll')
  async getAllProducts(
    @Query('page') page: number,
    @Query('page_size') page_size: number,
    @Query('product_name') product_name?: string,
    @Query('category_name') category_name?: string,
  ): Promise<{ data: Product[]; totalCount: number }> {
    try {
      return await this.productService.getAllProduct(
        page,
        page_size,
        product_name,
        category_name,
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Kesalahan saat mengambil data produk:', error.message);
      throw new HttpException(
        'Terjadi kesalahan saat mengambil data produk.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('/:id/getById')
  async getByIdProduct(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const product = await this.productService.getByIdProduct(id);
      if (!product) {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }
      return product;
    } catch (error) {
      throw new HttpException(
        `Error retrieving product: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
