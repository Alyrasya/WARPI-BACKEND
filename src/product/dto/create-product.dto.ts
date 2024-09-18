import { Type } from "class-transformer";
import { IsNotEmpty, IsOptional, IsUUID } from "class-validator";

export class CreateProductDto {
    @IsNotEmpty()
    @IsUUID()
    id_category: string;

    @IsNotEmpty()
    product_name: string;

    @IsNotEmpty()
    description: string;

    @IsNotEmpty()
    @Type(() => Number)
    price: number;

    @IsOptional()
    product_photo?: string;
}
