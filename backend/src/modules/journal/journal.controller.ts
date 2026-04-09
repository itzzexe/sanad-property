import { Controller, Get, Post, Body, Param, Query, Delete, Req, UseGuards } from '@nestjs/common';
import { JournalService } from './journal.service';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { ReverseJournalEntryDto } from './dto/reverse-journal-entry.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
// @ts-ignore
import { JournalStatus, JournalSourceType, UserRole } from '@prisma/client';

@Controller('journal-entries')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  create(@Body() dto: CreateJournalEntryDto, @Req() req: any) {
    return this.journalService.create(dto, req.user?.id || 'system');
  }

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: JournalStatus,
    @Query('sourceType') sourceType?: JournalSourceType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('fiscalPeriodId') fiscalPeriodId?: string,
    @Query('reference') reference?: string,
  ) {
    const filters = {
      status,
      sourceType,
      fiscalPeriodId,
      reference,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };
    const pagination = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };
    return this.journalService.findAll(filters, pagination);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.journalService.findOne(id);
  }

  @Post(':id/post')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  postEntry(@Param('id') id: string, @Req() req: any) {
    return this.journalService.post(id, req.user?.id || 'system');
  }

  @Post(':id/reverse')
  @Roles(UserRole.ADMIN)
  reverseEntry(@Param('id') id: string, @Body() dto: ReverseJournalEntryDto, @Req() req: any) {
    return this.journalService.reverse(id, dto.reason, req.user?.id || 'system');
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  remove(@Param('id') id: string) {
    return this.journalService.delete(id);
  }
}
