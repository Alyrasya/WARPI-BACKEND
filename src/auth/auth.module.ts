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
import { Cart } from '#/cart/entities/cart.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, User, Cart]),
    UserModule,
    RoleModule,
    PassportModule.register({defaultStrategy: 'jwt'}),
    JwtModule.register({
      global: true,
      secret: 'user123', // Ganti dengan secret key Anda
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserService],
  exports: [AuthService]
})
export class AuthModule {}
