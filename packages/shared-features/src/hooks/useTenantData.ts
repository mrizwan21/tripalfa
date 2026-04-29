import { useQuery } from '@tanstack/react-query';
import { apiManager } from '../services/apiManager';

export function useTenantData() {
  const { data: tenantBookings = [], isLoading } = useQuery({
    queryKey: ['tenant-bookings'],
    queryFn: () => apiManager.getBookings()
  });

  return { tenantBookings, isLoading };
}