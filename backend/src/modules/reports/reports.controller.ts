import { Controller, Get, Query, Res, UseGuards, SetMetadata } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('financial/excel')
  @SetMetadata('roles', ['ADMIN', 'OWNER'])
  async getFinancialExcel(@Query() filters: any, @Res() res: Response) {
    return this.reportsService.generateFinancialExcel(filters, res);
  }

  @Get('occupancy/excel')
  @SetMetadata('roles', ['ADMIN', 'OWNER'])
  async getOccupancyExcel(@Query() filters: any, @Res() res: Response) {
    return this.reportsService.generateOccupancyExcel(res);
  }

  @Get('financial/pdf')
  @SetMetadata('roles', ['ADMIN', 'OWNER'])
  async getFinancialPdf(@Query() filters: any, @Res() res: Response) {
    return this.reportsService.generateFinancialPdf(filters, res);
  }

  @Get('expenses/excel')
  @SetMetadata('roles', ['ADMIN', 'OWNER'])
  async getExpensesExcel(@Query() filters: any, @Res() res: Response) {
    return this.reportsService.generateExpensesExcel(filters, res);
  }

  @Get('tenants/excel')
  @SetMetadata('roles', ['ADMIN', 'OWNER'])
  async getTenantsExcel(@Res() res: Response) {
    return this.reportsService.generateTenantsExcel(res);
  }

  @Get('properties')
  @SetMetadata('roles', ['ADMIN', 'OWNER'])
  async getProperties() {
    return this.reportsService.getProperties();
  }
}
