import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateProductDto {
    @IsNotEmpty()
    @IsUUID()
    id_category: string;

    @IsNotEmpty()
    @IsString()
    product_name: string;

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    price: number;

    @IsOptional()
    product_photo?: string;
}
