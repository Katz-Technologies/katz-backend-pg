import { Injectable } from '@nestjs/common';
import { IGetTokens } from './interface/get-tokens.interface';
import { IGetToken } from './interface/get-token.interface';
import {
  IGetTokensResponse,
  IToken,
} from './interface/get-tokens-response.interface';

@Injectable()
export class XrplMetaService {
  async getTokens(data?: IGetTokens): Promise<IGetTokensResponse> {
    const queryParams = new URLSearchParams();

    if (data) {
      for (const key in data) {
        const value = data[key as keyof IGetTokens];
        if (value !== undefined && value !== null) {
          if (key === 'trust_level' && Array.isArray(value)) {
            value.forEach((item) => {
              queryParams.append(key, String(item));
            });
          } else if (Array.isArray(value)) {
            value.forEach((item) => {
              queryParams.append(key, String(item));
            });
          } else {
            queryParams.append(key, String(value));
          }
        }
      }
    }

    const queryString = queryParams.toString();

    const response = await fetch(
      `https://s1.xrplmeta.org/tokens${queryString ? '?' + queryString : ''}`,
    );
    return response.json() as Promise<IGetTokensResponse>;
  }

  getTokenByAssetAndIssuer(data: IGetToken): Promise<IToken> {
    const queryParams = new URLSearchParams();
    const { asset, issuer, include_sources, include_changes } = data;

    if (include_sources !== undefined) {
      queryParams.append('include_sources', String(include_sources));
    }
    if (include_changes !== undefined) {
      queryParams.append('include_changes', String(include_changes));
    }

    const queryString = queryParams.toString();
    const url = `https://s1.xrplmeta.org/token/${asset}:${issuer}${
      queryString ? '?' + queryString : ''
    }`;

    return fetch(url).then((r) => r.json() as Promise<IToken>);
  }
}
