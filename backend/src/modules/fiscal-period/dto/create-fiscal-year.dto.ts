import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateFiscalYearDto {
  @ApiProperty({ example: 'FY-2025' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '2025-01-01T00:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: '2025-12-31T23:59:59Z' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;
}
