import * as bcrypt from 'bcrypt';
import { Role } from '#/role/entities/role.entity';
import { StatusUser, User } from '#/user/entities/user.entity';

// Jumlah rounds untuk salt
const salt = 10;

// Fungsi untuk meng-hash password menggunakan bcrypt
async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, salt);
}

// Fungsi untuk menghasilkan data master pengguna dengan password yang sudah di-hash
export async function generateUserMasterData(): Promise<Partial<User>[]> {
    const password = 'admin123';
    const hashedPassword = await hashPassword(password);

    const roleData: Role = {
        id: '3140b0a3-db8e-4384-9abe-be6e3524c5e0',
        role_name: 'admin' // Misalkan nama role adalah 'Administrator'
    } as Role;

    return [
        {   
            id: '23131e76-ee28-407c-aed7-a5d573cb1cd5',
            username: 'admin',
            password: hashedPassword,  
            email: 'admin@gmail.com',
            // Field salt tidak diperlukan karena bcrypt mengelola salt secara otomatis
            status_user: StatusUser.ACTIVE,
            role: roleData, // Menyertakan data role lengkap
            role_name: 'admin',
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
        },
    ];
}

