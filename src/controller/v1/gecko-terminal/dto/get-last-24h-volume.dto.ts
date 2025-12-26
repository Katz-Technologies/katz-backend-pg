import { IsString } from 'class-validator';

export class GetLast24hVolumeDto {
  @IsString()
  currency!: string;

  @IsString()
  issuer!: string;
}
