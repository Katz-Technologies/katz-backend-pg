import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { EErrorCode } from '../enums/error-code.enum';
import type { HttpMethod } from '../types/http-method.type';

export class ResExceptionDto {
  @ApiProperty({ example: '2024-03-18T12:00:00.000Z' })
  timestamp!: Date;

  @ApiProperty({ example: 'http://example.com/api' })
  @IsString()
  @IsNotEmpty()
  url!: string;

  @ApiProperty({ example: 'GET' })
  method!: HttpMethod;

  @ApiProperty({ example: EErrorCode.Validate })
  code!: EErrorCode;

  @ApiProperty({ example: 'Invalid input provided' })
  messageUI!: string;

  @ApiProperty({ example: 'Detailed error message for debugging' })
  messageDebug!: string;

  @ApiProperty({ example: { key: 'value' } })
  data!: unknown;
}
