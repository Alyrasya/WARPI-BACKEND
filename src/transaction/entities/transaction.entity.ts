import { Cart } from "#/cart/entities/cart.entity";
import { PaymentMethod } from "#/payment_method/entities/payment_method.entity";
import { User } from "#/user/entities/user.entity";
import { 
    Column,
    CreateDateColumn,
    DeleteDateColumn, 
    Entity, 
    JoinColumn, 
    ManyToOne, 
    OneToOne, 
    PrimaryGeneratedColumn, 
    UpdateDateColumn 
} from "typeorm";

export enum PaymentStatus{
    Unpaid = 'unpaid',
    Pending = 'pending',
    Paid = 'paid',
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
    name_order: string;

    @Column({ type: 'int', nullable: true})
    no_order: number;

    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.Unpaid
    })
    payment_status: string;

    @ManyToOne(() => PaymentMethod, paymentMethod => paymentMethod.transaction) 
    @JoinColumn({ name: 'id_method', referencedColumnName: 'id' })
    paymentMethod: PaymentMethod;

    @ManyToOne(() => Cart) 
    @JoinColumn({ name: 'id_cart', referencedColumnName: 'id' }) 
    cart: Cart;

    @ManyToOne(() => User, (user) => user.customerTransactions)
    @JoinColumn({ name: 'id_customer' })
    customer: User;

    @ManyToOne(() => User, (user) => user.cashierTransactions)
    @JoinColumn({ name: 'id_cashier' })
    cashier: User;

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
