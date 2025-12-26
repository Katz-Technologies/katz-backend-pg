import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class ReqTokenHistoryDto {
  @IsString()
  asset: string;

  @IsNumber()
  @IsPositive()
  limit: number;

  @IsNumber()
  @IsOptional()
  offset?: number;
}
