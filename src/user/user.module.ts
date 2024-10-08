import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '#/role/entities/role.entity';
import { User } from './entities/user.entity';
import { RoleModule } from '#/role/role.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, User]),
    RoleModule
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
