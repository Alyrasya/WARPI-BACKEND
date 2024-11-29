import { Cart } from "#/cart/entities/cart.entity";
import { Role } from "#/role/entities/role.entity";
import { Transaction } from "#/transaction/entities/transaction.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum StatusUser {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    username: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 255 })
    password: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    salt: string;

    @Column({
        type: 'enum',
        enum: StatusUser,
        default: StatusUser.ACTIVE,
    })
    status_user: StatusUser;

    @ManyToOne(() => Role, role => role.user)
    @JoinColumn({ name: 'id_role', referencedColumnName: 'id' })
    role: Role;

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

    @OneToOne(() => Cart, cart => cart.user)
    cart: Cart;

    @OneToMany(() => Transaction, (transaction) => transaction.customer)
    customerTransactions: Transaction[];

    @OneToMany(() => Transaction, (transaction) => transaction.cashier)
    cashierTransactions: Transaction[];
}
