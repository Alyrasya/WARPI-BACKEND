import { Type } from 'class-transformer';
import {  IsEnum, IsOptional } from 'class-validator';
import { StatusCategory } from '../entities/category.entity';

export class UpdateCategoryDto{
    @IsOptional()
    category_name?: string;

    @IsOptional()
    @IsEnum(StatusCategory)
    status_category?: StatusCategory;
}
