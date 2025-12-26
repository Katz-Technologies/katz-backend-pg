import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsNumber,
  ArrayMinSize,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ETokensSort } from 'src/integrations/xrpl-meta/enum/tokens-sort.enum';

export class GetTokensDto {
  @IsString()
  @IsOptional()
  name_like?: string;

  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  expand_meta?: boolean;

  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  include_changes?: boolean;

  @IsEnum(ETokensSort)
  @IsOptional()
  sort_by?: ETokensSort;

  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => Number(v));
    }
    if (typeof value === 'string') {
      return [Number(value)];
    }
    return value;
  })
  @IsArray()
  @ArrayMinSize(2, {
    message: 'trust_level must contain at least 2 numbers',
  })
  @IsNumber({}, { each: true })
  @IsOptional()
  trust_level?: number[];

  @IsNumber()
  @IsOptional()
  limit?: number;

  @IsNumber()
  @IsOptional()
  offset?: number;
}
