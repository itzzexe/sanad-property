import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { UpdateLeaseDto } from './dto/update-lease.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LeaseService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLeaseDto) {
    // Check unit availability
    const unit = await this.prisma.unit.findFirst({
      where: { id: dto.unitId, deletedAt: null },
    });
    if (!unit) throw new NotFoundException('Unit not found');
    if (unit.status === 'RENTED') {
      throw new BadRequestException('Unit is already rented');
    }

    // Check tenant exists
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: dto.tenantId, deletedAt: null },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const leaseNumber = `LSE-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 4).toUpperCase()}`;

    // Create lease and update unit status in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const lease = await tx.lease.create({
        data: {
          ...dto,
          leaseNumber,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          status: 'ACTIVE',
        },
        include: { tenant: true, unit: { include: { property: true } } },
      });

      // Update unit status
      await tx.unit.update({
        where: { id: dto.unitId },
        data: { status: 'RENTED' },
      });

      // Generate installments
      await this.generateInstallments(tx, lease);

      return lease;
    });

    return result;
  }

  private async generateInstallments(tx: any, lease: any) {
    const start = new Date(lease.startDate);
    const end = new Date(lease.endDate);
    const installments = [];

    let current = new Date(start);
    const freqMonths = this.getFrequencyMonths(lease.paymentFrequency);

    while (current < end) {
      installments.push({
        leaseId: lease.id,
        dueDate: new Date(current),
        amount: lease.rentAmount,
        currency: lease.currency,
        status: 'PENDING' as const,
      });
      current.setMonth(current.getMonth() + freqMonths);
    }

    if (installments.length > 0) {
      await tx.installment.createMany({ data: installments });
    }
  }

  private getFrequencyMonths(freq: string): number {
    switch (freq) {
      case 'MONTHLY': return 1;
      case 'QUARTERLY': return 3;
      case 'SEMI_ANNUAL': return 6;
      case 'ANNUAL': return 12;
      default: return 1;
    }
  }

  async findAll(query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const { status, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (status) where.status = status;
    if (search && search.trim()) {
      where.OR = [
        { leaseNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.lease.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          tenant: true,
          unit: { include: { property: true } },
          installments: true,
        },
      }),
      this.prisma.lease.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const lease = await this.prisma.lease.findFirst({
      where: { id, deletedAt: null },
      include: {
        tenant: true,
        unit: { include: { property: true } },
        payments: true,
        installments: { orderBy: { dueDate: 'asc' } },
      },
    });
    if (!lease) throw new NotFoundException('Lease not found');
    return lease;
  }

  async update(id: string, dto: UpdateLeaseDto) {
    await this.findOne(id);
    return this.prisma.lease.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: { tenant: true, unit: { include: { property: true } } },
    });
  }

  async terminate(id: string) {
    const lease = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      await tx.lease.update({
        where: { id },
        data: { status: 'TERMINATED', deletedAt: new Date() },
      });

      await tx.unit.update({
        where: { id: lease.unitId },
        data: { status: 'AVAILABLE' },
      });

      return { message: 'Lease terminated' };
    });
  }
}
