import { Controller, Post, Body, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);

    // Cek jika password change diperlukan
    if (result.requiresPasswordChange) {
        return {
            status: HttpStatus.FORBIDDEN,
            requiresPasswordChange: true,
            message: 'Password Anda perlu diganti.',
            access_token: result.access_token,
        };
    }

    return {
        status: HttpStatus.OK,
        requiresPasswordChange: result.requiresPasswordChange,
        message: result.message,
        access_token: result.access_token,
    };
  }
}
