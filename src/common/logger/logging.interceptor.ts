import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const requestDetails = this.getRequestDetails(context);
    const requestLog = { req: this.truncateRequestData(requestDetails) };

    return next.handle().pipe(
      tap((data) => {
        this.logger.log({
          ...requestLog,
          res: this.truncateResponseData(data),
        });
      }),
      catchError((error) => {
        this.logger.error({ ...requestLog, err: error });
        return throwError(() => error);
      }),
    );
  }

  private truncateString(str: string, maxLength: number = 300): string {
    if (str.length <= maxLength) {
      return str;
    }
    return str.substring(0, maxLength) + '... [truncated]';
  }

  private truncateRequestData(
    requestData: Record<string, unknown>,
  ): Record<string, unknown> {
    const truncated = { ...requestData };
    const maxLength = 500;

    if (truncated.body) {
      const bodyStr = JSON.stringify(truncated.body);
      if (bodyStr.length > maxLength) {
        truncated.body = this.truncateString(bodyStr);
      }
    }

    return truncated;
  }

  private truncateResponseData(data: unknown): unknown {
    const maxLength = 500;

    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'string') {
      return this.truncateString(data, maxLength);
    }

    if (typeof data === 'object') {
      const stringified = JSON.stringify(data);
      if (stringified.length <= maxLength) {
        return data;
      }
      return this.truncateString(stringified, maxLength);
    }

    return data;
  }

  private getRequestDetails(
    context: ExecutionContext,
  ): Record<string, unknown> {
    if (context.getType() === 'ws') {
      const wsContext = context.switchToWs();
      return {
        eventName: wsContext.getPattern(),
        eventData: wsContext.getData(),
      };
    } else {
      const httpContext = context.switchToHttp();
      const request = httpContext.getRequest<Request>();
      return {
        method: request.method,
        url: request.url,
        body: request.body || {},
        headers: request.headers,
        params: request.params,
        query: request.query,
      };
    }
  }
}
