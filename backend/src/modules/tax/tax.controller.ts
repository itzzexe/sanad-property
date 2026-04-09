import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { TaxService } from './tax.service';
import { CreateTaxRateDto } from './dto/create-tax-rate.dto';
import { ApplyTaxDto } from './dto/apply-tax.dto';
import { TaxType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('tax')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Get('tax-rates')
  @Roles('ADMIN', 'ACCOUNTANT', 'OWNER')
  findAll(
    @Query('type') type?: TaxType,
    @Query('isActive') isActive?: string,
    @Query('jurisdiction') jurisdiction?: string
  ) {
    return this.taxService.findAll({ 
      type, 
      isActive: isActive === 'true' ? true : (isActive === 'false' ? false : undefined), 
      jurisdiction 
    });
  }

  @Post('tax-rates')
  @Roles('ADMIN')
  create(@Body() dto: CreateTaxRateDto) {
    return this.taxService.createTaxRate(dto);
  }

  @Get('tax-rates/:id')
  @Roles('ADMIN', 'ACCOUNTANT', 'OWNER')
  findOne(@Param('id') id: string) {
    return this.taxService.findOne(id);
  }

  @Get('vat-return')
  @Roles('ADMIN', 'ACCOUNTANT', 'OWNER')
  getVatReturn(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.taxService.getVatReturn(startDate, endDate);
  }

  @Get('withholding-summary')
  @Roles('ADMIN', 'ACCOUNTANT', 'OWNER')
  getWithholdingSummary(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.taxService.getWithholdingSummary(startDate, endDate);
  }

  @Post('apply')
  @Roles('ADMIN', 'ACCOUNTANT')
  applyTax(@Body() dto: ApplyTaxDto, @Request() req: any) {
    return this.taxService.applyTaxToJournalEntry(dto.journalEntryId, dto.taxRateId, dto.taxableAmount, dto.isInput, req.user.id);
  }
}
