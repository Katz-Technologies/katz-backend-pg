import { IsArray, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { ECurrency } from 'src/service/coingecko/enum/currency.enum';

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
  @IsArray()
  @IsEnum(ECurrency, { each: true })
  vs_currencies: ECurrency[];
}
