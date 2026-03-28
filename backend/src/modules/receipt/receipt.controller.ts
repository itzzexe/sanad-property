import { Controller, Get, Post, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { ReceiptService } from './receipt.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('receipts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('receipts')
export class ReceiptController {
  constructor(private readonly receiptService: ReceiptService) {}

  @Post('generate/:paymentId')
  @ApiOperation({ summary: 'Generate a receipt for a payment' })
  generate(@Param('paymentId') paymentId: string) {
    return this.receiptService.generate(paymentId);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download receipt PDF' })
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const { buffer, filename } = await this.receiptService.generatePdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get()
  @ApiOperation({ summary: 'Get all receipts' })
  findAll(@Query() query: any) {
    return this.receiptService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a receipt by ID' })
  findOne(@Param('id') id: string) {
    return this.receiptService.findOne(id);
  }
}
