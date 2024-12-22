import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class EditTransactionDto {
    @IsNumber()
    @IsOptional()
    cash?: number;

    @IsEnum(['paid', 'pending'])
    @IsNotEmpty()
    action: 'paid' | 'pending';

    @IsUUID()
    @IsOptional()
    id_method: string;  // id_method should be passed in the body
}
