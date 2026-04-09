import { Module, forwardRef } from '@nestjs/common';
import { FxService } from './fx.service';
import { FxController } from './fx.controller';
import { JournalModule } from '../journal/journal.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, forwardRef(() => JournalModule)],
  controllers: [FxController],
  providers: [FxService],
  exports: [FxService],
})
export class FxModule {}
