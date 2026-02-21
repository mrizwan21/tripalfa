/**
 * Exchange Rate Hook
 * ==================
 * React hook for fetching and caching exchange rates
 */

import { useState, useEffect, useCallback } from 'react';
import {
  exchangeRateApi,
  CurrencyCode,
  ConversionResult,
} from '../api/exchangeRateApi';

interface UseExchangeRateOptions {
  from: CurrencyCode;
  to: CurrencyCode;
  amount?: number;
  autoFetch?: boolean;
}

interface UseExchangeRateReturn {
  conversion: ConversionResult | null;
  rate: number | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  convert: (amount: number) => Promise<ConversionResult | null>;
}

/**
 * Hook for fetching exchange rate between two currencies
 */
export function useExchangeRate({
  from,
  to,
  amount = 1,
  autoFetch = true,
}: UseExchangeRateOptions): UseExchangeRateReturn {
  const [conversion, setConversion] = useState<ConversionResult | null>(null);
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!from || !to) return;

    setLoading(true);
    setError(null);

    try {
      const result = await exchangeRateApi.convert(amount, from, to);
      setConversion(result);
      setRate(result.rate);
    } catch (err: any) {
      console.error('Exchange rate fetch error:', err);
      setError(err.message || 'Failed to fetch exchange rate');
    } finally {
      setLoading(false);
    }
  }, [from, to, amount]);

  const convert = useCallback(
    async (convertAmount: number): Promise<ConversionResult | null> => {
      if (!from || !to) return null;

      setLoading(true);
      setError(null);

      try {
        const result = await exchangeRateApi.convert(convertAmount, from, to);
        setConversion(result);
        setRate(result.rate);
        return result;
      } catch (err: any) {
        console.error('Exchange rate convert error:', err);
        setError(err.message || 'Failed to convert currency');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [from, to]
  );

  useEffect(() => {
    if (autoFetch && from && to) {
      fetchData();
    }
  }, [autoFetch, from, to, fetchData]);

  return {
    conversion,
    rate,
    loading,
    error,
    refetch: fetchData,
    convert,
  };
}

// ── Multiple Rates Hook ─────────────────────────────────────────────────────

interface UseMultipleRatesOptions {
  base: CurrencyCode;
  targets: CurrencyCode[];
  autoFetch?: boolean;
}

interface UseMultipleRatesReturn {
  rates: Record<CurrencyCode, number>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching multiple exchange rates
 */
export function useMultipleRates({
  base,
  targets,
  autoFetch = true,
}: UseMultipleRatesOptions): UseMultipleRatesReturn {
  const [rates, setRates] = useState<Record<CurrencyCode, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!base || !targets.length) return;

    setLoading(true);
    setError(null);

    try {
      const result = await exchangeRateApi.getMultipleRates(base, targets);
      setRates(result);
    } catch (err: any) {
      console.error('Multiple rates fetch error:', err);
      setError(err.message || 'Failed to fetch exchange rates');
    } finally {
      setLoading(false);
    }
  }, [base, targets]);

  useEffect(() => {
    if (autoFetch && base && targets.length) {
      fetchData();
    }
  }, [autoFetch, base, targets, fetchData]);

  return {
    rates,
    loading,
    error,
    refetch: fetchData,
  };
}

export default useExchangeRate;
