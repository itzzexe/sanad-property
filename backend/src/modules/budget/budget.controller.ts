import { Controller, Get, Post, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile, BadRequestException, Req } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpsertBudgetLinesDto } from './dto/upsert-budget-lines.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('budgets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.OWNER)
  findAll(@Query() query: any) {
    return this.budgetService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.OWNER)
  findOne(@Param('id') id: string) {
    return this.budgetService.findOne(id);
  }

  @Get(':id/variance')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.OWNER)
  getVariance(@Param('id') id: string) {
    return this.budgetService.getVariance(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  create(@Body() dto: CreateBudgetDto, @Req() req: any) {
    return this.budgetService.create(dto, req.user?.id || 'system');
  }

  @Post(':id/lines')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  upsertLines(@Param('id') id: string, @Body() dto: UpsertBudgetLinesDto) {
    return this.budgetService.upsertLines(id, dto.lines);
  }

  @Post(':id/lines/import-csv')
  @UseInterceptors(FileInterceptor('file'))
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  importFromCsv(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');
    return this.budgetService.importFromCsv(id, file.buffer.toString('utf-8'));
  }

  @Post(':id/approve')
  @Roles(UserRole.ADMIN)
  approve(@Param('id') id: string, @Req() req: any) {
    return this.budgetService.approve(id, req.user?.id || 'system');
  }

  @Post(':id/archive')
  @Roles(UserRole.ADMIN)
  archive(@Param('id') id: string) {
    return this.budgetService.archive(id);
  }
}
