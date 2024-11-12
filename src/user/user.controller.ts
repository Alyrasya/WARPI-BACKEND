import { Controller, Get, Post, Body, Put, Param, ParseUUIDPipe, Query, NotFoundException, HttpCode, HttpStatus, HttpException, BadRequestException } from '@nestjs/common';
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
  @HttpCode(HttpStatus.CREATED)
  async createCustomer(@Body() registerCustomerDto: RegisterCustomerDto) {
    return this.userService.register(registerCustomerDto);
  }

  @Post('create/cashier')
  @HttpCode(HttpStatus.CREATED)
  async createCashier(@Body() createCashierDto: CreateCashierDto) {
    return this.userService.createCashier(createCashierDto);
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
      if (error instanceof NotFoundException){
        throw error;
      }
      console.error('Kesalahan saat mengambil data user:', error.message)
      throw new HttpException('Terjadi kesalahan saat mengambil datauser.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':id/status')
  async editStatusCashier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    try{
      const editStatus = await this.userService.editStatusCashier(id, updateStatusDto);
      return editStatus
    }
    catch (error) {
      if (error instanceof NotFoundException) {
          throw new NotFoundException('User tidak ditemukan');
      }
      if (error instanceof BadRequestException) {
          throw new BadRequestException(`Data tidak valid: ${error.message}`);
      }
      console.error('Terjadi kesalahan saat memperbarui status:', error.message);
      throw new HttpException(`Gagal memperbarui status: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':id/password')
  async editPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePasswordUserDto: UpdatePasswordUserDto
  ){
    try{
      const { currentPassword, newPassword, confirmPassword } = updatePasswordUserDto;
      const editPassword = await this.userService.editPassword(id, currentPassword, newPassword, confirmPassword);
      return editPassword;
    }
    catch (error) {
      if (error instanceof NotFoundException) {
          throw new NotFoundException('User tidak ditemukan');
      }
      if (error instanceof BadRequestException) {
          throw new BadRequestException(`Data tidak valid: ${error.message}`);
      }
      console.error('Terjadi kesalahan saat memperbarui status:', error.message);
      throw new HttpException(`Gagal memperbarui status: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':id/reset-password')
  async resetPassword(@Param('id', ParseUUIDPipe) id: string){
    return await this.userService.resetPassword(id);
  }
}