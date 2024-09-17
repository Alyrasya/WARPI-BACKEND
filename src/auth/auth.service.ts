import { UserService } from '#/user/user.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string): Promise<any> {
    // Mencari user berdasarkan email
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Email or password is incorrect');
    }

    // Cek status user
    if (user.status_user !== 'active') {
      throw new UnauthorizedException('User account is inactive');
    }

    // Validasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email or password is incorrect');
    }

    // Cek jika role adalah 'cashier' dan password masih default
    if (user.role.role_name === 'cashier' && password === 'cashier123') {
      return {
        requiresPasswordChange: true,
        userId: user.id,
      };
    }

    // Jika semua validasi lolos, buat JWT token
    const payload = { sub: user.id, role: user.role.role_name };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      requiresPasswordChange: false,
    };
  }
}
