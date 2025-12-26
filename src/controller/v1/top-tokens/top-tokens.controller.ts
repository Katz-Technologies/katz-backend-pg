import {
  Controller,
  Get,
  Post,
  Body,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import pLimit from 'p-limit';
import { IconsCacheService } from 'src/service/cron/icons-cache.service';
import { IconsService } from 'src/service/cron/icons.service';
import { IconOptimizerService } from 'src/service/cron/icon-optimizer.service';
import { ETopType } from 'src/service/cron/enum/top-types.enum';
import { ALL_TOP_TYPES } from 'src/service/cron/utils/top-mapping';
import { IToken } from 'src/service/xrpl-meta/interface/get-tokens-response.interface';
import { GetTopTokenDto } from './dto/get-top-token.dto';

@Controller('v1/top-tokens')
export class TopTokensController {
  private readonly logger = new Logger(TopTokensController.name);

  constructor(
    private readonly iconsCacheService: IconsCacheService,
    private readonly iconsService: IconsService,
    private readonly iconOptimizer: IconOptimizerService,
  ) {}

  @Post('token')
  async getTopToken(@Body() body: GetTopTokenDto) {
    try {
      const fallbackIcon = await this.iconsCacheService.getFallbackTokenIcon();
      const defaultIcon = fallbackIcon
        ? await this.iconOptimizer.iconToBase64(fallbackIcon)
        : null;

      const topTokens = await this.iconsCacheService.getTopTokensForTrending();

      const results = await Promise.all(
        body.tokens.map(async (token) => {
          try {
            const topToken = topTokens.find(
              (t) => t.currency === token.currency && t.issuer === token.issuer,
            );

            if (!topToken) {
              return {
                currency: token.currency,
                issuer: token.issuer,
                error: 'Token not found',
              };
            }

            try {
              const tokenIcon = await this.iconsCacheService.getTokenIcon(
                topToken.currency,
                topToken.issuer,
              );

              let iconBase64: string | null = null;
              if (tokenIcon === null) {
                iconBase64 = null;
              } else if (
                tokenIcon &&
                typeof tokenIcon !== 'undefined' &&
                tokenIcon.length > 0
              ) {
                iconBase64 = await this.iconOptimizer.iconToBase64(tokenIcon);
              } else {
                iconBase64 = null;
              }

              return {
                ...topToken,
                icon: iconBase64,
                defaultIcon: defaultIcon,
              };
            } catch (error) {
              this.logger.error(
                `Error getting icon for ${topToken.currency}:${topToken.issuer}`,
                error,
              );
              return {
                ...topToken,
                icon: null,
                defaultIcon: defaultIcon,
              };
            }
          } catch (error) {
            this.logger.error(
              `Error fetching top token for ${token.currency}:${token.issuer}`,
              error,
            );
            return {
              currency: token.currency,
              issuer: token.issuer,
              error: 'Error fetching top token',
            };
          }
        }),
      );

      return results;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error fetching top tokens',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('trending')
  async getTopTokensForTrending() {
    try {
      const tokens = await this.iconsCacheService.getTopTokensForTrending();

      const fallbackIcon = await this.iconsCacheService.getFallbackTokenIcon();
      const defaultIcon = fallbackIcon
        ? await this.iconOptimizer.iconToBase64(fallbackIcon)
        : null;

      const topTokens = await Promise.all(
        tokens.map(async (token) => {
          try {
            const tokenIcon = await this.iconsCacheService.getTokenIcon(
              token.currency,
              token.issuer,
            );

            let iconBase64: string | null = null;
            if (tokenIcon === null) {
              iconBase64 = null;
            } else if (tokenIcon && tokenIcon.length > 0) {
              iconBase64 = await this.iconOptimizer.iconToBase64(tokenIcon);
            } else {
              iconBase64 = null;
            }

            return {
              ...token,
              icon: iconBase64,
            };
          } catch (error) {
            this.logger.error(
              `Error getting icon for ${token.currency}:${token.issuer}`,
              error,
            );
            return {
              ...token,
              icon: null,
            };
          }
        }),
      );

      const totalTokens = topTokens.length;
      const tokensWithIcon = topTokens.filter((t) => t.icon !== null).length;
      const tokensWithoutIcon = totalTokens - tokensWithIcon;

      this.logger.log(
        `getTopTokensForTrending: Total tokens: ${totalTokens}, With icon: ${tokensWithIcon}, Without icon (null): ${tokensWithoutIcon}`,
      );

      return {
        tokens: topTokens,
        defaultIcon: defaultIcon,
      };
    } catch {
      throw new HttpException(
        'Error fetching top tokens for trending',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('icons/accounts')
  async getAccountIcons(@Body() body: { addresses: string[] }) {
    if (!body.addresses || !Array.isArray(body.addresses)) {
      throw new HttpException(
        'Addresses array is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const fallbackIcon = await this.iconsCacheService.getFallbackTokenIcon();
      const defaultIcon = fallbackIcon
        ? await this.iconOptimizer.iconToBase64(fallbackIcon)
        : null;

      const cacheResults = await Promise.all(
        body.addresses.map(async (address) => {
          const cachedIcon =
            await this.iconsCacheService.getAccountIcon(address);
          return {
            address,
            cachedIcon,
          };
        }),
      );

      const addressesToFetch: string[] = [];
      const resultMap = new Map<string, string | null>();

      for (const { address, cachedIcon } of cacheResults) {
        if (cachedIcon && cachedIcon.length > 0) {
          const iconBase64 = await this.iconOptimizer.iconToBase64(cachedIcon);
          resultMap.set(address, iconBase64 ?? null);
        } else if (cachedIcon === null) {
          resultMap.set(address, null);
          addressesToFetch.push(address);
        } else {
          addressesToFetch.push(address);
        }
      }

      if (addressesToFetch.length > 0) {
        const limit = pLimit(5);

        const fetchPromises = addressesToFetch.map((address) =>
          limit(async () => {
            try {
              const accountIcon =
                await this.iconsService.getAccountIcon(address);

              if (accountIcon && accountIcon.length > 0) {
                await this.iconsCacheService.saveAccountIcon(
                  address,
                  accountIcon,
                );
                const iconBase64 =
                  await this.iconOptimizer.iconToBase64(accountIcon);
                resultMap.set(address, iconBase64 ?? null);
              } else {
                await this.iconsCacheService.saveAccountIcon(address, null);
                resultMap.set(address, null);
              }
            } catch (error) {
              this.logger.error(
                `Error getting icon for account: ${address}`,
                error,
              );
              await this.iconsCacheService.saveAccountIcon(address, null);
              resultMap.set(address, null);
            }
          }),
        );

        await Promise.all(fetchPromises);
      }

      const icons = body.addresses.map((address) => ({
        address,
        icon: resultMap.get(address) ?? null,
      }));

      return {
        icons,
        defaultIcon,
      };
    } catch {
      throw new HttpException(
        'Error fetching account icons',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('icons/tokens')
  async getTokenIcons(
    @Body()
    body: {
      tokens: Array<{ currency: string; issuer: string }>;
    },
  ) {
    if (!body.tokens || !Array.isArray(body.tokens)) {
      throw new HttpException(
        'Tokens array is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const fallbackIcon = await this.iconsCacheService.getFallbackTokenIcon();
      const defaultIcon = fallbackIcon
        ? await this.iconOptimizer.iconToBase64(fallbackIcon)
        : null;

      const topTokens = await this.iconsCacheService.getTopTokensForTrending();

      const icons = await Promise.all(
        body.tokens.map(async (token) => {
          try {
            const tokenIcon =
              await this.iconsCacheService.getTokenIconWithFallback(
                token.currency,
                token.issuer,
                topTokens,
              );

            const iconBase64 =
              tokenIcon && tokenIcon.length > 0
                ? await this.iconOptimizer.iconToBase64(tokenIcon)
                : null;

            return {
              currency: token.currency,
              issuer: token.issuer,
              icon: iconBase64,
            };
          } catch (error) {
            this.logger.error(
              `Error getting icon for token: ${token.currency}:${token.issuer}`,
              error,
            );
            return {
              currency: token.currency,
              issuer: token.issuer,
              icon: null,
            };
          }
        }),
      );

      return {
        icons,
        defaultIcon,
      };
    } catch {
      throw new HttpException(
        'Error fetching token icons',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async getAllTopTokens() {
    try {
      const allTopTokens = await this.iconsCacheService.getAllTopTokens();
      const fallbackIcon = await this.iconsCacheService.getFallbackTokenIcon();
      const defaultIcon = fallbackIcon
        ? await this.iconOptimizer.iconToBase64(fallbackIcon)
        : null;

      const result: Record<
        ETopType,
        {
          tokens: Array<IToken & { icon: string | null }>;
          defaultIcon: string | null;
        }
      > = {} as Record<
        ETopType,
        {
          tokens: Array<IToken & { icon: string | null }>;
          defaultIcon: string | null;
        }
      >;

      await Promise.all(
        ALL_TOP_TYPES.map(async (topType) => {
          const tokens = allTopTokens[topType] || [];

          const tokensWithIcons = await Promise.all(
            tokens.map(async (token) => {
              try {
                const tokenIcon = await this.iconsCacheService.getTokenIcon(
                  token.currency,
                  token.issuer,
                );

                let iconBase64: string | null = null;
                if (tokenIcon === null) {
                  iconBase64 = null;
                } else if (
                  tokenIcon &&
                  typeof tokenIcon !== 'undefined' &&
                  tokenIcon.length > 0
                ) {
                  iconBase64 = await this.iconOptimizer.iconToBase64(tokenIcon);
                } else {
                  iconBase64 = null;
                }

                return {
                  ...token,
                  icon: iconBase64,
                };
              } catch (error) {
                this.logger.error(
                  `Error getting icon for ${token.currency}:${token.issuer}`,
                  error,
                );
                return {
                  ...token,
                  icon: null,
                };
              }
            }),
          );

          const totalTokens = tokensWithIcons.length;
          const tokensWithIcon = tokensWithIcons.filter(
            (t) => t.icon !== null,
          ).length;
          const tokensWithoutIcon = totalTokens - tokensWithIcon;

          this.logger.log(
            `getAllTopTokens [${topType}]: Total tokens: ${totalTokens}, With icon: ${tokensWithIcon}, Without icon (null): ${tokensWithoutIcon}`,
          );

          result[topType] = {
            tokens: tokensWithIcons,
            defaultIcon: defaultIcon,
          };
        }),
      );

      return result;
    } catch (error) {
      this.logger.error('Error fetching all top tokens:', error);
      throw new HttpException(
        'Error fetching all top tokens',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
