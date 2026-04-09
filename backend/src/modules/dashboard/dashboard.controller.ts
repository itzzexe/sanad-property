import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @Roles('ADMIN', 'ACCOUNTANT', 'MANAGER')
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('finance-stats')
  @ApiOperation({ summary: 'Get finance statistics' })
  @Roles('ADMIN', 'ACCOUNTANT', 'OWNER')
  getFinanceStats() {
    return this.dashboardService.getFinanceStats();
  }

  @Post('finance-stats/invalidate')
  @ApiOperation({ summary: 'Invalidate finance cache' })
  @Roles('ADMIN')
  invalidateCache() {
    return this.dashboardService.invalidateFinanceCache();
  }

  @Get('revenue-chart')
  @ApiOperation({ summary: 'Get revenue chart data' })
  getRevenueChart(@Query('months') months?: number) {
    return this.dashboardService.getRevenueChart(months);
  }

  @Get('recent-payments')
  @ApiOperation({ summary: 'Get recent payments' })
  getRecentPayments(@Query('limit') limit?: number) {
    return this.dashboardService.getRecentPayments(limit);
  }

  @Get('expiring-leases')
  @ApiOperation({ summary: 'Get expiring leases' })
  getExpiringLeases(@Query('days') days?: number) {
    return this.dashboardService.getExpiringLeases(days);
  }
}
