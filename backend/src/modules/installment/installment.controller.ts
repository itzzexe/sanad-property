import { Controller, Get, Param, Query, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InstallmentService } from './installment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('installments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('installments')
export class InstallmentController {
  constructor(private readonly installmentService: InstallmentService) {}

  @Get()
  @ApiOperation({ summary: 'Get all installments' })
  findAll(@Query() query: any) {
    return this.installmentService.findAll(query);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get overdue installments' })
  getOverdue() {
    return this.installmentService.getOverdue();
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming installments' })
  getUpcoming(@Query('days') days?: number) {
    return this.installmentService.getUpcoming(days);
  }

  @Post('update-overdue')
  @ApiOperation({ summary: 'Update overdue statuses' })
  updateOverdue() {
    return this.installmentService.updateOverdueStatuses();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get installment by ID' })
  findOne(@Param('id') id: string) {
    return this.installmentService.findOne(id);
  }
}
