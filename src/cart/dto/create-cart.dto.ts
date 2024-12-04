
import { IsString, IsInt, Min, IsUUID } from 'class-validator';

export class AddToCartDto {
    @IsUUID()
    readonly userId: string; // ID user yang ingin menambahkan produk ke cart

    @IsUUID()
    readonly productId: string; // ID produk yang ingin ditambahkan

    @IsInt()
    @Min(1)
    readonly qty: number; // Jumlah produk yang ingin ditambahkan ke cart
}


