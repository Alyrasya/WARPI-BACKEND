import { CategoryService } from '#/category/category.service';
import { ProductService } from '#/product/product.service';
import { UserService } from '#/user/user.service';
import { Injectable } from '@nestjs/common';

export interface AdminSummary{
  totalCategory: number;
  totalProduct:number;
  totalCashier: number;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly productService: ProductService,
    private readonly userService: UserService,
  ) {}

  async getAdminSummary(): Promise<AdminSummary> {
    const totalCategory = await this.categoryService.countCategories();
    const totalProduct = await this.productService.countProducts();
    const totalCashier = await this.userService.countCashiers();
    return {
      totalCategory,
      totalProduct,
      totalCashier,
    };
  }
}
