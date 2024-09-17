import { IsEmail, IsNotEmpty } from "class-validator";

export class CreateCashierDto {
    @IsNotEmpty()
    username: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;
}