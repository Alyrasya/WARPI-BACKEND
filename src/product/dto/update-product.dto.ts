import { Type } from "class-transformer";
import {  IsEnum, IsOptional, Min } from "class-validator";
import { StatusProduct } from "../entities/product.entity";

export class UpdateProductDto{
    @IsOptional()
    product_name?: string;

    @IsOptional()
    description?: string;

    @IsOptional()
    @Type(() => Number)
    @Min(0, { message: 'Stock cannot be negative' })
    price?: number;

    @IsOptional()
    @Type(() => Number)
    @Min(0, { message: 'Price cannot be negative' })
    stock?: number;

    @IsOptional()
    product_photo?: string;

    @IsOptional()
    @IsEnum(StatusProduct)
    status_product?: StatusProduct;
}
