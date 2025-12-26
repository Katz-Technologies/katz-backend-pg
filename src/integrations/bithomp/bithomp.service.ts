import { Injectable } from '@nestjs/common';
import { IGetAccountAvatar } from './interface/get-avatar.interface';
import { IGetIssuedTokenAvatar } from './interface/get-issued-token.interface';

@Injectable()
export class BithompService {
  async getAccountAvatar(data: IGetAccountAvatar): Promise<Buffer> {
    const response = await fetch(
      `https://cdn.bithomp.com/avatar/${data.address}`,
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch account avatar: ${response.status} ${response.statusText}`,
      );
    }

    const contentType = response.headers.get('content-type') || '';

    const clonedResponse = response.clone();

    if (contentType.includes('application/json')) {
      const jsonData = await response.json();
      if (jsonData.result === 'failed') {
        throw new Error(
          `Failed to fetch account avatar: ${jsonData.error || 'unknown error'}`,
        );
      }
    }

    const arrayBuffer = await clonedResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length < 100) {
      try {
        const text = buffer.toString('utf-8');
        const jsonData = JSON.parse(text);
        if (jsonData.result === 'failed') {
          throw new Error(
            `Failed to fetch account avatar: ${jsonData.error || 'unknown error'}`,
          );
        }
      } catch (parseError) {
        if (
          parseError instanceof Error &&
          parseError.message.includes('Failed to fetch')
        ) {
          throw parseError;
        }
        // Not JSON or not error - it's a normal small image
      }
    }

    return buffer;
  }

  async getIssuedTokenAvatar(data: IGetIssuedTokenAvatar): Promise<Buffer> {
    const response = await fetch(
      `https://cdn.bithomp.com/issued-token/${data.issuer}/${data.currencyHex}`,
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch issued token avatar: ${response.status} ${response.statusText}`,
      );
    }

    const contentType = response.headers.get('content-type') || '';

    const clonedResponse = response.clone();

    if (contentType.includes('application/json')) {
      const jsonData = await response.json();
      if (jsonData.result === 'failed') {
        throw new Error(
          `Failed to fetch issued token avatar: ${jsonData.error || 'unknown error'}`,
        );
      }
    }

    const arrayBuffer = await clonedResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length < 100) {
      try {
        const text = buffer.toString('utf-8');
        const jsonData = JSON.parse(text);
        if (jsonData.result === 'failed') {
          throw new Error(
            `Failed to fetch issued token avatar: ${jsonData.error || 'unknown error'}`,
          );
        }
      } catch (parseError) {
        if (
          parseError instanceof Error &&
          parseError.message.includes('Failed to fetch')
        ) {
          throw parseError;
        }
        // Not JSON or not error - it's a normal small image
      }
    }

    return buffer;
  }
}
