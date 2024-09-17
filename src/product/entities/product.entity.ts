import { Category } from "#/category/entities/category.entity";
import { Order } from "#/order/entities/order.entity";
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne, 
    OneToMany, 
    PrimaryGeneratedColumn,
    UpdateDateColumn 
} from "typeorm";

export enum StatusProduct {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

@Entity()
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255 })
    product_name: string;

    @Column({ type: 'text' }) 
    description: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @Column({ type: 'int', nullable: true})
    stock: number;

    @Column({ type: 'varchar', length: 255 })
    product_photo: string;
    
    @Column({
    type: 'enum',
    enum: StatusProduct,
    default: StatusProduct.ACTIVE,
    })
    status_product: StatusProduct;

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

    @ManyToOne(() => Category, (category) => category.id)
    @JoinColumn({ name: 'category_id', referencedColumnName: 'id' })
    category: Category

    @JoinColumn({ name: 'category_name', referencedColumnName: 'category_name' })
    @Column({ name: 'category_name', nullable: true})
    category_name: string;

    @OneToMany(() => Order, (order) => order.product )
    orders: Order[];
}
