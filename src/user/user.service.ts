import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StatusUser, User } from './entities/user.entity';
import { Role } from '#/role/entities/role.entity';
import { Repository } from 'typeorm';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';  // Import bcrypt untuk hashing
import { CreateCashierDto } from './dto/create-cashier.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  // Fungsi untuk generate salt dan hash password
  private async generatePasswordHash(password: string): Promise<{ salt: string, hash: string }> {
    const salt = await bcrypt.genSalt(); // Generate salt secara otomatis
    const hash = await bcrypt.hash(password, salt); // Hash password dengan salt
    return { salt, hash };
  }

  async register(registerCustomerDto: RegisterCustomerDto): Promise<User> {
    const { username, email, password } = registerCustomerDto;

    console.log('Receive registration data:', registerCustomerDto); // Log data pendaftaran

    try {
        // Mencari peran dengan role_name 'customer'
        const role = await this.roleRepository.findOne({ where: { role_name: 'customer' } });
        if (!role) {
            console.error('Role Customer Not Found'); // Log kesalahan
            throw new InternalServerErrorException('The customer role was not found in the database');
        }

        // Memeriksa apakah email sudah ada
        const existingEmail = await this.userRepository.findOne({ where: { email } });
        if (existingEmail) {
            throw new ConflictException('Email with this name already exists');
        }

        // Menghasilkan password hash
        const { salt, hash } = await this.generatePasswordHash(password);

        // Membuat data pengguna baru
        const newUser = this.userRepository.create({
            id: uuidv4(),
            username,
            email,
            password: hash,
            salt,
            status_user: StatusUser.ACTIVE,
            role_id: role.id,
            role_name: role.role_name,
            role,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        console.log('User data to be stored:', newUser); // Log data pengguna

        // Menyimpan pengguna ke database
        const savedUser = await this.userRepository.save(newUser);
        console.log('User saved successfully:', savedUser); // Log pengguna yang berhasil disimpan

        return savedUser;
    } catch (error) {
        console.error('Error saving user:', error); // Log kesalahan
        // Berikan informasi lebih spesifik tergantung jenis kesalahan
        if (error instanceof ConflictException) {
            throw error; // Melempar kembali konflik
        }
        throw new InternalServerErrorException('Unexpected error while saving account');
    }
  }

  // Fungsi untuk membuat Cashier dengan default password
  async createCashier(createCashierDto: CreateCashierDto): Promise<User> {
    const { username, email } = createCashierDto;

    // Mencari peran dengan role_name 'cashier'
    const role = await this.roleRepository.findOne({ where: { role_name: 'cashier' } });

    if (!role) {
      throw new Error('Role cashier not found');
    }

    const existingEmail = await this.userRepository.findOne({
      where: { username: createCashierDto.username, email: createCashierDto.email }
    });
  
    if (existingEmail) {
      throw new ConflictException('Email with this name already exists');
    }

    // Menggunakan default password (misalnya 'cashier123')
    const defaultPassword = 'cashier123';

    // Generate salt dan hash untuk default password
    const { salt, hash } = await this.generatePasswordHash(defaultPassword);

    // Membuat data pengguna baru dengan peran 'cashier'
    const newCashier = this.userRepository.create({
      id: uuidv4(),
      username,
      email,
      password: hash,
      salt,
      status_user: StatusUser.ACTIVE,
      role_id: role.id,
      role_name: role.role_name,
      role: role,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Menyimpan pengguna ke database
    return this.userRepository.save(newCashier);
  }

  async getAllCashier(page: number, page_size: number, usernameOrEmail?: string) {
    // Membuat query builder untuk mengambil semua user dengan role 'cashier'
    const query = this.userRepository
        .createQueryBuilder('user')
        .select([
          'user.id', 
          'user.username', 
          'user.email', 
          'user.status_user', 
          'role.role_name', 
          'user.createdAt'
        ])
        .innerJoin('user.role', 'role')
        .where('role.role_name = :role', { role: 'cashier' }); // Filter hanya role cashier

    if (usernameOrEmail) {
        query.andWhere('(user.username ILIKE :usernameOrEmail OR user.email ILIKE :usernameOrEmail)', {
            usernameOrEmail: `%${usernameOrEmail}%`
        });
    }

    query.orderBy('user.createdAt', 'ASC');

    // Paginasi: Skip dan Take
    query.skip((page - 1) * page_size).take(page_size);

    const [cashiers, totalCount] = await query.getManyAndCount();

    // Jika tidak ada cashier yang ditemukan, lemparkan NotFoundException
    if (totalCount === 0) {
        throw new NotFoundException(
            usernameOrEmail
                ? `Cashier with username or email '${usernameOrEmail}' not found`
                : `No cashiers found`
        );
    }

    return { data: cashiers, totalCount }; // Menyertakan totalCount
  }

  async editStatusCashier(id: string, updateStatusDto: UpdateStatusDto): Promise<User> {
    const { status_user } = updateStatusDto;
    // Menggunakan getUserById untuk mencari user berdasarkan ID
    const user = await this.getUserById(id);
    // Periksa apakah role user adalah 'cashier'
    if (user.role.role_name !== 'cashier') {
      throw new NotFoundException(`User is not a cashier`);
    }
    // Update status user
    user.status_user = status_user;
    return this.userRepository.save(user); // Simpan perubahan di database
  }
  
  async countCashiers(): Promise<number> {
    return await this.userRepository.count({
      where: { role_name: 'cashier' }, // Filter untuk hanya menghitung user dengan role 'cashier'
    });
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id }, relations:{role:true}});
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  // Fungsi untuk mengubah password user
  async editPassword(id: string, currentPassword: string, newPassword: string, confirmPassword: string): Promise<string> {
    // Menggunakan getUserById untuk mendapatkan user
    const user = await this.getUserById(id);

    // Cek apakah currentPassword sesuai dengan password yang tersimpan (gunakan bcrypt untuk membandingkan)
    const passwordMatches = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatches) {
      return 'Password saat ini salah';
    }

    // Cek apakah newPassword dan confirmPassword cocok
    if (newPassword !== confirmPassword) {
      return 'Password baru dan konfirmasi password tidak cocok';
    }

    // Cek apakah password baru tidak sama dengan password lama
    const newPasswordMatchesOld = await bcrypt.compare(newPassword, user.password);
    if (newPasswordMatchesOld) {
      return 'Password baru tidak boleh sama dengan password lama';
    }

    // Jika validasi terpenuhi, hash password baru
    const { hash } = await this.generatePasswordHash(newPassword);
    user.password = hash;

    // Simpan perubahan ke database
    await this.userRepository.save(user);

    return 'Password berhasil diubah';
  }

  // Fungsi untuk mereset password user ke default
  async resetPassword(id: string): Promise<string> {
    const user = await this.getUserById(id);

    // Password default yang akan diatur
    const defaultPassword = 'cashier123';

    // Cek apakah password saat ini sudah default
    const currentPasswordIsDefault = await bcrypt.compare(defaultPassword, user.password);
    if (currentPasswordIsDefault) {
      throw new ConflictException('Password sudah merupakan password default');
    }

    // Hash password default
    const { hash } = await this.generatePasswordHash(defaultPassword);
    user.password = hash;

    // Simpan perubahan ke database
    await this.userRepository.save(user);

    return 'Password berhasil direset ke default';
  }

  // Mendapatkan user berdasarkan username
  async findUserByEmail(email: string): Promise<User | undefined> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['role'], // Termasuk relasi dengan tabel role
    });
  }
}
