import { Controller, Get, Put, Body, UseGuards, Req, Query } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

import { UpdateSettingsDto } from './dto/update-settings.dto';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get global system settings' })
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @Put()
  @ApiOperation({ summary: 'Update global system settings (Admin only)' })
  async updateSettings(@Body() body: UpdateSettingsDto, @Req() req: any) {
    return this.settingsService.updateSettings(body, req.user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('audit')
  @ApiOperation({ summary: 'Get system audit logs (Admin only)' })
  async getAuditLogs(@Query() query: any) {
    return this.auditService.findAll(query);
  }
}
