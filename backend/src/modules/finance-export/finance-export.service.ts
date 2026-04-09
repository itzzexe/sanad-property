import { Injectable, BadRequestException } from '@nestjs/common';
import { ReportsService } from '../reports/reports.service';
import { UploadService } from '../upload/upload.service';
import { PdfRendererService, ReportMeta } from './pdf-renderer.service';
import { ExcelRendererService } from './excel-renderer.service';
import { ReportParams } from '../reports/types/report-params';

@Injectable()
export class FinanceExportService {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly pdfRenderer: PdfRendererService,
    private readonly excelRenderer: ExcelRendererService,
    private readonly uploadService: UploadService,
  ) {}

  async exportReport(params: {
    reportType: string;
    format: 'pdf' | 'excel';
    reportParams: ReportParams;
    requestedBy: string;
  }) {
    let data;
    let title;

    switch (params.reportType) {
      case 'income-statement':
        data = await this.reportsService.incomeStatement(params.reportParams);
        title = 'Income Statement';
        break;
      case 'balance-sheet':
        data = await this.reportsService.balanceSheet(params.reportParams);
        title = 'Balance Sheet';
        break;
      case 'trial-balance':
        data = await this.reportsService.trialBalance(params.reportParams);
        title = 'Trial Balance';
        break;
      case 'ar-aging':
        data = await this.reportsService.arAging(params.reportParams);
        title = 'AR Aging Report';
        break;
      case 'property-profitability':
        data = await this.reportsService.propertyProfitability(params.reportParams);
        title = 'Property Profitability Analysis';
        break;
      case 'cash-flow':
        data = await this.reportsService.cashFlowStatement(params.reportParams);
        title = 'Cash Flow Statement';
        break;
      case 'budget-vs-actual':
        data = await this.reportsService.budgetVsActual(params.reportParams);
        title = 'Budget vs Actual Report';
        break;
      default:
        throw new BadRequestException('Unknown report type: ' + params.reportType);
    }

    const meta: ReportMeta = {
      title,
      generatedAt: new Date(),
      companyName: 'RentFlow',
      dateRange: this.getDateRangeLabel(params.reportParams),
    };

    let buffer: Buffer;
    const ext = params.format === 'pdf' ? 'pdf' : 'xlsx';
    if (params.format === 'pdf') {
       buffer = await this.pdfRenderer.renderReport(params.reportType, data, meta);
    } else {
       buffer = await this.excelRenderer.renderReport(params.reportType, data, meta);
    }

    const filename = `${params.reportType}-${Date.now()}.${ext}`;
    const folder = `exports/${params.reportType}/${params.requestedBy}`;
    
    // Mocking an Express.Multer.File object for uploadService
    const mockFile: any = {
      originalname: filename,
      buffer: buffer,
      size: buffer.length,
      mimetype: params.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    const path = await this.uploadService.upload(mockFile, folder);
    const url = await this.uploadService.getSignedUrl(path, 86400); // 24h

    return {
      url,
      expiresAt: new Date(Date.now() + 86400 * 1000),
      filename,
    };
  }

  private getDateRangeLabel(p: ReportParams): string {
    if (p.startDate && p.endDate) {
      return `${p.startDate.toLocaleDateString()} - ${p.endDate.toLocaleDateString()}`;
    }
    if (p.fiscalPeriodId) return `Period: ${p.fiscalPeriodId}`;
    if (p.fiscalYearId) return `Fiscal Year: ${p.fiscalYearId}`;
    return 'For all dates';
  }
}
