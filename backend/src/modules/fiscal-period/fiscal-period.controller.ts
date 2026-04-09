import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { FiscalPeriodService } from './fiscal-period.service';
import { CreateFiscalYearDto } from './dto/create-fiscal-year.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, FiscalPeriodStatus } from '@prisma/client';

@ApiTags('fiscal-period')
@Controller()
export class FiscalPeriodController {
  constructor(private readonly fiscalPeriodService: FiscalPeriodService) {}

  @Get('fiscal-years')
  @ApiOperation({ summary: 'List all fiscal years with their periods' })
  async findAllYears() {
    return this.fiscalPeriodService.findAllYears();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('fiscal-years')
  @ApiOperation({ summary: 'Create a new fiscal year (JWT required)' })
  async createYear(@Body() dto: CreateFiscalYearDto) {
    return this.fiscalPeriodService.createFiscalYear(dto);
  }

  @Get('fiscal-years/:id')
  @ApiOperation({ summary: 'Get a single fiscal year with its periods' })
  async findYearById(@Param('id') id: string) {
    return this.fiscalPeriodService.findYearById(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('fiscal-years/:id/close')
  @ApiOperation({ summary: 'Close a fiscal year (Admin only)' })
  async closeYear(@Param('id') id: string, @Req() req: any) {
    return this.fiscalPeriodService.closeFiscalYear(id, req.user.sub || req.user.id);
  }

  @Get('fiscal-periods')
  @ApiOperation({ summary: 'List fiscal periods with optional filters' })
  @ApiQuery({ name: 'fiscalYearId', required: false })
  @ApiQuery({ name: 'status', enum: FiscalPeriodStatus, required: false })
  async findAllPeriods(
    @Query('fiscalYearId') fiscalYearId?: string,
    @Query('status') status?: FiscalPeriodStatus,
  ) {
    return this.fiscalPeriodService.findAllPeriods({ fiscalYearId, status });
  }

  @Get('fiscal-periods/current')
  @ApiOperation({ summary: 'Get the current open fiscal period' })
  async findCurrentPeriod() {
    return this.fiscalPeriodService.findCurrentPeriod();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @Post('fiscal-periods/:id/close')
  @ApiOperation({ summary: 'Close a fiscal period (Admin, Accountant only)' })
  async closePeriod(@Param('id') id: string, @Req() req: any) {
    return this.fiscalPeriodService.closePeriod(id, req.user.sub || req.user.id);
  }
}
