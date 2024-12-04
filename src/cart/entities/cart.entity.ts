import { Order } from '#/order/entities/order.entity';
import { Transaction } from '#/transaction/entities/transaction.entity';
import { User } from '#/user/entities/user.entity';
import {
    CreateDateColumn, 
    DeleteDateColumn, 
    Entity, 
    JoinColumn, 
    OneToMany, 
    OneToOne, 
    PrimaryGeneratedColumn, 
    UpdateDateColumn
} from 'typeorm';

@Entity()
export class Cart {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => User)
    @JoinColumn({ name: 'id_customer', referencedColumnName: 'id' })
    user: User;
  
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
    
    @OneToOne(() => Transaction, transaction => transaction.cart)
    transaction: Transaction;

    @OneToMany(() => Order, order => order.cart)
    order: Order[];
}

