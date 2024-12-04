import { IsNotEmpty, IsPositive, IsUUID, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

class OrderProductDto {
  @IsUUID()
  @IsNotEmpty()
  idProduct: string;

  @IsPositive()
  @IsNotEmpty()
  qty: number;
}

export class CreateOrderDto {
  @IsUUID()
  @IsNotEmpty()
  idCart: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderProductDto)
  products: OrderProductDto[];
}
<<<<<<< HEAD
                                    
=======
>>>>>>> fb61dda70eb5636874b578e462c08d529f6a8a74
