import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useAirports,
  useAirlines,
  useCountries,
  useCurrencies,
  usePopularDestinations,
  useHotelAmenities,
  useBoardTypes,
  useHotelTypes,
  queryKeys,
} from './useStaticData';

/**
 * Bootstrap hook to prefetch all critical static data on app mount.
 * Runs once to populate the React Query cache with essential datasets.
 * Gracefully handles errors - failures don't break the app.
 *
 * Usage in App.tsx:
 * ```tsx
 * export default function App() {
 *   useBootstrapStaticData();
 *   return <YourRoutes />;
 * }
 * ```
 */
export function useBootstrapStaticData(): void {
  const queryClient = useQueryClient();
  const hasBootstrapped = useRef(false);

  // Fetch all critical datasets
  const airports = useAirports();
  const airlines = useAirlines();
  const countries = useCountries();
  const currencies = useCurrencies();
  const popularDestinations = usePopularDestinations();
  const hotelAmenities = useHotelAmenities();
  const boardTypes = useBoardTypes();
  const hotelTypes = useHotelTypes();

  // Mark bootstrap as complete once all critical data is cached
  useEffect(() => {
    if (hasBootstrapped.current) return;

    const allLoaded =
      airports.isSuccess &&
      airlines.isSuccess &&
      countries.isSuccess &&
      currencies.isSuccess &&
      popularDestinations.isSuccess &&
      hotelAmenities.isSuccess &&
      boardTypes.isSuccess &&
      hotelTypes.isSuccess;

    if (allLoaded) {
      hasBootstrapped.current = true;
      console.log('[Static Data] Bootstrap complete - 8 datasets cached');
    }
  }, [
    airports.isSuccess,
    airlines.isSuccess,
    countries.isSuccess,
    currencies.isSuccess,
    popularDestinations.isSuccess,
    hotelAmenities.isSuccess,
    boardTypes.isSuccess,
    hotelTypes.isSuccess,
  ]);

  // Log any errors silently (don't propagate to UI)
  useEffect(() => {
    const errors = [
      airports.error,
      airlines.error,
      countries.error,
      currencies.error,
      popularDestinations.error,
      hotelAmenities.error,
      boardTypes.error,
      hotelTypes.error,
    ].filter((e) => e != null);

    if (errors.length > 0) {
      console.warn('[Static Data] Bootstrap encountered errors:', errors);
    }
  }, [
    airports.error,
    airlines.error,
    countries.error,
    currencies.error,
    popularDestinations.error,
    hotelAmenities.error,
    boardTypes.error,
    hotelTypes.error,
  ]);
}

/**
 * Prefetch multiple datasets manually for advanced use cases.
 * Useful when you know a specific feature will be used soon.
 *
 * Example: Prefetch hotel-related data when user navigates to hotel search
 * ```tsx
 * const { prefetchHotelData } = usePrefetchStaticData();
 * useEffect(() => {
 *   if (searchType === 'hotels') {
 *     prefetchHotelData();
 *   }
 * }, [searchType]);
 * ```
 */
export function usePrefetchStaticData() {
  const queryClient = useQueryClient();

  return {
    prefetchFlightData: async () => {
      try {
        await Promise.all([
          queryClient.prefetchQuery({
            queryKey: ["airports"],
            queryFn: async () => {
              const res = await fetch(
                `${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/static/airports`
              );
              if (!res.ok) throw new Error('Failed to fetch airports');
              return res.json();
            },
          }),
          queryClient.prefetchQuery({
            queryKey: ["airlines"],
            queryFn: async () => {
              const res = await fetch(
                `${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/static/airlines`
              );
              if (!res.ok) throw new Error('Failed to fetch airlines');
              return res.json();
            },
          }),
        ]);
      } catch (error) {
        console.warn('Failed to prefetch flight data:', error);
      }
    },

    prefetchHotelData: async () => {
      try {
        await Promise.all([
          queryClient.prefetchQuery({
            queryKey: ["countries"],
            queryFn: async () => {
              const res = await fetch(
                `${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/static/countries`
              );
              if (!res.ok) throw new Error('Failed to fetch countries');
              return res.json();
            },
          }),
          queryClient.prefetchQuery({
            queryKey: ["hotelAmenities"],
            queryFn: async () => {
              const res = await fetch(
                `${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/static/hotel-amenities`
              );
              if (!res.ok) throw new Error('Failed to fetch amenities');
              return res.json();
            },
          }),
          queryClient.prefetchQuery({
            queryKey: ["hotelTypes"],
            queryFn: async () => {
              const res = await fetch(
                `${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/static/hotel-types`
              );
              if (!res.ok) throw new Error('Failed to fetch hotel types');
              return res.json();
            },
          }),
        ]);
      } catch (error) {
        console.warn('Failed to prefetch hotel data:', error);
      }
    },

    prefetchPaymentData: async () => {
      try {
        await Promise.all([
          queryClient.prefetchQuery({
            queryKey: ["currencies"],
            queryFn: async () => {
              const res = await fetch(
                `${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/static/currencies`
              );
              if (!res.ok) throw new Error('Failed to fetch currencies');
              return res.json();
            },
          }),
        ]);
      } catch (error) {
        console.warn('Failed to prefetch payment data:', error);
      }
    },
  };
}
