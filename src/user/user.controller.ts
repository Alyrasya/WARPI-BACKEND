import { Controller, Get, Post, Body, Put, Param, ParseUUIDPipe, UseGuards, Req, Query } from '@nestjs/common';
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
  async create(@Body() registerCustomerDto: RegisterCustomerDto) {
    // Menggunakan DTO sebagai parameter
    const user = await this.userService.register(registerCustomerDto);
    return user;
  }

  @Post('createCashier')
  async createCashier(@Body() createCashierDto: CreateCashierDto) {
    // Menggunakan DTO sebagai parameter
    const cashier = await this.userService.createCashier(createCashierDto);
    return cashier;
  }

  // Endpoint untuk mendapatkan semua user dengan role 'cashier' dan menghitung totalnya
  @Get('cashiers')
  async getAllCashier(): Promise<{cashiers: User[], total: number, }> {
    return this.userService.getAllCashier();
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

  @Get('filter/user')
  async filterByEmail(@Query('email') email: string) {
    return this.userService.filterByName(email);
  }
}