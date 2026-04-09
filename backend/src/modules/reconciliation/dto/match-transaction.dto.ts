import { IsString, IsNotEmpty } from 'class-validator';

export class MatchTransactionDto {
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @IsString()
  @IsNotEmpty()
  journalLineId: string;
}
