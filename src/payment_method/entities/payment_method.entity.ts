import { Transaction } from "#/transaction/entities/transaction.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class PaymentMethod {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255 })
    method_name: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    qris_name: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    qris_photo: string;

    @OneToMany(() => Transaction, transaction => transaction.paymentMethod)
    transaction: Transaction[];

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
