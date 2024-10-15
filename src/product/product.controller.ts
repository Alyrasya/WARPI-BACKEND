import { BadRequestException, Body, ConflictException, Controller, Get, HttpException, HttpStatus, NotFoundException, Param, ParseUUIDPipe, Post, Put, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
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
  @UseInterceptors(FileInterceptor('product_photo', {
    storage: diskStorage({
      destination: './src/product/photo_product', // Ganti dengan direktori upload Anda
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

    // Log data yang diterima
    console.log('DTO:', createProductDto);
    console.log('Uploaded file:', file);

    try {
      if (file) {
        createProductDto.product_photo = file.filename;
      }
      return await this.productService.createProduct(createProductDto);
    } catch (error) {
      // Tangani error di sini
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
      // Periksa apakah produk dengan ID tersebut ada
      const existingProduct = await this.productService.getByIdProduct(id);
      if (!existingProduct) {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }

      // Jika file di-upload, perbarui nama file di DTO
      if (file) {
        updateProductDto.product_photo = file.filename;
      } else if (!updateProductDto.product_photo) {
        // Jika tidak ada file dan `product_photo` tidak diset, pertahankan nama file yang ada
        updateProductDto.product_photo = existingProduct.product_photo;
      }

      // Perbarui produk
      const updatedProduct = await this.productService.updateProduct(id, updateProductDto);

      if (!updatedProduct) {
        throw new HttpException('Error updating product', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return updatedProduct;
    } catch (error) {
      throw new HttpException(`Error updating product: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('getAll')
  async getAllProducts(
    @Query('product_name') product_name?: string,
    @Query('category_name') category_name?: string
  ): Promise<any[]> {
    try {
      // Call the service function to fetch the products
      const products = await this.productService.getAllProduct(product_name, category_name);
      return products;
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
