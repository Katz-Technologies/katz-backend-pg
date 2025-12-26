import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { EErrorCode } from '../enums/error-code.enum';

export class WsExceptionDto {
  @ApiProperty({ example: '2024-03-18T12:00:00.000Z' })
  timestamp: Date;

  @ApiProperty({ example: 'example_event_name' })
  @IsString()
  @IsNotEmpty()
  event: string;

  @ApiProperty({ example: EErrorCode.Validate })
  code: EErrorCode;

  @ApiProperty({ example: 'Invalid input provided' })
  message: string;

  @ApiProperty({ example: 'Invalid input provided' })
  messageUI: string;

  @ApiProperty({ example: 'Detailed error message for debugging' })
  messageDebug: string;

  @ApiProperty({ example: { key: 'value' } })
  data: any;
}
