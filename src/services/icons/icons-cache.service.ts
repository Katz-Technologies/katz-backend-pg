import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InternalRedisAdapter } from '../../common/redis/internal-redis.adapter';
import { ExternalRedisAdapter } from '../../common/redis/external-redis.adapter';
import { IToken } from '../../integrations/xrpl-meta/interface/get-tokens-response.interface';
import { IconOptimizerService } from './icon-optimizer.service';
import { IconsService } from './icons.service';
import { HashiconDetectorService } from './hashicon-detector.service';
import { ETopType } from '../../jobs/enum/top-types.enum';
import { ALL_TOP_TYPES } from '../../jobs/utils/top-mapping';

@Injectable()
export class IconsCacheService {
  private readonly logger = new Logger(IconsCacheService.name);

  private readonly TRENDING_TOKENS_TTL = 6 * 60 * 60;
  private readonly TOKEN_ICON_TTL = 60 * 60 * 24;
  private readonly ACCOUNT_ICON_TTL = 60 * 60 * 24;
  private readonly FALLBACK_ICON_TTL = 60 * 60 * 24;
  private readonly FALLBACK_ICON_KEY = 'icon:fallback:token';

  constructor(
    private readonly internalRedisService: InternalRedisAdapter,
    private readonly externalRedisService: ExternalRedisAdapter,
    private readonly iconOptimizer: IconOptimizerService,
    @Inject(forwardRef(() => IconsService))
    private readonly iconsService: IconsService,
    private readonly hashiconDetector: HashiconDetectorService,
  ) {}

  async waitUntilReady(): Promise<void> {
    await this.internalRedisService.waitUntilReady();
  }

  async saveTopTokensForTrending(tokens: IToken[]): Promise<void> {
    await this.saveTopTokens(ETopType.TRENDING, tokens);

    try {
      const pipeline = this.internalRedisService.pipelineWithJson();
      const updatedAt = new Date().toISOString();

      tokens = await Promise.all(
        tokens.map(async (v) => {
          const summary = await this.externalRedisService.getAsJson(
            `token:${v.currency}.${v.issuer}`,
          );
          if (summary !== null) {
            const assign = Object.assign(v, summary);
            if (assign.richList && Number(assign.metrics.supply) > 0) {
              assign.richList = assign.richList.map((v) => {
                return {
                  ...v,
                  percent: v.balance / Number(assign.metrics.supply),
                };
              });
            }
            return assign;
          } else {
            return v;
          }
        }),
      );

      pipeline.setAsJsonEx(
        'trending:tokens:list',
        tokens.slice(0, 1000),
        this.TRENDING_TOKENS_TTL,
      );

      pipeline.setAsJsonEx(
        'trending:tokens:count',
        tokens.slice(0, 1000).length,
        this.TRENDING_TOKENS_TTL,
      );

      pipeline.setAsJsonEx(
        'trending:tokens:updated_at',
        updatedAt,
        this.TRENDING_TOKENS_TTL,
      );

      const mainResults = await pipeline.exec();

      if (mainResults) {
        const mainErrors = mainResults.filter(([error]) => error !== null);
        if (mainErrors.length > 0) {
          this.logger.error(
            `Error saving main data to Redis: ${mainErrors.length} errors`,
          );
          mainErrors.forEach(([error], index) => {
            this.logger.error(
              `Main data error at index ${index}:`,
              error instanceof Error ? error.message : String(error),
            );
          });
        } else {
          this.logger.log('Main data saved successfully');
        }
      }

      const BATCH_SIZE = 100;
      for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
        const batch = tokens.slice(i, i + BATCH_SIZE);
        const batchPipeline = this.internalRedisService.pipelineWithJson();

        for (const token of batch) {
          const tokenKey = `trending:token:${token.currency}:${token.issuer}`;
          batchPipeline.setAsJsonEx(tokenKey, token, this.TRENDING_TOKENS_TTL);
        }

        const batchResults = await batchPipeline.exec();

        if (batchResults) {
          const batchErrors = batchResults.filter(([error]) => error !== null);
          if (batchErrors.length > 0) {
            this.logger.warn(
              `Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batchErrors.length} errors out of ${batchResults.length} operations`,
            );
          }
        }
      }

      this.logger.log(
        `Successfully saved ${tokens.length} top tokens (trending) to Redis`,
      );
    } catch (error) {
      this.logger.error('Error saving top tokens (trending) to Redis:', error);
      throw error;
    }
  }

  async getTopTokensForTrending(): Promise<IToken[]> {
    return this.getTopTokens(ETopType.TRENDING);
  }

  async saveTopTokens(topType: ETopType, tokens: IToken[]): Promise<void> {
    try {
      const pipeline = this.internalRedisService.pipelineWithJson();
      const updatedAt = new Date().toISOString();
      const topTypeKey = topType.replace(/-/g, ':');

      pipeline.setAsJsonEx(
        `top:${topTypeKey}:list`,
        tokens,
        this.TRENDING_TOKENS_TTL,
      );

      pipeline.setAsJsonEx(
        `top:${topTypeKey}:count`,
        tokens.length,
        this.TRENDING_TOKENS_TTL,
      );

      pipeline.setAsJsonEx(
        `top:${topTypeKey}:updated_at`,
        updatedAt,
        this.TRENDING_TOKENS_TTL,
      );

      const mainResults = await pipeline.exec();

      if (mainResults) {
        const mainErrors = mainResults.filter(([error]) => error !== null);
        if (mainErrors.length > 0) {
          this.logger.error(
            `[${topType}] Error saving main data to Redis: ${mainErrors.length} errors`,
          );
          mainErrors.forEach(([error], index) => {
            this.logger.error(
              `[${topType}] Main data error at index ${index}:`,
              error instanceof Error ? error.message : String(error),
            );
          });
        } else {
          this.logger.log(`[${topType}] Main data saved successfully`);
        }
      }

      const BATCH_SIZE = 100;
      for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
        const batch = tokens.slice(i, i + BATCH_SIZE);
        const batchPipeline = this.internalRedisService.pipelineWithJson();

        for (const token of batch) {
          const tokenKey = `top:${topTypeKey}:token:${token.currency}:${token.issuer}`;
          batchPipeline.setAsJsonEx(tokenKey, token, this.TRENDING_TOKENS_TTL);
        }

        const batchResults = await batchPipeline.exec();

        if (batchResults) {
          const batchErrors = batchResults.filter(([error]) => error !== null);
          if (batchErrors.length > 0) {
            this.logger.warn(
              `[${topType}] Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batchErrors.length} errors out of ${batchResults.length} operations`,
            );
          }
        }
      }

      this.logger.log(
        `[${topType}] Successfully saved ${tokens.length} tokens to Redis`,
      );
    } catch (error) {
      this.logger.error(`[${topType}] Error saving tokens to Redis:`, error);
      throw error;
    }
  }

  async getTopTokens(topType: ETopType): Promise<IToken[]> {
    try {
      const topTypeKey = topType.replace(/-/g, ':');
      const tokens = await this.internalRedisService.getAsJson<IToken[]>(
        `top:${topTypeKey}:list`,
      );
      return tokens || [];
    } catch (error) {
      this.logger.error(`[${topType}] Error getting tokens from Redis:`, error);
      return [];
    }
  }

  async getAllTopTokens(): Promise<Record<ETopType, IToken[]>> {
    const result: Partial<Record<ETopType, IToken[]>> = {};

    await Promise.all(
      ALL_TOP_TYPES.map(async (topType) => {
        result[topType] = await this.getTopTokens(topType);
      }),
    );

    return result as Record<ETopType, IToken[]>;
  }

  async saveTokenIcon(
    currency: string,
    issuer: string,
    icon: Buffer | null,
  ): Promise<void> {
    try {
      const pipeline = this.internalRedisService.pipelineWithJson();

      if (icon === null) {
        pipeline.setAsJsonEx(
          `token:icon:${currency}:${issuer}`,
          null,
          this.TOKEN_ICON_TTL,
        );
      } else if (icon && icon.length > 0) {
        const optimizedIcon = await this.iconOptimizer.optimizeIcon(icon, {
          currency,
          issuer,
          source: 'token',
        });

        pipeline.setAsJsonEx(
          `token:icon:${currency}:${issuer}`,
          optimizedIcon,
          this.TOKEN_ICON_TTL,
        );
      }

      await pipeline.exec();
    } catch (error) {
      this.logger.error(
        `Error saving token icon: ${currency}:${issuer} ${error}`,
      );
    }
  }

  async getTokenIcon(
    currency: string,
    issuer: string,
  ): Promise<Buffer | null | undefined> {
    try {
      const iconData = await this.internalRedisService.getAsJson<{
        type: string;
        data: number[];
      } | null>(`token:icon:${currency}:${issuer}`);

      if (iconData === null) {
        return null;
      }

      if (!iconData) {
        return undefined;
      }

      if (iconData.type === 'Buffer' && Array.isArray(iconData.data)) {
        const buffer = Buffer.from(iconData.data);
        return buffer;
      }

      if (Buffer.isBuffer(iconData)) {
        return iconData as unknown as Buffer;
      }

      return Buffer.from('');
    } catch (error) {
      this.logger.error(
        `Error getting token icon: ${currency}:${issuer} ${error}`,
      );
      return undefined;
    }
  }

  async getTokensList(): Promise<{ currency: string; issuer: string }[]> {
    try {
      const keys = await this.internalRedisService.scanKeys('token:icon:*');

      return keys
        .map((key) => {
          const [, , currency, issuer] = key.split(':');
          return { currency, issuer };
        })
        .filter(
          (item): item is { currency: string; issuer: string } =>
            item.currency !== undefined && item.issuer !== undefined,
        );
    } catch (error) {
      this.logger.error('Error getting tokens list from Redis:', error);
      return [];
    }
  }

  async saveAccountIcon(address: string, icon: Buffer | null): Promise<void> {
    try {
      const pipeline = this.internalRedisService.pipelineWithJson();

      if (icon === null) {
        pipeline.setAsJsonEx(
          `account:icon:${address}`,
          null,
          this.ACCOUNT_ICON_TTL,
        );
      } else if (icon && icon.length > 0) {
        const optimizedIcon = await this.iconOptimizer.optimizeIcon(icon, {
          issuer: address,
          source: 'account',
        });

        pipeline.setAsJsonEx(
          `account:icon:${address}`,
          optimizedIcon,
          this.ACCOUNT_ICON_TTL,
        );
      }

      await pipeline.exec();
    } catch (error) {
      this.logger.error(`Error saving account icon: ${address} ${error}`);
    }
  }

  async getAccountIcon(address: string): Promise<Buffer | null | undefined> {
    try {
      const iconData = await this.internalRedisService.getAsJson<{
        type: string;
        data: number[];
      } | null>(`account:icon:${address}`);

      if (iconData === null) {
        return null;
      }

      if (!iconData) {
        return undefined;
      }

      if (iconData.type === 'Buffer' && Array.isArray(iconData.data)) {
        return Buffer.from(iconData.data);
      }

      if (Buffer.isBuffer(iconData)) {
        return iconData as unknown as Buffer;
      }

      return Buffer.from('');
    } catch (error) {
      this.logger.error(`Error getting account icon: ${address} ${error}`);
      return undefined;
    }
  }

  async getAccountsList(): Promise<string[]> {
    try {
      const keys = await this.internalRedisService.scanKeys('account:icon:*');
      return keys
        .map((key) => {
          const [, , address] = key.split(':');
          return address;
        })
        .filter((address): address is string => address !== undefined);
    } catch (error) {
      this.logger.error('Error getting accounts list from Redis:', error);
      return [];
    }
  }

  async saveFallbackTokenIcon(icon: Buffer): Promise<void> {
    try {
      const optimizedIcon = await this.iconOptimizer.optimizeIcon(icon, {
        source: 'fallback',
      });

      const pipeline = this.internalRedisService.pipelineWithJson();
      pipeline.setAsJsonEx(
        this.FALLBACK_ICON_KEY,
        optimizedIcon,
        this.FALLBACK_ICON_TTL,
      );
      await pipeline.exec();
      this.logger.log('Fallback token icon saved to cache');
    } catch (error) {
      this.logger.error('Error saving fallback token icon to Redis:', error);
    }
  }

  async getFallbackTokenIcon(): Promise<Buffer | null> {
    try {
      const iconData = await this.internalRedisService.getAsJson<{
        type: string;
        data: number[];
      }>(this.FALLBACK_ICON_KEY);

      if (!iconData) {
        return null;
      }

      if (iconData.type === 'Buffer' && Array.isArray(iconData.data)) {
        return Buffer.from(iconData.data);
      }

      if (Buffer.isBuffer(iconData)) {
        return iconData as unknown as Buffer;
      }

      return null;
    } catch (error) {
      this.logger.error('Error getting fallback token icon from Redis:', error);
      return null;
    }
  }

  private async tryGetTokenIconFromTopTokens(
    currency: string,
    issuer: string,
    topTokens: IToken[],
  ): Promise<Buffer | null> {
    const tokenIconUrl =
      topTokens.find((t) => t.currency === currency && t.issuer === issuer)
        ?.meta?.token?.icon || null;

    if (tokenIconUrl && this.iconsService.isValidIconUrl(tokenIconUrl)) {
      return await this.iconsService.getIconByUrl(tokenIconUrl);
    }

    return null;
  }

  private async handleTokenIconHashicon(
    tokenIcon: Buffer,
    currency: string,
    issuer: string,
    topTokens?: IToken[],
  ): Promise<Buffer | null> {
    const isTokenIconHashicon =
      await this.hashiconDetector.isHashicon(tokenIcon);

    if (!isTokenIconHashicon) {
      return tokenIcon;
    }

    if (topTokens) {
      const iconFromTopTokens = await this.tryGetTokenIconFromTopTokens(
        currency,
        issuer,
        topTokens,
      );
      return iconFromTopTokens || Buffer.from('');
    }

    return Buffer.from('');
  }

  private async processTokenIcon(
    tokenIcon: Buffer,
    currency: string,
    issuer: string,
    topTokens?: IToken[],
  ): Promise<Buffer | null> {
    const accountIcon = await this.iconsService.getAccountIcon(issuer);

    if (accountIcon && accountIcon.length > 0) {
      await this.saveAccountIcon(issuer, accountIcon);
    }

    return await this.handleTokenIconHashicon(
      tokenIcon,
      currency,
      issuer,
      topTokens,
    );
  }

  async getTokenIconWithFallback(
    currency: string,
    issuer: string,
    topTokens?: IToken[],
  ): Promise<Buffer | null> {
    const cachedIcon = await this.getTokenIcon(currency, issuer);

    if (cachedIcon && cachedIcon.length > 0) {
      return cachedIcon;
    }

    let tokenIcon = await this.iconsService.getTokenIcon(currency, issuer);

    if (!tokenIcon || tokenIcon.length === 0) {
      if (topTokens) {
        tokenIcon =
          (await this.tryGetTokenIconFromTopTokens(
            currency,
            issuer,
            topTokens,
          )) || Buffer.from('');
      }
    } else {
      tokenIcon =
        (await this.processTokenIcon(tokenIcon, currency, issuer, topTokens)) ||
        Buffer.from('');
    }

    if (tokenIcon && tokenIcon.length > 0) {
      await this.saveTokenIcon(currency, issuer, tokenIcon);
      return tokenIcon;
    }

    await this.saveTokenIcon(currency, issuer, null);
    return null;
  }

  async getAccountIconWithFallback(address: string): Promise<Buffer | null> {
    const cachedIcon = await this.getAccountIcon(address);

    if (cachedIcon === null) {
      return null;
    }

    if (cachedIcon && cachedIcon.length > 0) {
      return cachedIcon;
    }

    const accountIcon = await this.iconsService.getAccountIcon(address);

    if (accountIcon && accountIcon.length > 0) {
      await this.saveAccountIcon(address, accountIcon);
      return accountIcon;
    } else {
      await this.saveAccountIcon(address, null);
      return null;
    }
  }
}
