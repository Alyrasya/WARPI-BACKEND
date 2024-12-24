import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  ParseUUIDPipe,
  Query,
  NotFoundException,
  HttpCode,
  HttpStatus,
  HttpException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { CreateCashierDto } from './dto/create-cashier.dto';
import { User } from './entities/user.entity';
import { UpdatePasswordUserDto } from './dto/update-password-user.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '#/auth/jwt-auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  //Customer
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async createCustomer(@Body() registerCustomerDto: RegisterCustomerDto) {
    return this.userService.register(registerCustomerDto);
  }

  //Admin
  @Post('create/cashier')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createCashier(@Body() createCashierDto: CreateCashierDto) {
    return this.userService.createCashier(createCashierDto);
  }

  //Admin
  @Get('getAll')
  @UseGuards(JwtAuthGuard)
  async getAllCashiers(
    @Query('page') page: number,
    @Query('page_size') page_size: number,
    @Query('usernameOrEmail') usernameOrEmail?: string,
  ): Promise<{ data: User[]; totalCount: number }> {
    try {
      return await this.userService.getAllCashier(
        page,
        page_size,
        usernameOrEmail,
      );
    } catch (error) {
      console.error('Kesalahan saat mengambil data user:', error.message);
      throw new HttpException(
        'Terjadi kesalahan saat mengambil datauser.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  //Cashier
  @Put(':id/password')
  async editPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePasswordUserDto: UpdatePasswordUserDto,
  ) {
    try {
      const { currentPassword, newPassword, confirmPassword } =
        updatePasswordUserDto;

      const result = await this.userService.editPassword(
        id,
        currentPassword,
        newPassword,
        confirmPassword,
      );

      return {
        statusCode: result.statusCode,
        message: result.message,
        data: result.data,
      };
    } catch (error) {
      console.error(`Error in editPassword Controller: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Gagal mengubah password',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  //Admin
  @Put(':id/reset-password')
  @UseGuards(JwtAuthGuard)
  async resetPassword(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const result = await this.userService.resetPassword(id);
      return {
        statusCode: 200,
        message: result.message,
        data: result.data,
      };
    } catch (error) {
      console.error(`Error di resetPassword Controller: ${error.message}`);
      throw new HttpException(
        {
          statusCode:
            error instanceof HttpException
              ? error.getStatus()
              : HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'Terjadi kesalahan saat mereset password',
        },
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  //Admin
  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  async editStatusCashier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    try {
      const editStatus = await this.userService.editStatusCashier(
        id,
        updateStatusDto,
      );
      return editStatus;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('User tidak ditemukan');
      }
      if (error instanceof BadRequestException) {
        throw new BadRequestException(`Data tidak valid: ${error.message}`);
      }
      console.error(
        'Terjadi kesalahan saat memperbarui status:',
        error.message,
      );
      throw new HttpException(
        `Gagal memperbarui status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
