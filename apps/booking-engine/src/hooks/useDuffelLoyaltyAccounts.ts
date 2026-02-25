/**
 * useDuffelLoyaltyAccounts Hook
 * 
 * React hook for managing Duffel loyalty programme accounts.
 * Provides CRUD operations for corporate loyalty accounts that can be
 * used in flight searches and bookings for frequent flyer benefits.
 * 
 * Documentation: https://duffel.com/docs/guides/adding-corporate-loyalty-programme-accounts
 */

import { useState, useCallback, useEffect } from 'react';
import flightApi from '../lib/api';

// ============================================================================
// TYPES
// ============================================================================

export interface DuffelLoyaltyAccount {
  id: string;
  passenger_id: string;
  airline_iata_code: string;
  account_number: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateLoyaltyAccountParams {
  passenger_id: string;
  airline_iata_code: string;
  account_number: string;
}

export interface UseDuffelLoyaltyAccountsOptions {
  /** Auto-fetch accounts on mount */
  autoFetch?: boolean;
  /** Passenger ID to filter accounts */
  passengerId?: string;
  /** Callback on successful account creation */
  onCreate?: (account: DuffelLoyaltyAccount) => void;
  /** Callback on successful account deletion */
  onDelete?: (accountId: string) => void;
  /** Callback on error */
  onError?: (error: string) => void;
}

export interface UseDuffelLoyaltyAccountsReturn {
  /** Loyalty accounts */
  accounts: DuffelLoyaltyAccount[];
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Fetch accounts */
  fetchAccounts: (passengerId?: string) => Promise<void>;
  /** Create a new loyalty account */
  createAccount: (params: CreateLoyaltyAccountParams) => Promise<DuffelLoyaltyAccount | null>;
  /** Delete a loyalty account */
  deleteAccount: (accountId: string) => Promise<boolean>;
  /** Clear error */
  clearError: () => void;
  /** Check if account exists for airline */
  hasAccountForAirline: (airlineIataCode: string) => boolean;
  /** Get account for specific airline */
  getAccountForAirline: (airlineIataCode: string) => DuffelLoyaltyAccount | undefined;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useDuffelLoyaltyAccounts(
  options: UseDuffelLoyaltyAccountsOptions = {}
): UseDuffelLoyaltyAccountsReturn {
  const {
    autoFetch = false,
    passengerId,
    onCreate,
    onDelete,
    onError,
  } = options;

  // State
  const [accounts, setAccounts] = useState<DuffelLoyaltyAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch accounts
  const fetchAccounts = useCallback(async (passengerIdFilter?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await flightApi.getDuffelLoyaltyAccounts({
        passenger_id: passengerIdFilter || passengerId,
      });

      if (response.success && response.data) {
        setAccounts(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch loyalty accounts');
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch loyalty accounts';
      console.error('[useDuffelLoyaltyAccounts] Fetch error:', errorMessage);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [passengerId, onError]);

  // Create account
  const createAccount = useCallback(async (params: CreateLoyaltyAccountParams): Promise<DuffelLoyaltyAccount | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await flightApi.createDuffelLoyaltyAccount(params);

      if (response.success && response.data) {
        const newAccount = response.data as DuffelLoyaltyAccount;
        setAccounts(prev => [...prev, newAccount]);
        onCreate?.(newAccount);
        return newAccount;
      } else {
        throw new Error(response.error || 'Failed to create loyalty account');
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to create loyalty account';
      console.error('[useDuffelLoyaltyAccounts] Create error:', errorMessage);
      setError(errorMessage);
      onError?.(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [onCreate, onError]);

  // Delete account
  const deleteAccount = useCallback(async (accountId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await flightApi.deleteDuffelLoyaltyAccount(accountId);

      if (response.success) {
        setAccounts(prev => prev.filter(acc => acc.id !== accountId));
        onDelete?.(accountId);
        return true;
      } else {
        throw new Error(response.error || 'Failed to delete loyalty account');
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to delete loyalty account';
      console.error('[useDuffelLoyaltyAccounts] Delete error:', errorMessage);
      setError(errorMessage);
      onError?.(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [onDelete, onError]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check if account exists for airline
  const hasAccountForAirline = useCallback((airlineIataCode: string): boolean => {
    return accounts.some(acc => acc.airline_iata_code === airlineIataCode);
  }, [accounts]);

  // Get account for specific airline
  const getAccountForAirline = useCallback((airlineIataCode: string): DuffelLoyaltyAccount | undefined => {
    return accounts.find(acc => acc.airline_iata_code === airlineIataCode);
  }, [accounts]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchAccounts();
    }
  }, [autoFetch, fetchAccounts]);

  return {
    accounts,
    loading,
    error,
    fetchAccounts,
    createAccount,
    deleteAccount,
    clearError,
    hasAccountForAirline,
    getAccountForAirline,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Build loyalty programme accounts array for Duffel API
 * Converts passenger loyalty selections to Duffel format
 */
export function buildLoyaltyProgrammeAccounts(
  passengers: Array<{
    id?: string;
    loyaltyProgram?: string;
    loyaltyNumber?: string;
  }>,
  loyaltyProgramsMap: Record<string, { providerCode?: string; airlineIataCode?: string }>
): Array<{ airline_iata_code: string; account_number: string }> {
  const accounts: Array<{ airline_iata_code: string; account_number: string }> = [];

  for (const passenger of passengers) {
    if (passenger.loyaltyProgram && passenger.loyaltyNumber) {
      const program = loyaltyProgramsMap[passenger.loyaltyProgram];
      if (program?.airlineIataCode) {
        accounts.push({
          airline_iata_code: program.airlineIataCode,
          account_number: passenger.loyaltyNumber,
        });
      }
    }
  }

  return accounts;
}

/**
 * Extract unique airline codes from flight offers
 * Used to suggest relevant loyalty programs
 */
export function extractAirlineCodesFromOffers(offers: any[]): string[] {
  const codes = new Set<string>();
  
  for (const offer of offers) {
    // Check slices
    if (offer.slices) {
      for (const slice of offer.slices) {
        if (slice.segments) {
          for (const segment of slice.segments) {
            if (segment.operating_carrier?.iata_code) {
              codes.add(segment.operating_carrier.iata_code);
            }
            if (segment.marketing_carrier?.iata_code) {
              codes.add(segment.marketing_carrier.iata_code);
            }
          }
        }
      }
    }
    
    // Check raw offer format
    if (offer.rawOffer?.slices) {
      for (const slice of offer.rawOffer.slices) {
        if (slice.segments) {
          for (const segment of slice.segments) {
            if (segment.operating_carrier?.iata_code) {
              codes.add(segment.operating_carrier.iata_code);
            }
            if (segment.marketing_carrier?.iata_code) {
              codes.add(segment.marketing_carrier.iata_code);
            }
          }
        }
      }
    }
    
    // Check carrier code directly
    if (offer.carrierCode) {
      codes.add(offer.carrierCode);
    }
  }
  
  return Array.from(codes);
}

export default useDuffelLoyaltyAccounts;