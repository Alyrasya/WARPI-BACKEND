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

    // Mencari peran dengan role_name 'customer'
    const role = await this.roleRepository.findOne({ where: { role_name: 'customer' } });

    if (!role) {
      throw new Error('Peran customer tidak ditemukan');
    }

    const existingEmail = await this.userRepository.findOne({
      where: { email: registerCustomerDto.email }
    });
  
    if (existingEmail) {
      throw new ConflictException('Email with this name already exists');
    }

    try{
      const { salt, hash } = await this.generatePasswordHash(password);

      // Membuat data pengguna baru dengan peran 'customer'
      const newUser = this.userRepository.create({
        id: uuidv4(),
        username,
        email,
        password: hash, // Menyimpan password yang sudah di-hash
        salt, // Menyimpan salt yang dihasilkan
        status_user: StatusUser.ACTIVE,
        role_id: role.id, // Mengatur id peran 'customer'
        role_name: role.role_name,
        role: role,       // Menghubungkan relasi ke role customer
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Menyimpan pengguna ke database
      return this.userRepository.save(newUser);
    }
    catch (error) {
      // Tangani kesalahan yang tidak terduga
      console.error('Error occurred while saving the user:', error);
      throw new InternalServerErrorException('An unexpected error occurred while saving the account');
    }
  }

  // Fungsi untuk membuat Cashier dengan default password
  async createCashier(createCashierDto: CreateCashierDto): Promise<User> {
    const { username, email } = createCashierDto;

    // Mencari peran dengan role_name 'cashier'
    const role = await this.roleRepository.findOne({ where: { role_name: 'cashier' } });

    if (!role) {
      throw new Error('Peran cashier tidak ditemukan');
    }

    const existingEmail = await this.userRepository.findOne({
      where: { email: createCashierDto.email }
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
      password: hash, // Menyimpan password yang sudah di-hash
      salt,           // Menyimpan salt yang dihasilkan
      status_user: StatusUser.ACTIVE,
      role_id: role.id, // Mengatur id peran 'cashier'
      role_name: role.role_name,
      role: role,       // Menghubungkan relasi ke role cashier
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Menyimpan pengguna ke database
    return this.userRepository.save(newCashier);
  }

  // Method untuk mendapatkan semua user dengan role cashier dan menghitung totalnya
  async getAllCashier(): Promise<{ cashiers: User[], total: number }> {
    const [cashiers, total] = await this.userRepository.findAndCount({
      where: { role_name: 'cashier' }, // Filter role 'cashier'
    });

    return {
      cashiers,    // Daftar user dengan role 'cashier'
      total,       // Total user dengan role 'cashier'
    };
  }

  // Method untuk edit status user dengan role 'cashier'
  async editStatusCashier(id: string, updateStatusDto: UpdateStatusDto): Promise<User> {
    const { status_user } = updateStatusDto;

    // Cari user berdasarkan ID dan role 'cashier'x 
    const user = await this.userRepository.findOne({ where: { id, role_name: 'cashier' } });

    if (!user) {
      throw new NotFoundException(`Cashier with ID ${id} not found`);
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

    // Fungsi untuk mencari kategori berdasarkan nama
    async filterByName(email: string): Promise<User[]> {
      // Query builder untuk pencarian case-insensitive menggunakan ILIKE
      const users = await this.userRepository
        .createQueryBuilder('user')
        .where('user.email ILIKE :email', { email: `%${email}%` })
        .getMany();
  
      // Jika tidak ada kategori yang ditemukan, lempar NotFoundException
      if (users.length === 0) {
        throw new NotFoundException('No category found with the given name');
      }
      return users;
    }
}
