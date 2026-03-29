import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class AttachmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  async create(entityType: string, entityId: string, file: Express.Multer.File) {
    const url = await this.uploadService.upload(file, `attachments/${entityType.toLowerCase()}`);
    
    return this.prisma.attachment.create({
      data: {
        url,
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
        entityType: entityType.toUpperCase(),
        entityId: entityId,
      },
    });
  }

  async findAllByEntity(entityType: string, entityId: string) {
    const attachments = await this.prisma.attachment.findMany({
      where: {
        entityType: entityType.toUpperCase(),
        entityId: entityId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Provide signed URLs for temporal access
    return Promise.all(
      attachments.map(async (a) => ({
        ...a,
        url: await this.uploadService.getSignedUrl(a.url),
      }))
    );
  }

  async remove(id: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      throw new NotFoundException(`Attachment with ID ${id} not found`);
    }

    // Try to delete from storage
    try {
      await this.uploadService.delete(attachment.url);
    } catch (error) {
      console.warn(`Failed to delete file from storage: ${attachment.url}`, error.message);
    }

    return this.prisma.attachment.delete({
      where: { id },
    });
  }
}
