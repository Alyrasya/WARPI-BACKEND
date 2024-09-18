import { IsArray, IsNotEmpty, IsString } from "class-validator";

export class CreateOrderDto {

    @IsString()
    @IsNotEmpty()
    orderers_name: string; // Nama pemesan yang harus diinput

    @IsArray()
    @IsNotEmpty()
    products: {
        product_id: string;
        qty: number;
    }[];
}
