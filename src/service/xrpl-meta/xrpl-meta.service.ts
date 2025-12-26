import { Injectable } from '@nestjs/common';
import { IGetTokens } from './interface/get-tokens.interface';
import { IGetToken } from './interface/get-token.interface';
import { IGetTokensResponse } from './interface/get-tokens-response.interface';

@Injectable()
export class XrplMetaService {
  async getTokens(data?: IGetTokens): Promise<IGetTokensResponse> {
    const queryParams = new URLSearchParams();

    if (data) {
      for (const key in data) {
        const value = data[key];
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

  getTokenByAssetAndIssuer(data: IGetToken) {
    return fetch(
      `https://s1.xrplmeta.org/token/${data.asset}:${data.issuer}`,
    ).then((r) => r.json());
  }
}
