import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditService,
  ) {}

  async create(dto: CreateTenantDto, userId?: string) {
    const existing = await this.prisma.tenant.findUnique({
      where: { email: dto.email }
    });
    
    if (existing) {
      throw new ConflictException('البريد الإلكتروني مسجل مسبقاً لمستأجر آخر');
    }

    const tenant = await this.prisma.tenant.create({ data: dto });
    
    if (userId) {
      await this.auditLog.log({
        userId,
        action: 'CREATE',
        entity: 'TENANT',
        entityId: tenant.id,
        newValue: tenant,
      });
    }
    
    return tenant;
  }

  async findAll(query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const { search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (search && search.trim()) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          leases: {
            where: { deletedAt: null },
            include: { unit: { include: { property: true } } },
          },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id, deletedAt: null },
      include: {
        leases: {
          where: { deletedAt: null },
          include: {
            unit: { include: { property: true } },
            payments: true,
            installments: true,
          },
        },
      },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto, userId?: string) {
    const old = await this.findOne(id);
    const updated = await this.prisma.tenant.update({ where: { id }, data: dto });
    
    if (userId) {
      await this.auditLog.log({
        userId,
        action: 'UPDATE',
        entity: 'TENANT',
        entityId: id,
        oldValue: old,
        newValue: updated,
      });
    }
    
    return updated;
  }

  async remove(id: string, userId?: string) {
    await this.findOne(id);
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    
    if (userId) {
      await this.auditLog.log({
        userId,
        action: 'DELETE',
        entity: 'TENANT',
        entityId: id,
      });
    }
    
    return tenant;
  }

  async importExcel(buffer: Buffer, userId: string) {
    if (!buffer) throw new BadRequestException('لم يتم رفع أي ملف');
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) throw new BadRequestException('ملف الإكسل فارغ');

    const errors: string[] = [];
    let successCount = 0;

    // A: FirstName(1), B: LastName(2), C: Email(3), D: Phone(4), 
    // E: IdType(5), F: IdNumber(6), G: Nationality(7), H: Address(8)
    
    // Convert to sequential processing to avoid parallel conflict issues
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      if (!row.hasValues) continue;

      const values = row.values as any[];
      const firstName = values[1]?.toString()?.trim();
      const lastName = values[2]?.toString()?.trim();
      const email = values[3]?.toString()?.trim();
      const phone = values[4]?.toString()?.trim();
      const idType = values[5]?.toString()?.trim();
      const idNumber = values[6]?.toString()?.trim();
      const nationality = values[7]?.toString()?.trim();
      const address = values[8]?.toString()?.trim();

      if (!firstName || !lastName || !email || !phone) {
         errors.push(`السطر ${rowNumber}: بيانات ناقصة (الاسم، العائلة، البريد، أو الهاتف)`);
         continue;
      }

      try {
        await this.create({
          firstName,
          lastName,
          email,
          phone,
          idType,
          idNumber,
          nationality,
          address
        }, userId);
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
