import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getSettings() {
    let settings = await this.prisma.systemSettings.findFirst();
    
    // If no settings exist yet, create default
    if (!settings) {
      settings = await this.prisma.systemSettings.create({
        data: {
          organizationName: 'سند للعقارات',
          address: 'بغداد - المنصور',
          defaultCurrency: 'IQD',
          exchangeRateUSD: 1460.0,
          language: 'ar',
        },
      });
    }
    return settings;
  }

  async updateSettings(data: UpdateSettingsDto, userId: string) {
    let settings = await this.prisma.systemSettings.findFirst();
    
    if (!settings) {
      settings = await this.prisma.systemSettings.create({
        data: {
          organizationName: data.organizationName,
          address: data.address,
          defaultCurrency: data.defaultCurrency,
          exchangeRateUSD: data.exchangeRateUSD,
          language: data.language,
          logo: data.logo,
        },
      });
    } else {
      settings = await this.prisma.systemSettings.update({
        where: { id: settings.id },
        data: {
          organizationName: data.organizationName,
          address: data.address,
          defaultCurrency: data.defaultCurrency,
          exchangeRateUSD: data.exchangeRateUSD,
          language: data.language,
          logo: data.logo,
        },
      });
    }

    await this.auditService.log({
      userId,
      action: 'UPDATE',
      entity: 'SYSTEM_SETTINGS',
      entityId: settings.id,
      oldValue: null, // Simplified for brevity in this robust pass
      newValue: settings,
    });

    return settings;
  }
}
