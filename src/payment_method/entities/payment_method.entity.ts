import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class PaymentMethod {
    @PrimaryGeneratedColumn('uuid') // Menggunakan UUID sebagai primary key
    id: string;

    @Column({ type: 'varchar', length: 255 })
    method_name: string; // Untuk menyimpan nama metode pembayaran

    @Column({ type: 'varchar', length: 255, nullable: true })
    qris_name: string; // Nullable, untuk menyimpan nama QRIS jika ada

    @Column({ type: 'varchar', length: 255, nullable: true })
    qris_photo: string; // Nullable, untuk menyimpan foto QRIS

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
