import { IsNumber, IsOptional } from 'class-validator';

export class GetAmmPoolsDto {
  @IsNumber()
  @IsOptional()
  limit?: number;

  @IsNumber()
  @IsOptional()
  offset?: number;
}
