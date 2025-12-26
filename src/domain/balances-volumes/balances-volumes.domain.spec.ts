import { Test, TestingModule } from '@nestjs/testing';
import { BalancesVolumesDomain } from './balances-volumes.domain';
import { ProcessedMoneyFlowRow } from 'src/services/smart-money/type/processed-money-flow-row.type';
import { DateTime } from 'luxon';

// eslint-disable-next-line max-lines-per-function
describe('BalancesVolumesDomain', () => {
  let service: BalancesVolumesDomain;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BalancesVolumesDomain],
    }).compile();

    service = module.get<BalancesVolumesDomain>(BalancesVolumesDomain);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // eslint-disable-next-line max-lines-per-function
  describe('getBalancesAndVolumes', () => {
    it('should return empty balances and volumes for empty array', () => {
      const result = service.getBalancesAndVolumes([], 'rTestAddress');

      expect(result.balances).toEqual({});
      expect(result.volumes).toEqual({});
    });

    it('should calculate balance and volume for fromAddress transaction', () => {
      const closeTime = DateTime.now();
      const row: ProcessedMoneyFlowRow = {
        hash: 'test-hash',
        fromAddress: 'rTestAddress',
        toAddress: 'rOtherAddress',
        fromAsset: 'USD.rIssuer',
        toAsset: 'XRP',
        fromAmount: -100,
        toAmount: 50,
        initFromAmount: 200,
        initToAmount: 0,
        kind: 'transfer',
        xrpPrice: 1.0,
        closeTime,
        ledgerIndex: 12345,
        inLedgerIndex: 0,
      };

      const result = service.getBalancesAndVolumes([row], 'rTestAddress');

      expect(result.balances['USD.rIssuer']).toHaveLength(1);
      expect(result.balances['USD.rIssuer']?.[0]?.balance).toBe(200 - -100); // initFromAmount - fromAmount = 200 - (-100) = 300
      expect(result.balances['USD.rIssuer']?.[0]?.closeTime).toEqual(closeTime);
      expect(result.balances['USD.rIssuer']?.[0]?.inLedgerIndex).toBe(0);

      expect(result.volumes['USD.rIssuer']).toHaveLength(1);
      expect(result.volumes['USD.rIssuer']?.[0]?.volume).toBe(100); // Math.abs(-100)
      expect(result.volumes['USD.rIssuer']?.[0]?.closeTime).toEqual(closeTime);
      expect(result.volumes['USD.rIssuer']?.[0]?.inLedgerIndex).toBe(0);
    });

    it('should calculate balance and volume for toAddress transaction', () => {
      const closeTime = DateTime.now();
      const row: ProcessedMoneyFlowRow = {
        hash: 'test-hash',
        fromAddress: 'rOtherAddress',
        toAddress: 'rTestAddress',
        fromAsset: 'USD.rIssuer',
        toAsset: 'XRP',
        fromAmount: -100,
        toAmount: 50,
        initFromAmount: 200,
        initToAmount: 10,
        kind: 'transfer',
        xrpPrice: 1.0,
        closeTime,
        ledgerIndex: 12345,
        inLedgerIndex: 0,
      };

      const result = service.getBalancesAndVolumes([row], 'rTestAddress');

      expect(result.balances['XRP']).toHaveLength(1);
      expect(result.balances['XRP']?.[0]?.balance).toBe(10 + 50); // initToAmount + toAmount = 10 + 50 = 60
      expect(result.balances['XRP']?.[0]?.closeTime).toEqual(closeTime);
      expect(result.balances['XRP']?.[0]?.inLedgerIndex).toBe(0);

      expect(result.volumes['XRP']).toHaveLength(1);
      expect(result.volumes['XRP']?.[0]?.volume).toBe(50); // Math.abs(50)
      expect(result.volumes['XRP']?.[0]?.closeTime).toEqual(closeTime);
      expect(result.volumes['XRP']?.[0]?.inLedgerIndex).toBe(0);
    });

    it('should handle transaction where account is both from and to', () => {
      const closeTime = DateTime.now();
      const row: ProcessedMoneyFlowRow = {
        hash: 'test-hash',
        fromAddress: 'rTestAddress',
        toAddress: 'rTestAddress',
        fromAsset: 'USD.rIssuer',
        toAsset: 'XRP',
        fromAmount: -100,
        toAmount: 50,
        initFromAmount: 200,
        initToAmount: 10,
        kind: 'transfer',
        xrpPrice: 1.0,
        closeTime,
        ledgerIndex: 12345,
        inLedgerIndex: 0,
      };

      const result = service.getBalancesAndVolumes([row], 'rTestAddress');

      // Should have entries for both fromAsset and toAsset
      expect(result.balances['USD.rIssuer']).toHaveLength(1);
      expect(result.balances['XRP']).toHaveLength(1);
      expect(result.volumes['USD.rIssuer']).toHaveLength(1);
      expect(result.volumes['XRP']).toHaveLength(1);
    });

    it('should ignore transactions where account is neither from nor to', () => {
      const closeTime = DateTime.now();
      const row: ProcessedMoneyFlowRow = {
        hash: 'test-hash',
        fromAddress: 'rOtherAddress1',
        toAddress: 'rOtherAddress2',
        fromAsset: 'USD.rIssuer',
        toAsset: 'XRP',
        fromAmount: -100,
        toAmount: 50,
        initFromAmount: 200,
        initToAmount: 10,
        kind: 'transfer',
        xrpPrice: 1.0,
        closeTime,
        ledgerIndex: 12345,
        inLedgerIndex: 0,
      };

      const result = service.getBalancesAndVolumes([row], 'rTestAddress');

      expect(result.balances).toEqual({});
      expect(result.volumes).toEqual({});
    });

    it('should aggregate multiple transactions for same asset', () => {
      const closeTime1 = DateTime.now();
      const closeTime2 = DateTime.now().plus({ minutes: 1 });
      const rows: ProcessedMoneyFlowRow[] = [
        {
          hash: 'test-hash-1',
          fromAddress: 'rTestAddress',
          toAddress: 'rOtherAddress',
          fromAsset: 'USD.rIssuer',
          toAsset: 'XRP',
          fromAmount: -100,
          toAmount: 50,
          initFromAmount: 200,
          initToAmount: 0,
          kind: 'transfer',
          xrpPrice: 1.0,
          closeTime: closeTime1,
          ledgerIndex: 12345,
          inLedgerIndex: 0,
        },
        {
          hash: 'test-hash-2',
          fromAddress: 'rTestAddress',
          toAddress: 'rOtherAddress',
          fromAsset: 'USD.rIssuer',
          toAsset: 'XRP',
          fromAmount: -50,
          toAmount: 25,
          initFromAmount: 100,
          initToAmount: 0,
          kind: 'transfer',
          xrpPrice: 1.0,
          closeTime: closeTime2,
          ledgerIndex: 12346,
          inLedgerIndex: 0,
        },
      ];

      const result = service.getBalancesAndVolumes(rows, 'rTestAddress');

      expect(result.balances['USD.rIssuer']).toHaveLength(2);
      expect(result.volumes['USD.rIssuer']).toHaveLength(2);
      expect(result.balances['USD.rIssuer']?.[0]?.balance).toBe(200 - -100);
      expect(result.balances['USD.rIssuer']?.[1]?.balance).toBe(100 - -50);
    });

    it('should handle multiple different assets', () => {
      const closeTime = DateTime.now();
      const rows: ProcessedMoneyFlowRow[] = [
        {
          hash: 'test-hash-1',
          fromAddress: 'rTestAddress',
          toAddress: 'rOtherAddress',
          fromAsset: 'USD.rIssuer',
          toAsset: 'XRP',
          fromAmount: -100,
          toAmount: 50,
          initFromAmount: 200,
          initToAmount: 0,
          kind: 'transfer',
          xrpPrice: 1.0,
          closeTime,
          ledgerIndex: 12345,
          inLedgerIndex: 0,
        },
        {
          hash: 'test-hash-2',
          fromAddress: 'rTestAddress',
          toAddress: 'rOtherAddress',
          fromAsset: 'EUR.rIssuer',
          toAsset: 'XRP',
          fromAmount: -200,
          toAmount: 100,
          initFromAmount: 300,
          initToAmount: 0,
          kind: 'transfer',
          xrpPrice: 1.0,
          closeTime,
          ledgerIndex: 12346,
          inLedgerIndex: 0,
        },
      ];

      const result = service.getBalancesAndVolumes(rows, 'rTestAddress');

      expect(result.balances['USD.rIssuer']).toBeDefined();
      expect(result.balances['EUR.rIssuer']).toBeDefined();
      expect(result.volumes['USD.rIssuer']).toBeDefined();
      expect(result.volumes['EUR.rIssuer']).toBeDefined();
    });

    it('should use absolute value for volume', () => {
      const closeTime = DateTime.now();
      const row: ProcessedMoneyFlowRow = {
        hash: 'test-hash',
        fromAddress: 'rTestAddress',
        toAddress: 'rOtherAddress',
        fromAsset: 'USD.rIssuer',
        toAsset: 'XRP',
        fromAmount: -100,
        toAmount: 50,
        initFromAmount: 200,
        initToAmount: 0,
        kind: 'transfer',
        xrpPrice: 1.0,
        closeTime,
        ledgerIndex: 12345,
        inLedgerIndex: 0,
      };

      const result = service.getBalancesAndVolumes([row], 'rTestAddress');

      // Volume should be absolute value
      expect(result.volumes['USD.rIssuer']?.[0]?.volume).toBe(100); // Math.abs(-100)
    });

    it('should handle positive fromAmount', () => {
      const closeTime = DateTime.now();
      const row: ProcessedMoneyFlowRow = {
        hash: 'test-hash',
        fromAddress: 'rTestAddress',
        toAddress: 'rOtherAddress',
        fromAsset: 'USD.rIssuer',
        toAsset: 'XRP',
        fromAmount: 100, // Positive amount
        toAmount: 50,
        initFromAmount: 200,
        initToAmount: 0,
        kind: 'transfer',
        xrpPrice: 1.0,
        closeTime,
        ledgerIndex: 12345,
        inLedgerIndex: 0,
      };

      const result = service.getBalancesAndVolumes([row], 'rTestAddress');

      expect(result.balances['USD.rIssuer']?.[0]?.balance).toBe(200 - 100); // initFromAmount - fromAmount = 200 - 100 = 100
      expect(result.volumes['USD.rIssuer']?.[0]?.volume).toBe(100); // Math.abs(100)
    });

    it('should preserve inLedgerIndex', () => {
      const closeTime = DateTime.now();
      const row: ProcessedMoneyFlowRow = {
        hash: 'test-hash',
        fromAddress: 'rTestAddress',
        toAddress: 'rOtherAddress',
        fromAsset: 'USD.rIssuer',
        toAsset: 'XRP',
        fromAmount: -100,
        toAmount: 50,
        initFromAmount: 200,
        initToAmount: 0,
        kind: 'transfer',
        xrpPrice: 1.0,
        closeTime,
        ledgerIndex: 12345,
        inLedgerIndex: 5,
      };

      const result = service.getBalancesAndVolumes([row], 'rTestAddress');

      expect(result.balances['USD.rIssuer']?.[0]?.inLedgerIndex).toBe(5);
      expect(result.volumes['USD.rIssuer']?.[0]?.inLedgerIndex).toBe(5);
    });

    it('should handle complex scenario with multiple addresses and assets', () => {
      const closeTime = DateTime.now();
      const rows: ProcessedMoneyFlowRow[] = [
        {
          hash: 'test-hash-1',
          fromAddress: 'rTestAddress',
          toAddress: 'rOtherAddress1',
          fromAsset: 'USD.rIssuer',
          toAsset: 'XRP',
          fromAmount: -100,
          toAmount: 50,
          initFromAmount: 200,
          initToAmount: 0,
          kind: 'transfer',
          xrpPrice: 1.0,
          closeTime,
          ledgerIndex: 12345,
          inLedgerIndex: 0,
        },
        {
          hash: 'test-hash-2',
          fromAddress: 'rOtherAddress2',
          toAddress: 'rTestAddress',
          fromAsset: 'EUR.rIssuer',
          toAsset: 'USD.rIssuer',
          fromAmount: -200,
          toAmount: 150,
          initFromAmount: 300,
          initToAmount: 100,
          kind: 'transfer',
          xrpPrice: 1.0,
          closeTime,
          ledgerIndex: 12346,
          inLedgerIndex: 0,
        },
        {
          hash: 'test-hash-3',
          fromAddress: 'rTestAddress',
          toAddress: 'rOtherAddress3',
          fromAsset: 'XRP',
          toAsset: 'EUR.rIssuer',
          fromAmount: -50,
          toAmount: 40,
          initFromAmount: 100,
          initToAmount: 0,
          kind: 'transfer',
          xrpPrice: 1.0,
          closeTime,
          ledgerIndex: 12347,
          inLedgerIndex: 0,
        },
      ];

      const result = service.getBalancesAndVolumes(rows, 'rTestAddress');

      // Should have balances and volumes for USD.rIssuer (from), USD.rIssuer (to), and XRP (from)
      expect(result.balances['USD.rIssuer']).toBeDefined();
      expect(result.balances['XRP']).toBeDefined();
      expect(result.volumes['USD.rIssuer']).toBeDefined();
      expect(result.volumes['XRP']).toBeDefined();

      // USD.rIssuer should have 2 entries (one from, one to)
      expect(result.balances['USD.rIssuer']).toHaveLength(2);
      expect(result.volumes['USD.rIssuer']).toHaveLength(2);
    });
  });
});
