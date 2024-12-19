<<<<<<< HEAD
import { Controller, Get, UseGuards } from '@nestjs/common';
=======
import { Controller, Get, Param } from '@nestjs/common';
>>>>>>> 32398938308cc356643729955677c4237556d64b
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '#/auth/jwt-auth.guard';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @UseGuards(JwtAuthGuard)
  @Get('admin-summary')
  async getAdminSummary() {
    return this.dashboardService.getAdminSummary();
  }

  // @Get('cashier-summary/:idUser')
  // async getCashierSummary(@Param('idUser') idUser: string) {
  //   return this.dashboardService.getCashierSummary(idUser);
  // }
}
