/**
 * useHotelFilters Hook
 * =====================
 * Manages hotel filter state with URL persistence for deep linking.
 * Syncs filter state with URL query parameters for shareable links.
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

type HotelFilters = {
  priceMin?: number;
  priceMax?: number;
  refundableOnly: boolean;
  sortBy: "top_picks" | "price_asc" | "price_desc" | "rating";
  starRating: number[];
  facilityIds: number[];
  strictFacilitiesFiltering: boolean;
  hotelTypeIds: number[];
  chainIds: number[];
  boardType?: "RO" | "BB" | "HB" | "FB" | "AI";
  minRating: number;
  minReviewsCount: number;
  advancedAccessibilityOnly: boolean;
};

// Default filter state
const DEFAULT_FILTERS: HotelFilters = {
  refundableOnly: false,
  sortBy: "top_picks",
  starRating: [],
  facilityIds: [],
  strictFacilitiesFiltering: false,
  hotelTypeIds: [],
  chainIds: [],
  minRating: 0,
  minReviewsCount: 0,
  advancedAccessibilityOnly: false,
};

// URL parameter keys
const FILTER_PARAMS = {
  priceMin: "minPrice",
  priceMax: "maxPrice",
  refundableOnly: "refundable",
  sortBy: "sort",
  starRating: "stars",
  facilityIds: "facilities",
  strictFacilitiesFiltering: "strictFacilities",
  hotelTypeIds: "hotelTypes",
  boardType: "board",
  minRating: "minRating",
  advancedAccessibilityOnly: "accessible",
} as const;

interface UseHotelFiltersResult {
  filters: HotelFilters;
  setFilters: (filters: HotelFilters) => void;
  updateFilter: <K extends keyof HotelFilters>(
    key: K,
    value: HotelFilters[K],
  ) => void;
  resetFilters: () => void;
  activeFilterCount: number;
  filterQueryParams: Record<string, any>;
}

/**
 * Parse array values from URL params
 */
function parseArrayParam(
  value: string | null,
  parser: (v: string) => any = Number,
): any[] {
  if (!value) return [];
  return value.split(",").map(parser).filter(Boolean);
}

/**
 * Serialize array values for URL params
 */
function serializeArrayParam(value: any[] | undefined): string | null {
  if (!value || value.length === 0) return null;
  return value.join(",");
}

/**
 * Hook to manage hotel filters with URL persistence
 */
export function useHotelFilters(): UseHotelFiltersResult {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse filters from URL on mount
  const parsedFilters = useMemo((): HotelFilters => {
    const filters: HotelFilters = { ...DEFAULT_FILTERS };

    // Price range
    const minPrice = searchParams.get(FILTER_PARAMS.priceMin);
    const maxPrice = searchParams.get(FILTER_PARAMS.priceMax);
    if (minPrice) filters.priceMin = parseFloat(minPrice);
    if (maxPrice) filters.priceMax = parseFloat(maxPrice);

    // Refundable only
    if (searchParams.get(FILTER_PARAMS.refundableOnly) === "true") {
      filters.refundableOnly = true;
    }

    // Sort by
    const sortBy = searchParams.get(
      FILTER_PARAMS.sortBy,
    ) as HotelFilters["sortBy"];
    if (
      sortBy &&
      ["top_picks", "price_asc", "price_desc", "rating"].includes(sortBy)
    ) {
      filters.sortBy = sortBy;
    }

    // Star rating
    const stars = searchParams.get(FILTER_PARAMS.starRating);
    if (stars) {
      filters.starRating = parseArrayParam(stars);
    }

    // Facilities
    const facilities = searchParams.get(FILTER_PARAMS.facilityIds);
    if (facilities) {
      filters.facilityIds = parseArrayParam(facilities);
    }

    // Strict facilities filtering
    if (searchParams.get(FILTER_PARAMS.strictFacilitiesFiltering) === "true") {
      filters.strictFacilitiesFiltering = true;
    }

    // Hotel types
    const hotelTypes = searchParams.get(FILTER_PARAMS.hotelTypeIds);
    if (hotelTypes) {
      filters.hotelTypeIds = parseArrayParam(hotelTypes);
    }

    // Board type
    const boardType = searchParams.get(
      FILTER_PARAMS.boardType,
    ) as HotelFilters["boardType"];
    if (boardType && ["RO", "BB", "HB", "FB", "AI"].includes(boardType)) {
      filters.boardType = boardType;
    }

    // Min rating
    const minRating = searchParams.get(FILTER_PARAMS.minRating);
    if (minRating) {
      filters.minRating = parseFloat(minRating);
    }

    // Accessibility
    if (searchParams.get(FILTER_PARAMS.advancedAccessibilityOnly) === "true") {
      filters.advancedAccessibilityOnly = true;
    }

    return filters;
  }, [searchParams]);

  const [filters, setFiltersState] = useState<HotelFilters>(parsedFilters);

  // Update URL when filters change
  const updateUrl = useCallback(
    (newFilters: HotelFilters) => {
      const params = new URLSearchParams(searchParams);

      // Update or remove each filter param
      if (newFilters.priceMin) {
        params.set(FILTER_PARAMS.priceMin, newFilters.priceMin.toString());
      } else {
        params.delete(FILTER_PARAMS.priceMin);
      }

      if (newFilters.priceMax) {
        params.set(FILTER_PARAMS.priceMax, newFilters.priceMax.toString());
      } else {
        params.delete(FILTER_PARAMS.priceMax);
      }

      if (newFilters.refundableOnly) {
        params.set(FILTER_PARAMS.refundableOnly, "true");
      } else {
        params.delete(FILTER_PARAMS.refundableOnly);
      }

      if (newFilters.sortBy !== "top_picks") {
        params.set(FILTER_PARAMS.sortBy, newFilters.sortBy);
      } else {
        params.delete(FILTER_PARAMS.sortBy);
      }

      const starsParam = serializeArrayParam(newFilters.starRating);
      if (starsParam) {
        params.set(FILTER_PARAMS.starRating, starsParam);
      } else {
        params.delete(FILTER_PARAMS.starRating);
      }

      const facilitiesParam = serializeArrayParam(newFilters.facilityIds);
      if (facilitiesParam) {
        params.set(FILTER_PARAMS.facilityIds, facilitiesParam);
      } else {
        params.delete(FILTER_PARAMS.facilityIds);
      }

      if (newFilters.strictFacilitiesFiltering) {
        params.set(FILTER_PARAMS.strictFacilitiesFiltering, "true");
      } else {
        params.delete(FILTER_PARAMS.strictFacilitiesFiltering);
      }

      const hotelTypesParam = serializeArrayParam(newFilters.hotelTypeIds);
      if (hotelTypesParam) {
        params.set(FILTER_PARAMS.hotelTypeIds, hotelTypesParam);
      } else {
        params.delete(FILTER_PARAMS.hotelTypeIds);
      }

      if (newFilters.boardType) {
        params.set(FILTER_PARAMS.boardType, newFilters.boardType);
      } else {
        params.delete(FILTER_PARAMS.boardType);
      }

      if (newFilters.minRating > 0) {
        params.set(FILTER_PARAMS.minRating, newFilters.minRating.toString());
      } else {
        params.delete(FILTER_PARAMS.minRating);
      }

      if (newFilters.advancedAccessibilityOnly) {
        params.set(FILTER_PARAMS.advancedAccessibilityOnly, "true");
      } else {
        params.delete(FILTER_PARAMS.advancedAccessibilityOnly);
      }

      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  // Set filters and update URL
  const setFilters = useCallback(
    (newFilters: HotelFilters) => {
      setFiltersState(newFilters);
      updateUrl(newFilters);
    },
    [updateUrl],
  );

  // Update a single filter
  const updateFilter = useCallback(
    <K extends keyof HotelFilters>(key: K, value: HotelFilters[K]) => {
      setFiltersState((prev) => {
        const newFilters = { ...prev, [key]: value };
        updateUrl(newFilters);
        return newFilters;
      });
    },
    [updateUrl],
  );

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
    updateUrl(DEFAULT_FILTERS);
  }, [updateUrl]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.starRating.length > 0) count++;
    if (filters.facilityIds.length > 0) count++;
    if (filters.priceMin || filters.priceMax) count++;
    if (filters.refundableOnly) count++;
    if (filters.boardType) count++;
    if (filters.hotelTypeIds.length > 0) count++;
    if (filters.advancedAccessibilityOnly) count++;
    return count;
  }, [filters]);

  // Build query params for API
  const filterQueryParams = useMemo(() => {
    const params: Record<string, any> = {};

    if (filters.priceMin) params.minPrice = filters.priceMin;
    if (filters.priceMax) params.maxPrice = filters.priceMax;
    if (filters.refundableOnly) params.refundableRatesOnly = true;
    if (filters.starRating.length > 0) params.starRating = filters.starRating;
    if (filters.facilityIds.length > 0) {
      params.facilityIds = filters.facilityIds;
      params.strictFacilitiesFiltering = filters.strictFacilitiesFiltering;
    }
    if (filters.hotelTypeIds.length > 0)
      params.hotelTypeIds = filters.hotelTypeIds;
    if (filters.boardType) params.boardType = filters.boardType;
    if (filters.minRating > 0) params.minRating = filters.minRating;
    if (filters.advancedAccessibilityOnly)
      params.advancedAccessibilityOnly = true;

    // Sorting
    if (filters.sortBy === "price_asc") {
      params.sortBy = "price";
      params.sortOrder = "asc";
    } else if (filters.sortBy === "price_desc") {
      params.sortBy = "price";
      params.sortOrder = "desc";
    } else if (filters.sortBy === "rating") {
      params.sortBy = "rating";
      params.sortOrder = "desc";
    }

    return params;
  }, [filters]);

  return {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    activeFilterCount,
    filterQueryParams,
  };
}

export default useHotelFilters;
