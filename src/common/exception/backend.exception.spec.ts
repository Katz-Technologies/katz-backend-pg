import { BackendException } from './backend.exception';
import { EErrorCode } from './enums/error-code.enum';
import { HttpStatus } from '@nestjs/common';

describe('BackendException', () => {
  it('should create exception with default error data', () => {
    const exception = new BackendException(EErrorCode.Unknown);

    expect(exception).toBeInstanceOf(Error);
    expect(exception).toBeInstanceOf(BackendException);
    expect(exception.code).toBe(EErrorCode.Unknown);
    expect(exception.httpCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(exception.messageDebug).toBe('Unknown error');
    expect(exception.data).toEqual({});
  });

  it('should create exception with custom data', () => {
    const customData = { userId: 123, action: 'test' };
    const exception = new BackendException(EErrorCode.Validate, {
      httpCode: HttpStatus.BAD_REQUEST,
      messageDebug: 'Custom validation error',
      data: customData,
    });

    expect(exception.code).toBe(EErrorCode.Validate);
    expect(exception.httpCode).toBe(HttpStatus.BAD_REQUEST);
    expect(exception.messageDebug).toBe('Custom validation error');
    expect(exception.data).toEqual(customData);
  });

  it('should override httpCode from custom data', () => {
    const exception = new BackendException(EErrorCode.NotFound, {
      httpCode: HttpStatus.GONE,
      messageDebug: 'Resource moved',
    });

    expect(exception.httpCode).toBe(HttpStatus.GONE);
  });

  it('should handle all error codes', () => {
    const errorCodes = Object.values(EErrorCode);

    errorCodes.forEach((code) => {
      const exception = new BackendException(code);
      expect(exception.code).toBe(code);
      expect(exception.httpCode).toBeGreaterThan(0);
    });
  });
});
