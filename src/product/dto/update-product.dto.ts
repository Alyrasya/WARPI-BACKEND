import { Type } from "class-transformer";
import {  IsEnum, IsOptional } from "class-validator";
import { StatusProduct } from "../entities/product.entity";

export class UpdateProductDto{
    @IsOptional()
    product_name?: string;

    @IsOptional()
    description?: string;

    @IsOptional()
    @Type(() => Number)
    price?: number;

    @IsOptional()
    @Type(() => Number)
    stock?: number;

    @IsOptional()
    product_photo?: string;

    @IsOptional()
    @IsEnum(StatusProduct)
    status_product?: StatusProduct;
}
