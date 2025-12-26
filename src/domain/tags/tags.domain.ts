import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { CTagTotalVolumeConfig } from 'src/service/smart_money/const/tag-total-volume-config.const';
import { ETag } from 'src/service/smart_money/enum/tag.type';
import { ETagOtherMetrics } from 'src/service/smart_money/enum/tag-other-metrics.enum';
import { ETagTraderType } from 'src/service/smart_money/enum/tag-trader-type.enum';
import { ETagWinrate } from 'src/service/smart_money/enum/tag-winrate.enum';
import { ETagTotalPnl } from 'src/service/smart_money/enum/tag-total-pnl.enum';
import { ETagAvgRoi } from 'src/service/smart_money/enum/tag-avg-roi.enum';
import { ETagTotalVolume } from 'src/service/smart_money/enum/tag-total-volume.enum';
import { ETagGroupVolume } from 'src/service/smart_money/enum/tag-group-volume.enum';
import { CTagOtherMetricsConfig } from 'src/service/smart_money/const/tag-other-metrics-config.const';
import { SmartMoneySummary } from 'src/service/smart_money/type/smart-money-summary.type';
import { CTagTraderTypeConfig } from 'src/service/smart_money/const/tag-trader-type-config.const';
import { CTagWinrateConfig } from 'src/service/smart_money/const/tag-winrate-config.const';
import { CTagPnlConfig } from 'src/service/smart_money/const/tag-pnl-config.const';
import { CTagAvgRoiConfig } from 'src/service/smart_money/const/tag-avg-roi-config.const';

@Injectable()
export class TagsDomain {
  getTags(summary: SmartMoneySummary): ETag[] {
    const tags: ETag[] = [];

    function manageWhale() {
      const isWhale = summary.sales.some(
        (s) => s.fromAmount >= CTagOtherMetricsConfig.Whale,
      );
      if (isWhale) tags.push(ETagOtherMetrics.Whale);
    }

    function manageTraderType() {
      const closedPositionsCount = summary.sales.length;
      const firstTxDate = summary.sales[0].chain[0].txCloseTime;
      const lastTxDate =
        summary.sales[summary.sales.length - 1].chain[
          summary.sales[summary.sales.length - 1].chain.length - 1
        ].txCloseTime;

      // txCloseTime теперь DateTime, но может быть строкой после десериализации из Redis
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
          : DateTime.fromFormat(
              lastTxDate as string,
              'yyyy-MM-dd HH:mm:ss.SSS',
              { zone: 'utc' },
            ).toMillis();

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

    function manageWinrate() {
      const winrate = summary.winrate;
      if (winrate > CTagWinrateConfig.VeryHighWinrate)
        tags.push(ETagWinrate.VeryHighWinrate);
      else if (winrate > CTagWinrateConfig.HighWinrate)
        tags.push(ETagWinrate.HighWinrate);
      else if (winrate > CTagWinrateConfig.MidWinrate)
        tags.push(ETagWinrate.MidWinrate);
      else tags.push(ETagWinrate.LowWinrate);
    }

    function manageTotalPnl() {
      const totalPnl = summary.totalPnl;
      if (totalPnl > CTagPnlConfig.VeryHighPnl)
        tags.push(ETagTotalPnl.VeryHighPnl);
      else if (totalPnl > CTagPnlConfig.HighPnl)
        tags.push(ETagTotalPnl.HighPnl);
      else if (totalPnl > CTagPnlConfig.MidPnl) tags.push(ETagTotalPnl.MidPnl);
      else if (totalPnl > CTagPnlConfig.LowPnl) tags.push(ETagTotalPnl.LowPnl);
      else tags.push(ETagTotalPnl.NegativePnl);
    }

    function manageAvgRoi() {
      const avgRoi = summary.avgRoi;
      if (avgRoi > CTagAvgRoiConfig.VeryHighRoi)
        tags.push(ETagAvgRoi.VeryHighRoi);
      else if (avgRoi > CTagAvgRoiConfig.HighRoi) tags.push(ETagAvgRoi.HighRoi);
      else if (avgRoi > CTagAvgRoiConfig.MidRoi) tags.push(ETagAvgRoi.MidRoi);
      else tags.push(ETagAvgRoi.LowRoi);
    }

    function manageTotalVolume() {
      const totalVolume = summary.totalVolume;
      if (totalVolume > CTagTotalVolumeConfig.VeryHighTotalVolume)
        tags.push(ETagTotalVolume.VeryHighTotalVolume);
      else if (totalVolume > CTagTotalVolumeConfig.HighTotalVolume)
        tags.push(ETagTotalVolume.HighTotalVolume);
      else if (totalVolume > CTagTotalVolumeConfig.MidTotalVolume)
        tags.push(ETagTotalVolume.MidTotalVolume);
      else tags.push(ETagTotalVolume.LowTotalVolume);
    }

    function manageGroupVolume() {
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

    try {
      manageWhale();
      manageTraderType();
      manageWinrate();
      manageTotalPnl();
      manageAvgRoi();
      manageTotalVolume();
      manageGroupVolume();

      summary.tags = tags;
    } catch {
      // Игнорируем ошибки при обработке тегов
    }

    return tags;
  }
}
