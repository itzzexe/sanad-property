import { Module } from '@nestjs/common';
import { PostingService } from './posting.service';
import { JournalModule } from '../journal/journal.module';
import { AccountModule } from '../account/account.module';
import { ScheduleModule } from '@nestjs/schedule';
import { FxModule } from '../fx/fx.module';

@Module({
  imports: [
    JournalModule,
    AccountModule,
    FxModule,
    ScheduleModule.forRoot(),
  ],
  providers: [PostingService],
})
export class PostingModule {}
