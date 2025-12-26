import { Injectable } from '@nestjs/common';
import { IGetAmmPools } from './interface/get-amm-pulls.interface';
import { IGetToken } from './interface/get-token.interface';
import { IAmmPool } from './interface/amm-pool.interface';
import { IAmmInfo } from './interface/amm-info.interface';
import { ITokenInfo } from './interface/token-info.interface';

@Injectable()
export class XrpScanService {
  getAmmPools(data?: IGetAmmPools): Promise<IAmmPool[]> {
    const queryParams = new URLSearchParams();

    if (data) {
      if (data.limit !== undefined) {
        queryParams.append('limit', String(data.limit));
      }
      if (data.offset !== undefined) {
        queryParams.append('offset', String(data.offset));
      }
    }

    const queryString = queryParams.toString();
    const url = `https://api.xrpscan.com/api/v1/amm/pools${
      queryString ? '?' + queryString : ''
    }`;

    return fetch(url).then((r) => r.json() as Promise<IAmmPool[]>);
  }

  getAmmPoolByAccount(account: string): Promise<IAmmInfo> {
    return fetch(`https://api.xrpscan.com/api/v1/amm/${account}`).then(
      (r) => r.json() as Promise<IAmmInfo>,
    );
  }

  getTokenByAssetAndIssuer(data: IGetToken): Promise<ITokenInfo> {
    return fetch(
      `https://api.xrpscan.com/api/v1/token/${data.asset}.${data.issuer}`,
    ).then((r) => r.json() as Promise<ITokenInfo>);
  }
}
