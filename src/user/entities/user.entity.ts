import { Role } from "#/role/entities/role.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

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

    @ManyToOne(() => Role, role => role.users)
    @JoinColumn({ name: 'id_role', referencedColumnName: 'id' })
    role: Role;
}
