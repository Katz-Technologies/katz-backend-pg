import type { ValidationError } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';

import { BackendException } from './backend.exception';
import { EErrorCode } from './enums/error-code.enum';

export class ValidateException extends BackendException {
  constructor(private readonly validationErrors: ValidationError[]) {
    super(EErrorCode.Validate, {
      httpCode: HttpStatus.BAD_REQUEST,
      messageDebug: 'Validation error',
      data: ValidateException.getError(validationErrors),
    });
  }

  static getError(validationErrors: ValidationError[]) {
    return validationErrors.reduce(
      (constraints, err) =>
        Object.assign(
          constraints,
          err.constraints || ValidateException.getError(err.children!),
        ),
      {},
    );
  }
}
