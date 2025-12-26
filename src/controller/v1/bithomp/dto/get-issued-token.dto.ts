import { IsString } from 'class-validator';

export class GetIssuedTokenDto {
  @IsString()
  issuer: string;

  @IsString()
  currencyHex: string;
}
