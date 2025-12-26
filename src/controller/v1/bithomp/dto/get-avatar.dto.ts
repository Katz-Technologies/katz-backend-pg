import { IsString } from 'class-validator';

export class GetAvatarDto {
  @IsString()
  address!: string;
}
