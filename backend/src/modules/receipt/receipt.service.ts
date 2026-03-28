import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ReceiptService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(paymentId: string): Promise<any> {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId },
      include: {
        lease: { include: { tenant: true, unit: { include: { property: true } } } },
        receipt: true,
      },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    if (payment.receipt) {
      return payment.receipt;
    }

    const receiptNumber = `RCT-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 4).toUpperCase()}`;

    // Generate QR code
    const qrData = JSON.stringify({
      receiptNumber,
      amount: payment.amount,
      currency: payment.currency,
      paymentDate: payment.paidDate,
      tenant: `${payment.lease.tenant.firstName} ${payment.lease.tenant.lastName}`,
    });
    const qrCode = await QRCode.toDataURL(qrData);

    const receipt = await this.prisma.receipt.create({
      data: {
        receiptNumber,
        paymentId,
        qrCode,
      },
      include: {
        payment: {
          include: {
            lease: { include: { tenant: true, unit: { include: { property: true } } } },
          },
        },
      },
    });

    return receipt;
  }

  async generatePdf(receiptId: string): Promise<{ buffer: Buffer; filename: string }> {
    const receipt = await this.prisma.receipt.findUnique({
      where: { id: receiptId },
      include: {
        payment: {
          include: {
            lease: { include: { tenant: true, unit: { include: { property: true } } } },
          },
        },
      },
    });
    if (!receipt) throw new NotFoundException('Receipt not found');

    const { payment } = receipt;
    const { lease } = payment;
    const { tenant, unit } = lease;

    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('RentFlow', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text('Payment Receipt', { align: 'center' });
      doc.moveDown();

      // Receipt info
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text(`Receipt #: ${receipt.receiptNumber}`);
      doc.text(`Date: ${new Date(receipt.issuedAt).toLocaleDateString()}`);
      doc.moveDown();

      // Divider
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Tenant info
      doc.font('Helvetica-Bold').text('Tenant:');
      doc.font('Helvetica').text(`${tenant.firstName} ${tenant.lastName}`);
      doc.text(`Email: ${tenant.email}`);
      doc.text(`Phone: ${tenant.phone}`);
      doc.moveDown();

      // Property info
      doc.font('Helvetica-Bold').text('Property:');
      doc.font('Helvetica').text(`${unit.property.name}`);
      doc.text(`Unit: ${unit.unitNumber}`);
      doc.text(`Address: ${unit.property.address}, ${unit.property.city}`);
      doc.moveDown();

      // Payment details
      doc.font('Helvetica-Bold').text('Payment Details:');
      doc.font('Helvetica');
      doc.text(`Amount: ${payment.currency} ${payment.amount.toFixed(2)}`);
      if (payment.lateFee > 0) {
        doc.text(`Late Fee: ${payment.currency} ${payment.lateFee.toFixed(2)}`);
      }
      doc.text(`Method: ${payment.method}`);
      doc.text(`Status: ${payment.status}`);
      doc.text(`Payment Date: ${new Date(payment.paidDate).toLocaleDateString()}`);
      if (payment.transactionRef) {
        doc.text(`Transaction Ref: ${payment.transactionRef}`);
      }
      doc.moveDown();

      // Divider
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Total
      const total = payment.amount + payment.lateFee;
      doc.fontSize(14).font('Helvetica-Bold').text(`Total: ${payment.currency} ${total.toFixed(2)}`, { align: 'right' });
      doc.moveDown(2);

      // Footer
      doc.fontSize(8).font('Helvetica').text('This is a computer-generated receipt. No signature required.', { align: 'center' });
      doc.text('Powered by RentFlow – Advanced Rent Management System', { align: 'center' });

      doc.end();
    });

    return {
      buffer,
      filename: `Receipt-${receipt.receiptNumber}.pdf`,
    };
  }

  async findAll(query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const { search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.receiptNumber = { contains: search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.receipt.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          payment: {
            include: {
              lease: { include: { tenant: true, unit: { include: { property: true } } } },
            },
          },
        },
      }),
      this.prisma.receipt.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const receipt = await this.prisma.receipt.findUnique({
      where: { id },
      include: {
        payment: {
          include: {
            lease: { include: { tenant: true, unit: { include: { property: true } } } },
          },
        },
      },
    });
    if (!receipt) throw new NotFoundException('Receipt not found');
    return receipt;
  }
}
