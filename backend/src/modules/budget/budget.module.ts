import { Module, forwardRef } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { BudgetController } from './budget.controller';
import { AccountModule } from '../account/account.module';
import { FiscalPeriodModule } from '../fiscal-period/fiscal-period.module';
import { JournalModule } from '../journal/journal.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AccountModule,
    forwardRef(() => FiscalPeriodModule),
    forwardRef(() => JournalModule),
    PrismaModule,
    AuthModule,
  ],
  controllers: [BudgetController],
  providers: [BudgetService],
  exports: [BudgetService],
})
export class BudgetModule {}
