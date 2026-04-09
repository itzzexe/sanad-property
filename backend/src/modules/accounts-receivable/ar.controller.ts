import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ArService } from './ar.service';
import { WriteOffDto } from './dto/write-off.dto';
import { CreditMemoDto } from './dto/credit-memo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('ar')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ArController {
  constructor(private readonly arService: ArService) {}

  @Get('tenant/:tenantId/balance')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.OWNER)
  getTenantBalance(@Param('tenantId') tenantId: string) {
    return this.arService.getTenantBalance(tenantId);
  }

  @Get('tenant/:tenantId/statement')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.OWNER)
  getTenantStatement(
    @Param('tenantId') tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.arService.getTenantStatement(tenantId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('aging')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.OWNER)
  getAgingReport(@Query('asOfDate') asOfDate?: string) {
    return this.arService.getAgingReport(asOfDate ? new Date(asOfDate) : undefined);
  }

  @Post('write-off')
  @Roles(UserRole.ADMIN)
  writeOff(@Body() dto: WriteOffDto, @Req() req: any) {
    return this.arService.writeOff({
      tenantId: dto.tenantId,
      amount: dto.amount,
      reason: dto.reason,
      approvedById: req.user?.id || 'system',
    });
  }

  @Post('credit-memo')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  createCreditMemo(@Body() dto: CreditMemoDto, @Req() req: any) {
    return this.arService.createCreditMemo({
      tenantId: dto.tenantId,
      amount: dto.amount,
      reason: dto.reason,
      createdById: req.user?.id || 'system',
    });
  }
}
