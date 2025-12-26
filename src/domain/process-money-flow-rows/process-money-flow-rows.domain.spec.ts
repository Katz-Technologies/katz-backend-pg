import { Test, TestingModule } from '@nestjs/testing';
import { ProcessMoneyFlowRowsDomain } from './process-money-flow-rows.domain';
import { MoneyFlowRow } from 'src/services/smart-money/interface/money-flow-row.interface';
import { DateTime } from 'luxon';

// eslint-disable-next-line max-lines-per-function
describe('ProcessMoneyFlowRowsDomain', () => {
  let service: ProcessMoneyFlowRowsDomain;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProcessMoneyFlowRowsDomain],
    }).compile();

    service = module.get<ProcessMoneyFlowRowsDomain>(
      ProcessMoneyFlowRowsDomain,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // eslint-disable-next-line max-lines-per-function
  describe('processMoneyFlowRows', () => {
    it('should process empty array', () => {
      const result = service.processMoneyFlowRows([], 'XRP');

      expect(result.fromMainToken).toBe(false);
      expect(result.toMainToken).toBe(false);
      expect(result.result).toEqual([]);
    });

    it('should process single row correctly', () => {
      const row: MoneyFlowRow = {
        from_address: 'rAddress1',
        to_address: 'rAddress2',
        from_asset: 'USD.rIssuer',
        to_asset: 'XRP',
        from_amount: '100',
        to_amount: '50',
        init_from_amount: '100',
        init_to_amount: '0',
        price_usd: '1.5',
        kind: 'payment',
        close_time: '2025-01-15 10:30:45.123',
        ledger_index: 12345,
        in_ledger_index: 0,
        tx_hash: 'test-hash',
      };

      const result = service.processMoneyFlowRows([row], 'XRP');

      expect(result.result).toHaveLength(1);
      expect(result.result[0]).toBeDefined();
      expect(result.result[0]).toEqual({
        hash: 'test-hash',
        fromAddress: 'rAddress1',
        toAddress: 'rAddress2',
        fromAsset: 'USD.rIssuer',
        toAsset: 'XRP',
        fromAmount: -100, // parseFloat('100') * -1
        toAmount: 50,
        initFromAmount: 100,
        initToAmount: 0,
        kind: 'payment',
        xrpPrice: 1.5,
        closeTime: expect.any(DateTime),
        ledgerIndex: 12345,
        inLedgerIndex: 0,
      });
    });

    it('should set fromMainToken to true when from_asset matches mainToken', () => {
      const row: MoneyFlowRow = {
        from_address: 'rAddress1',
        to_address: 'rAddress2',
        from_asset: 'XRP',
        to_asset: 'USD.rIssuer',
        from_amount: '100',
        to_amount: '50',
        init_from_amount: '100',
        init_to_amount: '0',
        price_usd: '1.5',
        kind: 'payment',
        close_time: '2025-01-15 10:30:45.123',
        ledger_index: 12345,
        in_ledger_index: 0,
        tx_hash: 'test-hash',
      };

      const result = service.processMoneyFlowRows([row], 'XRP');

      expect(result.fromMainToken).toBe(true);
      expect(result.toMainToken).toBe(false);
    });

    it('should set toMainToken to true when to_asset matches mainToken', () => {
      const row: MoneyFlowRow = {
        from_address: 'rAddress1',
        to_address: 'rAddress2',
        from_asset: 'USD.rIssuer',
        to_asset: 'XRP',
        from_amount: '100',
        to_amount: '50',
        init_from_amount: '100',
        init_to_amount: '0',
        price_usd: '1.5',
        kind: 'payment',
        close_time: '2025-01-15 10:30:45.123',
        ledger_index: 12345,
        in_ledger_index: 0,
        tx_hash: 'test-hash',
      };

      const result = service.processMoneyFlowRows([row], 'XRP');

      expect(result.fromMainToken).toBe(false);
      expect(result.toMainToken).toBe(true);
    });

    it('should set both flags to true when mainToken appears in both from and to', () => {
      const rows: MoneyFlowRow[] = [
        {
          from_address: 'rAddress1',
          to_address: 'rAddress2',
          from_asset: 'XRP',
          to_asset: 'USD.rIssuer',
          from_amount: '100',
          to_amount: '50',
          init_from_amount: '100',
          init_to_amount: '0',
          price_usd: '1.5',
          kind: 'payment',
          close_time: '2025-01-15 10:30:45.123',
          ledger_index: 12345,
          in_ledger_index: 0,
          tx_hash: 'test-hash-1',
        },
        {
          from_address: 'rAddress2',
          to_address: 'rAddress3',
          from_asset: 'USD.rIssuer',
          to_asset: 'XRP',
          from_amount: '50',
          to_amount: '100',
          init_from_amount: '50',
          init_to_amount: '0',
          price_usd: '1.5',
          kind: 'payment',
          close_time: '2025-01-15 10:31:45.123',
          ledger_index: 12346,
          in_ledger_index: 0,
          tx_hash: 'test-hash-2',
        },
      ];

      const result = service.processMoneyFlowRows(rows, 'XRP');

      expect(result.fromMainToken).toBe(true);
      expect(result.toMainToken).toBe(true);
    });

    it('should handle missing price_usd', () => {
      const row: MoneyFlowRow = {
        from_address: 'rAddress1',
        to_address: 'rAddress2',
        from_asset: 'USD.rIssuer',
        to_asset: 'XRP',
        from_amount: '100',
        to_amount: '50',
        init_from_amount: '100',
        init_to_amount: '0',
        price_usd: '',
        kind: 'payment',
        close_time: '2025-01-15 10:30:45.123',
        ledger_index: 12345,
        in_ledger_index: 0,
        tx_hash: 'test-hash',
      };

      const result = service.processMoneyFlowRows([row], 'XRP');

      expect(result.result[0]?.xrpPrice).toBe(0);
    });

    it('should handle missing amounts', () => {
      const row: MoneyFlowRow = {
        from_address: 'rAddress1',
        to_address: 'rAddress2',
        from_asset: 'USD.rIssuer',
        to_asset: 'XRP',
        from_amount: '',
        to_amount: '',
        init_from_amount: '',
        init_to_amount: '',
        price_usd: '1.5',
        kind: 'payment',
        close_time: '2025-01-15 10:30:45.123',
        ledger_index: 12345,
        in_ledger_index: 0,
        tx_hash: 'test-hash',
      };

      const result = service.processMoneyFlowRows([row], 'XRP');

      expect(result.result[0]?.fromAmount).toBe(-0);
      expect(result.result[0]?.toAmount).toBe(0);
      expect(result.result[0]?.initFromAmount).toBe(0);
      expect(result.result[0]?.initToAmount).toBe(0);
    });

    it('should process multiple rows', () => {
      const rows: MoneyFlowRow[] = [
        {
          from_address: 'rAddress1',
          to_address: 'rAddress2',
          from_asset: 'USD.rIssuer',
          to_asset: 'XRP',
          from_amount: '100',
          to_amount: '50',
          init_from_amount: '100',
          init_to_amount: '0',
          price_usd: '1.5',
          kind: 'payment',
          close_time: '2025-01-15 10:30:45.123',
          ledger_index: 12345,
          in_ledger_index: 0,
          tx_hash: 'test-hash-1',
        },
        {
          from_address: 'rAddress2',
          to_address: 'rAddress3',
          from_asset: 'XRP',
          to_asset: 'EUR.rIssuer',
          from_amount: '50',
          to_amount: '40',
          init_from_amount: '50',
          init_to_amount: '0',
          price_usd: '1.5',
          kind: 'swap',
          close_time: '2025-01-15 10:31:45.123',
          ledger_index: 12346,
          in_ledger_index: 0,
          tx_hash: 'test-hash-2',
        },
      ];

      const result = service.processMoneyFlowRows(rows, 'XRP');

      expect(result.result).toHaveLength(2);
      expect(result.fromMainToken).toBe(true);
      expect(result.toMainToken).toBe(true);
    });

    it('should parse close_time with milliseconds', () => {
      const row: MoneyFlowRow = {
        from_address: 'rAddress1',
        to_address: 'rAddress2',
        from_asset: 'USD.rIssuer',
        to_asset: 'XRP',
        from_amount: '100',
        to_amount: '50',
        init_from_amount: '100',
        init_to_amount: '0',
        price_usd: '1.5',
        kind: 'payment',
        close_time: '2025-01-15 10:30:45.123',
        ledger_index: 12345,
        in_ledger_index: 0,
        tx_hash: 'test-hash',
      };

      const result = service.processMoneyFlowRows([row], 'XRP');

      expect(result.result[0]?.closeTime).toBeInstanceOf(DateTime);
      expect(result.result[0]?.closeTime.isValid).toBe(true);
      expect(
        result.result[0]?.closeTime.toFormat('yyyy-MM-dd HH:mm:ss.SSS'),
      ).toBe('2025-01-15 10:30:45.123');
    });

    it('should parse close_time without milliseconds', () => {
      const row: MoneyFlowRow = {
        from_address: 'rAddress1',
        to_address: 'rAddress2',
        from_asset: 'USD.rIssuer',
        to_asset: 'XRP',
        from_amount: '100',
        to_amount: '50',
        init_from_amount: '100',
        init_to_amount: '0',
        price_usd: '1.5',
        kind: 'payment',
        close_time: '2025-01-15 10:30:45',
        ledger_index: 12345,
        in_ledger_index: 0,
        tx_hash: 'test-hash',
      };

      const result = service.processMoneyFlowRows([row], 'XRP');

      expect(result.result[0]?.closeTime).toBeInstanceOf(DateTime);
      expect(result.result[0]?.closeTime.isValid).toBe(true);
      expect(result.result[0]?.closeTime.toFormat('yyyy-MM-dd HH:mm:ss')).toBe(
        '2025-01-15 10:30:45',
      );
    });

    it('should handle invalid close_time format with fallback', () => {
      const row: MoneyFlowRow = {
        from_address: 'rAddress1',
        to_address: 'rAddress2',
        from_asset: 'USD.rIssuer',
        to_asset: 'XRP',
        from_amount: '100',
        to_amount: '50',
        init_from_amount: '100',
        init_to_amount: '0',
        price_usd: '1.5',
        kind: 'payment',
        close_time: 'invalid-date',
        ledger_index: 12345,
        in_ledger_index: 0,
        tx_hash: 'test-hash',
      };

      const result = service.processMoneyFlowRows([row], 'XRP');

      expect(result.result[0]?.closeTime).toBeInstanceOf(DateTime);
      // Fallback should still produce a valid DateTime (even if it's invalid date)
      expect(result.result[0]?.closeTime).toBeDefined();
    });

    it('should handle different kind values', () => {
      const kinds = ['swap', 'dexOffer', 'transfer'] as const;

      kinds.forEach((kind) => {
        const row: MoneyFlowRow = {
          from_address: 'rAddress1',
          to_address: 'rAddress2',
          from_asset: 'USD.rIssuer',
          to_asset: 'XRP',
          from_amount: '100',
          to_amount: '50',
          init_from_amount: '100',
          init_to_amount: '0',
          price_usd: '1.5',
          kind,
          close_time: '2025-01-15 10:30:45.123',
          ledger_index: 12345,
          in_ledger_index: 0,
          tx_hash: 'test-hash',
        };

        const result = service.processMoneyFlowRows([row], 'XRP');

        expect(result.result[0]?.kind).toBe(kind);
      });
    });

    it('should handle decimal amounts', () => {
      const row: MoneyFlowRow = {
        from_address: 'rAddress1',
        to_address: 'rAddress2',
        from_asset: 'USD.rIssuer',
        to_asset: 'XRP',
        from_amount: '100.123456',
        to_amount: '50.789012',
        init_from_amount: '100.123456',
        init_to_amount: '0.0',
        price_usd: '1.5',
        kind: 'payment',
        close_time: '2025-01-15 10:30:45.123',
        ledger_index: 12345,
        in_ledger_index: 0,
        tx_hash: 'test-hash',
      };

      const result = service.processMoneyFlowRows([row], 'XRP');

      expect(result.result[0]?.fromAmount).toBeCloseTo(-100.123456);
      expect(result.result[0]?.toAmount).toBeCloseTo(50.789012);
      expect(result.result[0]?.initFromAmount).toBeCloseTo(100.123456);
      expect(result.result[0]?.initToAmount).toBeCloseTo(0.0);
    });

    it('should handle negative fromAmount correctly', () => {
      const row: MoneyFlowRow = {
        from_address: 'rAddress1',
        to_address: 'rAddress2',
        from_asset: 'USD.rIssuer',
        to_asset: 'XRP',
        from_amount: '100',
        to_amount: '50',
        init_from_amount: '100',
        init_to_amount: '0',
        price_usd: '1.5',
        kind: 'payment',
        close_time: '2025-01-15 10:30:45.123',
        ledger_index: 12345,
        in_ledger_index: 0,
        tx_hash: 'test-hash',
      };

      const result = service.processMoneyFlowRows([row], 'XRP');

      // fromAmount should be negative (parseFloat('100') * -1)
      expect(result.result[0]?.fromAmount).toBe(-100);
    });
  });
});
