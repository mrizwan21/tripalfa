import { useState, useEffect } from 'react';
import { loyaltyApi, CustomerLoyalty } from '../api/loyaltyApi';

export function useLoyaltyBalance(userId = 'current') {
  const [balance, setBalance] = useState<CustomerLoyalty | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const data = await loyaltyApi.getUserLoyalty(userId);
      setBalance(data);
    } catch (err: any) {
      setError(err);
      console.error("Failed to load loyalty balance", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [userId]);

  return { balance, isLoading, error, refresh };
}
