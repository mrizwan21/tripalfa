// tests/services/fxService.test.ts
// Unit tests for FX conversion service

import {
  saveSnapshot,
  getLatestSnapshot,
  convertAmount,
  isSnapshotStale,
  getRate,
} from "../../src/services/fxService.ts";
const pool = (global as any).PG_POOL;
import { v4 as uuidv4 } from "uuid";

describe("fxService", () => {
  beforeAll(async () => {
    // Clear previous snapshots
    await pool.query("DELETE FROM exchange_rate_snapshots");
  });

  afterEach(async () => {
    await pool.query("DELETE FROM exchange_rate_snapshots");
  });

  describe("saveSnapshot", () => {
    it("should save a valid FX snapshot", async () => {
      const rates = {
        USD: 1.0,
        EUR: 0.92,
        GBP: 0.79,
        JPY: 149.5,
      };

      const snapshot = await fxService.saveSnapshot(
        "openexchangerates",
        "USD",
        rates,
        new Date(),
      );

      expect(snapshot).toBeDefined();
      expect(snapshot.baseCurrency).toBe("USD");
      expect(snapshot.rates).toEqual(rates);
      expect(snapshot.source).toBe("openexchangerates");
    });

    it("should be idempotent (not create duplicates)", async () => {
      const rates = { USD: 1.0, EUR: 0.92 };
      const now = new Date();

      const snapshot1 = await fxService.saveSnapshot(
        "openexchangerates",
        "USD",
        rates,
        now,
      );
      const snapshot2 = await fxService.saveSnapshot(
        "openexchangerates",
        "USD",
        rates,
        now,
      );

      expect(snapshot1.id).toBe(snapshot2.id);

      // Verify only one snapshot exists
      const allSnapshots = await pool.query(
        "SELECT * FROM exchange_rate_snapshots",
      );
      expect(allSnapshots.rowCount).toBe(1);
    });
  });

  describe("getLatestSnapshot", () => {
    it("should return the latest active snapshot", async () => {
      const rates = {
        USD: 1.0,
        EUR: 0.92,
        GBP: 0.79,
      };

      await fxService.saveSnapshot(
        "openexchangerates",
        "USD",
        rates,
        new Date(),
      );
      const snapshot = await fxService.getLatestSnapshot();

      expect(snapshot).toBeDefined();
      expect(snapshot.baseCurrency).toBe("USD");
      expect(snapshot.rates).toEqual(rates);
    });

    it("should throw error if no snapshot available", async () => {
      await pool.query("DELETE FROM exchange_rate_snapshots");

      await expect(fxService.getLatestSnapshot()).rejects.toThrow(
        "No FX snapshot available",
      );
    });

    it("should prefer newer snapshots", async () => {
      const rates1 = { USD: 1.0, EUR: 0.9 };
      const rates2 = { USD: 1.0, EUR: 0.92 };

      const time1 = new Date("2024-01-15T10:00:00Z");
      const time2 = new Date("2024-01-15T11:00:00Z");

      await fxService.saveSnapshot("openexchangerates", "USD", rates1, time1);
      await fxService.saveSnapshot("openexchangerates", "USD", rates2, time2);

      const snapshot = await fxService.getLatestSnapshot();
      expect(snapshot.rates.EUR).toBe(0.92);
    });
  });

  describe("convertAmount", () => {
    beforeEach(async () => {
      const rates = {
        USD: 1.0,
        EUR: 0.92,
        GBP: 0.79,
        JPY: 149.5,
      };
      await fxService.saveSnapshot(
        "openexchangerates",
        "USD",
        rates,
        new Date(),
      );
    });

    it("should convert amount between two currencies", async () => {
      const result = await fxService.convertAmount(100, "USD", "EUR");

      expect(result).toBeDefined();
      expect(result.baseAmount).toBe(100);
      expect(result.baseCurrency).toBe("USD");
      expect(result.fxRate).toBe(0.92);
      expect(result.converted).toBe(92); // 100 * 0.92
    });

    it("should handle same currency (return 1:1)", async () => {
      const result = await fxService.convertAmount(100, "USD", "USD");

      expect(result.fxRate).toBe(1.0);
      expect(result.converted).toBe(100);
    });

    it("should handle reverse conversion", async () => {
      const result = await fxService.convertAmount(92, "EUR", "USD");

      expect(result.fxRate).toBeCloseTo(1 / 0.92, 5);
      expect(result.converted).toBeCloseTo(100, 2);
    });

    it("should calculate correct FX rate", async () => {
      const result = await fxService.convertAmount(1000, "GBP", "JPY");

      // GBP -> USD: 1000 / 0.79 = 1265.82
      // USD -> JPY: 1265.82 * 149.5 = 189,241.77
      const expectedConverted = (1000 / 0.79) * 149.5;

      expect(result.converted).toBeCloseTo(expectedConverted, 2);
    });

    it("should include snapshot timestamp", async () => {
      const result = await fxService.convertAmount(100, "USD", "EUR");

      expect(result.fetchedAt).toBeDefined();
      expect(result.fetchedAt instanceof Date).toBe(true);
    });

    it("should throw error if currency not found in snapshot", async () => {
      await expect(fxService.convertAmount(100, "USD", "XXX")).rejects.toThrow(
        /Missing FX rate for destination currency: XXX/,
      );
    });
  });

  describe("isSnapshotStale", () => {
    it("should return false for fresh snapshot", async () => {
      const now = new Date();
      const result = fxService.isSnapshotStale(now);
      expect(result).toBe(false);
    });

    it("should return false for snapshot < 3 hours old", async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const result = fxService.isSnapshotStale(twoHoursAgo);
      expect(result).toBe(false);
    });

    it("should return true for snapshot > 3 hours old", async () => {
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
      const result = fxService.isSnapshotStale(fourHoursAgo);
      expect(result).toBe(true);
    });
  });

  describe("getRate", () => {
    beforeEach(async () => {
      const rates = { USD: 1.0, EUR: 0.92, GBP: 0.79 };
      await fxService.saveSnapshot(
        "openexchangerates",
        "USD",
        rates,
        new Date(),
      );
    });

    it("should return rate for currency pair", async () => {
      const rate = await fxService.getRate("USD", "EUR");
      expect(rate).toBe(0.92);
    });

    it("should return 1 for same currency", async () => {
      const rate = await fxService.getRate("USD", "USD");
      expect(rate).toBe(1.0);
    });

    it("should throw error if currency not in snapshot", async () => {
      await expect(fxService.getRate("USD", "XXX")).rejects.toThrow();
    });
  });
});
