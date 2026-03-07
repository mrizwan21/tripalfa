import React, { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  Calendar,
  Users,
  ArrowRight,
  ShoppingCart,
  Sparkles,
  Plane,
  Hotel,
  Car,
} from "lucide-react";
import { cn, formatCurrency } from "@tripalfa/shared-utils/utils";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { api, fetchAirports } from "../lib/api";
import { useTenantRuntime } from "@/components/providers/TenantRuntimeProvider";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_CONTENT_CONFIG,
  loadTenantContentConfig,
} from "../lib/tenantContentConfig";

interface CartSummaryResponse {
  data: {
    itemCount: number;
  };
}

interface AirportResult {
  type: "AIRPORT";
  icon: string;
  title: string;
  subtitle: string;
  code: string;
  city?: string;
  country?: string;
  countryCode?: string;
}

interface Flight {
  id: string;
  airline: string;
  airlineLogo: string;
  flightNumber: string;
  price: number;
  currency: string;
  departureTime: string;
  arrivalTime: string;
  origin: string;
  destination: string;
  duration: string;
  stops: number;
}

export default function Home() {
  const { config: runtimeConfig } = useTenantRuntime();
  const [contentConfig, setContentConfig] = useState(DEFAULT_CONTENT_CONFIG);
  const [activeTab, setActiveTab] = React.useState("flights");
  const [cartCount, setCartCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [airports, setAirports] = useState<AirportResult[]>([]);
  const [featuredFlights, setFeaturedFlights] = useState<Flight[]>([]);
  const [popularDestinations, setPopularDestinations] = useState<any[]>([]);
  const marketingHome = contentConfig.marketing.home;
  const homeFlightSearchLabels = marketingHome.searchFormLabels.flight;
  const homeHotelSearchLabels = marketingHome.searchFormLabels.hotel;

  // Fetch featured flights and popular destinations on component mount
  useEffect(() => {
    fetchFeaturedFlights();
    fetchCartSummary();
    fetchPopularDestinationsData();
  }, []);

  useEffect(() => {
    let active = true;

    const loadContent = async () => {
      try {
        const content = await loadTenantContentConfig();
        if (active) {
          setContentConfig(content);
        }
      } catch {
        if (active) {
          setContentConfig(DEFAULT_CONTENT_CONFIG);
        }
      }
    };

    loadContent();

    return () => {
      active = false;
    };
  }, []);

  const fetchFeaturedFlights = async () => {
    try {
      const response = await api.get("/search/flights/popular");
      if (response && Array.isArray(response)) {
        setFeaturedFlights(response.slice(0, 4));
      }
    } catch (error) {
      console.error("Failed to fetch featured flights:", error);
      setFeaturedFlights([]);
    }
  };

  const fetchPopularDestinationsData = async () => {
    try {
      const { fetchPopularDestinations } = await import("../lib/api");
      const destinations = await fetchPopularDestinations(8);
      setPopularDestinations(destinations || []);
    } catch (error) {
      console.error("Failed to fetch popular destinations:", error);
      setPopularDestinations([]);
    }
  };

  const fetchCartSummary = async () => {
    try {
      const response = await (globalThis as any).fetch?.(
        "/api/cart/summary?sessionId=guest-session",
      );
      if (response && response.ok) {
        const { data } = (await response.json()) as CartSummaryResponse;
        setCartCount(data.itemCount);
      }
    } catch (error) {
      (globalThis as any).console?.log("Cart not available");
    }
  };

  useEffect(() => {
    if (
      typeof globalThis === "undefined" ||
      !(globalThis as any).addEventListener
    )
      return;
    const handleScroll = () => setIsScrolled((globalThis as any).scrollY > 50);
    (globalThis as any).addEventListener("scroll", handleScroll);
    return () =>
      (globalThis as any).removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (searchQuery.length > 1) {
      if (
        activeTab !== "flights" ||
        !runtimeConfig.features.flightBookingEnabled
      ) {
        setAirports([]);
        return;
      }
      const fetchAirportData = async () => {
        try {
          const results = await fetchAirports(searchQuery);
          setAirports((results || []) as AirportResult[]);
        } catch (error) {
          console.error("[Home] Failed to fetch airports:", error);
          setAirports([]);
        }
      };
      fetchAirportData();
    } else {
      setAirports([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (
      activeTab === "flights" &&
      !runtimeConfig.features.flightBookingEnabled
    ) {
      setActiveTab(
        runtimeConfig.features.hotelBookingEnabled ? "hotels" : "packages",
      );
    }
    if (activeTab === "hotels" && !runtimeConfig.features.hotelBookingEnabled) {
      setActiveTab(
        runtimeConfig.features.flightBookingEnabled ? "flights" : "packages",
      );
    }
  }, [
    activeTab,
    runtimeConfig.features.flightBookingEnabled,
    runtimeConfig.features.hotelBookingEnabled,
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-background to-blue-50/20 gap-4">
      {/* Floating Cart */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="primary"
          size="md"
          className="relative bg-background/90 backdrop-blur-lg border border-border rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <ShoppingCart className="h-6 w-6 text-foreground" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold gap-2">
              {cartCount}
            </span>
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          "fixed top-0 w-full z-40 transition-all duration-500",
          isScrolled
            ? "bg-background/95 backdrop-blur-lg shadow-lg"
            : "bg-transparent",
        )}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[hsl(var(--primary))] rounded-lg flex items-center justify-center gap-2">
                <Plane className="h-5 w-5 text-background" />
              </div>
              <span className="text-xl font-bold text-foreground">
                {marketingHome.nav.brandName}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#flights"
                className="text-muted-foreground hover:text-[hsl(var(--primary))] transition-colors font-medium"
              >
                {marketingHome.nav.flights}
              </a>
              <a
                href="#hotels"
                className="text-muted-foreground hover:text-[hsl(var(--primary))] transition-colors font-medium"
              >
                {marketingHome.nav.hotels}
              </a>
              <a
                href="#packages"
                className="text-muted-foreground hover:text-[hsl(var(--primary))] transition-colors font-medium"
              >
                {marketingHome.nav.packages}
              </a>
              <a
                href="#cars"
                className="text-muted-foreground hover:text-[hsl(var(--primary))] transition-colors font-medium"
              >
                {marketingHome.nav.cars}
              </a>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="primary"
                size="sm"
                className="hidden md:flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {marketingHome.nav.aiSearchLabel}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 gap-2">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary)/0.1)] via-purple-50/10 to-blue-50/20" />

        <div className="container relative z-10 px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Hero Content */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-background border border-border rounded-full px-4 py-2 mb-4 justify-center shadow-sm">
                <Sparkles className="h-4 w-4 text-[hsl(var(--primary))]" />
                <span className="text-foreground text-sm font-medium">
                  {marketingHome.hero.badge}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
                {marketingHome.hero.title}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {marketingHome.hero.subtitle}
              </p>
            </div>

            {/* Search Widget */}
            <Card className="bg-background shadow-2xl overflow-hidden border-0">
              {/* Tab Navigation */}
              <div className="flex border-b border-border gap-4">
                {[
                  {
                    id: "flights",
                    label: marketingHome.tabs.flights,
                    icon: Plane,
                  },
                  {
                    id: "hotels",
                    label: marketingHome.tabs.hotels,
                    icon: Hotel,
                  },
                  {
                    id: "packages",
                    label: marketingHome.tabs.packages,
                    icon: Sparkles,
                  },
                  { id: "cars", label: marketingHome.tabs.cars, icon: Car },
                ].map(({ id, label, icon: Icon }) =>
                  (() => {
                    const isDisabled =
                      (id === "flights" &&
                        !runtimeConfig.features.flightBookingEnabled) ||
                      (id === "hotels" &&
                        !runtimeConfig.features.hotelBookingEnabled);
                    return (
                      <Button
                        variant="ghost"
                        size="md"
                        key={id}
                        disabled={isDisabled}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all duration-200",
                          activeTab === id
                            ? "text-[hsl(var(--primary-foreground))] bg-[hsl(var(--primary))]"
                            : "text-muted-foreground hover:text-[hsl(var(--primary))] hover:bg-muted",
                          isDisabled
                            ? "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground"
                            : "",
                        )}
                        onClick={() => setActiveTab(id)}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </Button>
                    );
                  })(),
                )}
              </div>

              {/* Search Form */}
              <div className="p-6">
                {activeTab === "flights" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div className="lg:col-span-1">
                      <Label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
                        {homeFlightSearchLabels.from}
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder={homeFlightSearchLabels.originPlaceholder}
                          className="pl-10 h-14 rounded-xl"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {airports.length > 0 && (
                          <div className="absolute top-full mt-1 w-full bg-background border border-border rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                            {airports.map((airport, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                              >
                                <span className="text-lg">✈️</span>
                                <div>
                                  <p className="font-medium text-foreground">
                                    {airport.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {airport.subtitle}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="lg:col-span-1">
                      <Label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
                        {homeFlightSearchLabels.to}
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder={
                            homeFlightSearchLabels.destinationPlaceholder
                          }
                          className="pl-10 h-14 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-1">
                      <Label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
                        {homeFlightSearchLabels.departure}
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="date"
                          placeholder={homeFlightSearchLabels.departure}
                          className="pl-10 h-14 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-1">
                      <Label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
                        {homeFlightSearchLabels.return}
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="date"
                          placeholder={homeFlightSearchLabels.return}
                          className="pl-10 h-14 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-1">
                      <Button
                        disabled={!runtimeConfig.features.flightBookingEnabled}
                        className="w-full h-14 rounded-xl bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)] text-[hsl(var(--primary-foreground))] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Search className="h-4 w-4 mr-2" />
                        {homeFlightSearchLabels.searchCtaLabel}
                      </Button>
                    </div>
                    {!runtimeConfig.features.flightBookingEnabled && (
                      <div className="lg:col-span-5 text-center">
                        <p className="text-xs font-bold text-muted-foreground">
                          {homeFlightSearchLabels.disabledLabel}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "hotels" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div className="lg:col-span-2">
                      <Label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
                        {homeHotelSearchLabels.destination}
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder={
                            homeHotelSearchLabels.destinationPlaceholder
                          }
                          className="pl-10 h-14 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-1">
                      <Label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
                        {homeHotelSearchLabels.checkIn}
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="date"
                          placeholder={homeHotelSearchLabels.checkIn}
                          className="pl-10 h-14 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-1">
                      <Label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
                        {homeHotelSearchLabels.checkOut}
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="date"
                          placeholder={homeHotelSearchLabels.checkOut}
                          className="pl-10 h-14 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-1">
                      <Button
                        disabled={!runtimeConfig.features.hotelBookingEnabled}
                        className="w-full h-14 rounded-xl bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)] text-[hsl(var(--primary-foreground))] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Search className="h-4 w-4 mr-2" />
                        {homeHotelSearchLabels.searchCtaLabel}
                      </Button>
                    </div>
                    {!runtimeConfig.features.hotelBookingEnabled && (
                      <div className="lg:col-span-5 text-center">
                        <p className="text-xs font-bold text-muted-foreground">
                          {homeHotelSearchLabels.disabledLabel}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "packages" && (
                  <div className="text-center py-8">
                    <Sparkles className="h-12 w-12 text-[hsl(var(--primary))] mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-foreground mb-2">
                      {marketingHome.packages.title}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {marketingHome.packages.subtitle}
                    </p>
                    <Button className="h-12 px-8 rounded-xl bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)] text-[hsl(var(--primary-foreground))]">
                      {marketingHome.packages.ctaLabel}
                    </Button>
                  </div>
                )}

                {activeTab === "cars" && (
                  <div className="text-center py-8">
                    <Car className="h-12 w-12 text-[hsl(var(--secondary))] mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-foreground mb-2">
                      {marketingHome.cars.title}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {marketingHome.cars.subtitle}
                    </p>
                    <Button
                      variant="outline"
                      className="h-12 px-8 rounded-xl border-[hsl(var(--primary))] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))]"
                    >
                      {marketingHome.cars.ctaLabel}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Popular Destinations */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12 gap-2">
            <div>
              <h2 className="text-3xl font-bold text-foreground">
                {marketingHome.popularDestinations.title}
              </h2>
              <p className="text-muted-foreground mt-2">
                {marketingHome.popularDestinations.subtitle}
              </p>
            </div>
            <Button variant="ghost" className="flex items-center gap-2">
              {marketingHome.popularDestinations.viewAllLabel}{" "}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(popularDestinations.length > 0
              ? popularDestinations
              : [
                {
                  city: "Dubai",
                  image:
                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRjNFNUYxIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzAwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkR1YmFpIENpdHkgSW1hZ2U8L3RleHQ+PC9zdmc+",
                  price: 450,
                },
                {
                  city: "London",
                  image:
                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRjNFNUYxIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzAwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvbmRvbiBDaXR5IEltYWdlPC90ZXh0Pjwvc3ZnPg==",
                  price: 620,
                },
                {
                  city: "Paris",
                  image:
                    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80",
                  price: 580,
                },
                {
                  city: "New York",
                  image:
                    "https://images.unsplash.com/photo-1496442226666-8d4a0e62e6e9?auto=format&fit=crop&q=80",
                  price: 750,
                },
              ]
            ).map((dest: any) => (
              <div
                key={dest.city}
                className="group relative rounded-xl overflow-hidden aspect-[3/4] cursor-pointer shadow-lg hover:shadow-xl transition-shadow"
              >
                <img
                  src={
                    dest.image ||
                    `https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80`
                  }
                  alt={dest.city}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                <div className="absolute bottom-6 left-6 text-background">
                  <h3 className="text-xl font-bold">{dest.city}</h3>
                  <p className="text-sm text-background/80 mt-1">
                    {marketingHome.popularDestinations.flightsFromLabel} $
                    {dest.price || Math.floor(Math.random() * 500) + 200}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Flights */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-foreground mb-12">
            {marketingHome.featuredFlights.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredFlights.length > 0 ? (
              featuredFlights.map((flight) => (
                <Card
                  key={flight.id}
                  className="p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between mb-6 gap-2">
                    <div className="flex items-center gap-4">
                      <img
                        src={flight.airlineLogo}
                        alt={flight.airline}
                        className="h-10 w-10 object-contain"
                      />
                      <div>
                        <h3 className="font-semibold text-foreground text-xl font-semibold tracking-tight">
                          {flight.airline}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {flight.flightNumber}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[hsl(var(--primary))]">
                        {formatCurrency(flight.price, flight.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {marketingHome.featuredFlights.perPersonLabel}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between relative gap-2">
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">
                        {flight.departureTime}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {flight.origin}
                      </p>
                    </div>
                    <div className="flex-1 px-8 text-center relative gap-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        {flight.duration}
                      </p>
                      <div className="w-full h-px bg-border relative mb-1">
                        <div className="absolute left-1/2 -translate-x-1/2 -top-1.5 bg-muted px-1">
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {flight.stops === 0
                          ? marketingHome.featuredFlights.directLabel
                          : `${flight.stops} ${marketingHome.featuredFlights.stopSuffix}`}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">
                        {flight.arrivalTime}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {flight.destination}
                      </p>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full mt-6" size="sm">
                    {marketingHome.featuredFlights.viewDetailsLabel}
                  </Button>
                </Card>
              ))
            ) : (
              <div className="md:col-span-2 text-center py-12 text-muted-foreground">
                {marketingHome.featuredFlights.emptyLabel}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
