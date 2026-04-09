import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateBillDto {
  @IsString()
  vendorId: string;

  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsDateString()
  billDate: string;

  @IsDateString()
  dueDate: string;

  @IsNumber()
  subtotal: number;

  @IsOptional()
  @IsNumber()
  taxAmount?: number;

  @IsString()
  expenseAccountId: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
