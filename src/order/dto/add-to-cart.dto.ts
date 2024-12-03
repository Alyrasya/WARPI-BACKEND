import { IsArray, IsNotEmpty } from 'class-validator';

export class AddToCartDto {
  @IsArray()
  @IsNotEmpty()
  id_product: string[];
}