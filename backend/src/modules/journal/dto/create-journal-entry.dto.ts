import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, ValidateNested, ArrayMinSize, IsDate, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { JournalSourceType } from '@prisma/client';
import { CreateJournalLineDto } from './create-journal-line.dto';

export class CreateJournalEntryDto {
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  description: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsEnum(JournalSourceType)
  @IsOptional()
  sourceType?: JournalSourceType = JournalSourceType.MANUAL;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(2)
  @Type(() => CreateJournalLineDto)
  lines: CreateJournalLineDto[];
}
