import { GlobalExceptionFilter } from './global-exception.filter';
import { BackendException } from '../backend.exception';
import { EErrorCode } from '../enums/error-code.enum';
import {
  HttpException,
  UnauthorizedException,
  HttpStatus,
} from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';
import type { Request, Response } from 'express';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockArgumentsHost: jest.Mocked<ArgumentsHost>;
  let mockResponse: jest.Mocked<Pick<Response, 'status' | 'json'>>;
  let mockRequest: Partial<Request>;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      url: '/api/test',
      method: 'GET',
      body: {},
      query: {},
      params: {},
      headers: {},
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as jest.Mocked<ArgumentsHost>;
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should handle BackendException', () => {
    const exception = new BackendException(EErrorCode.Validate, {
      httpCode: HttpStatus.BAD_REQUEST,
      messageDebug: 'Test error',
    });

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: EErrorCode.Validate,
        messageDebug: 'Test error',
        url: '/api/test',
        method: 'GET',
      }),
    );
  });

  it('should handle HttpException', () => {
    const exception = new HttpException('Test message', 400);

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalled();
    expect(mockResponse.json).toHaveBeenCalled();
  });

  it('should handle UnauthorizedException', () => {
    const exception = new UnauthorizedException();

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: EErrorCode.Unauthorized,
      }),
    );
  });

  it('should handle generic Error', () => {
    const exception = new Error('Generic error');

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalled();
    expect(mockResponse.json).toHaveBeenCalled();
  });

  it('should include timestamp in response', () => {
    const exception = new BackendException(EErrorCode.Unknown);

    filter.catch(exception, mockArgumentsHost);

    const callArgs = mockResponse.json.mock.calls[0]?.[0];
    expect(callArgs).toBeDefined();
    if (callArgs && typeof callArgs === 'object' && 'timestamp' in callArgs) {
      expect(callArgs.timestamp).toBeDefined();
      expect(new Date(callArgs.timestamp as string).getTime()).not.toBeNaN();
    }
  });
});
