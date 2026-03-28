import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, type: NotificationType, title: string, message: string, metadata?: any) {
    return this.prisma.notification.create({
      data: { userId, type, title, message, metadata },
    });
  }

  async findAll(userId: string, query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (query.isRead !== undefined) {
      where.isRead = query.isRead === 'true' || query.isRead === true;
    }

    const [data, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      data,
      unreadCount,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { message: 'All notifications marked as read' };
  }

  // Mock email notification
  async sendEmailNotification(to: string, subject: string, body: string) {
    console.log(`📧 [MOCK EMAIL] To: ${to} | Subject: ${subject} | Body: ${body}`);
    return { sent: true, to, subject };
  }

  // Mock SMS notification
  async sendSmsNotification(to: string, message: string) {
    console.log(`📱 [MOCK SMS] To: ${to} | Message: ${message}`);
    return { sent: true, to, message };
  }
}
