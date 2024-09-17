import { Role } from "#/role/entities/role.entity";

export const roleMasterData: Partial<Role>[] = [
    {
        id: '3140b0a3-db8e-4384-9abe-be6e3524c5e0',
        role_name: 'admin',
        users:[],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
    },
    {
        id: '3f951e19-9e65-48d8-8d91-0ae9ea76031d',
        role_name: 'cashier',
        users:[],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
    },
    {
        id: '7732cc17-9aa0-4b33-942b-6247b1132787',
        role_name: 'customer',
        users:[],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
    }
]
