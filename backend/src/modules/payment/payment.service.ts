import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService, private readonly eventEmitter: EventEmitter2) {}

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

    let markedPaidInst: any = null;

    const result = await this.prisma.$transaction(async (tx) => {
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
          const newStatus = newPaidAmount >= inst.amount ? 'PAID' : 'PARTIALLY_PAID';
          await tx.installment.update({
            where: { id: dto.installmentId },
            data: {
              paidAmount: newPaidAmount,
              lateFee,
              status: newStatus,
            },
          });
          if (newStatus === 'PAID' && inst.status !== 'PAID') {
            markedPaidInst = { ...inst, status: 'PAID' }; // trigger emit later
          }
        }
      }

      return payment;
    });

    this.eventEmitter.emit('payment.created', {
      paymentId: result.id,
      amount: result.amount,
      currency: result.currency ?? 'USD',
      exchangeRate: 1,
      method: result.method,
    });
    
    if ((dto as any).type === 'SECURITY_DEPOSIT' || (result.notes && result.notes.includes('SECURITY_DEPOSIT'))) {
      this.eventEmitter.emit('payment.security_deposit', {
        paymentId: result.id,
        amount: result.amount,
        currency: result.currency ?? 'USD',
        tenantId: result.lease.tenantId,
      });
    }

    if (lateFee > 0 && dto.installmentId) {
      this.eventEmitter.emit('installment.late_fee_applied', {
        installmentId: dto.installmentId,
        lateFeeAmount: lateFee,
        currency: lease.currency ?? 'USD',
      });
    }

    if (markedPaidInst) {
      this.eventEmitter.emit('installment.paid', {
        installmentId: markedPaidInst.id,
        amount: markedPaidInst.amount,
        currency: markedPaidInst.currency ?? 'USD',
        dueDate: markedPaidInst.dueDate,
      });
    }

    return result;
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
