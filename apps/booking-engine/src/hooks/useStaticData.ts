import { useQuery } from "@tanstack/react-query";
import {
  fetchDestinations,
  fetchAirports,
  fetchCountries,
  fetchAirlines,
  fetchAmenities,
  fetchCurrencies,
  fetchPopularDestinations,
  fetchBoardTypes,
  fetchHotelTypes,
  fetchRoomTypes,
  fetchStarRatings,
  fetchLoyaltyPrograms,
  getEnvironmentInfo,
} from "../lib/dataFetchStrategy";

const staticApiClient = {
  get: async (url: string) => {
    const gatewayUrl = import.meta.env.VITE_GATEWAY_URL || "";
    const res = await fetch(`${gatewayUrl}${url}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return { data };
  },
};

// Static data query keys
const allKey = ["staticData"] as const;

export const staticDataKeys = {
  all: allKey,
  amenities: () => [...allKey, "amenities"] as const,
  boardTypes: () => [...allKey, "boardTypes"] as const,
  hotelTypes: () => [...allKey, "hotelTypes"] as const,
  chains: () => [...allKey, "chains"] as const,
  starRatings: () => [...allKey, "starRatings"] as const,
  roomTypes: () => [...allKey, "roomTypes"] as const,
  viewTypes: () => [...allKey, "viewTypes"] as const,
  paymentTypes: () => [...allKey, "paymentTypes"] as const,
  destinations: (query?: string) => [...allKey, "destinations", query] as const,
  airports: () => [...allKey, "airports"] as const,
  airlines: () => [...allKey, "airlines"] as const,
  countries: () => [...allKey, "countries"] as const,
  currencies: () => [...allKey, "currencies"] as const,
  popularDestinations: () => [...allKey, "popularDestinations"] as const,
  popularHotels: (limit?: number) => [...allKey, "popularHotels", limit] as const,
};

// Hooks for static data with caching (stale time: 1 hour)
export const useAmenities = () => {
  return useQuery({
    queryKey: staticDataKeys.amenities(),
    queryFn: async () => {
      const result = await fetchAmenities();
      return result.data || [];
    },
    staleTime: 60 * 60 * 1000,
  });
};

export const useBoardTypes = () => {
  return useQuery({
    queryKey: staticDataKeys.boardTypes(),
    queryFn: async () => {
      const result = await fetchBoardTypes();
      return result.data || [];
    },
    staleTime: 60 * 60 * 1000,
  });
};

export const useHotelTypes = () => {
  return useQuery({
    queryKey: staticDataKeys.hotelTypes(),
    queryFn: async () => {
      const result = await fetchHotelTypes();
      return result.data || [];
    },
    staleTime: 60 * 60 * 1000,
  });
};

export const useHotelChains = () => {
  return useQuery({
    queryKey: staticDataKeys.chains(),
    queryFn: async () => {
      const result = await fetchDestinations({ type: "hotel_chains" });
      return result.data || [];
    },
    staleTime: 60 * 60 * 1000,
  });
};

export const useStarRatings = () => {
  return useQuery({
    queryKey: staticDataKeys.starRatings(),
    queryFn: async () => {
      const result = await fetchStarRatings();
      return result.data || [];
    },
    staleTime: 60 * 60 * 1000,
  });
};

export const useRoomTypes = () => {
  return useQuery({
    queryKey: staticDataKeys.roomTypes(),
    queryFn: async () => {
      const result = await fetchRoomTypes();
      return result.data || [];
    },
    staleTime: 60 * 60 * 1000,
  });
};

export const useViewTypes = () => {
  return useQuery({
    queryKey: staticDataKeys.viewTypes(),
    queryFn: async () => {
      const result = await fetchDestinations({ type: "view_types" });
      return result.data || [];
    },
    staleTime: 60 * 60 * 1000,
  });
};

export const usePaymentTypes = () => {
  return useQuery({
    queryKey: staticDataKeys.paymentTypes(),
    queryFn: async () => {
      const result = await fetchDestinations({ type: "payment_types" });
      return result.data || [];
    },
    staleTime: 60 * 60 * 1000,
  });
};

export const useDestinations = (query?: string) => {
  return useQuery({
    queryKey: staticDataKeys.destinations(query),
    queryFn: async () => {
      const result = await fetchDestinations({ type: "city", limit: 20 });
      if (query) {
        return result.data?.filter((d: any) =>
          d.name?.toLowerCase().includes(query.toLowerCase()) ||
          d.city?.toLowerCase().includes(query.toLowerCase())
        ) || [];
      }
      return result.data || [];
    },
    staleTime: 60 * 60 * 1000,
  });
};

export const useAirports = (query?: string) => {
  return useQuery({
    queryKey: [...staticDataKeys.airports(), query],
    queryFn: async () => {
      const result = await fetchAirports(query);
      return result.data || [];
    },
    staleTime: 60 * 60 * 1000,
  });
};

export const useAirlines = (query?: string) => {
  return useQuery({
    queryKey: [...staticDataKeys.airlines(), query],
    queryFn: async () => {
      const result = await fetchAirlines(query);
      return result.data || [];
    },
    staleTime: 60 * 60 * 1000,
  });
};

export const useCountries = (query?: string) => {
  return useQuery({
    queryKey: [...staticDataKeys.countries(), query],
    queryFn: async () => {
      const result = await fetchCountries(query);
      return result.data || [];
    },
    staleTime: 60 * 60 * 1000,
  });
};

export const useCurrencies = () => {
  return useQuery({
    queryKey: staticDataKeys.currencies(),
    queryFn: async () => {
      const result = await fetchCurrencies();
      return result.data || [];
    },
    staleTime: 60 * 60 * 1000,
  });
};

export const usePopularDestinations = (limit: number = 10) => {
  return useQuery({
    queryKey: [...staticDataKeys.popularDestinations(), limit],
    queryFn: async () => {
      const result = await fetchPopularDestinations(limit);
      return (result?.data ?? []) as any[];
    },
    staleTime: 60 * 60 * 1000,
  });
};

// Alias for useDestinations (used by useBundledStaticData)
export const useCities = useDestinations;

export const usePopularHotels = (limit: number = 12) => {
  return useQuery({
    queryKey: [...staticDataKeys.popularHotels(limit)],
    queryFn: async () => {
      const result = await fetchPopularDestinations(limit);
      return result.data || [];
    },
    staleTime: 60 * 60 * 1000,
  });
};

export const useLoyaltyPrograms = () => {
  return useQuery({
    queryKey: [...staticDataKeys.all, "loyaltyPrograms"],
    queryFn: async () => {
      const result = await fetchLoyaltyPrograms();
      return result.data || [];
    },
    staleTime: 60 * 60 * 1000,
  });
};

export const useHotelAmenities = () => {
  return useAmenities();
};

export const queryKeys = staticDataKeys;

// Export environment info for debugging
export const useEnvironmentInfo = () => {
  return getEnvironmentInfo();
};
