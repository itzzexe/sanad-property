import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ReportsModule } from '../reports/reports.module';
import { ArModule } from '../accounts-receivable/ar.module';
import { JournalModule } from '../journal/journal.module';
import { FiscalPeriodModule } from '../fiscal-period/fiscal-period.module';
import { BudgetModule } from '../budget/budget.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ReportsModule,
    ArModule,
    JournalModule,
    FiscalPeriodModule,
    BudgetModule
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
