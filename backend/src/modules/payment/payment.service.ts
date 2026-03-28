import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePaymentDto) {
    const lease = await this.prisma.lease.findFirst({
      where: { id: dto.leaseId, deletedAt: null },
      include: { installments: { where: { status: { in: ['PENDING', 'OVERDUE', 'PARTIALLY_PAID'] } }, orderBy: { dueDate: 'asc' } } },
    });
    if (!lease) throw new NotFoundException('Lease not found');

    const paymentNumber = `PAY-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 4).toUpperCase()}`;

    // Calculate late fee
    let lateFee = 0;
    if (dto.installmentId) {
      const installment = lease.installments.find(i => i.id === dto.installmentId);
      if (installment) {
        const now = new Date();
        const dueDate = new Date(installment.dueDate);
        const gracePeriod = lease.lateFeeGraceDays * 24 * 60 * 60 * 1000;
        if (now.getTime() > dueDate.getTime() + gracePeriod) {
          lateFee = installment.amount * (lease.lateFeePercent / 100);
        }
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          leaseId: dto.leaseId,
          amount: dto.amount,
          currency: dto.currency || lease.currency,
          method: dto.method,
          status: dto.amount >= (dto.expectedAmount || dto.amount) ? 'COMPLETED' : 'PARTIAL',
          paidDate: dto.paidDate ? new Date(dto.paidDate) : new Date(),
          notes: dto.notes,
          lateFee,
          transactionRef: dto.transactionRef,
          installmentId: dto.installmentId,
        },
        include: {
          lease: { include: { tenant: true, unit: { include: { property: true } } } },
        },
      });

      // Update installment if linked
      if (dto.installmentId) {
        const inst = await tx.installment.findUnique({ where: { id: dto.installmentId } });
        if (inst) {
          const newPaidAmount = inst.paidAmount + dto.amount;
          await tx.installment.update({
            where: { id: dto.installmentId },
            data: {
              paidAmount: newPaidAmount,
              lateFee,
              status: newPaidAmount >= inst.amount ? 'PAID' : 'PARTIALLY_PAID',
            },
          });
        }
      }

      return payment;
    });
  }

  async findAll(query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const { leaseId, status, method, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (leaseId) where.leaseId = leaseId;
    if (status) where.status = status;
    if (method) where.method = method;
    if (search && search.trim()) {
      where.OR = [
        { paymentNumber: { contains: search, mode: 'insensitive' } },
        { transactionRef: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          lease: { include: { tenant: true, unit: { include: { property: true } } } },
          receipt: true,
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, deletedAt: null },
      include: {
        lease: { include: { tenant: true, unit: { include: { property: true } } } },
        receipt: true,
        installment: true,
      },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }
}
