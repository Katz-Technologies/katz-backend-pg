import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { MoneyFlowRow } from 'src/services/smart-money/interface/money-flow-row.interface';
import { ProcessedMoneyFlowRow } from 'src/services/smart-money/type/processed-money-flow-row.type';
import { Kind } from 'src/services/smart-money/type/kind.type';

@Injectable()
export class ProcessMoneyFlowRowsDomain {
  /**
   * Парсит close_time из ClickHouse в DateTime (UTC)
   * Формат ClickHouse: 2025-11-24 11:15:12.000
   */
  private parseCloseTime(closeTime: string): DateTime {
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

  processMoneyFlowRows(
    moneyFlowRows: MoneyFlowRow[],
    mainToken: string,
  ): {
    fromMainToken: boolean;
    toMainToken: boolean;
    result: ProcessedMoneyFlowRow[];
  } {
    let fromMainToken = false;
    let toMainToken = false;

    const result: ProcessedMoneyFlowRow[] = [];

    for (const row of moneyFlowRows) {
      const xrpPrice = row.price_usd ? parseFloat(row.price_usd) : 0;

      if (!fromMainToken) {
        if (row.from_asset === mainToken) fromMainToken = true;
      }

      if (!toMainToken) {
        if (row.to_asset === mainToken) toMainToken = true;
      }

      result.push({
        hash: row.tx_hash,
        fromAddress: row.from_address,
        toAddress: row.to_address,
        fromAsset: row.from_asset,
        toAsset: row.to_asset,
        fromAmount: parseFloat(row.from_amount || '0') * -1,
        toAmount: parseFloat(row.to_amount || '0'),
        initFromAmount: parseFloat(row.init_from_amount || '0'),
        initToAmount: parseFloat(row.init_to_amount || '0'),
        kind: row.kind as Kind,
        xrpPrice,
        closeTime: this.parseCloseTime(row.close_time),
        ledgerIndex: row.ledger_index,
        inLedgerIndex: row.in_ledger_index,
      });
    }

    return { fromMainToken, toMainToken, result };
  }
}
