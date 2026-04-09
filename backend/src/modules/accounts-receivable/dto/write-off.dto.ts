import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class WriteOffDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
