import { Module } from '@nestjs/common';
import { TrialBalanceService } from './trial-balance.service';
import { TrialBalanceController } from './trial-balance.controller';
import { AccountModule } from '../account/account.module';
import { JournalModule } from '../journal/journal.module';
import { FiscalPeriodModule } from '../fiscal-period/fiscal-period.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AccountModule,
    JournalModule,
    FiscalPeriodModule,
    PrismaModule,
    AuthModule,
  ],
  controllers: [TrialBalanceController],
  providers: [TrialBalanceService],
  exports: [TrialBalanceService],
})
export class TrialBalanceModule {}
