import { Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { MoneyFlowRow } from 'src/services/smart-money/interface/money-flow-row.interface';
import {
  TokenVolumeCharts,
  VolumeChartPoint,
} from 'src/services/smart-money/type/token-summary.type';
import { BalanceData } from 'src/services/smart-money/type/balance-data.type';

export interface TokenTradersCharts {
  hour: VolumeChartPoint[];
  day: VolumeChartPoint[];
  week: VolumeChartPoint[];
  month: VolumeChartPoint[];
}

export interface TokenHoldersCharts {
  hour: VolumeChartPoint[];
  day: VolumeChartPoint[];
  week: VolumeChartPoint[];
  month: VolumeChartPoint[];
}

export interface TokenChartsData {
  volumes: Record<string, TokenVolumeCharts>;
  traders: Record<string, TokenTradersCharts>;
}

@Injectable()
export class ChartDomain {
  private readonly HOUR_SECONDS = 60 * 60;
  private readonly DAY_SECONDS = 24 * 60 * 60;
  private readonly WEEK_SECONDS = 7 * 24 * 60 * 60;
  private readonly MONTH_SECONDS = 30 * 24 * 60 * 60;

  private readonly logger = new Logger(ChartDomain.name);

  /**
   * Парсит closeTime из строки в DateTime (UTC)
   * Формат ClickHouse: 2025-11-24 11:15:12.000
   */
  private parseCloseTime(closeTime: string | Date | DateTime): DateTime {
    if (closeTime instanceof DateTime) {
      return closeTime;
    }

    if (closeTime instanceof Date) {
      return DateTime.fromJSDate(closeTime, { zone: 'utc' });
    }

    // Формат ClickHouse: yyyy-MM-dd HH:mm:ss.SSS
    let dateTime = DateTime.fromFormat(closeTime, 'yyyy-MM-dd HH:mm:ss.SSS', {
      zone: 'utc',
    });
    if (!dateTime.isValid) {
      // Пробуем без миллисекунд: yyyy-MM-dd HH:mm:ss
      dateTime = DateTime.fromFormat(closeTime, 'yyyy-MM-dd HH:mm:ss', {
        zone: 'utc',
      });
    }
    if (!dateTime.isValid) {
      // Fallback: используем стандартный Date
      dateTime = DateTime.fromJSDate(new Date(closeTime), { zone: 'utc' });
    }

    return dateTime;
  }

  private getHourInterval(): number {
    return this.HOUR_SECONDS / 60;
  }

  private getDayInterval(): number {
    return this.DAY_SECONDS / 60;
  }

  private getWeekInterval(): number {
    return this.WEEK_SECONDS / 60;
  }

  private getMonthInterval(): number {
    return this.MONTH_SECONDS / 60;
  }

  private initializeVolumeCharts(
    token: string,
    volumeCharts: Record<string, TokenVolumeCharts>,
    nowSeconds: number,
  ): TokenVolumeCharts {
    if (!volumeCharts[token]) {
      const hour: { timestamp: number; value: number }[] = [];
      const day: { timestamp: number; value: number }[] = [];
      const week: { timestamp: number; value: number }[] = [];
      const month: { timestamp: number; value: number }[] = [];

      const HOUR_INTERVAL = this.getHourInterval();
      const DAY_INTERVAL = this.getDayInterval();
      const WEEK_INTERVAL = this.getWeekInterval();
      const MONTH_INTERVAL = this.getMonthInterval();

      for (let i = 1; i <= 60; i++) {
        // i = 0: минута 0 (60 минут назад), i = 59: минута 59 (1 минута назад)
        const hourTimestamp = nowSeconds - (60 - i) * HOUR_INTERVAL;
        const dayTimestamp = nowSeconds - (60 - i) * DAY_INTERVAL;
        const weekTimestamp = nowSeconds - (60 - i) * WEEK_INTERVAL;
        const monthTimestamp = nowSeconds - (60 - i) * MONTH_INTERVAL;

        hour.push({ timestamp: hourTimestamp * 1000, value: 0 });
        day.push({ timestamp: dayTimestamp * 1000, value: 0 });
        week.push({ timestamp: weekTimestamp * 1000, value: 0 });
        month.push({ timestamp: monthTimestamp * 1000, value: 0 });
      }

      volumeCharts[token] = { hour, day, week, month };
    }
    return volumeCharts[token];
  }

  private getOrCreateTradersData(
    token: string,
    tradersDataByInterval: Record<
      string,
      {
        hour: Map<number, Set<string>>;
        day: Map<number, Set<string>>;
        week: Map<number, Set<string>>;
        month: Map<number, Set<string>>;
      }
    >,
  ): {
    hour: Map<number, Set<string>>;
    day: Map<number, Set<string>>;
    week: Map<number, Set<string>>;
    month: Map<number, Set<string>>;
  } {
    if (!tradersDataByInterval[token]) {
      tradersDataByInterval[token] = {
        hour: new Map(),
        day: new Map(),
        week: new Map(),
        month: new Map(),
      };
    }
    return tradersDataByInterval[token];
  }

  private addVolumeToInterval(
    charts: TokenVolumeCharts,
    timestampSeconds: number,
    volume: number,
    nowSeconds: number,
  ): void {
    const timeDiff = nowSeconds - timestampSeconds;

    this.addVolumeToSingleInterval(
      charts.hour,
      timeDiff,
      this.HOUR_SECONDS,
      this.getHourInterval(),
      volume,
    );
    this.addVolumeToSingleInterval(
      charts.day,
      timeDiff,
      this.DAY_SECONDS,
      this.getDayInterval(),
      volume,
    );
    this.addVolumeToSingleInterval(
      charts.week,
      timeDiff,
      this.WEEK_SECONDS,
      this.getWeekInterval(),
      volume,
    );
    this.addVolumeToSingleInterval(
      charts.month,
      timeDiff,
      this.MONTH_SECONDS,
      this.getMonthInterval(),
      volume,
    );
  }

  private addVolumeToSingleInterval(
    chartArray: VolumeChartPoint[],
    timeDiff: number,
    maxSeconds: number,
    interval: number,
    volume: number,
  ): void {
    if (timeDiff >= 0 && timeDiff <= maxSeconds) {
      let index = Math.floor(timeDiff / interval);
      if (index >= 60) index = 59;
      if (index >= 0 && index < 60) {
        const arrayIndex = 59 - index;
        const chartPoint = chartArray[arrayIndex];
        if (chartPoint) {
          chartPoint.value += volume;
        }
      }
    }
  }

  private addTradersToInterval(
    tokenData: {
      hour: Map<number, Set<string>>;
      day: Map<number, Set<string>>;
      week: Map<number, Set<string>>;
      month: Map<number, Set<string>>;
    },
    address: string,
    timeDiff: number,
  ): void {
    this.addTraderToSingleInterval(
      tokenData.hour,
      address,
      timeDiff,
      this.HOUR_SECONDS,
      this.getHourInterval(),
    );
    this.addTraderToSingleInterval(
      tokenData.day,
      address,
      timeDiff,
      this.DAY_SECONDS,
      this.getDayInterval(),
    );
    this.addTraderToSingleInterval(
      tokenData.week,
      address,
      timeDiff,
      this.WEEK_SECONDS,
      this.getWeekInterval(),
    );
    this.addTraderToSingleInterval(
      tokenData.month,
      address,
      timeDiff,
      this.MONTH_SECONDS,
      this.getMonthInterval(),
    );
  }

  private addTraderToSingleInterval(
    intervalMap: Map<number, Set<string>>,
    address: string,
    timeDiff: number,
    maxSeconds: number,
    interval: number,
  ): void {
    if (timeDiff >= 0 && timeDiff <= maxSeconds) {
      let index = Math.floor(timeDiff / interval);
      if (index >= 60) index = 59;
      if (index >= 0 && index < 60) {
        const arrayIndex = 59 - index;
        if (!intervalMap.has(arrayIndex)) {
          intervalMap.set(arrayIndex, new Set());
        }
        intervalMap.get(arrayIndex)!.add(address);
      }
    }
  }

  buildTokenCharts(moneyFlows: MoneyFlowRow[]): TokenChartsData {
    const now = DateTime.now();
    const nowSeconds = now.toSeconds();

    this.parseDateRange(moneyFlows);

    const volumeCharts: Record<string, TokenVolumeCharts> = {};
    const tradersDataByInterval: Record<
      string,
      {
        hour: Map<number, Set<string>>;
        day: Map<number, Set<string>>;
        week: Map<number, Set<string>>;
        month: Map<number, Set<string>>;
      }
    > = {};

    this.processMoneyFlows(
      moneyFlows,
      volumeCharts,
      tradersDataByInterval,
      nowSeconds,
    );

    const tradersCharts = this.buildTradersCharts(
      tradersDataByInterval,
      nowSeconds,
    );

    return {
      volumes: volumeCharts,
      traders: tradersCharts,
    };
  }

  private parseDateRange(moneyFlows: MoneyFlowRow[]): void {
    if (moneyFlows.length === 0) return;

    const firstFlow = moneyFlows[0];
    const lastFlow = moneyFlows[moneyFlows.length - 1];

    if (firstFlow) {
      this.parseDateTimeString(firstFlow.close_time);
    }
    if (lastFlow) {
      this.parseDateTimeString(lastFlow.close_time);
    }
  }

  private parseDateTimeString(dateString: string): DateTime {
    let date = DateTime.fromISO(dateString, { zone: 'utc' });
    if (!date.isValid) {
      date = DateTime.fromSQL(dateString, { zone: 'utc' });
    }
    if (!date.isValid) {
      date = DateTime.fromFormat(dateString, 'yyyy-MM-dd HH:mm:ss.SSS', {
        zone: 'utc',
      });
    }
    if (!date.isValid) {
      date = DateTime.fromFormat(dateString, 'yyyy-MM-dd HH:mm:ss', {
        zone: 'utc',
      });
    }
    return date;
  }

  private processMoneyFlows(
    moneyFlows: MoneyFlowRow[],
    volumeCharts: Record<string, TokenVolumeCharts>,
    tradersDataByInterval: Record<
      string,
      {
        hour: Map<number, Set<string>>;
        day: Map<number, Set<string>>;
        week: Map<number, Set<string>>;
        month: Map<number, Set<string>>;
      }
    >,
    nowSeconds: number,
  ): void {
    moneyFlows.forEach((moneyFlow) => {
      this.processMoneyFlow(
        moneyFlow,
        volumeCharts,
        tradersDataByInterval,
        nowSeconds,
      );
    });
  }

  private processMoneyFlow(
    moneyFlow: MoneyFlowRow,
    volumeCharts: Record<string, TokenVolumeCharts>,
    tradersDataByInterval: Record<
      string,
      {
        hour: Map<number, Set<string>>;
        day: Map<number, Set<string>>;
        week: Map<number, Set<string>>;
        month: Map<number, Set<string>>;
      }
    >,
    nowSeconds: number,
  ): void {
    const {
      from_asset,
      to_asset,
      from_amount,
      to_amount,
      from_address,
      to_address,
      close_time,
    } = moneyFlow;

    if (
      from_asset === 'XLM.r44CR5cYKVyzuJpFUtF2ZRDizVZpvtkc4C' ||
      to_asset === 'XLM.r44CR5cYKVyzuJpFUtF2ZRDizVZpvtkc4C'
    ) {
      this.logger.debug(
        `[XLM] Processing moneyFlow: from_asset=${from_asset}, to_asset=${to_asset}, from_address=${from_address}, to_address=${to_address}, close_time=${close_time}`,
      );
    }

    const timestampSeconds = this.parseCloseTimeToSeconds(close_time);
    if (!timestampSeconds) return;

    const timeDiff = nowSeconds - timestampSeconds;
    if (timeDiff < 0 || timeDiff > this.MONTH_SECONDS) return;

    this.processAsset(
      from_asset,
      from_amount,
      from_address,
      volumeCharts,
      tradersDataByInterval,
      timestampSeconds,
      timeDiff,
      nowSeconds,
    );

    this.processAsset(
      to_asset,
      to_amount,
      to_address,
      volumeCharts,
      tradersDataByInterval,
      timestampSeconds,
      timeDiff,
      nowSeconds,
    );
  }

  private parseCloseTimeToSeconds(closeTime: string): number | null {
    try {
      const dateTime = this.parseDateTimeString(closeTime);
      return dateTime.isValid ? dateTime.toSeconds() : null;
    } catch (error) {
      this.logger.log('Error parsing date:', closeTime, error);
      return null;
    }
  }

  private processAsset(
    asset: string | null,
    amount: string | null,
    address: string | null,
    volumeCharts: Record<string, TokenVolumeCharts>,
    tradersDataByInterval: Record<
      string,
      {
        hour: Map<number, Set<string>>;
        day: Map<number, Set<string>>;
        week: Map<number, Set<string>>;
        month: Map<number, Set<string>>;
      }
    >,
    timestampSeconds: number,
    timeDiff: number,
    nowSeconds: number,
  ): void {
    if (!asset) return;

    const volumeChartsForToken = this.initializeVolumeCharts(
      asset,
      volumeCharts,
      nowSeconds,
    );

    const volume = Math.abs(parseFloat(amount || '0'));
    if (volume > 0) {
      this.addVolumeToInterval(
        volumeChartsForToken,
        timestampSeconds,
        volume,
        nowSeconds,
      );
    }

    if (address) {
      const tradersData = this.getOrCreateTradersData(
        asset,
        tradersDataByInterval,
      );
      this.addTradersToInterval(tradersData, address, timeDiff);
    }
  }

  private buildTradersCharts(
    tradersDataByInterval: Record<
      string,
      {
        hour: Map<number, Set<string>>;
        day: Map<number, Set<string>>;
        week: Map<number, Set<string>>;
        month: Map<number, Set<string>>;
      }
    >,
    nowSeconds: number,
  ): Record<string, TokenTradersCharts> {
    const tradersCharts: Record<string, TokenTradersCharts> = {};

    for (const token in tradersDataByInterval) {
      const tokenData = tradersDataByInterval[token];
      if (!tokenData) continue;

      const charts = this.initializeTradersChartPoints(nowSeconds);

      this.populateTradersChart(charts.hour, tokenData.hour);
      this.populateTradersChart(charts.day, tokenData.day);
      this.populateTradersChart(charts.week, tokenData.week);
      this.populateTradersChart(charts.month, tokenData.month);

      tradersCharts[token] = charts;
    }

    return tradersCharts;
  }

  private initializeTradersChartPoints(nowSeconds: number): TokenTradersCharts {
    const hour: VolumeChartPoint[] = [];
    const day: VolumeChartPoint[] = [];
    const week: VolumeChartPoint[] = [];
    const month: VolumeChartPoint[] = [];

    const HOUR_INTERVAL = this.getHourInterval();
    const DAY_INTERVAL = this.getDayInterval();
    const WEEK_INTERVAL = this.getWeekInterval();
    const MONTH_INTERVAL = this.getMonthInterval();

    for (let i = 1; i <= 60; i++) {
      const hourTimestamp = nowSeconds - (60 - i) * HOUR_INTERVAL;
      const dayTimestamp = nowSeconds - (60 - i) * DAY_INTERVAL;
      const weekTimestamp = nowSeconds - (60 - i) * WEEK_INTERVAL;
      const monthTimestamp = nowSeconds - (60 - i) * MONTH_INTERVAL;

      hour.push({ timestamp: hourTimestamp * 1000, value: 0 });
      day.push({ timestamp: dayTimestamp * 1000, value: 0 });
      week.push({ timestamp: weekTimestamp * 1000, value: 0 });
      month.push({ timestamp: monthTimestamp * 1000, value: 0 });
    }

    return { hour, day, week, month };
  }

  private populateTradersChart(
    chart: VolumeChartPoint[],
    intervalMap: Map<number, Set<string>>,
  ): void {
    intervalMap.forEach((addresses, arrayIndex) => {
      if (arrayIndex >= 0 && arrayIndex < 60) {
        const chartPoint = chart[arrayIndex];
        if (chartPoint) {
          chartPoint.value = addresses.size;
        }
      }
    });
  }

  buildTokenHoldersChartsFromBalances(
    tokenBalances: Record<string, Record<string, BalanceData[]>>,
  ): Record<string, TokenHoldersCharts> {
    const now = DateTime.now();
    const nowSeconds = now.toSeconds();

    const holdersCharts: Record<string, TokenHoldersCharts> = {};

    for (const token in tokenBalances) {
      const addressBalances = tokenBalances[token];
      if (addressBalances) {
        holdersCharts[token] = this.buildTokenHoldersChart(
          addressBalances,
          nowSeconds,
        );
      }
    }

    return holdersCharts;
  }

  private buildTokenHoldersChart(
    addressBalances: Record<string, BalanceData[]>,
    nowSeconds: number,
  ): TokenHoldersCharts {
    const charts = this.initializeHoldersChartPoints(nowSeconds);
    const processedBalances = this.processAddressBalances(addressBalances);
    this.populateHoldersCharts(charts, processedBalances, nowSeconds);

    return charts;
  }

  private initializeHoldersChartPoints(nowSeconds: number): TokenHoldersCharts {
    const hour: VolumeChartPoint[] = [];
    const day: VolumeChartPoint[] = [];
    const week: VolumeChartPoint[] = [];
    const month: VolumeChartPoint[] = [];

    const HOUR_INTERVAL = this.getHourInterval();
    const DAY_INTERVAL = this.getDayInterval();
    const WEEK_INTERVAL = this.getWeekInterval();
    const MONTH_INTERVAL = this.getMonthInterval();

    for (let i = 1; i <= 60; i++) {
      const hourTimestamp = nowSeconds - (60 - i) * HOUR_INTERVAL;
      const dayTimestamp = nowSeconds - (60 - i) * DAY_INTERVAL;
      const weekTimestamp = nowSeconds - (60 - i) * WEEK_INTERVAL;
      const monthTimestamp = nowSeconds - (60 - i) * MONTH_INTERVAL;

      hour.push({ timestamp: hourTimestamp * 1000, value: 0 });
      day.push({ timestamp: dayTimestamp * 1000, value: 0 });
      week.push({ timestamp: weekTimestamp * 1000, value: 0 });
      month.push({ timestamp: monthTimestamp * 1000, value: 0 });
    }

    return { hour, day, week, month };
  }

  private processAddressBalances(
    addressBalances: Record<string, BalanceData[]>,
  ): Record<
    string,
    Array<{ balance: number; timeSeconds: number; inLedgerIndex: number }>
  > {
    const processedBalances: Record<
      string,
      Array<{ balance: number; timeSeconds: number; inLedgerIndex: number }>
    > = {};

    for (const [address, balances] of Object.entries(addressBalances)) {
      processedBalances[address] = this.processBalanceData(balances);
    }

    return processedBalances;
  }

  private processBalanceData(
    balances: BalanceData[],
  ): Array<{ balance: number; timeSeconds: number; inLedgerIndex: number }> {
    return balances
      .map((b) => {
        const dateTime = this.parseCloseTime(b.closeTime);

        if (!dateTime.isValid) {
          this.logger.warn(
            `Failed to parse closeTime for balance: ${JSON.stringify(b.closeTime)}`,
          );
          return null;
        }

        return {
          balance: b.balance,
          timeSeconds: dateTime.toSeconds(),
          inLedgerIndex: b.inLedgerIndex,
        };
      })
      .filter(
        (
          p,
        ): p is {
          balance: number;
          timeSeconds: number;
          inLedgerIndex: number;
        } => p !== null,
      )
      .sort((a, b) => {
        if (a.timeSeconds !== b.timeSeconds)
          return a.timeSeconds - b.timeSeconds;
        return a.inLedgerIndex - b.inLedgerIndex;
      });
  }

  private populateHoldersCharts(
    charts: TokenHoldersCharts,
    processedBalances: Record<
      string,
      Array<{ balance: number; timeSeconds: number; inLedgerIndex: number }>
    >,
    nowSeconds: number,
  ): void {
    const HOUR_INTERVAL = this.getHourInterval();
    const DAY_INTERVAL = this.getDayInterval();
    const WEEK_INTERVAL = this.getWeekInterval();
    const MONTH_INTERVAL = this.getMonthInterval();

    for (let arrayIndex = 0; arrayIndex < 60; arrayIndex++) {
      const hourRange = this.getIntervalRange(
        arrayIndex,
        nowSeconds,
        HOUR_INTERVAL,
      );
      const dayRange = this.getIntervalRange(
        arrayIndex,
        nowSeconds,
        DAY_INTERVAL,
      );
      const weekRange = this.getIntervalRange(
        arrayIndex,
        nowSeconds,
        WEEK_INTERVAL,
      );
      const monthRange = this.getIntervalRange(
        arrayIndex,
        nowSeconds,
        MONTH_INTERVAL,
      );

      const hourPoint = charts.hour[arrayIndex];
      const dayPoint = charts.day[arrayIndex];
      const weekPoint = charts.week[arrayIndex];
      const monthPoint = charts.month[arrayIndex];

      if (hourPoint) {
        hourPoint.value = this.countHoldersInRange(
          processedBalances,
          hourRange.start,
          hourRange.end,
        );
      }
      if (dayPoint) {
        dayPoint.value = this.countHoldersInRange(
          processedBalances,
          dayRange.start,
          dayRange.end,
        );
      }
      if (weekPoint) {
        weekPoint.value = this.countHoldersInRange(
          processedBalances,
          weekRange.start,
          weekRange.end,
        );
      }
      if (monthPoint) {
        monthPoint.value = this.countHoldersInRange(
          processedBalances,
          monthRange.start,
          monthRange.end,
        );
      }
    }
  }

  private getIntervalRange(
    arrayIndex: number,
    nowSeconds: number,
    interval: number,
  ): { start: number; end: number } {
    const startTime =
      arrayIndex === 0
        ? nowSeconds - 60 * interval
        : nowSeconds - (60 - arrayIndex) * interval;
    const endTime = nowSeconds - (60 - arrayIndex - 1) * interval;

    return { start: startTime, end: endTime };
  }

  private countHoldersInRange(
    processedBalances: Record<
      string,
      Array<{ balance: number; timeSeconds: number; inLedgerIndex: number }>
    >,
    startTime: number,
    endTime: number,
  ): number {
    const holders = new Set<string>();

    for (const [address, processed] of Object.entries(processedBalances)) {
      if (
        this.hasPositiveBalanceInRangeOptimized(processed, startTime, endTime)
      ) {
        holders.add(address);
      }
    }

    return holders.size;
  }

  /**
   * Оптимизированная версия hasPositiveBalanceInRange для предобработанных балансов
   * processedBalances уже отсортированы и имеют timeSeconds вместо closeTime
   */
  private hasPositiveBalanceInRangeOptimized(
    processedBalances: Array<{
      balance: number;
      timeSeconds: number;
      inLedgerIndex: number;
    }>,
    startTimeSeconds: number,
    endTimeSeconds: number,
  ): boolean {
    if (!processedBalances || processedBalances.length === 0) {
      return false;
    }

    const balanceContext = this.findBalanceContext(
      processedBalances,
      startTimeSeconds,
      endTimeSeconds,
    );

    if (!this.hasAnyPositiveBalance(balanceContext)) {
      return false;
    }

    return this.checkHolderStatus(balanceContext, endTimeSeconds);
  }

  private findBalanceContext(
    processedBalances: Array<{
      balance: number;
      timeSeconds: number;
      inLedgerIndex: number;
    }>,
    startTimeSeconds: number,
    endTimeSeconds: number,
  ): {
    lastBeforeStart: {
      balance: number;
      timeSeconds: number;
      inLedgerIndex: number;
    } | null;
    balancesInRange: Array<{
      balance: number;
      timeSeconds: number;
      inLedgerIndex: number;
    }>;
    firstAfterRange: {
      balance: number;
      timeSeconds: number;
      inLedgerIndex: number;
    } | null;
  } {
    let lastBalanceBeforeOrAtStart: {
      balance: number;
      timeSeconds: number;
      inLedgerIndex: number;
    } | null = null;
    for (const balance of processedBalances) {
      if (balance.timeSeconds <= startTimeSeconds) {
        lastBalanceBeforeOrAtStart = balance;
      } else {
        break;
      }
    }

    const balancesInRange: Array<{
      balance: number;
      timeSeconds: number;
      inLedgerIndex: number;
    }> = [];
    for (const balance of processedBalances) {
      if (
        balance.timeSeconds >= startTimeSeconds &&
        balance.timeSeconds <= endTimeSeconds
      ) {
        balancesInRange.push(balance);
      } else if (balance.timeSeconds > endTimeSeconds) {
        break;
      }
    }

    let firstBalanceAfterRange: {
      balance: number;
      timeSeconds: number;
      inLedgerIndex: number;
    } | null = null;
    for (const balance of processedBalances) {
      if (balance.timeSeconds > endTimeSeconds) {
        firstBalanceAfterRange = balance;
        break;
      }
    }

    return {
      lastBeforeStart: lastBalanceBeforeOrAtStart,
      balancesInRange,
      firstAfterRange: firstBalanceAfterRange,
    };
  }

  private hasAnyPositiveBalance(context: {
    lastBeforeStart: {
      balance: number;
      timeSeconds: number;
      inLedgerIndex: number;
    } | null;
    balancesInRange: Array<{
      balance: number;
      timeSeconds: number;
      inLedgerIndex: number;
    }>;
    firstAfterRange: {
      balance: number;
      timeSeconds: number;
      inLedgerIndex: number;
    } | null;
  }): boolean {
    const balanceAtStart =
      context.balancesInRange.length > 0
        ? context.balancesInRange[0]
        : context.lastBeforeStart;

    const hadPositiveAtStart = balanceAtStart
      ? balanceAtStart.balance > 0
      : false;
    const hasPositiveInRange = context.balancesInRange.some(
      (b) => b.balance > 0,
    );
    const hadPositiveBeforeStart = context.lastBeforeStart
      ? context.lastBeforeStart.balance > 0
      : false;

    return hadPositiveAtStart || hasPositiveInRange || hadPositiveBeforeStart;
  }

  private checkHolderStatus(
    context: {
      lastBeforeStart: {
        balance: number;
        timeSeconds: number;
        inLedgerIndex: number;
      } | null;
      balancesInRange: Array<{
        balance: number;
        timeSeconds: number;
        inLedgerIndex: number;
      }>;
      firstAfterRange: {
        balance: number;
        timeSeconds: number;
        inLedgerIndex: number;
      } | null;
    },
    endTimeSeconds: number,
  ): boolean {
    const balanceAtEnd =
      context.balancesInRange.length > 0
        ? context.balancesInRange[context.balancesInRange.length - 1]
        : context.lastBeforeStart;

    if (balanceAtEnd && balanceAtEnd.balance === 0) {
      return this.hasAnyPositiveBalance(context);
    }

    if (
      context.firstAfterRange &&
      context.firstAfterRange.balance === 0 &&
      context.firstAfterRange.timeSeconds - endTimeSeconds < 300
    ) {
      return false;
    }

    return true;
  }

  /**
   * Проверяет, был ли у адреса положительный баланс в указанном временном диапазоне
   * и не стал ли он нулевым до конца диапазона
   */
  private hasPositiveBalanceInRange(
    balances: BalanceData[],
    startTimeSeconds: number,
    endTimeSeconds: number,
  ): boolean {
    if (!balances || balances.length === 0) {
      return false;
    }

    const processedBalances: Array<{
      balance: number;
      timeSeconds: number;
      inLedgerIndex: number;
    }> = balances
      .map((b) => {
        const dateTime = this.parseCloseTime(b.closeTime);
        if (!dateTime.isValid) {
          return null;
        }
        return {
          balance: b.balance,
          timeSeconds: dateTime.toSeconds(),
          inLedgerIndex: b.inLedgerIndex,
        };
      })
      .filter(
        (
          p,
        ): p is {
          balance: number;
          timeSeconds: number;
          inLedgerIndex: number;
        } => p !== null,
      )
      .sort((a, b) => {
        if (a.timeSeconds !== b.timeSeconds)
          return a.timeSeconds - b.timeSeconds;
        return a.inLedgerIndex - b.inLedgerIndex;
      });

    return this.hasPositiveBalanceInRangeOptimized(
      processedBalances,
      startTimeSeconds,
      endTimeSeconds,
    );
  }
}
