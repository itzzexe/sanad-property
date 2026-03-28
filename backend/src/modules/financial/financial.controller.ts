import { Controller, Get, Post, Body, Query, Param, Delete, UseGuards } from '@nestjs/common';
import { FinancialService } from './financial.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('financial')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  // Expenses
  @Get('expenses')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  getExpenses(@Query() query: any) {
    return this.financialService.getExpenses(query);
  }

  @Post('expenses')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  createExpense(@Body() data: any) {
    return this.financialService.createExpense(data);
  }

  @Delete('expenses/:id')
  @Roles(UserRole.ADMIN)
  deleteExpense(@Param('id') id: string) {
    return this.financialService.deleteExpense(id);
  }

  // Shareholders
  @Get('properties/:propertyId/shareholders')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  getShareholders(@Param('propertyId') propertyId: string) {
    return this.financialService.getShareholders(propertyId);
  }

  @Post('shareholders')
  @Roles(UserRole.ADMIN)
  addShareholder(@Body() data: any) {
    return this.financialService.addShareholder(data);
  }

  // Profit Sharing
  @Get('properties/:propertyId/profit-analysis')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  calculateProfit(
    @Param('propertyId') propertyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.financialService.calculateProfit(propertyId, startDate, endDate);
  }

  @Post('distribute-profit')
  @Roles(UserRole.ADMIN)
  distributeProfit(@Body() data: any) {
    return this.financialService.distributeProfit(data.propertyId, data);
  }

  // Assets
  @Get('properties/:propertyId/assets')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  getAssets(@Param('propertyId') propertyId: string) {
    return this.financialService.getAssets(propertyId);
  }

  @Post('assets')
  @Roles(UserRole.ADMIN)
  createAsset(@Body() data: any) {
    return this.financialService.createAsset(data);
  }
}
