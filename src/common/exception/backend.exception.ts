import { HttpStatus, Injectable } from '@nestjs/common';
import { EErrorCode } from './enums/error-code.enum';
import type { IError } from './interfaces/error.interface';
import { errorsDeclaration } from './declarations/errors-declaration';

@Injectable()
export class BackendException extends Error {
  public readonly code: EErrorCode;
  public readonly httpCode: HttpStatus;
  public readonly messageDebug: string;
  public readonly data: any;

  constructor(code: EErrorCode, data?: IError) {
    const error: IError = errorsDeclaration[code];
    super(error.messageDebug || 'Unknown error');
    Object.setPrototypeOf(this, BackendException.prototype);
    this.code = code;
    this.httpCode = data?.httpCode ?? error.httpCode;
    this.messageDebug = data?.messageDebug ?? error.messageDebug;
    this.data = data?.data ?? error.data ?? {};
  }
}
