import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUnitDto) {
    return this.prisma.unit.create({
      data: dto,
      include: { property: true },
    });
  }

  async findAll(query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const { propertyId, status, type, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (propertyId) where.propertyId = propertyId;
    if (status) where.status = status;
    if (type) where.type = type;
    if (search && search.trim()) {
      where.OR = [
        { unitNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.unit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { property: { select: { id: true, name: true, address: true } } },
      }),
      this.prisma.unit.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const unit = await this.prisma.unit.findFirst({
      where: { id, deletedAt: null },
      include: {
        property: true,
        leases: {
          where: { deletedAt: null },
          include: { tenant: true },
        },
      },
    });
    if (!unit) throw new NotFoundException('Unit not found');
    return unit;
  }

  async update(id: string, dto: UpdateUnitDto) {
    await this.findOne(id);
    return this.prisma.unit.update({
      where: { id },
      data: dto,
      include: { property: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.unit.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
