import { CategoryService } from '#/category/category.service';
import { ProductService } from '#/product/product.service';
import { TransactionService } from '#/transaction/transaction.service';
import { UserService } from '#/user/user.service';
import { Injectable } from '@nestjs/common';

export interface AdminSummary{
  totalCategory: number;
  totalProduct:number;
  totalCashier: number;
  totalTransaction: number;
  totalMonthlyIncome: number;
  totalAllIncome: number;
}
export interface CashierSummary{
  totalPaidTransaction: number,
  totalUnpaidTransaction: number,
  totalPendingTransaction:number,
  totalTransactionCashier:number
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly productService: ProductService,
    private readonly userService: UserService,
    private readonly transactionService: TransactionService,
  ) {}

  //Admin
  async getAdminSummary(){
    const totalCategory = await this.categoryService.countCategories();
    const totalProduct = await this.productService.countProducts();
    const totalCashier = await this.userService.countCashiers();
    const totalTransaction = await this.transactionService.countPaidTransactions()
    const totalMonthlyIncome = await this.transactionService.countTotalMonthlyIncome()
    const totalAllIncome = await this.transactionService.countTotalAllIncome()
    return {
      totalCategory,
      totalProduct,
      totalCashier,
      totalTransaction,
      totalMonthlyIncome,
      totalAllIncome,
    };
  }
}
