import { IsString, IsNumber, IsBoolean } from 'class-validator';

export class ApplyTaxDto {
  @IsString()
  journalEntryId: string;

  @IsString()
  taxRateId: string;

  @IsNumber()
  taxableAmount: number;

  @IsBoolean()
  isInput: boolean;
}
