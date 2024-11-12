import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '#/user/user.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService
    ) { }

    async login(data: LoginDto) {
        const { email, password } = data;

        // Mencari user berdasarkan email
        const user = await this.userService.findUserByEmail(email);
        if (!user) {
            throw new NotFoundException(`User dengan email ${email} tidak ditemukan`);
        }

        // Cek status user
        if (user.status_user !== 'active') {
            throw new UnauthorizedException('User dalam status inactive');
        }

        // Validasi password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Password salah');
        }

        // Jika semua validasi lolos, buat JWT token
        const payload = { id: user.id, role: user.role.role_name, username: user.username };
        const token = await this.jwtService.signAsync(payload, {
            secret: process.env.JWT_SECRET || 'defaultSecret',
            expiresIn: '7d',
        });

        // Cek jika role adalah 'cashier' dan password masih default
        if (user.role.role_name === 'cashier' && password === 'cashier123') {
            return {
                requiresPasswordChange: true,
                access_token: token
            };
        }

        return {
            access_token: token,
            requiresPasswordChange: false,
            status: 200,
            message: 'Login berhasil',
        };
    }
}
