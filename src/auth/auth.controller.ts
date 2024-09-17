import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const { email, password } = loginDto;
    const result = await this.authService.login(email, password);

    if (result.requiresPasswordChange) {
      // Berikan respons yang memberi tahu pengguna untuk mengganti password
      throw new BadRequestException({
        message: 'Password anda perlu diganti.',
      });
    }

    return result;
  }
}
