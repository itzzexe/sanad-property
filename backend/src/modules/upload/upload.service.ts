import { Injectable } from '@nestjs/common';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private minioClient: Minio.Client;
  private bucket: string;

  constructor() {
    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: false,
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
    });
    this.bucket = process.env.MINIO_BUCKET || 'rentflow';
    this.ensureBucket();
  }

  private async ensureBucket() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucket);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucket);
      }
    } catch (error) {
      console.warn('MinIO not available, file uploads will fail:', error.message);
    }
  }

  async upload(file: Express.Multer.File, folder: string = 'general'): Promise<string> {
    const ext = file.originalname.split('.').pop();
    const fileName = `${folder}/${uuidv4()}.${ext}`;

    await this.minioClient.putObject(this.bucket, fileName, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });

    return `/${this.bucket}/${fileName}`;
  }

  async delete(filePath: string): Promise<void> {
    const objectName = filePath.replace(`/${this.bucket}/`, '');
    await this.minioClient.removeObject(this.bucket, objectName);
  }

  async getSignedUrl(filePath: string, expiry: number = 3600): Promise<string> {
    const objectName = filePath.replace(`/${this.bucket}/`, '');
    return this.minioClient.presignedGetObject(this.bucket, objectName, expiry);
  }
}
