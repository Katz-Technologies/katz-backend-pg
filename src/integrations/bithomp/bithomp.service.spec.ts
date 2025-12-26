import { Test, TestingModule } from '@nestjs/testing';
import { BithompService } from './bithomp.service';
import { IGetAccountAvatar } from './interface/get-avatar.interface';
import { IGetIssuedTokenAvatar } from './interface/get-issued-token.interface';

// Мокируем глобальный fetch
global.fetch = jest.fn();

describe('BithompService', () => {
  let service: BithompService;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BithompService],
    }).compile();

    service = module.get<BithompService>(BithompService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAccountAvatar', () => {
    const mockAddress = 'rD9W7ULveavz8qBGM1R5jMgK2QKsEDPQVi';
    const mockImageBuffer = Buffer.from('fake-image-data');

    it('should return image buffer for valid address', async () => {
      const data: IGetAccountAvatar = {
        address: mockAddress,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('image/png'),
        },
        clone: jest.fn().mockReturnThis(),
        arrayBuffer: jest.fn().mockResolvedValue(mockImageBuffer.buffer),
      } as unknown as Response);

      const result = await service.getAccountAvatar(data);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
      expect(mockFetch).toHaveBeenCalledWith(
        `https://cdn.bithomp.com/avatar/${mockAddress}`,
      );
    });

    it('should throw error when response is not ok', async () => {
      const data: IGetAccountAvatar = {
        address: mockAddress,
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as unknown as Response);

      await expect(service.getAccountAvatar(data)).rejects.toThrow(
        'Failed to fetch account avatar: 404 Not Found',
      );
    });

    it('should throw error when API returns JSON error with application/json content-type', async () => {
      const data: IGetAccountAvatar = {
        address: mockAddress,
      };

      const errorJson = { result: 'failed', error: 'Account not found' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        clone: jest.fn().mockReturnThis(),
        json: jest.fn().mockResolvedValue(errorJson),
        arrayBuffer: jest
          .fn()
          .mockResolvedValue(Buffer.from(JSON.stringify(errorJson)).buffer),
      } as unknown as Response);

      await expect(service.getAccountAvatar(data)).rejects.toThrow(
        'Failed to fetch account avatar: Account not found',
      );
    });

    it('should throw error when API returns JSON error in small buffer', async () => {
      const data: IGetAccountAvatar = {
        address: mockAddress,
      };

      const errorJson = { result: 'failed', error: 'Invalid address' };
      const errorText = JSON.stringify(errorJson);
      const errorBuffer = Buffer.from(errorText);
      const arrayBuffer = new ArrayBuffer(errorBuffer.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < errorBuffer.length; i++) {
        view[i] = errorBuffer[i] ?? 0;
      }

      const mockResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('image/png'),
        },
        clone: jest.fn().mockReturnThis(),
        arrayBuffer: jest.fn().mockResolvedValue(arrayBuffer),
      };
      mockResponse.clone = jest.fn().mockReturnValue(mockResponse);

      mockFetch.mockResolvedValueOnce(mockResponse as unknown as Response);

      await expect(service.getAccountAvatar(data)).rejects.toThrow(
        'Failed to fetch account avatar: Invalid address',
      );
    });

    it('should return small image buffer when it is not JSON error', async () => {
      const data: IGetAccountAvatar = {
        address: mockAddress,
      };

      const smallImageText = 'small-image';
      const smallImageBuffer = Buffer.from(smallImageText);
      const arrayBuffer = new ArrayBuffer(smallImageBuffer.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < smallImageBuffer.length; i++) {
        view[i] = smallImageBuffer[i] ?? 0;
      }

      const mockResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('image/png'),
        },
        clone: jest.fn().mockReturnThis(),
        arrayBuffer: jest.fn().mockResolvedValue(arrayBuffer),
      };
      mockResponse.clone = jest.fn().mockReturnValue(mockResponse);

      mockFetch.mockResolvedValueOnce(mockResponse as unknown as Response);

      const result = await service.getAccountAvatar(data);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBe(smallImageBuffer.length);
    });

    it('should handle network errors', async () => {
      const data: IGetAccountAvatar = {
        address: mockAddress,
      };

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.getAccountAvatar(data)).rejects.toThrow(
        'Network error',
      );
    });

    it('should handle JSON parse errors gracefully for small buffers', async () => {
      const data: IGetAccountAvatar = {
        address: mockAddress,
      };

      const invalidJsonText = 'not-valid-json';
      const invalidJsonBuffer = Buffer.from(invalidJsonText);
      const arrayBuffer = new ArrayBuffer(invalidJsonBuffer.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < invalidJsonBuffer.length; i++) {
        view[i] = invalidJsonBuffer[i] ?? 0;
      }

      const mockResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('image/png'),
        },
        clone: jest.fn().mockReturnThis(),
        arrayBuffer: jest.fn().mockResolvedValue(arrayBuffer),
      };
      mockResponse.clone = jest.fn().mockReturnValue(mockResponse);

      mockFetch.mockResolvedValueOnce(mockResponse as unknown as Response);

      const result = await service.getAccountAvatar(data);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBe(invalidJsonBuffer.length);
    });
  });

  describe('getIssuedTokenAvatar', () => {
    const mockIssuer = 'rD9W7ULveavz8qBGM1R5jMgK2QKsEDPQVi';
    const mockCurrencyHex = '5553440000000000000000000000000000000000';
    const mockImageBuffer = Buffer.from('fake-token-image-data');

    it('should return image buffer for valid token', async () => {
      const data: IGetIssuedTokenAvatar = {
        issuer: mockIssuer,
        currencyHex: mockCurrencyHex,
      };

      const arrayBuffer = new ArrayBuffer(mockImageBuffer.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < mockImageBuffer.length; i++) {
        view[i] = mockImageBuffer[i] ?? 0;
      }

      const mockResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('image/png'),
        },
        clone: jest.fn().mockReturnThis(),
        arrayBuffer: jest.fn().mockResolvedValue(arrayBuffer),
      };
      mockResponse.clone = jest.fn().mockReturnValue(mockResponse);

      mockFetch.mockResolvedValueOnce(mockResponse as unknown as Response);

      const result = await service.getIssuedTokenAvatar(data);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
      expect(mockFetch).toHaveBeenCalledWith(
        `https://cdn.bithomp.com/issued-token/${mockIssuer}/${mockCurrencyHex}`,
      );
    });

    it('should throw error when response is not ok', async () => {
      const data: IGetIssuedTokenAvatar = {
        issuer: mockIssuer,
        currencyHex: mockCurrencyHex,
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as unknown as Response);

      await expect(service.getIssuedTokenAvatar(data)).rejects.toThrow(
        'Failed to fetch issued token avatar: 404 Not Found',
      );
    });

    it('should throw error when API returns JSON error with application/json content-type', async () => {
      const data: IGetIssuedTokenAvatar = {
        issuer: mockIssuer,
        currencyHex: mockCurrencyHex,
      };

      const errorJson = { result: 'failed', error: 'Token not found' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        clone: jest.fn().mockReturnThis(),
        json: jest.fn().mockResolvedValue(errorJson),
        arrayBuffer: jest
          .fn()
          .mockResolvedValue(Buffer.from(JSON.stringify(errorJson)).buffer),
      } as unknown as Response);

      await expect(service.getIssuedTokenAvatar(data)).rejects.toThrow(
        'Failed to fetch issued token avatar: Token not found',
      );
    });

    it('should throw error when API returns JSON error in small buffer', async () => {
      const data: IGetIssuedTokenAvatar = {
        issuer: mockIssuer,
        currencyHex: mockCurrencyHex,
      };

      const errorJson = { result: 'failed', error: 'Invalid token' };
      const errorText = JSON.stringify(errorJson);
      const errorBuffer = Buffer.from(errorText);
      const arrayBuffer = new ArrayBuffer(errorBuffer.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < errorBuffer.length; i++) {
        view[i] = errorBuffer[i] ?? 0;
      }

      const mockResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('image/png'),
        },
        clone: jest.fn().mockReturnThis(),
        arrayBuffer: jest.fn().mockResolvedValue(arrayBuffer),
      };
      mockResponse.clone = jest.fn().mockReturnValue(mockResponse);

      mockFetch.mockResolvedValueOnce(mockResponse as unknown as Response);

      await expect(service.getIssuedTokenAvatar(data)).rejects.toThrow(
        'Failed to fetch issued token avatar: Invalid token',
      );
    });

    it('should return small image buffer when it is not JSON error', async () => {
      const data: IGetIssuedTokenAvatar = {
        issuer: mockIssuer,
        currencyHex: mockCurrencyHex,
      };

      const smallImageText = 'small-token-image';
      const smallImageBuffer = Buffer.from(smallImageText);
      const arrayBuffer = new ArrayBuffer(smallImageBuffer.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < smallImageBuffer.length; i++) {
        view[i] = smallImageBuffer[i] ?? 0;
      }

      const mockResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('image/png'),
        },
        clone: jest.fn().mockReturnThis(),
        arrayBuffer: jest.fn().mockResolvedValue(arrayBuffer),
      };
      mockResponse.clone = jest.fn().mockReturnValue(mockResponse);

      mockFetch.mockResolvedValueOnce(mockResponse as unknown as Response);

      const result = await service.getIssuedTokenAvatar(data);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBe(smallImageBuffer.length);
    });

    it('should handle network errors', async () => {
      const data: IGetIssuedTokenAvatar = {
        issuer: mockIssuer,
        currencyHex: mockCurrencyHex,
      };

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.getIssuedTokenAvatar(data)).rejects.toThrow(
        'Network error',
      );
    });

    it('should handle JSON parse errors gracefully for small buffers', async () => {
      const data: IGetIssuedTokenAvatar = {
        issuer: mockIssuer,
        currencyHex: mockCurrencyHex,
      };

      const invalidJsonText = 'not-valid-json';
      const invalidJsonBuffer = Buffer.from(invalidJsonText);
      const arrayBuffer = new ArrayBuffer(invalidJsonBuffer.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < invalidJsonBuffer.length; i++) {
        view[i] = invalidJsonBuffer[i] ?? 0;
      }

      const mockResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('image/png'),
        },
        clone: jest.fn().mockReturnThis(),
        arrayBuffer: jest.fn().mockResolvedValue(arrayBuffer),
      };
      mockResponse.clone = jest.fn().mockReturnValue(mockResponse);

      mockFetch.mockResolvedValueOnce(mockResponse as unknown as Response);

      const result = await service.getIssuedTokenAvatar(data);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBe(invalidJsonBuffer.length);
    });

    it('should handle different currency hex formats', async () => {
      const data: IGetIssuedTokenAvatar = {
        issuer: mockIssuer,
        currencyHex: 'USD',
      };

      const arrayBuffer = new ArrayBuffer(mockImageBuffer.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < mockImageBuffer.length; i++) {
        view[i] = mockImageBuffer[i] ?? 0;
      }

      const mockResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('image/png'),
        },
        clone: jest.fn().mockReturnThis(),
        arrayBuffer: jest.fn().mockResolvedValue(arrayBuffer),
      };
      mockResponse.clone = jest.fn().mockReturnValue(mockResponse);

      mockFetch.mockResolvedValueOnce(mockResponse as unknown as Response);

      await service.getIssuedTokenAvatar(data);

      expect(mockFetch).toHaveBeenCalledWith(
        `https://cdn.bithomp.com/issued-token/${mockIssuer}/USD`,
      );
    });
  });
});
