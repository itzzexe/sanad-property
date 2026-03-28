import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        createdAt: true,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateUserDto, adminId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        ...dto,
        password: hashedPassword,
      },
    });

    await this.auditService.log({
      userId: adminId,
      action: 'CREATE',
      entity: 'USER',
      entityId: user.id,
      newValue: { email: user.email, role: user.role, name: `${user.firstName} ${user.lastName}` },
    });

    const { password, ...result } = user;
    return result;
  }

  async updateStatus(id: string, isActive: boolean, adminId: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive },
    });

    await this.auditService.log({
      userId: adminId,
      action: 'UPDATE_STATUS',
      entity: 'USER',
      entityId: id,
      newValue: { isActive },
    });

    return user;
  }

  async remove(id: string, adminId: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await this.auditService.log({
      userId: adminId,
      action: 'DELETE',
      entity: 'USER',
      entityId: id,
    });

    return user;
  }
}
