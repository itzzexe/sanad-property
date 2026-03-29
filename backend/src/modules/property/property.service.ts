import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
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
          _count: {
            select: { units: { where: { deletedAt: null } }, shareholders: true }
          }
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
        shareholders: true,
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

  async importExcel(buffer: Buffer, ownerId: string) {
    if (!buffer) throw new BadRequestException('لم يتم رفع أي ملف');
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) throw new BadRequestException('ملف الإكسل فارغ');

    const errors: string[] = [];
    let successCount = 0;

    // A: Name(1), B: Address(2), C: City(3), D: State(4), E: Country(5), F: ZipCode(6), G: Description(7), H: MapUrl(8)
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      if (!row.hasValues) continue;

      const values = row.values as any[];
      const name = values[1]?.toString()?.trim();
      const address = values[2]?.toString()?.trim();
      const city = values[3]?.toString()?.trim();
      const state = values[4]?.toString()?.trim();
      const country = values[5]?.toString()?.trim() || 'العراق';
      const zipCode = values[6]?.toString()?.trim();
      const description = values[7]?.toString()?.trim();
      const mapUrl = values[8]?.toString()?.trim();

      if (!name || !address || !city) {
         errors.push(`السطر ${rowNumber}: بيانات ناقصة (الاسم، العنوان، أو المدينة)`);
         continue;
      }

      try {
        await this.create({
          name, address, city, state, country, zipCode, description, mapUrl
        }, ownerId);
        successCount++;
      } catch (error: any) {
        errors.push(`السطر ${rowNumber}: ${error.message || 'خطأ غير معروف'}`);
      }
    }

    return {
      success: true,
      successCount,
      errorsCount: errors.length,
      errors
    };
  }
}
