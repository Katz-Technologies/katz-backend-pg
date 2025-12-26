import { Injectable, Logger } from '@nestjs/common';
import { createCanvas, loadImage } from 'canvas';
import sharp from 'sharp';

interface ImageAnalysis {
  width: number;
  height: number;
  data: Uint8ClampedArray;
  isSquare: boolean;
  hasTransparency: boolean;
  uniqueColors: number;
  colorDiversity: number;
  stdDev: number;
  horizontalSymmetryRatio: number;
  verticalSymmetryRatio: number;
  blockyRatio: number;
}

@Injectable()
export class HashiconDetectorService {
  private readonly logger = new Logger(HashiconDetectorService.name);

  private async convertToPng(buffer: Buffer): Promise<Buffer> {
    try {
      const metadata = await sharp(buffer).metadata();
      if (!metadata.format) {
        throw new Error('Unable to determine image format');
      }
      return await sharp(buffer).png().toBuffer();
    } catch {
      return buffer;
    }
  }

  private async loadImageData(buffer: Buffer): Promise<{
    width: number;
    height: number;
    data: Uint8ClampedArray;
  }> {
    const imageBuffer = await this.convertToPng(buffer);
    const img = await loadImage(imageBuffer);
    const width = img.width;
    const height = img.height;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, width, height);
    return { width, height, data: imgData.data };
  }

  private checkTransparency(data: Uint8ClampedArray): boolean {
    for (let i = 3; i < data.length; i += 4) {
      if ((data[i] ?? 255) < 255) {
        return true;
      }
    }
    return false;
  }

  private analyzeColorPalette(
    data: Uint8ClampedArray,
    width: number,
    height: number,
  ): { uniqueColors: number; colorDiversity: number } {
    const colorSet = new Set<string>();
    for (let i = 0; i < data.length; i += 4) {
      const r = Math.round((data[i] ?? 0) / 8) * 8;
      const g = Math.round((data[i + 1] ?? 0) / 8) * 8;
      const b = Math.round((data[i + 2] ?? 0) / 8) * 8;
      colorSet.add(`${r},${g},${b}`);
    }
    const uniqueColors = colorSet.size;
    const totalPixels = width * height;
    const colorDiversity = uniqueColors / totalPixels;
    return { uniqueColors, colorDiversity };
  }

  private calculateBrightnessVariance(data: Uint8ClampedArray): number {
    let sum = 0;
    let cnt = 0;
    for (let i = 0; i < data.length; i += 4) {
      const gray =
        ((data[i] ?? 0) + (data[i + 1] ?? 0) + (data[i + 2] ?? 0)) / 3;
      sum += gray;
      cnt++;
    }
    const avg = sum / cnt;

    let variance = 0;
    for (let i = 0; i < data.length; i += 4) {
      const gray =
        ((data[i] ?? 0) + (data[i + 1] ?? 0) + (data[i + 2] ?? 0)) / 3;
      variance += (gray - avg) ** 2;
    }
    return Math.sqrt(variance / cnt);
  }

  private calculatePixelDiff(
    data: Uint8ClampedArray,
    idx1: number,
    idx2: number,
  ): number {
    return (
      Math.abs((data[idx1] ?? 0) - (data[idx2] ?? 0)) +
      Math.abs((data[idx1 + 1] ?? 0) - (data[idx2 + 1] ?? 0)) +
      Math.abs((data[idx1 + 2] ?? 0) - (data[idx2 + 2] ?? 0)) +
      Math.abs((data[idx1 + 3] ?? 0) - (data[idx2 + 3] ?? 0))
    );
  }

  private calculateHorizontalSymmetry(
    data: Uint8ClampedArray,
    width: number,
    height: number,
  ): { matches: number; totalChecks: number } {
    let matches = 0;
    let totalChecks = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < Math.floor(width / 2); x++) {
        const idxLeft = (y * width + x) * 4;
        const idxRight = (y * width + (width - x - 1)) * 4;
        const diff = this.calculatePixelDiff(data, idxLeft, idxRight);

        if (diff < 20) matches++;
        totalChecks++;
      }
    }

    return { matches, totalChecks };
  }

  private calculateVerticalSymmetry(
    data: Uint8ClampedArray,
    width: number,
    height: number,
  ): number {
    let matches = 0;

    for (let y = 0; y < Math.floor(height / 2); y++) {
      for (let x = 0; x < width; x++) {
        const idxTop = (y * width + x) * 4;
        const idxBottom = ((height - y - 1) * width + x) * 4;
        const diff = this.calculatePixelDiff(data, idxTop, idxBottom);

        if (diff < 20) matches++;
      }
    }

    return matches;
  }

  private calculateSymmetry(
    data: Uint8ClampedArray,
    width: number,
    height: number,
  ): { horizontalRatio: number; verticalRatio: number } {
    const horizontal = this.calculateHorizontalSymmetry(data, width, height);
    const verticalMatches = this.calculateVerticalSymmetry(data, width, height);

    return {
      horizontalRatio:
        horizontal.totalChecks > 0
          ? horizontal.matches / horizontal.totalChecks
          : 0,
      verticalRatio:
        horizontal.totalChecks > 0
          ? verticalMatches / horizontal.totalChecks
          : 0,
    };
  }

  private calculateBlockyScore(
    data: Uint8ClampedArray,
    width: number,
    height: number,
  ): number {
    let blockyScore = 0;
    const blockSize = Math.max(2, Math.floor(width / 16));

    for (let y = 0; y < height - blockSize; y += blockSize) {
      for (let x = 0; x < width - blockSize; x += blockSize) {
        const idx = (y * width + x) * 4;
        const r = data[idx] ?? 0;
        const g = data[idx + 1] ?? 0;
        const b = data[idx + 2] ?? 0;

        const isBlockUniform = this.checkBlockUniformity(
          data,
          width,
          x,
          y,
          blockSize,
          r,
          g,
          b,
        );

        if (isBlockUniform) blockyScore++;
      }
    }

    const totalBlocks =
      Math.floor(height / blockSize) * Math.floor(width / blockSize);
    return totalBlocks > 0 ? blockyScore / totalBlocks : 0;
  }

  private checkBlockUniformity(
    data: Uint8ClampedArray,
    width: number,
    startX: number,
    startY: number,
    blockSize: number,
    r: number,
    g: number,
    b: number,
  ): boolean {
    for (let dy = 0; dy < blockSize; dy++) {
      for (let dx = 0; dx < blockSize; dx++) {
        const checkIdx = ((startY + dy) * width + (startX + dx)) * 4;
        const diff =
          Math.abs((data[checkIdx] ?? 0) - r) +
          Math.abs((data[checkIdx + 1] ?? 0) - g) +
          Math.abs((data[checkIdx + 2] ?? 0) - b);
        if (diff > 10) return false;
      }
    }
    return true;
  }

  private analyzeImage(buffer: Buffer): Promise<ImageAnalysis> {
    return this.loadImageData(buffer).then(({ width, height, data }) => {
      const isSquare = Math.abs(width - height) <= 2;
      const hasTransparency = this.checkTransparency(data);
      const { uniqueColors, colorDiversity } = this.analyzeColorPalette(
        data,
        width,
        height,
      );
      const stdDev = this.calculateBrightnessVariance(data);
      const { horizontalRatio, verticalRatio } = this.calculateSymmetry(
        data,
        width,
        height,
      );
      const blockyRatio = this.calculateBlockyScore(data, width, height);

      return {
        width,
        height,
        data,
        isSquare,
        hasTransparency,
        uniqueColors,
        colorDiversity,
        stdDev,
        horizontalSymmetryRatio: horizontalRatio,
        verticalSymmetryRatio: verticalRatio,
        blockyRatio,
      };
    });
  }

  private checkBasicCriteria(analysis: ImageAnalysis): boolean {
    if (!analysis.isSquare) {
      return false;
    }

    if (!analysis.hasTransparency) {
      return false;
    }

    if (analysis.uniqueColors < 15 || analysis.uniqueColors >= 100) {
      return false;
    }

    return true;
  }

  private checkSymmetryCriteria(analysis: ImageAnalysis): {
    isModeratelySymmetric: boolean;
    isSymmetric: boolean;
  } {
    const avgSymmetry =
      (analysis.horizontalSymmetryRatio + analysis.verticalSymmetryRatio) / 2;

    if (avgSymmetry > 0.6) {
      return { isModeratelySymmetric: false, isSymmetric: false };
    }

    const isModeratelySymmetric = avgSymmetry >= 0.3 && avgSymmetry <= 0.6;

    if (!isModeratelySymmetric) {
      return { isModeratelySymmetric: false, isSymmetric: false };
    }

    const isSymmetric =
      analysis.horizontalSymmetryRatio >= 0.3 ||
      analysis.verticalSymmetryRatio >= 0.3;

    return { isModeratelySymmetric, isSymmetric };
  }

  private calculateScore(analysis: ImageAnalysis): number {
    const hasLimitedPalette =
      analysis.colorDiversity < 0.002 &&
      analysis.uniqueColors >= 30 &&
      analysis.uniqueColors < 100;

    const hasModerateVariance = analysis.stdDev >= 60 && analysis.stdDev < 100;

    const symmetry = this.checkSymmetryCriteria(analysis);
    const hasBlockyStructure = analysis.blockyRatio > 0.3;

    let score = 0;
    if (analysis.isSquare) score += 1;
    if (hasLimitedPalette) score += 2;
    if (hasModerateVariance) score += 1;
    if (symmetry.isSymmetric) score += 2;
    if (hasBlockyStructure) score += 1;

    return score;
  }

  private evaluateHashicon(analysis: ImageAnalysis): boolean {
    if (!this.checkBasicCriteria(analysis)) {
      return false;
    }

    const symmetry = this.checkSymmetryCriteria(analysis);

    if (!symmetry.isModeratelySymmetric) {
      return false;
    }

    const hasLimitedPalette =
      analysis.colorDiversity < 0.002 &&
      analysis.uniqueColors >= 30 &&
      analysis.uniqueColors < 100;

    const hasRequiredCriteria =
      analysis.hasTransparency &&
      symmetry.isModeratelySymmetric &&
      hasLimitedPalette &&
      analysis.isSquare;

    const score = this.calculateScore(analysis);

    return hasRequiredCriteria && score >= 5;
  }

  async isHashicon(buffer: Buffer): Promise<boolean> {
    try {
      const analysis = await this.analyzeImage(buffer);
      return this.evaluateHashicon(analysis);
    } catch (error) {
      this.logger.error(
        `Error detecting hashicon: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      return false;
    }
  }
}
