import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { ReportMeta } from './pdf-renderer.service';

@Injectable()
export class ExcelRendererService {
  async renderReport(reportType: string, data: any, meta: ReportMeta): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(meta.title.slice(0, 31));

    // Rows 1-4 Header
    sheet.mergeCells('A1:D1');
    sheet.getCell('A1').value = meta.companyName;
    sheet.getCell('A1').font = { size: 16, bold: true };

    sheet.mergeCells('A2:D2');
    sheet.getCell('A2').value = meta.title;
    sheet.getCell('A2').font = { size: 14 };

    sheet.mergeCells('A3:D3');
    sheet.getCell('A3').value = meta.dateRange;
    sheet.getCell('A3').font = { size: 11, color: { argb: '808080' } };

    sheet.mergeCells('A4:D4');
    sheet.getCell('A4').value = `Generated at: ${meta.generatedAt.toLocaleString()}`;
    sheet.getCell('A4').font = { size: 10, color: { argb: 'aaaaaa' } };

    // Row 5: blank
    let startRow = 6;

    if (reportType === 'income-statement') {
      this.renderIncomeStatement(sheet, data, startRow);
    } else if (reportType === 'balance-sheet') {
      this.renderBalanceSheet(sheet, data, startRow);
    } else if (reportType === 'trial-balance') {
      this.renderTrialBalance(sheet, data, startRow);
    } else if (reportType === 'ar-aging') {
      this.renderArAging(sheet, data, startRow);
    } else if (reportType === 'property-profitability') {
      this.renderPropertyProfitability(sheet, data, startRow);
    } else {
      sheet.addRow(['Export not fully implemented for ' + reportType]);
    }

    // Common column styling (Number format #,##0.00)
    sheet.columns.forEach((col: any) => {
      col.width = 15;
    });

    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  }

  private renderIncomeStatement(sheet: ExcelJS.Worksheet, data: any, startRow: number) {
    sheet.getRow(startRow).values = ['Account', 'Amount', 'Prior'];
    sheet.getRow(startRow).font = { bold: true };
    let rIdx = startRow + 1;
    data.sections.forEach((s: any) => {
      sheet.addRow([s.sectionName]).font = { bold: true };
      rIdx++;
      s.accounts.forEach((a: any) => {
        const row = sheet.addRow([a.accountName, a.amount, 0]);
        row.getCell(2).numFmt = '#,##0.00';
        row.getCell(3).numFmt = '#,##0.00';
        rIdx++;
      });
      const sumRow = sheet.addRow(['Total ' + s.sectionName, s.total]);
      sumRow.font = { bold: true };
      sumRow.getCell(2).numFmt = '#,##0.00';
      rIdx++;
    });
    const final = sheet.addRow(['Net Income', data.netIncome]);
    final.font = { bold: true };
    final.getCell(2).numFmt = '#,##0.00';
  }

  private renderBalanceSheet(sheet: ExcelJS.Worksheet, data: any, startRow: number) {
    sheet.getRow(startRow).values = ['Account', 'Balance'];
    sheet.getRow(startRow).font = { bold: true };
    // Simplified Balance Sheet logic
    data.assets.sections.forEach((s: any) => {
        s.accounts.forEach((a: any) => {
            const row = sheet.addRow([a.accountName, a.balance]);
            row.getCell(2).numFmt = '#,##0.00';
        });
    });
    sheet.addRow(['Total Assets', data.assets.totalAssets]).font = { bold: true };
  }

  private renderTrialBalance(sheet: ExcelJS.Worksheet, data: any, startRow: number) {
    sheet.getRow(startRow).values = ['Code', 'Account', 'Debits', 'Credits'];
    sheet.getRow(startRow).font = { bold: true };
    data.rows.forEach((r: any) => {
      const row = sheet.addRow([r.accountCode, r.accountName, r.debit, r.credit]);
      row.getCell(3).numFmt = '#,##0.00';
      row.getCell(4).numFmt = '#,##0.00';
    });
    const totals = sheet.addRow(['', 'TOTALS', data.totalDebit, data.totalCredit]);
    totals.font = { bold: true };
    totals.getCell(3).numFmt = '#,##0.00';
    totals.getCell(4).numFmt = '#,##0.00';
  }

  private renderArAging(sheet: ExcelJS.Worksheet, data: any, startRow: number) {
    sheet.getRow(startRow).values = ['Tenant', 'Property', 'Unit', 'Current', '31-60', '61-90', '90+', 'Total'];
    sheet.getRow(startRow).font = { bold: true };
    data.rows.forEach((r: any) => {
      const row = sheet.addRow([r.tenantName, r.propertyName, r.unitNumber, r.current, r.bucket30, r.bucket60, r.bucket90 + r.bucket90plus, r.total]);
      for (let i = 4; i <= 8; i++) row.getCell(i).numFmt = '#,##0.00';
    });
  }

  private renderPropertyProfitability(sheet: ExcelJS.Worksheet, data: any, startRow: number) {
    sheet.getRow(startRow).values = ['Property', 'Revenue', 'Expenses', 'Net Profit', 'Occupancy %'];
    sheet.getRow(startRow).font = { bold: true };
    data.forEach((r: any) => {
        const row = sheet.addRow([r.propertyName, r.revenue, r.expenses, r.netProfit, r.occupancyRate]);
        row.getCell(2).numFmt = '#,##0.00';
        row.getCell(3).numFmt = '#,##0.00';
        row.getCell(4).numFmt = '#,##0.00';
        row.getCell(5).numFmt = '0.0%';
    });
  }
}
