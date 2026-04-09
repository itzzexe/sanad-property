import { Module } from '@nestjs/common';
import { FinanceExportService } from './finance-export.service';
import { FinanceExportController } from './finance-export.controller';
import { PdfRendererService } from './pdf-renderer.service';
import { ExcelRendererService } from './excel-renderer.service';
import { ReportsModule } from '../reports/reports.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [ReportsModule, UploadModule],
  controllers: [FinanceExportController],
  providers: [FinanceExportService, PdfRendererService, ExcelRendererService],
  exports: [FinanceExportService],
})
export class FinanceExportModule {}
