import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { FxService } from './fx.service';
import { CreateExchangeRateDto } from './dto/create-exchange-rate.dto';
import { ImportRatesDto } from './dto/import-rates.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('fx')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FxController {
  constructor(private readonly fxService: FxService) {}

  @Get('rates')
  @Roles('ADMIN', 'ACCOUNTANT', 'OWNER')
  listRates(
    @Query('fromCurrency') fromCurrency?: string,
    @Query('toCurrency') toCurrency?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.fxService.listRates({ fromCurrency, toCurrency, startDate, endDate });
  }

  @Post('rates')
  @Roles('ADMIN', 'ACCOUNTANT')
  setRate(@Body() dto: CreateExchangeRateDto) {
    return this.fxService.setRate(dto);
  }

  @Post('rates/import')
  @Roles('ADMIN')
  importRates(@Body() dto: ImportRatesDto) {
    return this.fxService.importRates(dto.csvData);
  }

  @Post('revaluation')
  @Roles('ADMIN')
  runRevaluation(@Body('fiscalPeriodId') fiscalPeriodId: string, @Request() req: any) {
    return this.fxService.runRevaluation(fiscalPeriodId, req.user.id);
  }

  @Get('convert')
  @Roles('ADMIN', 'ACCOUNTANT', 'OWNER')
  async convert(
    @Query('amount') amount: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('date') date?: string
  ) {
    const d = date ? new Date(date) : new Date();
    const result = await this.fxService.convert(parseFloat(amount), from, to, d);
    return { result: result.toNumber() };
  }
}
