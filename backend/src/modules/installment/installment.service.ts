import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InstallmentService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const { leaseId, status, sortBy = 'dueDate', sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (leaseId) where.leaseId = leaseId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.installment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          lease: { include: { tenant: true, unit: { include: { property: true } } } },
          payments: true,
        },
      }),
      this.prisma.installment.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const installment = await this.prisma.installment.findUnique({
      where: { id },
      include: {
        lease: { include: { tenant: true, unit: { include: { property: true } } } },
        payments: true,
      },
    });
    if (!installment) throw new NotFoundException('Installment not found');
    return installment;
  }

  async getOverdue() {
    const now = new Date();
    return this.prisma.installment.findMany({
      where: {
        dueDate: { lt: now },
        status: { in: ['PENDING', 'PARTIALLY_PAID'] },
      },
      include: {
        lease: { include: { tenant: true, unit: { include: { property: true } } } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async updateOverdueStatuses() {
    const now = new Date();
    const result = await this.prisma.installment.updateMany({
      where: {
        dueDate: { lt: now },
        status: 'PENDING',
      },
      data: { status: 'OVERDUE' },
    });
    return { updated: result.count };
  }

  async getUpcoming(days: number = 7) {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);

    return this.prisma.installment.findMany({
      where: {
        dueDate: { gte: now, lte: future },
        status: 'PENDING',
      },
      include: {
        lease: { include: { tenant: true, unit: { include: { property: true } } } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }
}
