import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export enum OHLCPeriod {
  '1m' = '1m',
  '3m' = '3m',
  '5m' = '5m',
  '15m' = '15m',
  '30m' = '30m',
  '1h' = '1h',
  '3h' = '3h',
  '6h' = '6h',
  '12h' = '12h',
  '1d' = '1d',
  '3d' = '3d',
  '1w' = '1w',
}

export class GetOhlcDto {
  @IsString()
  assetCurrency: string;

  @IsString()
  @IsOptional()
  assetIssuer?: string;

  @IsString()
  asset2Currency: string;

  @IsString()
  @IsOptional()
  asset2Issuer?: string;

  @IsEnum(OHLCPeriod)
  period: OHLCPeriod;

  @IsNumber()
  from: number;

  @IsNumber()
  to: number;
}
