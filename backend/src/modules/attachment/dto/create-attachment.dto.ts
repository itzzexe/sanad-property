import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateAttachmentDto {
  @ApiProperty({ example: 'CONTRACT_PDF', description: 'The type of entity this attachment belongs to' })
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiProperty({ example: 'uuid-of-entity', description: 'The ID of the entity this attachment belongs to' })
  @IsString()
  @IsNotEmpty()
  entityId: string;

  @ApiProperty({ type: 'string', format: 'binary', description: 'The file to upload' })
  file: any;
}
