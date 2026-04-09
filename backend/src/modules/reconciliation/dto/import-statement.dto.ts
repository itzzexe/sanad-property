import { IsString, IsNotEmpty, IsDateString, IsNumber } from 'class-validator';

export class ImportStatementDto {
  @IsString()
  @IsNotEmpty()
  bankAccountId: string;

  @IsString()
  @IsNotEmpty()
  csvString: string;

  @IsDateString()
  statementDate: string;

  @IsNumber()
  openingBalance: number;

  @IsNumber()
  closingBalance: number;
}
