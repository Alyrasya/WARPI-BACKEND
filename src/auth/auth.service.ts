import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '#/user/user.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async login(data: LoginDto) {
    const { email, password } = data;

    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException(`User dengan email ${email} tidak ditemukan`);
    }

    if (user.status_user !== 'active') {
      throw new BadRequestException(
        'Akun Anda tidak aktif. Silakan hubungi administrator.',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password salah');
    }

    const payload = {
      id: user.id,
      role: user.role.role_name,
      username: user.username,
      status_user: user.status_user,
    };
    const token = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'defaultSecret',
      expiresIn: '7d',
    });

    if (user.role.role_name === 'cashier' && password === 'cashier123') {
      return {
        requiresPasswordChange: true,
        access_token: token,
      };
    }

    return {
      status: 200,
      requiresPasswordChange: false,
      message: 'Login berhasil',
      access_token: token,
    };
  }
}