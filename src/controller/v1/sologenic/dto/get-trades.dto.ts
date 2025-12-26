import { IsString, IsOptional, IsNumber } from 'class-validator';

export class GetTradesDto {
  @IsString()
  @IsOptional()
  assetCurrency?: string;

  @IsString()
  @IsOptional()
  assetIssuer?: string;

  @IsString()
  @IsOptional()
  asset2Currency?: string;

  @IsString()
  @IsOptional()
  asset2Issuer?: string;

  @IsString()
  @IsOptional()
  account?: string;

  @IsNumber()
  @IsOptional()
  limit?: number;

  @IsNumber()
  @IsOptional()
  beforeId?: number;

  @IsNumber()
  @IsOptional()
  afterId?: number;
}
