import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  MapPin,
  Star,
  Wifi,
  Coffee,
  Waves,
  Calendar,
  User,
  ChevronDown,
  ChevronRight,
  Check,
  Filter,
  ArrowUpDown,
  RotateCcw,
  Building2,
  Zap,
  Clock,
  Server,
  X,
  SlidersHorizontal,
  Map,
  List,
  Sparkles,
  Grid3X3,
  LayoutGrid,
} from "lucide-react";
import hotelApi from "../api/hotelApi";
import { formatCurrency } from "@tripalfa/ui-components";
import { TripLogerLayout } from "../components/layout/TripLogerLayout";
import { usePopularDestinations } from "../hooks/useStaticData";
import { useFacilities, getPopularFacilities } from "../hooks/useFacilities";
import { useHotelFilters } from "../hooks/useHotelFilters";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { HotelMap } from "../components/map/HotelMap";
import {
  HotelSearchFilters,
  HotelFilters,
} from "../components/hotel/HotelSearchFilters";
import { HOTEL_STATIC_DATA } from "../lib/constants/hotel-static-data";
import { useTenantRuntime } from "@/components/providers/TenantRuntimeProvider";

// AMENITY_ICONS is accessed via HOTEL_STATIC_DATA.AMENITY_ICONS
const AMENITY_ICONS: Record<string, string> =
  (HOTEL_STATIC_DATA as any).AMENITY_ICONS ?? {};

// View modes
type ViewMode = "list" | "grid" | "map";

export default function HotelSearch() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { config: runtimeConfig } = useTenantRuntime();
  const popularDestinations = usePopularDestinations(5);

  // Form State
  const [location, setLocation] = useState(
    searchParams.get("location") || "Dubai",
  );
  const [checkin, setCheckin] = useState(searchParams.get("checkin") || "");
  const [checkout, setCheckout] = useState(searchParams.get("checkout") || "");
  const [adults, setAdults] = useState(Number(searchParams.get("adults")) || 2);
  const [children, setChildren] = useState(
    Number(searchParams.get("children")) || 0,
  );
  const [rooms, setRooms] = useState(Number(searchParams.get("rooms")) || 1);

  // Results State
  const [hotels, setHotels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isCached, setIsCached] = useState(false);

  // View State
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filter State - using custom hook for URL persistence
  const {
    filters,
    setFilters,
    resetFilters,
    activeFilterCount,
    filterQueryParams,
  } = useHotelFilters();

  // Fetch facilities from API
  const { facilities, isLoading: facilitiesLoading } = useFacilities();

  // Calculate result counts for filter badges
  const resultCounts = useMemo(() => {
    const byStar: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const byFacility: Record<number, number> = {};

    hotels.forEach((hotel) => {
      // Count by star rating
      if (hotel.rating) {
        const stars = Math.floor(hotel.rating);
        if (stars >= 1 && stars <= 5) {
          byStar[stars]++;
        }
      }

      // Count by facility
      (hotel.facilityIds || []).forEach((id: number) => {
        byFacility[id] = (byFacility[id] || 0) + 1;
      });
    });

    return { total: hotels.length, byStar, byFacility };
  }, [hotels]);

  // Sort hotels based on filter selection
  const sortedHotels = useMemo(() => {
    let sorted = [...hotels];

    switch (filters.sortBy) {
      case "price_asc":
        sorted.sort((a, b) => (a.price?.amount || 0) - (b.price?.amount || 0));
        break;
      case "price_desc":
        sorted.sort((a, b) => (b.price?.amount || 0) - (a.price?.amount || 0));
        break;
      case "rating":
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        // top_picks - keep original order
        break;
    }

    return sorted;
  }, [hotels, filters.sortBy]);

  // Filter hotels based on all filters (client-side additional filtering)
  const filteredHotels = useMemo(() => {
    return sortedHotels.filter((hotel) => {
      // Star filter
      if (filters.starRating.length > 0) {
        const hotelStars = Math.floor(hotel.rating || 0);
        const matchesStar = filters.starRating.some((s) => hotelStars >= s);
        if (!matchesStar) return false;
      }

      // Price filter
      if (filters.priceMin && (hotel.price?.amount || 0) < filters.priceMin)
        return false;
      if (filters.priceMax && (hotel.price?.amount || 0) > filters.priceMax)
        return false;

      // Refundable only
      if (filters.refundableOnly && !hotel.refundable) return false;

      return true;
    });
  }, [sortedHotels, filters]);

  // Perform search using LITEAPI with filters
  const handleSearch = async () => {
    if (!runtimeConfig.features.hotelBookingEnabled) {
      setHasSearched(true);
      setHotels([]);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    try {
      const searchPayload: any = {
        location,
        checkin,
        checkout,
        adults,
        children: children > 0 ? [children] : undefined,
        rooms,
        // Include all filter params
        ...filterQueryParams,
      };

      // Add facility filtering if facilities are selected
      if (filters.facilityIds.length > 0) {
        searchPayload.facilityIds = filters.facilityIds;
        searchPayload.strictFacilitiesFiltering =
          filters.strictFacilitiesFiltering;
      }

      const result = await hotelApi.search(searchPayload);
      // API returns { results, total }
      const hotelList = result.results || [];
      setHotels(Array.isArray(hotelList) ? hotelList : []);
      setIsCached(false);

      // Update URL params with search criteria
      const params = new URLSearchParams(searchParams);
      params.set("location", location);
      params.set("checkin", checkin);
      params.set("checkout", checkout);
      params.set("adults", String(adults));
      params.set("children", String(children));
      params.set("rooms", String(rooms));
      setSearchParams(params, { replace: true });
    } catch (error) {
      console.error("Search failed:", error);
      setHotels([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle filter apply
  const handleApplyFilters = useCallback(() => {
    if (hasSearched) {
      handleSearch();
    }
  }, [hasSearched, filters]);

  // Handle filter reset
  const handleResetFilters = useCallback(() => {
    resetFilters();
    if (hasSearched) {
      handleSearch();
    }
  }, [hasSearched]);

  // Handle hotel click from map
  const handleHotelClick = useCallback((hotelId: string) => {
    setSelectedHotelId(hotelId);
    // Scroll to hotel in list
    const element = document.getElementById(`hotel-${hotelId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  // Auto-search on mount if params exist
  useEffect(() => {
    if (
      runtimeConfig.features.hotelBookingEnabled &&
      searchParams.get("location")
    ) {
      handleSearch();
    }
  }, [runtimeConfig.features.hotelBookingEnabled]);

  // Detect mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!runtimeConfig.features.hotelBookingEnabled) {
    return (
      <TripLogerLayout>
        <div className="bg-[hsl(var(--background))] min-h-screen pt-28 flex items-center justify-center px-4 gap-2">
          <Card className="w-full max-w-xl p-10 text-center rounded-[2rem] border border-border shadow-sm space-y-4">
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              Hotel Search Disabled
            </h1>
            <p className="text-sm font-bold text-muted-foreground">
              Your admin has currently disabled hotel booking for this tenant.
            </p>
            <Button onClick={() => navigate("/")} className="h-11 px-6">
              Back to Home
            </Button>
          </Card>
        </div>
      </TripLogerLayout>
    );
  }

  return (
    <TripLogerLayout>
      <div className="bg-[hsl(var(--background))] min-h-screen pt-28">
        {/* Hero Section with Search */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(var(--primary))] to-[hsl(var(--accent))]">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent" />
          </div>

          <div className="container mx-auto px-4 max-w-6xl relative z-10 py-16">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-black text-background tracking-tight mb-4 drop-shadow-2xl">
                Find Your Perfect Stay
              </h1>
              <p className="text-background/80 font-bold text-lg uppercase tracking-[0.3em]">
                Curated Hotels Worldwide
              </p>
            </div>

            {/* Premium Search Card */}
            <Card className="p-0 bg-background/95 backdrop-blur-2xl shadow-[0_30px_60px_-20px_rgba(0,0,0,0.4)] border border-border/50 rounded-[2.5rem] overflow-visible relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div className="px-6 py-2 bg-[hsl(var(--secondary))] rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-[hsl(var(--secondary-foreground))] shadow-lg shadow-yellow-200/50">
                  Best Price Guaranteed
                </div>
              </div>

              <div className="p-8 pt-10">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                  {/* Destination */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 text-sm font-medium">
                      Destination
                    </label>
                    <div className="relative group">
                      <MapPin
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[hsl(var(--primary))] group-hover:scale-110 transition-transform"
                        size={18}
                      />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 bg-muted border-2 border-transparent rounded-2xl text-sm font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[hsl(var(--primary))] focus:bg-background hover:bg-background transition-all"
                        placeholder="Where are you going?"
                      />
                    </div>
                  </div>

                  {/* Check-in */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 text-sm font-medium">
                      Check-in
                    </label>
                    <div className="relative group">
                      <Calendar
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-[hsl(var(--primary))] transition-colors"
                        size={16}
                      />
                      <input
                        type="date"
                        value={checkin}
                        onChange={(e) => setCheckin(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 bg-muted border-2 border-transparent rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:border-[hsl(var(--primary))] focus:bg-background hover:bg-background cursor-pointer transition-all"
                      />
                    </div>
                  </div>

                  {/* Check-out */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 text-sm font-medium">
                      Check-out
                    </label>
                    <div className="relative group">
                      <Calendar
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-[hsl(var(--primary))] transition-colors"
                        size={16}
                      />
                      <input
                        type="date"
                        value={checkout}
                        onChange={(e) => setCheckout(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 bg-muted border-2 border-transparent rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:border-[hsl(var(--primary))] focus:bg-background hover:bg-background cursor-pointer transition-all"
                      />
                    </div>
                  </div>

                  {/* Guests */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 text-sm font-medium">
                      Guests
                    </label>
                    <div className="relative group">
                      <User
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-[hsl(var(--primary))] transition-colors"
                        size={16}
                      />
                      <select
                        value={adults}
                        onChange={(e) => setAdults(Number(e.target.value))}
                        className="w-full h-14 pl-12 pr-4 bg-muted border-2 border-transparent rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:border-[hsl(var(--primary))] focus:bg-background hover:bg-background cursor-pointer transition-all appearance-none"
                      >
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                          <option key={n} value={n}>
                            {n} Adult{n > 1 ? "s" : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                      />
                    </div>
                  </div>

                  {/* Search Button */}
                  <div className="flex items-end gap-4">
                    <Button
                      onClick={handleSearch}
                      disabled={isLoading}
                      className="w-full h-14 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)] font-black rounded-2xl shadow-xl shadow-indigo-200 uppercase text-[10px] tracking-[0.2em] transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Search size={18} className="mr-2" /> Search
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Results Section */}
        <div className="container mx-auto px-4 max-w-7xl py-12">
          {!hasSearched ? (
            /* Popular Destinations */
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-black text-foreground tracking-tight">
                  Popular Destinations
                </h2>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] mt-2">
                  Explore trending hotels worldwide
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                {(popularDestinations.data || [])
                  .slice(0, 5)
                  .map((dest: any, i: number) => (
                    <div
                      key={i}
                      onClick={() => {
                        setLocation(dest.city);
                        handleSearch();
                      }}
                      className="group relative h-64 rounded-[2rem] overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
                    >
                      <img
                        src={dest.imageUrl || "/images/placeholder-hotel.jpg"}
                        alt={dest.city}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                      <div className="absolute bottom-6 left-6">
                        <h3 className="text-2xl font-black text-background tracking-tight text-xl font-semibold tracking-tight">
                          {dest.city}
                        </h3>
                        <p className="text-[10px] font-bold text-background/70 uppercase tracking-widest mt-1">
                          {dest.hotelCount ? `${dest.hotelCount}+ Hotels` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            /* Results with Filters */
            <div className="flex gap-8">
              {/* Desktop Sidebar Filters */}
              {!isMobile && (
                <div className="w-72 shrink-0">
                  <div className="sticky top-32">
                    <HotelSearchFilters
                      facilities={facilities}
                      facilitiesLoading={facilitiesLoading}
                      filters={filters}
                      onFiltersChange={setFilters}
                      onApply={handleApplyFilters}
                      onReset={handleResetFilters}
                      resultCounts={resultCounts}
                    />
                  </div>
                </div>
              )}

              {/* Main Content */}
              <div className="flex-1 min-w-0 gap-4">
                {isLoading ? (
                  /* Loading State */
                  <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <div className="w-16 h-16 border-4 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin mb-6" />
                    <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-sm">
                      Searching the globe...
                    </p>
                  </div>
                ) : filteredHotels.length === 0 ? (
                  /* No Results */
                  <div className="text-center py-32">
                    <Building2
                      size={64}
                      className="mx-auto text-muted-foreground/40 mb-6"
                    />
                    <h3 className="text-2xl font-black text-muted-foreground text-xl font-semibold tracking-tight">
                      No hotels found
                    </h3>
                    <p className="text-muted-foreground mt-2">
                      Try adjusting your search criteria
                    </p>
                    <Button
                      onClick={handleResetFilters}
                      className="mt-4 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)]"
                    >
                      Reset All Filters
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Results Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 bg-card rounded-2xl p-4 shadow-sm">
                      <div>
                        <div className="flex items-center gap-3">
                          <h2 className="text-2xl font-black text-foreground">
                            {filteredHotels.length} Hotels
                          </h2>
                          {isCached && (
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                              <Zap size={12} className="text-green-600" />
                              Cached
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                          in {location}
                        </p>
                      </div>

                      {/* View Mode Toggle */}
                      <div className="flex items-center gap-2">
                        <div className="flex bg-muted rounded-xl p-1 gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode("list")}
                            className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-card shadow-sm" : ""}`}
                          >
                            <List
                              size={18}
                              className={
                                viewMode === "list"
                                  ? "text-[hsl(var(--primary))]"
                                  : "text-muted-foreground"
                              }
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode("grid")}
                            className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-card shadow-sm" : ""}`}
                          >
                            <Grid3X3
                              size={18}
                              className={
                                viewMode === "grid"
                                  ? "text-[hsl(var(--primary))]"
                                  : "text-muted-foreground"
                              }
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode("map")}
                            className={`p-2 rounded-lg transition-colors ${viewMode === "map" ? "bg-card shadow-sm" : ""}`}
                          >
                            <Map
                              size={18}
                              className={
                                viewMode === "map"
                                  ? "text-[hsl(var(--primary))]"
                                  : "text-muted-foreground"
                              }
                            />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Map View */}
                    {viewMode === "map" && (
                      <div className="bg-card rounded-2xl shadow-lg overflow-hidden h-[600px]">
                        <HotelMap
                          hotels={filteredHotels.map((h) => ({
                            id: h.id,
                            name: h.name,
                            latitude: h.latitude,
                            longitude: h.longitude,
                            rating: h.rating,
                            price: h.price?.amount,
                            currency: h.price?.currency,
                            image: h.image,
                          }))}
                          onHotelClick={handleHotelClick}
                          selectedHotelId={selectedHotelId || undefined}
                          height="600px"
                          showLocationCard={false}
                        />
                      </div>
                    )}

                    {/* List/Grid View */}
                    {viewMode !== "map" && (
                      <div
                        className={
                          viewMode === "grid"
                            ? "grid grid-cols-1 md:grid-cols-2 gap-6"
                            : "space-y-6"
                        }
                      >
                        {filteredHotels.map((hotel: any) => (
                          <Card
                            key={hotel.id}
                            id={`hotel-${hotel.id}`}
                            className={`group overflow-hidden border-none shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ${
                              viewMode === "list"
                                ? "flex h-72 bg-card rounded-[2rem]"
                                : "bg-card rounded-[2rem]"
                            } ${selectedHotelId === hotel.id ? "ring-4 ring-[hsl(var(--accent))]" : ""}`}
                          >
                            {/* Hotel Image */}
                            <div
                              className={`${viewMode === "list" ? "w-[35%]" : "h-48"} relative overflow-hidden`}
                            >
                              <img
                                src={hotel.image}
                                alt={hotel.name}
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                              />
                              <div className="absolute top-4 left-4">
                                <span className="bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-[hsl(var(--primary))] shadow-xl border border-border/50">
                                  {hotel.refundable
                                    ? "Free Cancellation"
                                    : "Top Rated"}
                                </span>
                              </div>
                            </div>

                            {/* Hotel Info */}
                            <div
                              className={`flex-1 p-6 ${viewMode === "list" ? "flex flex-col" : ""}`}
                            >
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 pr-4 gap-4">
                                  <div className="flex items-center gap-1 mb-2">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        size={14}
                                        className={
                                          i < (hotel.rating || 4)
                                            ? "text-yellow-400 fill-current"
                                            : "text-muted-foreground/40"
                                        }
                                      />
                                    ))}
                                  </div>
                                  <h3 className="text-xl font-black text-foreground group-hover:text-[hsl(var(--primary))] transition-colors leading-tight mb-2">
                                    {hotel.name}
                                  </h3>
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <MapPin
                                      size={14}
                                      className="text-[hsl(var(--primary))]"
                                    />
                                    <span className="text-[11px] font-black uppercase tracking-tighter">
                                      {hotel.location}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-1">
                                    From
                                  </p>
                                  <p className="text-2xl font-black text-[hsl(var(--primary))] tracking-tighter">
                                    {formatCurrency(
                                      hotel.price?.amount ||
                                        hotel.pricePerNight ||
                                        500,
                                    )}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground font-bold mt-1">
                                    per night
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4 p-3 bg-muted rounded-xl flex flex-wrap gap-3">
                                <span className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase">
                                  <Wifi size={14} className="text-blue-500" />{" "}
                                  WiFi
                                </span>
                                <span className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase">
                                  <Coffee
                                    size={14}
                                    className="text-orange-500"
                                  />{" "}
                                  Breakfast
                                </span>
                                <span className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase">
                                  <Waves size={14} className="text-cyan-500" />{" "}
                                  Pool
                                </span>
                              </div>

                              <div className="mt-auto flex items-center justify-between pt-4 gap-2">
                                <div className="flex items-center gap-3">
                                  <div className="bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-lg gap-2">
                                    {hotel.rating || "4.5"}
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-tighter text-foreground leading-none">
                                      Excellent
                                    </p>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase leading-none mt-1">
                                      {hotel.reviews || 420} Reviews
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)] h-11 px-6 font-black rounded-xl shadow-lg shadow-indigo-100 uppercase text-[9px] tracking-wide transition-all hover:scale-105 active:scale-95"
                                  onClick={() =>
                                    navigate(`/hotels/${hotel.id}`)
                                  }
                                >
                                  View Rooms{" "}
                                  <ChevronRight size={16} className="ml-1" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Filter Bottom Sheet */}
        {isMobile && hasSearched && !isLoading && filteredHotels.length > 0 && (
          <HotelSearchFilters
            facilities={facilities}
            facilitiesLoading={facilitiesLoading}
            filters={filters}
            onFiltersChange={setFilters}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            resultCounts={resultCounts}
            isMobile={true}
          />
        )}
      </div>
    </TripLogerLayout>
  );
}
