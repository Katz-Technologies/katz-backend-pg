import { Injectable } from '@nestjs/common';
import { IGetAmmPools } from './interface/get-amm-pulls.interface';
import { IGetToken } from './interface/get-token.interface';
@Injectable()
export class XrpScanService {
  getAmmPools(data?: IGetAmmPools) {
    let queryString = '?';

    if (data) {
      for (const key in data) {
        queryString += key + '=' + data[key] + '&';
      }
    }

    return fetch('https://api.xrpscan.com/api/v1/amm/pools' + queryString).then(
      (r) => r.json(),
    );
  }

  getAmmPoolByAccount(account: string) {
    return fetch(`https://api.xrpscan.com/api/v1/amm/${account}`).then((r) =>
      r.json(),
    );
  }

  getTokenByAssetAndIssuer(data: IGetToken) {
    return fetch(
      `https://api.xrpscan.com/api/v1/token/${data.asset}.${data.issuer}`,
    ).then((r) => r.json());
  }
}
