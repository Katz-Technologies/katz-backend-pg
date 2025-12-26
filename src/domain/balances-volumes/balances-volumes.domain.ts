import { Injectable } from '@nestjs/common';
import { ProcessedMoneyFlowRow } from 'src/service/smart_money/type/processed-money-flow-row.type';
import { BalancesData } from 'src/service/smart_money/type/balances-data.type';
import { VolumesData } from 'src/service/smart_money/type/volumes-data.type';
import { BalanceData } from 'src/service/smart_money/type/balance-data.type';
import { VolumeData } from 'src/service/smart_money/type/volume-data.type';

@Injectable()
export class BalancesVolumesDomain {
  getBalancesAndVolumes(
    processedMoneyFlowRows: ProcessedMoneyFlowRow[],
    accountAddress: string,
  ): { balances: BalancesData; volumes: VolumesData } {
    const balances: BalancesData = {};
    const volumes: VolumesData = {};

    for (const row of processedMoneyFlowRows) {
      if (row.fromAddress === accountAddress) {
        const balanceData: BalanceData = {
          balance: row.initFromAmount - row.fromAmount,
          closeTime: row.closeTime,
          inLedgerIndex: row.inLedgerIndex,
        };

        if (!balances[row.fromAsset]) {
          balances[row.fromAsset] = [balanceData];
        } else {
          balances[row.fromAsset].push(balanceData);
        }

        const volumeData: VolumeData = {
          volume: Math.abs(row.fromAmount),
          closeTime: row.closeTime,
          inLedgerIndex: row.inLedgerIndex,
        };

        if (!volumes[row.fromAsset]) {
          volumes[row.fromAsset] = [volumeData];
        } else {
          volumes[row.fromAsset].push(volumeData);
        }
      }

      if (row.toAddress === accountAddress) {
        const balanceData: BalanceData = {
          balance: row.initToAmount + row.toAmount,
          closeTime: row.closeTime,
          inLedgerIndex: row.inLedgerIndex,
        };

        if (!balances[row.toAsset]) {
          balances[row.toAsset] = [balanceData];
        } else {
          balances[row.toAsset].push(balanceData);
        }

        const volumeData: VolumeData = {
          volume: Math.abs(row.toAmount),
          closeTime: row.closeTime,
          inLedgerIndex: row.inLedgerIndex,
        };

        if (!volumes[row.toAsset]) {
          volumes[row.toAsset] = [volumeData];
        } else {
          volumes[row.toAsset].push(volumeData);
        }
      }
    }

    return { balances, volumes };
  }
}
