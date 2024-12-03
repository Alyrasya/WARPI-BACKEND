import { IsArray, IsNotEmpty } from 'class-validator';

export class AddToCartDto {
  @IsNotEmpty()
  id_cart: string;

  @IsArray()
  @IsNotEmpty()
  id_product: string[];
}