import { Type } from "class-transformer";
import { IsNotEmpty, IsOptional } from "class-validator";

export class CreateProductDto {
    @IsNotEmpty()
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
