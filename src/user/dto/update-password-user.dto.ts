import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class UpdatePasswordUserDto{
    @IsNotEmpty({message: 'Password saat ini harus diisi'})
    @IsString()
    currentPassword: string;

    @IsNotEmpty({ message: 'Password baru harus diisi' })
    @IsString()
    @MinLength(6, { message: 'Password baru harus minimal 6 karakter.' })
    newPassword: string;

    @IsNotEmpty({ message: 'Konfirmasi password harus diisi' })
    @IsString()
    confirmPassword: string;
}