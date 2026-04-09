import { Module } from '@nestjs/common';
import { ApService } from './ap.service';
import { ApController } from './ap.controller';
import { VendorController } from './vendor.controller';
import { JournalModule } from '../journal/journal.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { TaxModule } from '../tax/tax.module';

@Module({
  imports: [PrismaModule, JournalModule, TaxModule],
  controllers: [ApController, VendorController],
  providers: [ApService],
  exports: [ApService],
})
export class ApModule {}
