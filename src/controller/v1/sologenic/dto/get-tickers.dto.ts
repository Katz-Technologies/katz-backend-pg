import { IsArray, ValidateNested, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class SymbolDto {
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
}

export class GetTickersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SymbolDto)
  symbols: SymbolDto[];
}
