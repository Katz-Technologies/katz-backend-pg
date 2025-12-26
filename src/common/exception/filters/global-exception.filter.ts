import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { HttpArgumentsHost } from '@nestjs/common/interfaces';
import type { Request, Response } from 'express';

import { BackendException } from '../backend.exception';
import { EErrorCode } from '../enums/error-code.enum';
import type { HttpMethod } from '../types/http-method.type';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  catch(exception: BackendException | Error, host: ArgumentsHost): void {
    const ctx: HttpArgumentsHost = host.switchToHttp();
    const response: Response = ctx.getResponse<Response>();
    const request: Request = ctx.getRequest<Request>();

    const backendException: BackendException = this.convertException(exception);

    const res = {
      url: request.url,
      method: request.method as HttpMethod,
      timestamp: new Date(),
      code: backendException.code,
      messageDebug: backendException.messageDebug,
      data: backendException.data,
    };

    this.logger.error({
      req: {
        method: request.method,
        url: request.url,
        body: request.body,
        query: request.query,
        params: request.params,
        headers: request.headers,
      },
      res: res,
    });

    response.status(backendException.httpCode).json(res);
  }

  private convertException(
    exception: BackendException | Error | HttpException,
  ): BackendException {
    switch (true) {
      case exception instanceof BackendException:
        return <BackendException>exception;
      case exception instanceof UnauthorizedException:
        return new BackendException(EErrorCode.Unauthorized);
      case exception instanceof HttpException: {
        const httpException = exception as HttpException;
        const statusCode = httpException.getStatus();
        const response = httpException.getResponse();
        const message =
          typeof response === 'string'
            ? response
            : (response as { message?: string })?.message || 'Validation error';
        return new BackendException(EErrorCode.Validate, {
          httpCode: statusCode,
          messageDebug: message,
        });
      }
      default:
        return new BackendException(EErrorCode.Unknown, {
          messageDebug: exception.toString(),
          httpCode: HttpStatus.I_AM_A_TEAPOT,
        });
    }
  }
}
