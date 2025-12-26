import { Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { MoneyFlowRow } from 'src/service/smart_money/interface/money-flow-row.interface';
import {
  TokenVolumeCharts,
  VolumeChartPoint,
} from 'src/service/smart_money/type/token-summary.type';
import { BalanceData } from 'src/service/smart_money/type/balance-data.type';

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
  ) {
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
    const HOUR_INTERVAL = this.getHourInterval();
    const DAY_INTERVAL = this.getDayInterval();
    const WEEK_INTERVAL = this.getWeekInterval();
    const MONTH_INTERVAL = this.getMonthInterval();

    // Обрабатываем транзакции за последний час (от 0 до 3600 секунд назад включительно)
    // timeDiff = 0 означает текущий момент, timeDiff = 3600 означает час назад
    if (timeDiff >= 0 && timeDiff <= this.HOUR_SECONDS) {
      let hourIndex = Math.floor(timeDiff / HOUR_INTERVAL);
      // hourIndex может быть от 0 до 60 (61 минута), но нам нужно только 0-59
      // hourIndex = 0: текущая минута, hourIndex = 60: ровно час назад (минута 0)
      if (hourIndex >= 60) hourIndex = 59;
      if (hourIndex >= 0 && hourIndex < 60) {
        // arrayIndex = 59 означает текущую минуту (timeDiff близко к 0, hourIndex = 0)
        // arrayIndex = 0 означает минуту 0 (60 минут назад, timeDiff = 3600, hourIndex = 60 → 59)
        const arrayIndex = 59 - hourIndex;
        charts.hour[arrayIndex].value += volume;
      }
    }

    // Обрабатываем транзакции за последний день (от 0 до 86400 секунд назад включительно)
    if (timeDiff >= 0 && timeDiff <= this.DAY_SECONDS) {
      let dayIndex = Math.floor(timeDiff / DAY_INTERVAL);
      if (dayIndex >= 60) dayIndex = 59;
      if (dayIndex >= 0 && dayIndex < 60) {
        const arrayIndex = 59 - dayIndex;
        charts.day[arrayIndex].value += volume;
      }
    }

    // Обрабатываем транзакции за последнюю неделю (от 0 до 604800 секунд назад включительно)
    if (timeDiff >= 0 && timeDiff <= this.WEEK_SECONDS) {
      let weekIndex = Math.floor(timeDiff / WEEK_INTERVAL);
      if (weekIndex >= 60) weekIndex = 59;
      if (weekIndex >= 0 && weekIndex < 60) {
        const arrayIndex = 59 - weekIndex;
        charts.week[arrayIndex].value += volume;
      }
    }

    // Обрабатываем транзакции за последний месяц (от 0 до 2592000 секунд назад включительно)
    if (timeDiff >= 0 && timeDiff <= this.MONTH_SECONDS) {
      let monthIndex = Math.floor(timeDiff / MONTH_INTERVAL);
      if (monthIndex >= 60) monthIndex = 59;
      if (monthIndex >= 0 && monthIndex < 60) {
        const arrayIndex = 59 - monthIndex;
        charts.month[arrayIndex].value += volume;
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
    const HOUR_INTERVAL = this.getHourInterval();
    const DAY_INTERVAL = this.getDayInterval();
    const WEEK_INTERVAL = this.getWeekInterval();
    const MONTH_INTERVAL = this.getMonthInterval();

    // Обрабатываем транзакции за последний час (от 0 до 3600 секунд назад включительно)
    if (timeDiff >= 0 && timeDiff <= this.HOUR_SECONDS) {
      let hourIndex = Math.floor(timeDiff / HOUR_INTERVAL);
      if (hourIndex >= 60) hourIndex = 59;
      if (hourIndex >= 0 && hourIndex < 60) {
        const arrayIndex = 59 - hourIndex;
        if (!tokenData.hour.has(arrayIndex)) {
          tokenData.hour.set(arrayIndex, new Set());
        }
        tokenData.hour.get(arrayIndex)!.add(address);
      }
    }

    // Обрабатываем транзакции за последний день (от 0 до 86400 секунд назад включительно)
    if (timeDiff >= 0 && timeDiff <= this.DAY_SECONDS) {
      let dayIndex = Math.floor(timeDiff / DAY_INTERVAL);
      if (dayIndex >= 60) dayIndex = 59;
      if (dayIndex >= 0 && dayIndex < 60) {
        const arrayIndex = 59 - dayIndex;
        if (!tokenData.day.has(arrayIndex)) {
          tokenData.day.set(arrayIndex, new Set());
        }
        tokenData.day.get(arrayIndex)!.add(address);
      }
    }

    // Обрабатываем транзакции за последнюю неделю (от 0 до 604800 секунд назад включительно)
    if (timeDiff >= 0 && timeDiff <= this.WEEK_SECONDS) {
      let weekIndex = Math.floor(timeDiff / WEEK_INTERVAL);
      if (weekIndex >= 60) weekIndex = 59;
      if (weekIndex >= 0 && weekIndex < 60) {
        const arrayIndex = 59 - weekIndex;
        if (!tokenData.week.has(arrayIndex)) {
          tokenData.week.set(arrayIndex, new Set());
        }
        tokenData.week.get(arrayIndex)!.add(address);
      }
    }

    // Обрабатываем транзакции за последний месяц (от 0 до 2592000 секунд назад включительно)
    if (timeDiff >= 0 && timeDiff <= this.MONTH_SECONDS) {
      let monthIndex = Math.floor(timeDiff / MONTH_INTERVAL);
      if (monthIndex >= 60) monthIndex = 59;
      if (monthIndex >= 0 && monthIndex < 60) {
        const arrayIndex = 59 - monthIndex;
        if (!tokenData.month.has(arrayIndex)) {
          tokenData.month.set(arrayIndex, new Set());
        }
        tokenData.month.get(arrayIndex)!.add(address);
      }
    }
  }

  buildTokenCharts(moneyFlows: MoneyFlowRow[]): TokenChartsData {
    // const now = DateTime.fromISO('2025-11-05T06:00:00Z', { zone: 'utc' });
    //Как установить 0 таймзону?
    const now = DateTime.now();
    const nowSeconds = now.toSeconds();

    if (moneyFlows.length > 0) {
      const firstFlow = moneyFlows[0];
      const lastFlow = moneyFlows[moneyFlows.length - 1];

      // Парсим даты с поддержкой разных форматов
      let firstDate = DateTime.fromISO(firstFlow.close_time, { zone: 'utc' });
      if (!firstDate.isValid) {
        firstDate = DateTime.fromSQL(firstFlow.close_time, { zone: 'utc' });
      }
      if (!firstDate.isValid) {
        firstDate = DateTime.fromFormat(
          firstFlow.close_time,
          'yyyy-MM-dd HH:mm:ss.SSS',
          { zone: 'utc' },
        );
      }
      if (!firstDate.isValid) {
        firstDate = DateTime.fromFormat(
          firstFlow.close_time,
          'yyyy-MM-dd HH:mm:ss',
          { zone: 'utc' },
        );
      }

      let lastDate = DateTime.fromISO(lastFlow.close_time, { zone: 'utc' });
      if (!lastDate.isValid) {
        lastDate = DateTime.fromSQL(lastFlow.close_time, { zone: 'utc' });
      }
      if (!lastDate.isValid) {
        lastDate = DateTime.fromFormat(
          lastFlow.close_time,
          'yyyy-MM-dd HH:mm:ss.SSS',
          { zone: 'utc' },
        );
      }
      if (!lastDate.isValid) {
        lastDate = DateTime.fromFormat(
          lastFlow.close_time,
          'yyyy-MM-dd HH:mm:ss',
          { zone: 'utc' },
        );
      }
    }

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

    moneyFlows.forEach((moneyFlow) => {
      const {
        from_asset,
        to_asset,
        from_amount,
        to_amount,
        from_address,
        to_address,
        close_time,
      } = moneyFlow;

      // Логирование для отладки токена XLM.r44CR5cYKVyzuJpFUtF2ZRDizVZpvtkc4C
      if (
        from_asset === 'XLM.r44CR5cYKVyzuJpFUtF2ZRDizVZpvtkc4C' ||
        to_asset === 'XLM.r44CR5cYKVyzuJpFUtF2ZRDizVZpvtkc4C'
      ) {
        this.logger.debug(
          `[XLM] Processing moneyFlow: from_asset=${from_asset}, to_asset=${to_asset}, from_address=${from_address}, to_address=${to_address}, close_time=${close_time}`,
        );
      }

      let timestampSeconds: number;
      try {
        let closeTimeDate = DateTime.fromISO(close_time, { zone: 'utc' });
        if (!closeTimeDate.isValid) {
          closeTimeDate = DateTime.fromSQL(close_time, { zone: 'utc' });
        }
        if (!closeTimeDate.isValid) {
          closeTimeDate = DateTime.fromFormat(
            close_time,
            'yyyy-MM-dd HH:mm:ss.SSS',
            { zone: 'utc' },
          );
        }
        if (!closeTimeDate.isValid) {
          closeTimeDate = DateTime.fromFormat(
            close_time,
            'yyyy-MM-dd HH:mm:ss',
            { zone: 'utc' },
          );
        }

        timestampSeconds = closeTimeDate.toSeconds();
      } catch (error) {
        this.logger.log('Error parsing date:', close_time, error);
        return;
      }

      const timeDiff = nowSeconds - timestampSeconds;

      if (timeDiff < 0 || timeDiff > this.MONTH_SECONDS) {
        return;
      }

      if (from_asset) {
        const volumeChartsForToken = this.initializeVolumeCharts(
          from_asset,
          volumeCharts,
          nowSeconds,
        );

        const volume = Math.abs(parseFloat(from_amount) || 0);
        if (volume > 0) {
          this.addVolumeToInterval(
            volumeChartsForToken,
            timestampSeconds,
            volume,
            nowSeconds,
          );
        }

        if (from_address) {
          const tradersData = this.getOrCreateTradersData(
            from_asset,
            tradersDataByInterval,
          );
          this.addTradersToInterval(tradersData, from_address, timeDiff);
        }
      }

      if (to_asset) {
        const volumeChartsForToken = this.initializeVolumeCharts(
          to_asset,
          volumeCharts,
          nowSeconds,
        );
        const volume = Math.abs(parseFloat(to_amount) || 0);
        if (volume > 0) {
          this.addVolumeToInterval(
            volumeChartsForToken,
            timestampSeconds,
            volume,
            nowSeconds,
          );
        }

        if (to_address) {
          const tradersData = this.getOrCreateTradersData(
            to_asset,
            tradersDataByInterval,
          );
          this.addTradersToInterval(tradersData, to_address, timeDiff);
        }
      }
    });

    const tradersCharts: Record<string, TokenTradersCharts> = {};
    for (const token in tradersDataByInterval) {
      const tokenData = tradersDataByInterval[token];
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

      tokenData.hour.forEach((addresses, arrayIndex) => {
        if (arrayIndex >= 0 && arrayIndex < 60) {
          hour[arrayIndex].value = addresses.size;
        }
      });

      tokenData.day.forEach((addresses, arrayIndex) => {
        if (arrayIndex >= 0 && arrayIndex < 60) {
          day[arrayIndex].value = addresses.size;
        }
      });

      tokenData.week.forEach((addresses, arrayIndex) => {
        if (arrayIndex >= 0 && arrayIndex < 60) {
          week[arrayIndex].value = addresses.size;
        }
      });

      tokenData.month.forEach((addresses, arrayIndex) => {
        if (arrayIndex >= 0 && arrayIndex < 60) {
          month[arrayIndex].value = addresses.size;
        }
      });

      tradersCharts[token] = { hour, day, week, month };
    }

    return {
      volumes: volumeCharts,
      traders: tradersCharts,
    };
  }

  buildTokenHoldersChartsFromBalances(
    tokenBalances: Record<string, Record<string, BalanceData[]>>,
  ): Record<string, TokenHoldersCharts> {
    const now = DateTime.now();
    const nowSeconds = now.toSeconds();

    const holdersCharts: Record<string, TokenHoldersCharts> = {};

    for (const token in tokenBalances) {
      const addressBalances = tokenBalances[token];

      // Инициализируем графики
      const hour: VolumeChartPoint[] = [];
      const day: VolumeChartPoint[] = [];
      const week: VolumeChartPoint[] = [];
      const month: VolumeChartPoint[] = [];

      const HOUR_INTERVAL = this.getHourInterval();
      const DAY_INTERVAL = this.getDayInterval();
      const WEEK_INTERVAL = this.getWeekInterval();
      const MONTH_INTERVAL = this.getMonthInterval();

      // Создаем временные точки для каждого интервала
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

      // Предварительно обрабатываем балансы для каждого адреса: сортируем и кэшируем парсинг closeTime
      const processedBalances: Record<
        string,
        Array<{ balance: number; timeSeconds: number; inLedgerIndex: number }>
      > = {};
      for (const [address, balances] of Object.entries(addressBalances)) {
        // Сортируем балансы один раз и кэшируем парсинг closeTime
        const processed = balances
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
        processedBalances[address] = processed;
      }

      // Для каждого интервала определяем количество холдеров
      for (let arrayIndex = 0; arrayIndex < 60; arrayIndex++) {
        // Определяем временной диапазон для текущего интервала
        // Для каждого интервала: от предыдущей точки до текущей
        const hourStartTime =
          arrayIndex === 0
            ? nowSeconds - 60 * HOUR_INTERVAL
            : nowSeconds - (60 - arrayIndex) * HOUR_INTERVAL;
        const hourEndTime = nowSeconds - (60 - arrayIndex - 1) * HOUR_INTERVAL;

        const dayStartTime =
          arrayIndex === 0
            ? nowSeconds - 60 * DAY_INTERVAL
            : nowSeconds - (60 - arrayIndex) * DAY_INTERVAL;
        const dayEndTime = nowSeconds - (60 - arrayIndex - 1) * DAY_INTERVAL;

        const weekStartTime =
          arrayIndex === 0
            ? nowSeconds - 60 * WEEK_INTERVAL
            : nowSeconds - (60 - arrayIndex) * WEEK_INTERVAL;
        const weekEndTime = nowSeconds - (60 - arrayIndex - 1) * WEEK_INTERVAL;

        const monthStartTime =
          arrayIndex === 0
            ? nowSeconds - 60 * MONTH_INTERVAL
            : nowSeconds - (60 - arrayIndex) * MONTH_INTERVAL;
        const monthEndTime =
          nowSeconds - (60 - arrayIndex - 1) * MONTH_INTERVAL;

        // Подсчитываем холдеров для каждого интервала
        const hourHolders = new Set<string>();
        const dayHolders = new Set<string>();
        const weekHolders = new Set<string>();
        const monthHolders = new Set<string>();

        for (const [address, processed] of Object.entries(processedBalances)) {
          // Проверяем, был ли у адреса положительный баланс в этом временном промежутке
          // и не стал ли он нулевым до конца промежутка
          const hourHasHolder = this.hasPositiveBalanceInRangeOptimized(
            processed,
            hourStartTime,
            hourEndTime,
          );
          const dayHasHolder = this.hasPositiveBalanceInRangeOptimized(
            processed,
            dayStartTime,
            dayEndTime,
          );
          const weekHasHolder = this.hasPositiveBalanceInRangeOptimized(
            processed,
            weekStartTime,
            weekEndTime,
          );
          const monthHasHolder = this.hasPositiveBalanceInRangeOptimized(
            processed,
            monthStartTime,
            monthEndTime,
          );

          if (hourHasHolder) hourHolders.add(address);
          if (dayHasHolder) dayHolders.add(address);
          if (weekHasHolder) weekHolders.add(address);
          if (monthHasHolder) monthHolders.add(address);
        }

        hour[arrayIndex].value = hourHolders.size;
        day[arrayIndex].value = dayHolders.size;
        week[arrayIndex].value = weekHolders.size;
        month[arrayIndex].value = monthHolders.size;
      }

      holdersCharts[token] = { hour, day, week, month };
    }

    return holdersCharts;
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

    // Находим последний баланс до начала диапазона или в начале диапазона
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

    // Находим все балансы в диапазоне
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

    // Находим первый баланс после диапазона
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

    // Определяем баланс в начале диапазона
    const balanceAtStart =
      balancesInRange.length > 0
        ? balancesInRange[0]
        : lastBalanceBeforeOrAtStart;

    // Определяем баланс в конце диапазона
    const balanceAtEnd =
      balancesInRange.length > 0
        ? balancesInRange[balancesInRange.length - 1]
        : lastBalanceBeforeOrAtStart;

    // Проверяем, был ли положительный баланс в начале диапазона
    const hadPositiveBalanceAtStart =
      balanceAtStart && balanceAtStart.balance > 0;

    // Проверяем, был ли хотя бы один положительный баланс в диапазоне
    const hasPositiveInRange = balancesInRange.some((b) => b.balance > 0);

    // Проверяем, был ли положительный баланс до начала диапазона
    const hadPositiveBalanceBeforeStart =
      lastBalanceBeforeOrAtStart && lastBalanceBeforeOrAtStart.balance > 0;

    // Если не было положительного баланса ни в начале, ни в диапазоне, ни до начала
    if (
      !hadPositiveBalanceAtStart &&
      !hasPositiveInRange &&
      !hadPositiveBalanceBeforeStart
    ) {
      return false;
    }

    if (balanceAtEnd && balanceAtEnd.balance === 0) {
      // Если был положительный баланс в начале диапазона или до начала, то адрес был холдером
      if (
        hadPositiveBalanceAtStart ||
        hadPositiveBalanceBeforeStart ||
        hasPositiveInRange
      ) {
        return true;
      } else {
        return false;
      }
    }

    // Если есть баланс сразу после диапазона и он нулевой,
    // то адрес перестал быть холдером до конца диапазона
    if (firstBalanceAfterRange && firstBalanceAfterRange.balance === 0) {
      // Если баланс стал нулевым сразу после диапазона (в пределах небольшого окна),
      // считаем что он перестал быть холдером до конца диапазона
      if (firstBalanceAfterRange.timeSeconds - endTimeSeconds < 300) {
        return false;
      }
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

    // Сортируем все балансы по времени
    const sortedBalances = [...balances].sort((a, b) => {
      const timeA = this.parseCloseTime(a.closeTime).toSeconds();
      const timeB = this.parseCloseTime(b.closeTime).toSeconds();
      if (timeA !== timeB) return timeA - timeB;
      return a.inLedgerIndex - b.inLedgerIndex;
    });

    // Находим последний баланс до начала диапазона или в начале диапазона
    let lastBalanceBeforeOrAtStart: BalanceData | null = null;
    for (const balance of sortedBalances) {
      const balanceTime = this.parseCloseTime(balance.closeTime).toSeconds();
      if (balanceTime <= startTimeSeconds) {
        lastBalanceBeforeOrAtStart = balance;
      } else {
        break;
      }
    }

    // Находим все балансы в диапазоне
    const balancesInRange: BalanceData[] = [];
    for (const balance of sortedBalances) {
      const balanceTime = this.parseCloseTime(balance.closeTime).toSeconds();
      if (balanceTime >= startTimeSeconds && balanceTime <= endTimeSeconds) {
        balancesInRange.push(balance);
      }
    }

    // Находим первый баланс после диапазона
    let firstBalanceAfterRange: BalanceData | null = null;
    for (const balance of sortedBalances) {
      const balanceTime = this.parseCloseTime(balance.closeTime).toSeconds();
      if (balanceTime > endTimeSeconds) {
        firstBalanceAfterRange = balance;
        break;
      }
    }

    // Определяем баланс в начале диапазона
    const balanceAtStart =
      balancesInRange.length > 0
        ? balancesInRange[0]
        : lastBalanceBeforeOrAtStart;

    // Определяем баланс в конце диапазона
    const balanceAtEnd =
      balancesInRange.length > 0
        ? balancesInRange[balancesInRange.length - 1]
        : lastBalanceBeforeOrAtStart;

    // Проверяем, был ли положительный баланс в начале диапазона
    const hadPositiveBalanceAtStart =
      balanceAtStart && balanceAtStart.balance > 0;

    // Проверяем, был ли хотя бы один положительный баланс в диапазоне
    const hasPositiveInRange = balancesInRange.some((b) => b.balance > 0);

    // Проверяем, был ли положительный баланс до начала диапазона
    const hadPositiveBalanceBeforeStart =
      lastBalanceBeforeOrAtStart && lastBalanceBeforeOrAtStart.balance > 0;

    // Если не было положительного баланса ни в начале, ни в диапазоне, ни до начала
    if (
      !hadPositiveBalanceAtStart &&
      !hasPositiveInRange &&
      !hadPositiveBalanceBeforeStart
    ) {
      return false;
    }

    if (balanceAtEnd && balanceAtEnd.balance === 0) {
      // Если был положительный баланс в начале диапазона или до начала, то адрес был холдером
      if (
        hadPositiveBalanceAtStart ||
        hadPositiveBalanceBeforeStart ||
        hasPositiveInRange
      ) {
        return true;
      } else {
        return false;
      }
    }

    // Если есть баланс сразу после диапазона и он нулевой,
    // то адрес перестал быть холдером до конца диапазона
    if (firstBalanceAfterRange && firstBalanceAfterRange.balance === 0) {
      const firstBalanceTime = this.parseCloseTime(
        firstBalanceAfterRange.closeTime,
      ).toSeconds();
      // Если баланс стал нулевым сразу после диапазона (в пределах небольшого окна),
      // считаем что он перестал быть холдером до конца диапазона
      if (firstBalanceTime - endTimeSeconds < 300) {
        return false;
      }
    }
    return true;
  }
}
