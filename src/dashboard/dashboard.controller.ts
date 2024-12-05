import { Controller, Get, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';


@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin-summary')
  async getAdminSummary() {
    return this.dashboardService.getAdminSummary();
  }

  @Get('cashier-summary/:idUser')
  async getCashierSummary(@Param('idUser') idUser: string) {
    return this.dashboardService.getCashierSummary(idUser);
  }
}
