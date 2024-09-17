import { Type } from "class-transformer";
import { IsEnum,IsNumber, IsOptional } from "class-validator";

export class UpdateOrderDto{
    @IsOptional()
    @IsEnum(['increment', 'decrement'])
    actionOrQty?: 'increment' | 'decrement';
  
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    qty?: number;
}
