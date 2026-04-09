import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TrialBalanceService } from './trial-balance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('trial-balance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrialBalanceController {
  constructor(private readonly trialBalanceService: TrialBalanceService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.OWNER)
  async getTrialBalance(
    @Query('asOfDate') asOfDateStr?: string,
    @Query('fiscalPeriodId') fiscalPeriodId?: string,
    @Query('adjusted') adjustedStr?: string,
    @Query('includeZeroBalance') includeZeroBalanceStr?: string,
  ) {
    const asOfDate = asOfDateStr ? new Date(asOfDateStr) : new Date();
    const adjusted = adjustedStr === 'true';
    const includeZeroBalance = includeZeroBalanceStr === 'true';

    return this.trialBalanceService.generate({
      asOfDate,
      fiscalPeriodId,
      adjusted,
      includeZeroBalance,
    });
  }

  @Get('validate')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  async validateBalance() {
    const result = await this.trialBalanceService.validateBalance();
    return {
      ...result,
      checkedAt: new Date(),
    };
  }
}
