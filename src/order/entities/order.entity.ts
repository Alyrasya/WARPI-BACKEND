import { Cart } from "#/cart/entities/cart.entity";
import { Product } from "#/product/entities/product.entity";
import { Transaction } from "#/transaction/entities/transaction.entity";
import { 
    Column, 
    CreateDateColumn, 
    DeleteDateColumn, 
    Entity, 
    JoinColumn, 
    ManyToOne, 
    PrimaryGeneratedColumn, 
    UpdateDateColumn 
} from "typeorm";

@Entity()
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, default: 0 })
    total_price_order: number;

    @Column({ type: 'int' , nullable: true })
    qty: number;

    @ManyToOne(() => Cart, cart => cart.order)
    @JoinColumn({ name: 'id_cart', referencedColumnName: 'id' })
    cart: Cart;

    @ManyToOne(() => Product, product => product.order)
    @JoinColumn({ name: 'id_product', referencedColumnName: 'id'})
    product: Product;

    @CreateDateColumn({
        type: 'timestamp with time zone',
        nullable: false,
    })
    createdAt: Date;
    
    @UpdateDateColumn({
        type: 'timestamp with time zone',
        nullable: false,
    })     
    updatedAt: Date;
    
    @DeleteDateColumn({
        type: 'timestamp with time zone',
        nullable: true,
    })
    deletedAt: Date;
}
