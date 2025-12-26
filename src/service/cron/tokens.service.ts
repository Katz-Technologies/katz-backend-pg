import { Injectable, Logger } from '@nestjs/common';
import { XrplMetaService } from '../xrpl-meta/xrpl-meta.service';
import { getSuspiciousLpTokens } from '../xrpl-meta/utils/token-utils';
import { IToken } from '../xrpl-meta/interface/get-tokens-response.interface';
import { ETopType } from './enum/top-types.enum';
import { TOP_TYPE_TO_SORT_MAP } from './utils/top-mapping';

@Injectable()
export class TokensService {
  private readonly logger = new Logger(TokensService.name);

  constructor(private readonly xrplMetaService: XrplMetaService) {}

  async getTopTokensList(topType: ETopType): Promise<IToken[]> {
    const OFFSET = 0;
    const LIMIT = 100;
    const LIMIT_EXTRA = 200;

    try {
      const sortBy = TOP_TYPE_TO_SORT_MAP[topType];
      const response = await this.xrplMetaService.getTokens({
        limit: LIMIT + LIMIT_EXTRA,
        offset: OFFSET,
        sort_by: sortBy,
      });
      this.logger.log(
        `[${topType}] Fetched ${response.tokens?.length || 0} tokens (total: ${response.count || 0})`,
      );

      const suspiciousTokens = getSuspiciousLpTokens(response.tokens);
      this.logger.log(
        `[${topType}] Found ${suspiciousTokens.length} suspicious tokens`,
      );

      const suspiciousSet = new Set(
        suspiciousTokens.map((t) => `${t.currency}:${t.issuer}`),
      );

      const filteredTokens = response.tokens.filter(
        (token) => !suspiciousSet.has(`${token.currency}:${token.issuer}`),
      );

      const tokens = filteredTokens.slice(0, LIMIT);

      this.logger.log(`[${topType}] Filtered to ${tokens.length} tokens`);

      return tokens;
    } catch (error) {
      this.logger.error(`[${topType}] Error fetching tokens:`, error);
      return [];
    }
  }
}
