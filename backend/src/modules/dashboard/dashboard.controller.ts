import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  getStats() {
    return this.dashboardService.getStats();
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
