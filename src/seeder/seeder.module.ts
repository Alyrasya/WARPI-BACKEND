import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { Role } from '#/role/entities/role.entity';
import { User } from '#/user/entities/user.entity';
import { PaymentMethod } from '#/payment_method/entities/payment_method.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Role, User, PaymentMethod])], // Pastikan Role entitas diimpor
  providers: [SeederService, Role, User, PaymentMethod], // Daftarkan RoleSeeder
  exports: [SeederService],
})
export class SeederModule {}
