import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';

@Injectable()
export class IconOptimizerService {
  private readonly logger = new Logger(IconOptimizerService.name);

  private readonly MAX_ICON_SIZE = 96;
  private readonly WEBP_QUALITY = 80;

  async optimizeIcon(
    iconBuffer: Buffer,
    context?: {
      currency?: string;
      issuer?: string;
      source?: string;
    },
  ): Promise<Buffer> {
    if (!iconBuffer || iconBuffer.length === 0) {
      return Buffer.from('');
    }

    const contextInfo = this.formatContext(context);
    const bufferPreview = this.getBufferPreview(iconBuffer);

    try {
      const metadata = await sharp(iconBuffer).metadata();
      if (!metadata.format) {
        this.logger.warn(
          `Cannot determine image format${contextInfo}. Buffer size: ${iconBuffer.length} bytes. First bytes: ${bufferPreview}. Returning original.`,
        );
        return iconBuffer;
      }

      const optimized = await sharp(iconBuffer)
        .resize(this.MAX_ICON_SIZE, this.MAX_ICON_SIZE, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .webp({ quality: this.WEBP_QUALITY, effort: 4 })
        .toBuffer();

      return optimized;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorName = error instanceof Error ? error.name : 'UnknownError';

      this.logger.warn(
        `Failed to optimize icon${contextInfo}. Buffer size: ${iconBuffer.length} bytes. First bytes (hex): ${bufferPreview}. Error: ${errorName} - ${errorMessage}. Returning original image.`,
      );

      return iconBuffer;
    }
  }

  private formatContext(context?: {
    currency?: string;
    issuer?: string;
    source?: string;
  }): string {
    if (!context) {
      return '';
    }

    const parts: string[] = [];
    if (context.currency && context.issuer) {
      parts.push(`Token: ${context.currency}:${context.issuer}`);
    } else if (context.issuer && context.source === 'account') {
      parts.push(`Account: ${context.issuer}`);
    }
    if (context.source) {
      parts.push(`Source: ${context.source}`);
    }

    return parts.length > 0 ? ` [${parts.join(', ')}]` : '';
  }

  private getBufferPreview(buffer: Buffer, maxBytes: number = 32): string {
    const previewLength = Math.min(buffer.length, maxBytes);
    const preview = buffer.slice(0, previewLength);
    return preview.toString('hex').toUpperCase();
  }

  async iconToBase64(iconBuffer: Buffer): Promise<string | null> {
    if (!iconBuffer || iconBuffer.length === 0) {
      return null;
    }

    try {
      const metadata = await sharp(iconBuffer).metadata();
      const mimeType = this.getMimeType(metadata.format);

      return `data:${mimeType};base64,${iconBuffer.toString('base64')}`;
    } catch {
      return `data:image/png;base64,${iconBuffer.toString('base64')}`;
    }
  }

  async getContentType(iconBuffer: Buffer): Promise<string> {
    if (!iconBuffer || iconBuffer.length === 0) {
      return 'image/webp';
    }

    try {
      const metadata = await sharp(iconBuffer).metadata();
      return this.getMimeType(metadata.format);
    } catch {
      return 'image/webp';
    }
  }

  private getMimeType(format: string | undefined): string {
    switch (format) {
      case 'webp':
        return 'image/webp';
      case 'png':
        return 'image/png';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'gif':
        return 'image/gif';
      case 'svg':
        return 'image/svg+xml';
      default:
        return 'image/webp';
    }
  }
}
