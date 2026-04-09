import { Module } from '@nestjs/common';
import { JournalService } from './journal.service';
import { JournalController } from './journal.controller';
import { JournalEntryNumberService } from './journal-entry-number.service';
import { AccountModule } from '../account/account.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { FiscalPeriodModule } from '../fiscal-period/fiscal-period.module';
import { FxModule } from '../fx/fx.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [PrismaModule, AccountModule, forwardRef(() => FiscalPeriodModule), forwardRef(() => FxModule)],
  controllers: [JournalController],
  providers: [JournalService, JournalEntryNumberService],
  exports: [JournalService],
})
export class JournalModule {}
