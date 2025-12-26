import { HttpStatus } from '@nestjs/common';

import { EErrorCode } from '../enums/error-code.enum';
import type { IError } from '../interfaces/error.interface';

export const errorsDeclaration: {
  [key in EErrorCode]: IError;
} = {
  [EErrorCode.Unknown]: {
    httpCode: HttpStatus.INTERNAL_SERVER_ERROR,
    messageDebug: 'Unknown error',
  },
  [EErrorCode.Unauthorized]: {
    httpCode: HttpStatus.UNAUTHORIZED,
    messageDebug: 'Authorization error',
  },
  [EErrorCode.Validate]: {
    httpCode: HttpStatus.BAD_REQUEST,
    messageDebug: 'Validation error',
  },
  [EErrorCode.NotFound]: {
    httpCode: HttpStatus.NOT_FOUND,
    messageDebug: 'Not found error',
  },
  [EErrorCode.Database]: {
    httpCode: HttpStatus.INTERNAL_SERVER_ERROR,
    messageDebug: 'Database error',
  },
  [EErrorCode.AlreadyAuthorized]: {
    httpCode: HttpStatus.BAD_REQUEST,
    messageDebug: 'User already authenticated',
  },
  [EErrorCode.TooManyRequest]: {
    httpCode: HttpStatus.TOO_MANY_REQUESTS,
    messageDebug: 'Too many request',
  },
};
