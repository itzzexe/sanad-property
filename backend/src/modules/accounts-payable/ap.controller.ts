import { Controller, Get, Post, Body, Param, Query, Patch, UseGuards, Request } from '@nestjs/common';
import { ApService } from './ap.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { PayBillDto } from './dto/pay-bill.dto';
import { BillStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('ap/bills')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApController {
  constructor(private readonly apService: ApService) {}

  @Get()
  @Roles('ADMIN', 'ACCOUNTANT', 'OWNER')
  findAll(
    @Query('vendorId') vendorId?: string,
    @Query('propertyId') propertyId?: string,
    @Query('status') status?: BillStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.apService.findAllBills({ vendorId, propertyId, status, startDate, endDate });
  }

  @Get('aging')
  @Roles('ADMIN', 'ACCOUNTANT', 'OWNER')
  getAgingReport(@Query('asOfDate') asOfDate?: string) {
    return this.apService.getApAgingReport(asOfDate);
  }

  @Get(':id')
  @Roles('ADMIN', 'ACCOUNTANT', 'OWNER')
  findOne(@Param('id') id: string) {
    return this.apService.findOneBill(id);
  }

  @Post()
  @Roles('ADMIN', 'ACCOUNTANT')
  create(@Body() dto: CreateBillDto, @Request() req: any) {
    return this.apService.createBill(dto, req.user.id);
  }

  @Post(':id/post')
  @Roles('ADMIN', 'ACCOUNTANT')
  postBill(@Param('id') id: string, @Request() req: any) {
    return this.apService.postBill(id, req.user.id);
  }

  @Post(':id/pay')
  @Roles('ADMIN', 'ACCOUNTANT')
  payBill(@Param('id') id: string, @Body() dto: PayBillDto, @Request() req: any) {
    return this.apService.payBill(id, dto, req.user.id);
  }
}
