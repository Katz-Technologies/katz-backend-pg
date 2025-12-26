import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetNftVolumesExtendedDto {
  @IsString()
  list: 'collections';

  @IsString()
  @IsOptional()
  convertCurrencies?: string;

  @IsString()
  @IsOptional()
  sortCurrency?: string;

  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  floorPrice?: boolean;

  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  statistics?: boolean;

  @IsString()
  @IsOptional()
  period?: string;

  @IsString()
  @IsOptional()
  saleType?: string;
}
