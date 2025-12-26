import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class AnalyzeAccountDto {
  @IsString()
  address: string;

  @IsNumber()
  @IsPositive()
  limit: number;

  @IsNumber()
  @IsOptional()
  offset?: number;
}
