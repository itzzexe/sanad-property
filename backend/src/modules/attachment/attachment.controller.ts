import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete, 
  UseInterceptors, 
  UploadedFile, 
  UseGuards,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Query
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AttachmentService } from './attachment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('attachments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attachments')
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload an attachment linked to an entity' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        entityType: { type: 'string', default: 'PROPERTY' },
        entityId: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /image\/*|application\/pdf/ }),
        ],
      }),
    ) file: Express.Multer.File,
    @Body('entityType') entityType: string,
    @Body('entityId') entityId: string,
  ) {
    return this.attachmentService.create(entityType, entityId, file);
  }

  @Get(':entityType/:entityId')
  @ApiOperation({ summary: 'Get all attachments for an entity' })
  async findAll(@Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.attachmentService.findAllByEntity(entityType, entityId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an attachment' })
  async remove(@Param('id') id: string) {
    return this.attachmentService.remove(id);
  }
}
