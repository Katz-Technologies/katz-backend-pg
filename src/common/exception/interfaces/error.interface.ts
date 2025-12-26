import { HttpStatus } from '@nestjs/common';

export interface IError {
  httpCode: HttpStatus;
  messageDebug: string;
  data?: any;
}
