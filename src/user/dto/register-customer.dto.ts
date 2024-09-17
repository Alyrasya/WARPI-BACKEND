import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class RegisterCustomerDto {
    @IsNotEmpty({ message: 'username harus di isi'})
    username: string;

    @IsNotEmpty({ message: 'email harus di isi'})
    @IsString()
    email: string;

    @IsNotEmpty()
    @MinLength(6, { message: 'Password baru harus minimal 6 karakter.' })
    password: string;
}
