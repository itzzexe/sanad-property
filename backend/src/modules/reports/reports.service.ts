import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';
import { Response } from 'express';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateFinancialExcel(filters: any, res: Response) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('التقرير المالي');

    // Headers
    worksheet.columns = [
      { header: 'التاريخ', key: 'date', width: 15 },
      { header: 'النوع', key: 'type', width: 18 },
      { header: 'العقار', key: 'property', width: 25 },
      { header: 'الوصف', key: 'description', width: 35 },
      { header: 'المبلغ', key: 'amount', width: 15 },
      { header: 'العملة', key: 'currency', width: 10 },
      { header: 'الحالة', key: 'status', width: 15 },
    ];

    const dateQuery: any = {};
    if (filters.startDate) dateQuery.gte = new Date(filters.startDate);
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      dateQuery.lte = end;
    }

    // Fetch Payments (Income)
    const payments = await this.prisma.payment.findMany({
      where: {
        paidDate: dateQuery,
        lease: filters.property && filters.property !== 'all' ? {
          unit: { propertyId: filters.property }
        } : undefined,
      },
      include: { 
        lease: { 
          include: { 
            tenant: true,
            unit: { include: { property: true } }
          } 
        } 
      },
    });

    // Fetch Expenses
    const expenses = await this.prisma.expense.findMany({
      where: {
        date: dateQuery,
        propertyId: filters.property && filters.property !== 'all' ? filters.property : undefined,
      },
      include: { property: true },
    });

    let totalIncome = 0;
    let totalExpense = 0;

    // Add rows
    payments.forEach(p => {
      worksheet.addRow({
        date: p.paidDate.toLocaleDateString('ar-IQ'),
        type: 'إيراد (إيجار)',
        property: p.lease.unit.property.name,
        description: `دفعة من ${p.lease.tenant.firstName} - وحدة ${p.lease.unit.unitNumber}`,
        amount: p.amount,
        currency: p.currency,
        status: p.status === 'COMPLETED' ? 'مكتمل' : p.status,
      });
      totalIncome += p.amount;
    });

    expenses.forEach(e => {
      worksheet.addRow({
        date: e.date.toLocaleDateString('ar-IQ'),
        type: 'مصروف تشغيلي',
        property: e.property?.name || 'عام',
        description: e.description || e.title,
        amount: -e.amount,
        currency: e.currency,
        status: 'مدفوع',
      });
      totalExpense += e.amount;
    });

    // Summary Row
    worksheet.addRow({});
    const summaryRow = worksheet.addRow({
      description: 'صافي الربح للفترة',
      amount: totalIncome - totalExpense,
      currency: 'IQD',
    });
    summaryRow.font = { bold: true, size: 12 };

    // Styling
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' }, // Indigo-600
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=financial-report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  }

  async generateOccupancyExcel(res: Response) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('تقرير الإشغال');

    worksheet.columns = [
      { header: 'اسم العقار', key: 'propertyName', width: 25 },
      { header: 'رقم الوحدة', key: 'unitNumber', width: 15 },
      { header: 'الحالة', key: 'status', width: 15 },
      { header: 'المستأجر الحالي', key: 'tenantName', width: 25 },
    ];

    const properties = await this.prisma.property.findMany({
      include: {
        units: {
          include: {
            leases: {
              where: { status: 'ACTIVE' },
              include: { tenant: true }
            }
          }
        }
      }
    });

    properties.forEach(p => {
      p.units.forEach(u => {
        const activeLease = u.leases[0];
        worksheet.addRow({
          propertyName: p.name,
          unitNumber: u.unitNumber,
          status: activeLease ? 'مشغولة' : 'شاغرة',
          tenantName: activeLease ? `${activeLease.tenant.firstName} ${activeLease.tenant.lastName}` : '-',
        });
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=occupancy-report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  }

  async generateExpensesExcel(filters: any, res: Response) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('تقرير المصروفات');

    worksheet.columns = [
      { header: 'التاريخ', key: 'date', width: 15 },
      { header: 'الفئة', key: 'category', width: 20 },
      { header: 'العقار', key: 'property', width: 25 },
      { header: 'الوصف', key: 'description', width: 35 },
      { header: 'المبلغ', key: 'amount', width: 15 },
      { header: 'العملة', key: 'currency', width: 10 },
    ];

    const expenses = await this.prisma.expense.findMany({
      where: {
        propertyId: filters.property && filters.property !== 'all' ? filters.property : undefined,
      },
      include: { property: true },
      orderBy: { date: 'desc' }
    });

    expenses.forEach(e => {
      worksheet.addRow({
        date: e.date.toLocaleDateString('ar-IQ'),
        category: e.category,
        property: e.property?.name || 'عام',
        description: e.description || e.title,
        amount: e.amount,
        currency: e.currency,
      });
    });

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE11D48' } }; // Rose-600

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses-report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  }

  async generateTenantsExcel(res: Response) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('بيانات المستأجرين');

    worksheet.columns = [
      { header: 'اسم المستأجر', key: 'name', width: 25 },
      { header: 'رقم الهاتف', key: 'phone', width: 20 },
      { header: 'البريد الإلكتروني', key: 'email', width: 25 },
      { header: 'العقار', key: 'property', width: 25 },
      { header: 'الوحدة', key: 'unit', width: 15 },
      { header: 'انتهاء العقد', key: 'endDate', width: 20 },
    ];

    const leases = await this.prisma.lease.findMany({
      where: { status: 'ACTIVE' },
      include: {
        tenant: true,
        unit: { include: { property: true } }
      }
    });

    leases.forEach(l => {
      worksheet.addRow({
        name: `${l.tenant.firstName} ${l.tenant.lastName}`,
        phone: l.tenant.phone,
        email: l.tenant.email,
        property: l.unit.property.name,
        unit: l.unit.unitNumber,
        endDate: l.endDate.toLocaleDateString('ar-IQ'),
      });
    });

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } }; // Emerald-600

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=tenants-report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  }

  async generateFinancialPdf(filters: any, res: Response) {
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=financial-report.pdf');
    doc.pipe(res);

    doc.fontSize(24).text('RentFlow - Financial Report', { align: 'center' });
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    const payments = await this.prisma.payment.findMany({
       where: { status: 'COMPLETED' },
       take: 10,
       orderBy: { paidDate: 'desc' }
    });
    const expenses = await this.prisma.expense.findMany({ take: 10, orderBy: { date: 'desc' } });

    const totalIncome = (await this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED' } }))._sum.amount || 0;
    const totalExpenses = (await this.prisma.expense.aggregate({ _sum: { amount: true } }))._sum.amount || 0;

    doc.rect(50, doc.y, 500, 80).fill('#F3F4F6');
    doc.fillColor('#1F2937').fontSize(14).text('Executive Summary', 70, doc.y + 10);
    doc.fontSize(11).text(`Total Revenue: ${totalIncome.toLocaleString()} IQD`, 70, doc.y + 20);
    doc.text(`Total Expenditures: ${totalExpenses.toLocaleString()} IQD`, 70, doc.y + 10);
    doc.fillColor('#059669').fontSize(14).text(`Net Operating Profit: ${(totalIncome - totalExpenses).toLocaleString()} IQD`, 70, doc.y + 10);
    doc.fillColor('black');

    doc.moveDown(4);
    doc.fontSize(14).text('Recent Transactions History', { underline: true });
    doc.moveDown();

    payments.forEach(p => {
       doc.fontSize(10).text(`${p.paidDate.toLocaleDateString()} - Income: ${p.amount.toLocaleString()} IQD (${p.paymentNumber})`);
    });
    doc.moveDown();
    expenses.forEach(e => {
       doc.fontSize(10).text(`${e.date.toLocaleDateString()} - Expense: ${e.amount.toLocaleString()} IQD - ${e.title}`);
    });

    doc.end();
  }

  async getProperties() {
    return this.prisma.property.findMany({
      select: { id: true, name: true }
    });
  }
}
