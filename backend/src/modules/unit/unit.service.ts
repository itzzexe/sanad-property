import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
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

  async importExcel(buffer: Buffer) {
    if (!buffer) throw new BadRequestException('لم يتم رفع أي ملف');
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) throw new BadRequestException('ملف الإكسل فارغ');

    const errors: string[] = [];
    let successCount = 0;

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      if (!row.hasValues) continue;

      const values = row.values as any[];
      const propertyId = values[1]?.toString()?.trim();
      const unitNumber = values[2]?.toString()?.trim();
      const typeStr = values[3]?.toString()?.trim() || 'APARTMENT';
      const statusStr = values[4]?.toString()?.trim() || 'AVAILABLE';
      const monthlyRentStr = values[5]?.toString()?.trim();
      const currencyStr = values[6]?.toString()?.trim() || 'IQD';
      const floorStr = values[7]?.toString()?.trim();
      const areaStr = values[8]?.toString()?.trim();
      const bedroomsStr = values[9]?.toString()?.trim();
      const bathroomsStr = values[10]?.toString()?.trim();

      if (!propertyId || !unitNumber || !monthlyRentStr) {
         errors.push(`السطر ${rowNumber}: بيانات ناقصة (معرف العقار، رقم الوحدة، أو الإيجار)`);
         continue;
      }

      try {
        await this.create({
          propertyId,
          unitNumber,
          type: typeStr as any,
          status: statusStr as any,
          monthlyRent: parseFloat(monthlyRentStr),
          currency: currencyStr as any,
          floor: floorStr ? parseInt(floorStr) : undefined,
          area: areaStr ? parseFloat(areaStr) : undefined,
          bedrooms: bedroomsStr ? parseInt(bedroomsStr) : undefined,
          bathrooms: bathroomsStr ? parseInt(bathroomsStr) : undefined,
        });
        successCount++;
      } catch (error: any) {
        errors.push(`السطر ${rowNumber}: ${error.message || 'خطأ غير معروف'}`);
      }
    }

    return { success: true, successCount, errorsCount: errors.length, errors };
  }
}
