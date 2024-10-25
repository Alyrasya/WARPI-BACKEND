import { BadRequestException, Body, ConflictException, Controller, Get, HttpException, HttpStatus, NotFoundException, Param, ParseUUIDPipe, Post, Put, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ProductService } from './product.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { diskStorage } from 'multer';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Express } from 'express';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}
  
  @Post('create')
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
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      if (file) {
        createProductDto.product_photo = file.filename;
      }
      return await this.productService.createProduct(createProductDto);
    } catch (error) {
      console.error('Error creating product:', error.message);
      throw new Error(`Error creating product: ${error.message}`);
    }
  }

  @Put(':id/edit')
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
  async updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      // Cek apakah produk dengan ID tersebut ada
      const existingProduct = await this.productService.getByIdProduct(id);
      if (!existingProduct) {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }

      // Jika ada file yang di-upload, tambahkan ke DTO
      if (file) {
        updateProductDto.product_photo = file.filename;
      }

      // Panggil service untuk mengupdate produk
      const updatedProduct = await this.productService.updateProduct(id, updateProductDto);

      return updatedProduct;
    } catch (error) {
      throw new HttpException(`Error updating product: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('getAll')
  async getAllProducts(
    @Query('page') page: number,
    @Query('page_size') page_size: number,
    @Query('product_name') product_name?: string,
    @Query('category_name') category_name?: string,
  ): Promise<{ data: any[]; totalCount: number }> {
    try {
      // Call the service function to fetch the products with pagination
      const { data, totalCount } = await this.productService.getAllProduct(page, page_size, product_name, category_name);
      return { data, totalCount };  // Mengembalikan data dan totalCount
    } catch (error) {
      // Throw a BadRequestException if any error occurs
      throw new BadRequestException(error.message);
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
      throw new HttpException(`Error retrieving product: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
