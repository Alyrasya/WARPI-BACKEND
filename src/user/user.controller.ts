import { Controller, Get, Post, Body, Put, Param, ParseUUIDPipe, UseGuards, Req, Query, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { CreateCashierDto } from './dto/create-cashier.dto';
import { User } from './entities/user.entity';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdatePasswordUserDto } from './dto/update-password-user.dto';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
  ) {}
  
  @Post('register')
  async createCustomer(@Body() registerCustomerDto: RegisterCustomerDto) {
    const user = await this.userService.register(registerCustomerDto);
    return user;
  }

  @Post('create/cashier')
  async createCashier(@Body() createCashierDto: CreateCashierDto) {
    const cashier = await this.userService.createCashier(createCashierDto);
    return cashier;
  }

  @Get('getAll')
  async getAllCashiers(
    @Query('page') page: number,
    @Query('page_size') page_size: number,
    @Query('usernameOrEmail') usernameOrEmail?: string
  ): Promise<{ data: User[]; totalCount: number }> {
    try {
      // Memanggil service untuk mendapatkan semua user dengan role 'cashier'
      return await this.userService.getAllCashier(page, page_size, usernameOrEmail);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error; // Lemparkan kembali jika tidak ditemukan
      }
      // Penanganan error lain
      throw new Error('Something went wrong');
    }
  }

  // Endpoint untuk mengubah status user dengan role cashier
  @Put(':id/status')
  async editStatusCashier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.userService.editStatusCashier(id, updateStatusDto);
  }

  @Put(':id/password')
  async editPassword(
    @Param('id', ParseUUIDPipe) id: string, // Mendapatkan userId dari parameter URL
    @Body() updatePasswordUserDto: UpdatePasswordUserDto // Mengambil data password dari body
  ): Promise<string> {
    const { currentPassword, newPassword, confirmPassword } = updatePasswordUserDto;
    // Memanggil service untuk mengubah password
    return await this.userService.editPassword(id, currentPassword, newPassword, confirmPassword);
  }

  @Put(':id/reset-password')
  async resetPassword(@Param('id') id: string): Promise<string> {
    return await this.userService.resetPassword(id);
  }
}