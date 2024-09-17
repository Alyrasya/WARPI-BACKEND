import { Product } from '#/product/entities/product.entity';
import {
    Column,
    CreateDateColumn, 
    DeleteDateColumn, 
    Entity, 
    OneToMany, 
    PrimaryGeneratedColumn, 
    UpdateDateColumn
} from 'typeorm';

export enum StatusCategory {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity()
export class Category {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'varchar', length: 255 })
    category_name: string;
  
    @Column({
      type: 'enum',
      enum: StatusCategory,
      default: StatusCategory.ACTIVE,
    })
    status_category: StatusCategory;
  
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

    @OneToMany(() => Product, (product) => product.category)
    product?: Product[];
}

