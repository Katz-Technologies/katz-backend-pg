import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { BithompService } from '../bithomp/bithomp.service';
import { IconsCacheService } from './icons-cache.service';

@Injectable()
export class IconsService {
  private readonly logger = new Logger(IconsService.name);
  private readonly FALLBACK_ICON_PATH = join(
    process.cwd(),
    'assets',
    'token-fallback-icon.png',
  );

  constructor(
    private readonly bithompService: BithompService,
    @Inject(forwardRef(() => IconsCacheService))
    private readonly iconsCacheService: IconsCacheService,
  ) {}

  isValidIconUrl(url: string): boolean {
    if (!url) {
      return false;
    }
    if (url.includes('/icon/null.null')) {
      return false;
    }
    return true;
  }

  async getIconByUrl(url: string): Promise<Buffer> {
    if (!this.isValidIconUrl(url)) {
      return Buffer.from('');
    }

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      this.logger.error(`Error getting icon by url: ${url} ${error}`);
      return Buffer.from('');
    }
  }

  async getTokenIcon(currency: string, issuer: string): Promise<Buffer> {
    try {
      const icon = await this.bithompService.getIssuedTokenAvatar({
        issuer: issuer,
        currencyHex: currency,
      });
      return icon;
    } catch (error) {
      this.logger.error(
        `Error getting token icon: ${currency}:${issuer} ${error}`,
      );
      return Buffer.from('');
    }
  }

  async getAccountIcon(address: string): Promise<Buffer> {
    try {
      const icon = await this.bithompService.getAccountAvatar({
        address: address,
      });
      return icon;
    } catch (error) {
      this.logger.error(`Error getting account icon: ${address} ${error}`);
      return Buffer.from('');
    }
  }

  async loadFallbackTokenIconFromFile(): Promise<Buffer> {
    try {
      return await readFile(this.FALLBACK_ICON_PATH);
    } catch (error) {
      this.logger.error(
        `Error reading fallback token icon from ${this.FALLBACK_ICON_PATH}: ${error}`,
      );
      return Buffer.from('');
    }
  }

  async getFallbackTokenIcon(): Promise<Buffer> {
    const cachedIcon = await this.iconsCacheService.getFallbackTokenIcon();
    if (cachedIcon && cachedIcon.length > 0) {
      return cachedIcon;
    }

    const fileIcon = await this.loadFallbackTokenIconFromFile();
    if (fileIcon.length > 0) {
      await this.iconsCacheService.saveFallbackTokenIcon(fileIcon);
    }

    return fileIcon;
  }
}
