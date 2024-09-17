import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserService } from '../user/user.service';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { RoleModule } from '#/role/role.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '#/role/entities/role.entity';
import { User } from '#/user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, User]),
    UserModule, // Memasukkan modul user
    RoleModule,
    PassportModule, // Untuk strategi autentikasi
    JwtModule.register({
      global: true,
      secret: 'yourSecretKey', // Ganti dengan secret key Anda
      signOptions: { expiresIn: '1d' }, // Atur masa berlaku token
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserService],
})
export class AuthModule {}
