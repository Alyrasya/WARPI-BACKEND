import * as bcrypt from 'bcrypt';
import { Role } from '#/role/entities/role.entity';
import { User } from '#/user/entities/user.entity';

// Fungsi untuk menghasilkan data master pengguna dengan password yang sudah di-hash
export async function generateUserMasterData(): Promise<Partial<User>[]> {
    const password = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const roleData: Role = {
        id: '3140b0a3-db8e-4384-9abe-be6e3524c5e0',
        role_name: 'admin'
    } as Role;

    return [
        {   
            id: '23131e76-ee28-407c-aed7-a5d573cb1cd5',
            username: 'admin',
            password: hashedPassword,  
            email: 'admin@gmail.com',
            salt: salt,
            role: roleData,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
        },
    ];
}

