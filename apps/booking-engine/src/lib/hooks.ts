import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
import { api, queryKeys, setAccessToken, setRefreshToken, clearTokens } from './api';
import { API_ENDPOINTS } from './constants';
import { useNavigate } from 'react-router-dom';

// ============================================================================
// Auth Hooks
// ============================================================================

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: any) => api.post(API_ENDPOINTS.AUTH_LOGIN, credentials) as Promise<{ accessToken: string, refreshToken: string, user: any }>,
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      queryClient.setQueryData(queryKeys.auth.user, data.user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.post(API_ENDPOINTS.AUTH_REGISTER, data) as Promise<{ accessToken: string, refreshToken: string, user: any }>,
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      queryClient.setQueryData(queryKeys.auth.user, data.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => api.post(API_ENDPOINTS.AUTH_LOGOUT),
    onSettled: () => {
      clearTokens();
      queryClient.clear();
      navigate('/login');
    },
  });
}

export function useUserProfile(options?: Partial<UseQueryOptions<any>>) {
  return useQuery({
    queryKey: queryKeys.user.profile,
    queryFn: () => api.get(API_ENDPOINTS.USER_PROFILE),
    ...options,
  });
}

// ============================================================================
// Search Hooks
// ============================================================================

export function useFlightSearch(params: any, options?: Partial<UseQueryOptions<any>>) {
  return useQuery({
    queryKey: queryKeys.search.flights(params),
    queryFn: () => api.post(API_ENDPOINTS.SEARCH_FLIGHTS, params),
    enabled: !!params && (Object.keys(params).length > 0),
    ...options,
  });
}

export function useHotelSearch(params: any, options?: Partial<UseQueryOptions<any>>) {
  return useQuery({
    queryKey: queryKeys.search.hotels(params),
    queryFn: () => api.post(API_ENDPOINTS.SEARCH_HOTELS, params),
    enabled: !!params && (Object.keys(params).length > 0),
    ...options,
  });
}

// ============================================================================
// Booking Hooks
// ============================================================================

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.post(API_ENDPOINTS.BOOKING_CREATE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
  });
}

export function useUserBookings(options?: Partial<UseQueryOptions<any>>) {
  return useQuery({
    queryKey: queryKeys.bookings.list('user'),
    queryFn: () => api.get(API_ENDPOINTS.USER_BOOKINGS),
    ...options,
  });
}

export function useBookingDetail(id: string, options?: Partial<UseQueryOptions<any>>) {
  return useQuery({
    queryKey: queryKeys.bookings.detail(id),
    queryFn: () => api.get(API_ENDPOINTS.BOOKING_DETAIL(id)),
    enabled: !!id,
    ...options,
  });
}
