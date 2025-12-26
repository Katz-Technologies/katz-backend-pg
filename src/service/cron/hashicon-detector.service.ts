import { Injectable, Logger } from '@nestjs/common';
import { createCanvas, loadImage } from 'canvas';
import sharp from 'sharp';

@Injectable()
export class HashiconDetectorService {
  private readonly logger = new Logger(HashiconDetectorService.name);

  async isHashicon(buffer: Buffer): Promise<boolean> {
    try {
      // Конвертируем изображение в PNG через sharp, так как canvas поддерживает
      // только PNG, JPEG и GIF. Sharp поддерживает больше форматов (WebP, SVG и т.д.)
      let imageBuffer: Buffer;
      try {
        const metadata = await sharp(buffer).metadata();
        if (!metadata.format) {
          return false;
        }

        // Конвертируем в PNG для совместимости с canvas
        imageBuffer = await sharp(buffer).png().toBuffer();
      } catch {
        // Если sharp не смог обработать, пробуем напрямую (может быть уже PNG/JPEG)
        imageBuffer = buffer;
      }

      const img = await loadImage(imageBuffer);
      const width = img.width;
      const height = img.height;

      const isSquare = Math.abs(width - height) <= 2;
      if (!isSquare) {
        return false;
      }

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      // Проверка на прозрачность: дефолтные иконки (hashicon) имеют прозрачный фон
      // Если нет прозрачных пикселей (alpha < 255), это 100% не дефолтная иконка
      let hasTransparency = false;
      for (let i = 3; i < data.length; i += 4) {
        const alpha = data[i];
        if (alpha < 255) {
          hasTransparency = true;
          break; // Достаточно найти хотя бы один прозрачный пиксель
        }
      }

      // Если нет прозрачности, это точно не дефолтная иконка
      if (!hasTransparency) {
        return false;
      }

      const colorSet = new Set<string>();
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const rRound = Math.round(r / 8) * 8;
        const gRound = Math.round(g / 8) * 8;
        const bRound = Math.round(b / 8) * 8;
        colorSet.add(`${rRound},${gRound},${bRound}`);
      }
      const uniqueColors = colorSet.size;
      const totalPixels = width * height;
      const colorDiversity = uniqueColors / totalPixels;

      // Дефолтные hashicons имеют ограниченную палитру (обычно 30-150 цветов)
      // Слишком малое количество цветов (< 15) указывает на простую геометрическую фигуру или логотип
      // Слишком большое количество (> 150) указывает на фотографию или сложное изображение
      if (uniqueColors < 15) {
        return false;
      }

      // Дефолтные hashicons имеют ограниченную палитру (обычно 30-100 цветов)
      // Слишком много цветов (>100) указывает на сложное изображение или фотографию
      // Hashicon обычно имеют очень ограниченную палитру
      // Реальные hashicons имеют diversity ~0.0004-0.0005, а не-hashicons могут иметь 0.01+
      const hasLimitedPalette =
        colorDiversity < 0.002 && uniqueColors >= 30 && uniqueColors < 100;

      let sum = 0;
      let cnt = 0;
      for (let i = 0; i < data.length; i += 4) {
        const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
        sum += gray;
        cnt++;
      }
      const avg = sum / cnt;

      let variance = 0;
      for (let i = 0; i < data.length; i += 4) {
        const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
        variance += (gray - avg) ** 2;
      }
      const stdDev = Math.sqrt(variance / cnt);

      const hasModerateVariance = stdDev >= 60 && stdDev < 100;

      let horizontalSymmetricMatches = 0;
      let verticalSymmetricMatches = 0;
      let totalChecks = 0;

      // Проверка симметрии с учетом alpha канала (прозрачности)
      // Дефолтные иконки должны быть очень симметричными, включая прозрачные области
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < Math.floor(width / 2); x++) {
          const idxLeft = (y * width + x) * 4;
          const idxRight = (y * width + (width - x - 1)) * 4;

          const diff =
            Math.abs(data[idxLeft] - data[idxRight]) +
            Math.abs(data[idxLeft + 1] - data[idxRight + 1]) +
            Math.abs(data[idxLeft + 2] - data[idxRight + 2]) +
            Math.abs(data[idxLeft + 3] - data[idxRight + 3]); // Учитываем alpha

          if (diff < 20) horizontalSymmetricMatches++;
          totalChecks++;
        }
      }

      for (let y = 0; y < Math.floor(height / 2); y++) {
        for (let x = 0; x < width; x++) {
          const idxTop = (y * width + x) * 4;
          const idxBottom = ((height - y - 1) * width + x) * 4;

          const diff =
            Math.abs(data[idxTop] - data[idxBottom]) +
            Math.abs(data[idxTop + 1] - data[idxBottom + 1]) +
            Math.abs(data[idxTop + 2] - data[idxBottom + 2]) +
            Math.abs(data[idxTop + 3] - data[idxBottom + 3]); // Учитываем alpha

          if (diff < 20) verticalSymmetricMatches++;
        }
      }

      const horizontalSymmetryRatio = horizontalSymmetricMatches / totalChecks;
      const verticalSymmetryRatio = verticalSymmetricMatches / totalChecks;
      const avgSymmetry = (horizontalSymmetryRatio + verticalSymmetryRatio) / 2;

      // Дефолтные иконки (hashicon) - это 6-угольники на прозрачном фоне
      // Они имеют умеренную симметрию (около 0.35-0.45), но не идеально симметричны
      // Слишком высокая симметрия (>0.6) может указывать на простой логотип или геометрическую фигуру
      // Исключаем изображения с слишком высокой симметрией - это не hashicons
      if (avgSymmetry > 0.6) {
        return false;
      }

      // Требуем умеренную симметрию для дефолтных иконок (минимум 0.3, максимум 0.6)
      const isModeratelySymmetric = avgSymmetry >= 0.3 && avgSymmetry <= 0.6;

      // Если симметрия слишком низкая, это не дефолтная иконка
      if (!isModeratelySymmetric) {
        return false;
      }

      // Проверяем, что хотя бы одна ось имеет умеренную симметрию
      const isSymmetric =
        horizontalSymmetryRatio >= 0.3 || verticalSymmetryRatio >= 0.3;

      let blockyScore = 0;
      const blockSize = Math.max(2, Math.floor(width / 16));

      for (let y = 0; y < height - blockSize; y += blockSize) {
        for (let x = 0; x < width - blockSize; x += blockSize) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          let blockUniform = true;
          for (let dy = 0; dy < blockSize && blockUniform; dy++) {
            for (let dx = 0; dx < blockSize && blockUniform; dx++) {
              const checkIdx = ((y + dy) * width + (x + dx)) * 4;
              const diff =
                Math.abs(data[checkIdx] - r) +
                Math.abs(data[checkIdx + 1] - g) +
                Math.abs(data[checkIdx + 2] - b);
              if (diff > 10) blockUniform = false;
            }
          }
          if (blockUniform) blockyScore++;
        }
      }

      const blockyRatio =
        blockyScore /
        (Math.floor(height / blockSize) * Math.floor(width / blockSize));
      const hasBlockyStructure = blockyRatio > 0.3;

      // Комбинированная оценка: дефолтные иконки (hashicon) должны соответствовать нескольким критериям
      // Обязательные критерии для дефолтной иконки:
      // 1. Прозрачность (уже проверено выше)
      // 2. Умеренная симметрия (>= 0.3, но < 0.8) - уже проверено выше
      // 3. Ограниченная палитра
      // 4. Квадратная форма
      // 5. Блочная структура (опционально, но желательно)

      // Дефолтные иконки должны иметь все обязательные критерии
      const hasRequiredCriteria =
        hasTransparency &&
        isModeratelySymmetric &&
        hasLimitedPalette &&
        isSquare;

      // Дополнительные баллы за опциональные критерии
      let score = 0;
      if (isSquare) score += 1;
      if (hasLimitedPalette) score += 2;
      if (hasModerateVariance) score += 1;
      if (isSymmetric) score += 2;
      if (hasBlockyStructure) score += 1;

      // Дефолтная иконка должна иметь все обязательные критерии И набрать минимум 5 баллов
      const isHashicon = hasRequiredCriteria && score >= 5;

      return isHashicon;
    } catch (error) {
      this.logger.error(
        `Error detecting hashicon: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      return false;
    }
  }
}
