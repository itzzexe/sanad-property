import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { QueryPropertyDto } from './dto/query-property.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PropertyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreatePropertyDto, ownerId: string) {
    const property = await this.prisma.property.create({
      data: { ...dto, ownerId },
      include: { units: true },
    });
    
    await this.auditService.log({
      userId: ownerId,
      action: 'CREATE',
      entity: 'PROPERTY',
      entityId: property.id,
      newValue: property,
    });
    
    return property;
  }

  async findAll(query: QueryPropertyDto, ownerId: string, role: string) {
    const page = parseInt(query.page as any) || 1;
    const limit = parseInt(query.limit as any) || 10;
    const { search, city, country, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (role !== 'ADMIN') where.ownerId = ownerId;
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (country) where.country = country;

    const [data, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          units: { where: { deletedAt: null } },
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findFirst({
      where: { id, deletedAt: null },
      include: {
        units: { where: { deletedAt: null } },
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async update(id: string, dto: UpdatePropertyDto, userId: string) {
    const old = await this.findOne(id);
    const updated = await this.prisma.property.update({
      where: { id },
      data: dto,
      include: { units: true },
    });
    
    await this.auditService.log({
      userId,
      action: 'UPDATE',
      entity: 'PROPERTY',
      entityId: id,
      oldValue: old,
      newValue: updated,
    });
    
    return updated;
  }

  async remove(id: string, userId: string) {
    await this.findOne(id);
    const property = await this.prisma.property.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    
    await this.auditService.log({
      userId,
      action: 'DELETE',
      entity: 'PROPERTY',
      entityId: id,
    });
    
    return property;
  }
}
