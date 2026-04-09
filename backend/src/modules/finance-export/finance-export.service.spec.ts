import { Test, TestingModule } from '@nestjs/testing';
import { FinanceExportService } from './finance-export.service';
import { ReportsService } from '../reports/reports.service';
import { PdfRendererService } from './pdf-renderer.service';
import { ExcelRendererService } from './excel-renderer.service';
import { UploadService } from '../upload/upload.service';
import { BadRequestException } from '@nestjs/common';

describe('FinanceExportService', () => {
  let service: FinanceExportService;
  let reportsService: ReportsService;
  let uploadService: UploadService;

  const mockReportsService = {
    incomeStatement: jest.fn(),
    balanceSheet: jest.fn(),
    trialBalance: jest.fn(),
    arAging: jest.fn(),
    propertyProfitability: jest.fn(),
    cashFlowStatement: jest.fn(),
    budgetVsActual: jest.fn(),
  };

  const mockPdfRenderer = { renderReport: jest.fn() };
  const mockExcelRenderer = { renderReport: jest.fn() };
  const mockUploadService = {
    upload: jest.fn(),
    getSignedUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceExportService,
        { provide: ReportsService, useValue: mockReportsService },
        { provide: PdfRendererService, useValue: mockPdfRenderer },
        { provide: ExcelRendererService, useValue: mockExcelRenderer },
        { provide: UploadService, useValue: mockUploadService },
      ],
    }).compile();

    service = module.get<FinanceExportService>(FinanceExportService);
    reportsService = module.get<ReportsService>(ReportsService);
    uploadService = module.get<UploadService>(UploadService);
    jest.clearAllMocks();
  });

  describe('exportReport', () => {
    it('calls correct report service method (income-statement)', async () => {
      mockReportsService.incomeStatement.mockResolvedValue({ sections: [] });
      mockPdfRenderer.renderReport.mockResolvedValue(Buffer.from('pdf'));
      mockUploadService.upload.mockResolvedValue('/path/to/file');
      mockUploadService.getSignedUrl.mockResolvedValue('http://signed-url');

      const result = await service.exportReport({
        reportType: 'income-statement',
        format: 'pdf',
        reportParams: {},
        requestedBy: 'user1',
      });

      expect(mockReportsService.incomeStatement).toHaveBeenCalled();
      expect(result.url).toBe('http://signed-url');
    });

    it('uploads to MinIO with correct folder pattern', async () => {
      mockReportsService.balanceSheet.mockResolvedValue({ assets: {} });
      mockExcelRenderer.renderReport.mockResolvedValue(Buffer.from('excel'));
      mockUploadService.upload.mockResolvedValue('/path/to/excel');
      mockUploadService.getSignedUrl.mockResolvedValue('http://signed-excel');

      await service.exportReport({
        reportType: 'balance-sheet',
        format: 'excel',
        reportParams: {},
        requestedBy: 'user1',
      });

      expect(mockUploadService.upload).toHaveBeenCalledWith(
        expect.any(Object),
        expect.stringContaining('exports/balance-sheet/user1')
      );
    });

    it('throws BadRequestException for unknown reportType', async () => {
      await expect(service.exportReport({
        reportType: 'invalid-type',
        format: 'pdf',
        reportParams: {},
        requestedBy: 'user1',
      })).rejects.toThrow(BadRequestException);
    });
  });
});
