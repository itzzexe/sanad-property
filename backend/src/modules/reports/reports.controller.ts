import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportParams } from './types/report-params';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('income-statement')
  @Roles('ADMIN', 'ACCOUNTANT', 'OWNER')
  getIncomeStatement(@Query() params: any) {
    return this.reportsService.incomeStatement(this.parseParams(params));
  }

  @Get('balance-sheet')
  @Roles('ADMIN', 'ACCOUNTANT', 'OWNER')
  getBalanceSheet(@Query() params: any) {
    return this.reportsService.balanceSheet(this.parseParams(params));
  }

  @Get('cash-flow')
  @Roles('ADMIN', 'ACCOUNTANT', 'OWNER')
  getCashFlow(@Query() params: any) {
    return this.reportsService.cashFlowStatement(this.parseParams(params));
  }

  @Get('property-profitability')
  @Roles('ADMIN', 'ACCOUNTANT', 'OWNER')
  getPropertyProfitability(@Query() params: any) {
    return this.reportsService.propertyProfitability(this.parseParams(params));
  }

  @Get('ar-aging')
  @Roles('ADMIN', 'ACCOUNTANT', 'OWNER')
  getArAging(@Query('endDate') endDate?: string) {
    return this.reportsService.arAging({ endDate: endDate ? new Date(endDate) : new Date() });
  }

  @Get('trial-balance')
  @Roles('ADMIN', 'ACCOUNTANT', 'OWNER')
  getTrialBalance(@Query() params: any) {
    return this.reportsService.trialBalance(this.parseParams(params));
  }

  @Get('budget-vs-actual')
  @Roles('ADMIN', 'ACCOUNTANT', 'OWNER')
  getBudgetVsActual(@Query('budgetId') budgetId: string) {
    return this.reportsService.budgetVsActual({ fiscalYearId: budgetId });
  }

  private parseParams(query: any): ReportParams {
    return {
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      fiscalPeriodId: query.fiscalPeriodId,
      fiscalYearId: query.fiscalYearId,
      propertyId: query.propertyId,
      compareWithPriorPeriod: query.compareWithPriorPeriod === 'true'
    };
  }
}
