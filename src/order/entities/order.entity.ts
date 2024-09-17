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

    @Column('uuid')
    product_id: string;

    @Column('uuid')
    transaction_id: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, default: 0 })
    total_price_order: number;

    @Column({ type: 'int' , nullable: true })
    qty: number;

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

    // Relasi Many-to-One dengan tabel Product
    @ManyToOne(() => Product, (product) => product.orders)
    @JoinColumn({ name: 'product_id' , referencedColumnName: 'id'})
    product: Product;

    // Relasi Many-to-One dengan tabel Transaction
    @ManyToOne(() => Transaction, (transaction) => transaction.orders)
    @JoinColumn({ name: 'transaction_id' , referencedColumnName: 'id'})
    transaction: Transaction;
}
