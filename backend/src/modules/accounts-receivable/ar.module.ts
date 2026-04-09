import { Module } from '@nestjs/common';
import { ArService } from './ar.service';
import { ArController } from './ar.controller';
import { JournalModule } from '../journal/journal.module';
import { AccountModule } from '../account/account.module';

@Module({
  imports: [JournalModule, AccountModule],
  controllers: [ArController],
  providers: [ArService],
  exports: [ArService],
})
export class ArModule {}
