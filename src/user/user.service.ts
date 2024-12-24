import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from '#/role/entities/role.entity';
import { Repository } from 'typeorm';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { CreateCashierDto } from './dto/create-cashier.dto';
import { StatusUser, User } from './entities/user.entity';
import { UpdateStatusDto } from './dto/update-status.dto';
import { Cart } from '#/cart/entities/cart.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Cart) 
    private readonly cartRepository: Repository<Cart>
  ) {}

  // Fungsi untuk generate salt dan hash password
  private async generatePasswordHash(
    password: string,
  ): Promise<{ salt: string; hash: string }> {
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(password, salt);
    return { salt, hash };
  }

  //Customer
  async register(data: RegisterCustomerDto) {
    const { username, email, password } = data;

    const role = await this.roleRepository.findOne({
      where: { role_name: 'customer' },
    });
    if (!role) {
      throw new NotFoundException('Role customer tidak ditemukan');
    }

    const existingEmail = await this.userRepository.findOne({
      where: { username: data.username, email: data.email },
    });

    if (existingEmail) {
      throw new ConflictException(
        'Pengguna dengan username dan email ini sudah ada',
      );
    }

    const { salt, hash } = await this.generatePasswordHash(password);

    try {
      const newUser = this.userRepository.create({
        id: uuidv4(),
        username,
        email,
        password: hash,
        salt,
        status_user: StatusUser.ACTIVE,
        role: role,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const savedUser = await this.userRepository.save(newUser);

      const newCart = this.cartRepository.create({
        id: uuidv4(),
        user: savedUser, // Relasi ke user
        createdAt: new Date(),
        updatedAt: new Date(),
      });
  
      const savedCart = await this.cartRepository.save(newCart);

      return [savedUser,savedCart];
    } catch {
      throw new InternalServerErrorException('Terjadi kesalahan pada server');
    }
  }

  //Admin
  async createCashier(data: CreateCashierDto) {
    const { username, email } = data;

    const role = await this.roleRepository.findOne({
      where: { role_name: 'cashier' },
    });
    if (!role) {
      throw new Error('Role kasir tidak ditemukan');
    }

    const existingEmail = await this.userRepository.findOne({
      where: { username: data.username, email: data.email },
    });

    if (existingEmail) {
      throw new ConflictException(
        'Pengguna dengan username dan email ini sudah ada',
      );
    }

    const defaultPassword = 'cashier123';

    const { salt, hash } = await this.generatePasswordHash(defaultPassword);

    try {
      const newCashier = this.userRepository.create({
        id: uuidv4(),
        username,
        email,
        password: hash,
        salt,
        status_user: StatusUser.ACTIVE,
        role: role,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const savedCashier = await this.userRepository.save(newCashier);
      return savedCashier;
    } catch {
      throw new InternalServerErrorException('Terjadi kesalahan pada server');
    }
  }

  //Admin
  async getAllCashier(
    page: number,
    page_size: number,
    usernameOrEmail?: string,
  ) {
    const query = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.username',
        'user.email',
        'user.status_user',
        'role.role_name',
        'user.createdAt',
      ])
      .innerJoin('user.role', 'role')
      .where('role.role_name = :role', { role: 'cashier' });

    if (usernameOrEmail) {
      query.andWhere(
        '(user.username ILIKE :usernameOrEmail OR user.email ILIKE :usernameOrEmail)',
        {
          usernameOrEmail: `%${usernameOrEmail}%`,
        },
      );
    }

    query.orderBy('user.createdAt', 'ASC');

    query.skip((page - 1) * page_size).take(page_size);

    const [cashiers, totalCount] = await query.getManyAndCount();

    return { data: cashiers, totalCount };
  }

  //Admin
  async countCashiers() {
    return await this.userRepository.count({
      where: {
        role: { role_name: 'cashier' },
      },
      relations: { role: true },
    });
  }

  //Admin
  async getUserById(id: string) {
    const user = await this.userRepository.findOne({
      where: {
        id,
        role: { role_name: 'cashier' },
      },
      relations: { role: true },
    });

    if (!user) {
      throw new NotFoundException(
        `User dengan ID ${id} dan role 'cashier' tidak ditemukan`,
      );
    }
    return user;
  }

  //Cashier
  async editPassword(
    id: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    try {
      const user = await this.getUserById(id);

      const passwordMatches = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!passwordMatches) {
        throw new BadRequestException('Password saat ini salah');
      }

      const newPasswordMatchesOld = await bcrypt.compare(
        newPassword,
        user.password,
      );
      if (newPasswordMatchesOld) {
        throw new ConflictException(
          'Password baru tidak boleh sama dengan password lama',
        );
      }

      if (newPassword !== confirmPassword) {
        throw new BadRequestException(
          'Password baru dan konfirmasi password tidak cocok',
        );
      }

      const { hash } = await this.generatePasswordHash(newPassword);
      user.password = hash;

      await this.userRepository.save(user);

      return {
        statusCode: 200,
        success: true,
        message: 'Password berhasil diubah',
        data: { id: user.id, username: user.username },
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: error instanceof HttpException ? error.getStatus() : 500,
          message: error.message || 'Terjadi kesalahan saat mengubah password',
        },
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  //Admin
  async resetPassword(id: string) {
    try {
      const user = await this.getUserById(id);
      const defaultPassword = 'cashier123';

      const currentPasswordIsDefault = await bcrypt.compare(
        defaultPassword,
        user.password,
      );
      if (currentPasswordIsDefault) {
        throw new ConflictException(
          'Password sudah merupakan password default',
        );
      }

      const { hash } = await this.generatePasswordHash(defaultPassword);
      user.password = hash;

      await this.userRepository.save(user);

      return {
        success: 200,
        message: 'Password berhasil direset ke default',
        data: user,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Terjadi kesalahan saat mengubah password',
        error instanceof ConflictException
          ? HttpStatus.CONFLICT
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  //Auth
  async findUserByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email },
      relations: { role: true },
    });
  }

  //Admin
  async editStatusCashier(id: string, updateStatusDto: UpdateStatusDto) {
    try {
      const { status_user } = updateStatusDto;
      const user = await this.getUserById(id);
  
      if (user.role.role_name !== 'cashier') {
        throw new NotFoundException('User ini bukan kasir');
      }
  
      user.status_user = status_user;
      await this.userRepository.save(user);
  
      return {
        success: 200,
        message: 'Status cashier berhasil diperbarui',
        data: user,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Terjadi kesalahan saat mengubah status',
        error instanceof ConflictException ? HttpStatus.CONFLICT : HttpStatus.INTERNAL_SERVER_ERROR
     );
    }
  }

  //Auth
  async getUserId(id: string) {
    const user = await this.userRepository.findOne({
      where: {
        id,
      },
      relations: { role: true },
    });
    return user;
  }
}