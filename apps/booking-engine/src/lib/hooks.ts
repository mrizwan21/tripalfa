import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  api,
  queryKeys,
  setAccessToken,
  setRefreshToken,
  clearTokens,
} from "./api";
import { API_ENDPOINTS } from "./constants";
import { useNavigate } from "react-router-dom";
import type { SocialProvider, AuthResponse } from "./socialAuth";

// ============================================================================
// Auth Hooks
// ============================================================================

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: any) =>
      api.post(API_ENDPOINTS.AUTH_LOGIN, credentials) as Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
      }>,
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
    mutationFn: (data: any) =>
      api.post(API_ENDPOINTS.AUTH_REGISTER, data) as Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
      }>,
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
      navigate("/login");
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
// Social OAuth Authentication Hooks
// ============================================================================

/**
 * Hook to initiate social login (Google, Facebook, Apple)
 * Redirects the user to the OAuth provider's authorization page
 */
export function useSocialLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (provider: SocialProvider) => {
      // Get OAuth authorization URL from backend
      const response = await api.get<{ authUrl: string }>(
        `${API_ENDPOINTS.AUTH_OAUTH}/${provider}`,
      );
      return response.authUrl;
    },
    onSuccess: (authUrl) => {
      // Redirect to OAuth provider
      window.location.href = authUrl;
    },
  });
}

/**
 * Hook to handle OAuth callback - exchange authorization code for tokens
 */
export function useOAuthCallback() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: { provider: SocialProvider; code: string }) =>
      api.post<AuthResponse>(API_ENDPOINTS.AUTH_OAUTH_CALLBACK, data),
    onSuccess: (data) => {
      // Store tokens
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      // Update user query cache
      queryClient.setQueryData(queryKeys.auth.user, data.user);
      // Navigate to home page
      navigate("/", { replace: true });
    },
  });
}

/**
 * Hook to get linked social accounts for the current user
 */
export function useLinkedAccounts(options?: Partial<UseQueryOptions<any>>) {
  return useQuery({
    queryKey: ["auth", "linked-accounts"],
    queryFn: () =>
      api.get<{ providers: SocialProvider[] }>(
        API_ENDPOINTS.AUTH_LINKED_ACCOUNTS,
      ),
    ...options,
  });
}

/**
 * Hook to link a social account to existing user
 */
export function useLinkSocialAccount() {
  return useMutation({
    mutationFn: async (provider: SocialProvider) => {
      const response = await api.get<{ authUrl: string }>(
        `${API_ENDPOINTS.AUTH_OAUTH_LINK}/${provider}`,
      );
      return response.authUrl;
    },
    onSuccess: (authUrl) => {
      window.location.href = authUrl;
    },
  });
}

/**
 * Hook to unlink a social account from existing user
 */
export function useUnlinkSocialAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (provider: SocialProvider) =>
      api.delete(`${API_ENDPOINTS.AUTH_OAUTH_UNLINK}/${provider}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "linked-accounts"] });
    },
  });
}

// ============================================================================
// Search Hooks
// ============================================================================

export function useFlightSearch(
  params: any,
  options?: Partial<UseQueryOptions<any>>,
) {
  return useQuery({
    queryKey: queryKeys.search.flights(params),
    queryFn: () => api.post(API_ENDPOINTS.SEARCH_FLIGHTS, params),
    enabled: !!params && Object.keys(params).length > 0,
    ...options,
  });
}

export function useHotelSearch(
  params: any,
  options?: Partial<UseQueryOptions<any>>,
) {
  return useQuery({
    queryKey: queryKeys.search.hotels(params),
    queryFn: () => api.post(API_ENDPOINTS.SEARCH_HOTELS, params),
    enabled: !!params && Object.keys(params).length > 0,
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
    queryKey: queryKeys.bookings.list("user"),
    queryFn: () => api.get(API_ENDPOINTS.USER_BOOKINGS),
    ...options,
  });
}

export function useBookingDetail(
  id: string,
  options?: Partial<UseQueryOptions<any>>,
) {
  return useQuery({
    queryKey: queryKeys.bookings.detail(id),
    queryFn: () => api.get(API_ENDPOINTS.BOOKING_DETAIL(id)),
    enabled: !!id,
    ...options,
  });
}
