import { Module, forwardRef } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { JournalModule } from '../journal/journal.module';
import { AccountModule } from '../account/account.module';
import { FiscalPeriodModule } from '../fiscal-period/fiscal-period.module';
import { BudgetModule } from '../budget/budget.module';
import { ArModule } from '../accounts-receivable/ar.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => JournalModule),
    AccountModule,
    forwardRef(() => FiscalPeriodModule),
    BudgetModule,
    ArModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
