import { PaymentMethod } from "#/payment_method/entities/payment_method.entity";

export const paymentMethodMasterData: Partial<PaymentMethod>[] = [
    {
        id: 'e5223168-60e4-4cc8-8501-d10917562273',
        method_name: 'cash',
        qris_name: null,
        qris_photo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
    },
    {
        id: '54fc9f4e-98b4-4f7b-89af-f5b3446affe5',
        method_name: 'qris',
        qris_name: 'WARPI',
        qris_photo: 'blablabla.png',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
    },
]