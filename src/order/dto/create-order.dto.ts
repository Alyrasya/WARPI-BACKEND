import { ArrayMinSize, IsArray, IsNotEmpty } from "class-validator";

export class CreateOrderDto {
    
    @IsArray()
    @IsNotEmpty()
    @ArrayMinSize(1)
    products: {
        product_id: string;
        qty?: number;
    }[];
}
                                                