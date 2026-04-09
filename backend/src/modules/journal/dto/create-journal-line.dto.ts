import { IsString, IsNumber, IsOptional, Min, Length } from 'class-validator';

export class CreateJournalLineDto {
  @IsString()
  accountId: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  debit?: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  credit?: number = 0;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @Length(3, 3)
  @IsOptional()
  currencyCode?: string = 'USD';

  @IsNumber()
  @Min(0)
  @IsOptional()
  exchangeRate?: number = 1;
}
