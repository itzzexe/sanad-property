import { IsString } from 'class-validator';

export class ImportRatesDto {
  @IsString()
  csvData: string;
}
