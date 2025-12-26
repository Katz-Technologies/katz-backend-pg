import { IsString } from 'class-validator';

export class GetTokenDto {
  @IsString()
  asset!: string;

  @IsString()
  issuer!: string;
}
