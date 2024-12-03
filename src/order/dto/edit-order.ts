import { IsOptional, IsEnum, IsPositive } from 'class-validator';

export class EditOrderQuantityDto {
  @IsOptional()
  @IsEnum(['increment', 'decrement'])
  action?: 'increment' | 'decrement';

  @IsOptional()
  @IsPositive()
  qty?: number;
}
