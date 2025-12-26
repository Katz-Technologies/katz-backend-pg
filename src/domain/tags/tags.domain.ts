import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { CTagTotalVolumeConfig } from 'src/services/smart-money/const/tag-total-volume-config.const';
import { ETag } from 'src/services/smart-money/enum/tag.type';
import { ETagOtherMetrics } from 'src/services/smart-money/enum/tag-other-metrics.enum';
import { ETagTraderType } from 'src/services/smart-money/enum/tag-trader-type.enum';
import { ETagWinrate } from 'src/services/smart-money/enum/tag-winrate.enum';
import { ETagTotalPnl } from 'src/services/smart-money/enum/tag-total-pnl.enum';
import { ETagAvgRoi } from 'src/services/smart-money/enum/tag-avg-roi.enum';
import { ETagTotalVolume } from 'src/services/smart-money/enum/tag-total-volume.enum';
import { ETagGroupVolume } from 'src/services/smart-money/enum/tag-group-volume.enum';
import { CTagOtherMetricsConfig } from 'src/services/smart-money/const/tag-other-metrics-config.const';
import { SmartMoneySummary } from 'src/services/smart-money/type/smart-money-summary.type';
import { CTagTraderTypeConfig } from 'src/services/smart-money/const/tag-trader-type-config.const';
import { CTagWinrateConfig } from 'src/services/smart-money/const/tag-winrate-config.const';
import { CTagPnlConfig } from 'src/services/smart-money/const/tag-pnl-config.const';
import { CTagAvgRoiConfig } from 'src/services/smart-money/const/tag-avg-roi-config.const';

@Injectable()
export class TagsDomain {
  getTags(summary: SmartMoneySummary): ETag[] {
    const tags: ETag[] = [];

    try {
      this.manageWhale(summary, tags);
      this.manageTraderType(summary, tags);
      this.manageWinrate(summary, tags);
      this.manageTotalPnl(summary, tags);
      this.manageAvgRoi(summary, tags);
      this.manageTotalVolume(summary, tags);
      this.manageGroupVolume(summary, tags);

      summary.tags = tags;
    } catch {
      // Ignore errors
    }

    return tags;
  }

  private manageWhale(summary: SmartMoneySummary, tags: ETag[]): void {
    const isWhale = summary.sales.some(
      (s) => s.fromAmount >= CTagOtherMetricsConfig.Whale,
    );
    if (isWhale) tags.push(ETagOtherMetrics.Whale);
  }

  private manageTraderType(summary: SmartMoneySummary, tags: ETag[]): void {
    const closedPositionsCount = summary.sales.length;
    if (closedPositionsCount === 0) {
      tags.push(ETagTraderType.PassiveTrader);
      return;
    }

    const firstSale = summary.sales[0];
    const lastSale = summary.sales[summary.sales.length - 1];
    if (!firstSale?.chain?.[0] || !lastSale?.chain) {
      tags.push(ETagTraderType.PassiveTrader);
      return;
    }

    const firstTxDate = firstSale.chain[0].txCloseTime;
    const lastChainIndex = lastSale.chain.length - 1;
    const lastTxDate = lastSale.chain[lastChainIndex]?.txCloseTime;

    if (!firstTxDate || !lastTxDate) {
      tags.push(ETagTraderType.PassiveTrader);
      return;
    }

    const firstTxTime =
      firstTxDate instanceof DateTime
        ? firstTxDate.toMillis()
        : DateTime.fromFormat(
            firstTxDate as string,
            'yyyy-MM-dd HH:mm:ss.SSS',
            { zone: 'utc' },
          ).toMillis();
    const lastTxTime =
      lastTxDate instanceof DateTime
        ? lastTxDate.toMillis()
        : DateTime.fromFormat(lastTxDate as string, 'yyyy-MM-dd HH:mm:ss.SSS', {
            zone: 'utc',
          }).toMillis();

    const daysBetween = Math.ceil(
      (lastTxTime - firstTxTime) / (1000 * 60 * 60 * 24),
    );
    const avgPositionsPerDay = Math.round(closedPositionsCount / daysBetween);

    if (avgPositionsPerDay > CTagTraderTypeConfig.Bot)
      tags.push(ETagTraderType.Bot);
    else if (avgPositionsPerDay > CTagTraderTypeConfig.ActiveTrader)
      tags.push(ETagTraderType.ActiveTrader);
    else if (avgPositionsPerDay > CTagTraderTypeConfig.BacisTrader)
      tags.push(ETagTraderType.BacisTrader);
    else tags.push(ETagTraderType.PassiveTrader);
  }

  private manageWinrate(summary: SmartMoneySummary, tags: ETag[]): void {
    const winrate = summary.winrate;
    if (winrate > CTagWinrateConfig.VeryHighWinrate)
      tags.push(ETagWinrate.VeryHighWinrate);
    else if (winrate > CTagWinrateConfig.HighWinrate)
      tags.push(ETagWinrate.HighWinrate);
    else if (winrate > CTagWinrateConfig.MidWinrate)
      tags.push(ETagWinrate.MidWinrate);
    else tags.push(ETagWinrate.LowWinrate);
  }

  private manageTotalPnl(summary: SmartMoneySummary, tags: ETag[]): void {
    const totalPnl = summary.totalPnl;
    if (totalPnl > CTagPnlConfig.VeryHighPnl)
      tags.push(ETagTotalPnl.VeryHighPnl);
    else if (totalPnl > CTagPnlConfig.HighPnl) tags.push(ETagTotalPnl.HighPnl);
    else if (totalPnl > CTagPnlConfig.MidPnl) tags.push(ETagTotalPnl.MidPnl);
    else if (totalPnl > CTagPnlConfig.LowPnl) tags.push(ETagTotalPnl.LowPnl);
    else tags.push(ETagTotalPnl.NegativePnl);
  }

  private manageAvgRoi(summary: SmartMoneySummary, tags: ETag[]): void {
    const avgRoi = summary.avgRoi;
    if (avgRoi > CTagAvgRoiConfig.VeryHighRoi)
      tags.push(ETagAvgRoi.VeryHighRoi);
    else if (avgRoi > CTagAvgRoiConfig.HighRoi) tags.push(ETagAvgRoi.HighRoi);
    else if (avgRoi > CTagAvgRoiConfig.MidRoi) tags.push(ETagAvgRoi.MidRoi);
    else tags.push(ETagAvgRoi.LowRoi);
  }

  private manageTotalVolume(summary: SmartMoneySummary, tags: ETag[]): void {
    const totalVolume = summary.totalVolume;
    if (totalVolume > CTagTotalVolumeConfig.VeryHighTotalVolume)
      tags.push(ETagTotalVolume.VeryHighTotalVolume);
    else if (totalVolume > CTagTotalVolumeConfig.HighTotalVolume)
      tags.push(ETagTotalVolume.HighTotalVolume);
    else if (totalVolume > CTagTotalVolumeConfig.MidTotalVolume)
      tags.push(ETagTotalVolume.MidTotalVolume);
    else tags.push(ETagTotalVolume.LowTotalVolume);
  }

  private manageGroupVolume(summary: SmartMoneySummary, tags: ETag[]): void {
    let tokensWithHighVolume = 0;

    for (const token in summary.saleVolumes) {
      const volumes = summary.saleVolumes[token];
      if (!volumes) continue;

      const totalTokenVolume = volumes.totalVolume;

      if (totalTokenVolume > 100) {
        tokensWithHighVolume++;
      }
    }

    if (tokensWithHighVolume < 5) {
      tags.push(ETagGroupVolume.SmallGroupVolume);
    } else {
      tags.push(ETagGroupVolume.BigGroupVolume);
    }
  }
}
