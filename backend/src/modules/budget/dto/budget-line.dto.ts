import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class BudgetLineDto {
  @IsString()
  accountId: string;

  @IsString()
  fiscalPeriodId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
