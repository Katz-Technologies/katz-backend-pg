import {
  IsArray,
  ValidateNested,
  IsString,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TokenDto {
  @IsString()
  currency!: string;

  @IsString()
  issuer!: string;
}

export class GetTopTokenDto {
  @IsArray()
  @ArrayMinSize(1, {
    message: 'At least one token is required',
  })
  @ValidateNested({ each: true })
  @Type(() => TokenDto)
  tokens!: TokenDto[];
}
