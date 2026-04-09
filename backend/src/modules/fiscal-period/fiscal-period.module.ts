import { Module } from '@nestjs/common';
import { FiscalPeriodService } from './fiscal-period.service';
import { FiscalPeriodController } from './fiscal-period.controller';
import { PrismaModule } from '../../prisma/prisma.module';

import { ReportsModule } from '../reports/reports.module';
import { JournalModule } from '../journal/journal.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [PrismaModule, forwardRef(() => JournalModule), forwardRef(() => ReportsModule)],
  controllers: [FiscalPeriodController],
  providers: [FiscalPeriodService],
  exports: [FiscalPeriodService],
})
export class FiscalPeriodModule {}
