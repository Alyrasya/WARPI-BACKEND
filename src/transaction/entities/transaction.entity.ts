import { Order } from "#/order/entities/order.entity";
import { 
    Column,
    CreateDateColumn,
    DeleteDateColumn, 
    Entity, 
    OneToMany, 
    PrimaryGeneratedColumn, 
    UpdateDateColumn 
} from "typeorm";

export enum PaymentStatus{
    Unpaid = 'unpaid',
    Pending = 'pending',
    Paid = 'paid'
}

@Entity()
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true})
    total_price_transaction: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true})
    change_money: number

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true})
    cash: number;

    @Column({ type: 'varchar', length: 60, nullable: true})
    orderers_name: string;

    @Column({ type: 'int', nullable: true})
    no_order: number;

    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.Unpaid
    })
    payment_status: string;

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

    @OneToMany(() => Order, (order) => order.transaction)
    orders: Order[];
}
