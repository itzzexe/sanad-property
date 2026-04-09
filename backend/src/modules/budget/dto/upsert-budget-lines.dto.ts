import { ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { BudgetLineDto } from './budget-line.dto';

export class UpsertBudgetLinesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetLineDto)
  lines: BudgetLineDto[];
}
