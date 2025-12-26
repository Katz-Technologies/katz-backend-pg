import {
  IsArray,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ECurrency } from 'src/integrations/coingecko/enum/currency.enum';

export class GetPriceDto {
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string') {
      return value.split(',');
    }
    return value;
  })
  @IsString({ each: true })
  ids!: string | string[];

  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string') {
      return value.split(',');
    }
    return value;
  })
  @IsArray()
  @IsEnum(ECurrency, { each: true })
  vs_currencies!: ECurrency[];

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  include_market_cap?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  include_24hr_vol?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  include_24hr_change?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  include_last_updated_at?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'full') return 'full';
    const num = Number(value);
    if (!isNaN(num) && num >= 0 && num <= 18) return num;
    return value;
  })
  precision?: 'full' | number;
}
