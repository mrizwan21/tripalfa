import { useState, useCallback, useRef, useEffect } from "react";
import { pricingApi } from "@/api/pricingApi";
import type { CouponValidationResult } from "@/api/pricingApi";

interface UseCouponValidationOptions {
  debounceDelay?: number;
  onValidationChange?: (result: CouponValidationResult) => void;
}

interface UseCouponValidationReturn {
  isValidating: boolean;
  validationResult: CouponValidationResult | null;
  error: string | null;
  validateCoupon: (
    code: string,
    amount: number,
    serviceType?: string,
  ) => Promise<CouponValidationResult | null>;
  clearValidation: () => void;
}

export function useCouponValidation(
  options: UseCouponValidationOptions = {},
): UseCouponValidationReturn {
  const { debounceDelay = 300, onValidationChange } = options;

  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] =
    useState<CouponValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cacheRef = useRef<Map<string, CouponValidationResult>>(new Map());

  const validateCoupon = useCallback(
    async (code: string, amount: number, serviceType?: string) => {
      // Clear previous error
      setError(null);

      // Check cache
      const cacheKey = `${code}:${amount}:${serviceType || ""}`;
      if (cacheRef.current.has(cacheKey)) {
        const cached = cacheRef.current.get(cacheKey)!;
        setValidationResult(cached);
        onValidationChange?.(cached);
        return cached;
      }

      // Clear previous debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new debounce timer
      setIsValidating(true);
      return new Promise<CouponValidationResult | null>((resolve) => {
        debounceTimerRef.current = setTimeout(async () => {
          try {
            const result = await pricingApi.validateCoupon(
              code,
              amount,
              serviceType,
            );
            cacheRef.current.set(cacheKey, result);
            setValidationResult(result);
            onValidationChange?.(result);
            resolve(result);
          } catch (err) {
            const errorMessage =
              err instanceof Error ? err.message : "Failed to validate coupon";
            setError(errorMessage);
            setValidationResult(null);
            resolve(null);
          } finally {
            setIsValidating(false);
          }
        }, debounceDelay);
      });
    },
    [debounceDelay, onValidationChange],
  );

  const clearValidation = useCallback(() => {
    setValidationResult(null);
    setError(null);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    isValidating,
    validationResult,
    error,
    validateCoupon,
    clearValidation,
  };
}
