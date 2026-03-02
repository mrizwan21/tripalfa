/**
 * Hotel Search Loading Page
 * =========================
 * A beautiful loading page shown during hotel search with:
 * - Animated hotel map showing hotels appearing around destination
 * - Destination weather information
 * - Currency exchange rates
 */

import React, { useState, useEffect, lazy, Suspense } from "react";
import { useWeatherData } from "../hooks/useWeatherData";
import { useExchangeRate } from "../hooks/useExchangeRate";
import { CURRENCY_SYMBOLS, CURRENCY_NAMES } from "../api/exchangeRateApi";
import {
  DEFAULT_CONTENT_CONFIG,
  loadTenantContentConfig,
} from "../lib/tenantContentConfig";

type CurrencyCode = string;
type MapCoordinates = { latitude: number; longitude: number };

// ── Code-split the heavy map component (mapbox-gl ~1.7MB) ────────────────────
const AnimatedHotelMap = lazy(() =>
  import("../components/map/AnimatedHotelMap").then((module) => ({
    default: module.AnimatedHotelMap,
  })),
);
const AnimatedHotelMapAny = AnimatedHotelMap as any;

// ── Map Loading Fallback ─────────────────────────────────────────────────────
function MapFallback({
  height = "500px",
}: {
  height?: string;
}): React.JSX.Element {
  return (
    <div
      className="flex items-center justify-center bg-foreground rounded-2xl gap-2"
      style={{ height }}
    >
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground font-bold">Loading map...</p>
        <p className="text-muted-foreground text-xs mt-1">
          Initializing Mapbox
        </p>
      </div>
    </div>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

interface HotelDestination extends MapCoordinates {
  name: string;
  city: string;
  country: string;
  currency: CurrencyCode;
}

interface HotelSearchLoadingProps {
  destination: HotelDestination;
  userCurrency?: CurrencyCode;
  searchProgress?: number; // 0-100
  estimatedTime?: number; // in seconds
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  rooms?: number;
  className?: string;
}

// ── Weather Icon Component ───────────────────────────────────────────────────

function WeatherIcon({
  condition,
  size = 48,
}: {
  condition: string;
  size?: number;
}): React.JSX.Element {
  const iconMap: Record<string, string> = {
    clear: "☀️",
    sunny: "☀️",
    "partly-cloudy": "⛅",
    cloudy: "☁️",
    overcast: "☁️",
    rain: "🌧️",
    "light-rain": "🌦️",
    "heavy-rain": "⛈️",
    thunderstorm: "⛈️",
    snow: "❄️",
    fog: "🌫️",
    wind: "💨",
    default: "🌤️",
  };

  const key = condition.toLowerCase().replace(/\s+/g, "-");
  const icon = iconMap[key] || iconMap["default"];

  return (
    <span style={{ fontSize: size }} className="drop-shadow-lg">
      {icon}
    </span>
  );
}

// ── Weather Widget Component ─────────────────────────────────────────────────

function WeatherWidget({
  destination,
  className = "",
}: {
  destination: HotelDestination;
  className?: string;
}): React.JSX.Element {
  const { weather, loading, error } = useWeatherData({
    latitude: destination.latitude,
    longitude: destination.longitude,
  });

  if (loading) {
    return (
      <div
        className={`bg-card/50 backdrop-blur-md rounded-2xl p-6 border border-border ${className}`}
      >
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/2 mb-4" />
          <div className="h-8 bg-muted rounded w-2/3 mb-2" />
          <div className="h-3 bg-muted rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div
        className={`bg-card/50 backdrop-blur-md rounded-2xl p-6 border border-border ${className}`}
      >
        <p className="text-muted-foreground text-sm">Weather unavailable</p>
      </div>
    );
  }

  const current = weather.current;
  const temp = Math.round(current.temp);
  const feelsLike = Math.round(current.feelsLike);
  const condition = current.description || "Clear";
  const description = current.description || "Clear sky";
  const humidity = current.humidity;
  const windSpeed = Math.round(current.windSpeed);

  return (
    <div
      className={`bg-card/50 backdrop-blur-md rounded-2xl p-6 border border-border ${className}`}
    >
      <div className="flex items-center justify-between mb-4 gap-2">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
            Weather in {destination.city}
          </p>
          <p className="text-4xl font-black text-foreground">{temp}°C</p>
        </div>
        <WeatherIcon condition={condition} size={56} />
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground capitalize">
          {description}
        </p>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>Feels like {feelsLike}°C</span>
          <span>•</span>
          <span>Humidity {humidity}%</span>
          <span>•</span>
          <span>Wind {windSpeed} km/h</span>
        </div>
      </div>
    </div>
  );
}

// ── Currency Widget Component ────────────────────────────────────────────────

function CurrencyWidget({
  userCurrency,
  destinationCurrency,
  className = "",
}: {
  userCurrency: CurrencyCode;
  destinationCurrency: CurrencyCode;
  className?: string;
}): React.JSX.Element {
  const { conversion, rate, loading, error } = useExchangeRate({
    from: userCurrency,
    to: destinationCurrency,
    amount: 100,
    autoFetch: true,
  });

  if (loading) {
    return (
      <div
        className={`bg-card/50 backdrop-blur-md rounded-2xl p-6 border border-border ${className}`}
      >
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/2 mb-4" />
          <div className="h-8 bg-muted rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (error || !rate) {
    return (
      <div
        className={`bg-card/50 backdrop-blur-md rounded-2xl p-6 border border-border ${className}`}
      >
        <p className="text-muted-foreground text-sm">
          Currency conversion unavailable
        </p>
      </div>
    );
  }

  const originSymbol = CURRENCY_SYMBOLS[userCurrency] || userCurrency;
  const destSymbol =
    CURRENCY_SYMBOLS[destinationCurrency] || destinationCurrency;

  return (
    <div
      className={`bg-card/50 backdrop-blur-md rounded-2xl p-6 border border-border ${className}`}
    >
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
        Currency Exchange
      </p>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground text-sm">
            {originSymbol} 100
          </span>
          <span className="text-muted-foreground">→</span>
          <span className="text-foreground font-bold text-lg">
            {destSymbol} {conversion?.result.toFixed(2)}
          </span>
        </div>

        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            1 {userCurrency} = {rate.toFixed(4)} {destinationCurrency}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {CURRENCY_NAMES[userCurrency]} →{" "}
            {CURRENCY_NAMES[destinationCurrency]}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Search Progress Component ────────────────────────────────────────────────

function SearchProgress({
  progress = 0,
  estimatedTime = 30,
}: {
  progress?: number;
  estimatedTime?: number;
}): React.JSX.Element {
  const [tips, setTips] = useState<string[]>(
    DEFAULT_CONTENT_CONFIG.searchLoading.hotelTips,
  );

  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    let active = true;

    const loadTips = async () => {
      const contentConfig = await loadTenantContentConfig();
      if (!active) return;
      setTips(contentConfig.searchLoading.hotelTips);
    };

    void loadTips();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [tips.length]);

  return (
    <div className="bg-card/50 backdrop-blur-md rounded-2xl p-6 border border-border">
      <div className="flex items-center justify-between mb-4 gap-2">
        <p className="text-sm font-bold text-foreground">Searching hotels...</p>
        <p className="text-xs text-muted-foreground">
          ~{estimatedTime}s remaining
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-border rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Animated tip */}
      <div className="h-12 flex items-center gap-2">
        <p
          className="text-xs text-muted-foreground animate-fade-in"
          key={currentTip}
        >
          {tips[currentTip]}
        </p>
      </div>
    </div>
  );
}

// ── Stay Info Component ──────────────────────────────────────────────────────

function StayInfo({
  checkIn,
  checkOut,
  guests,
  rooms,
}: {
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  rooms?: number;
}): React.JSX.Element {
  // Format dates if provided
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Select dates";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const nights =
    checkIn && checkOut
      ? Math.ceil(
          (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

  return (
    <div className="bg-card/50 backdrop-blur-md rounded-2xl p-6 border border-border">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
        Your Stay
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Check-in</p>
          <p className="text-sm font-bold text-foreground">
            {formatDate(checkIn)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Check-out</p>
          <p className="text-sm font-bold text-foreground">
            {formatDate(checkOut)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Guests</p>
          <p className="text-sm font-bold text-foreground">
            {guests || 2} guests
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Rooms</p>
          <p className="text-sm font-bold text-foreground">
            {rooms || 1} room{(rooms || 1) > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {nights > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-center">
            <span className="text-2xl font-black text-amber-500">{nights}</span>
            <span className="text-sm text-muted-foreground ml-2">
              night{nights > 1 ? "s" : ""}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function HotelSearchLoading({
  destination,
  userCurrency = "USD",
  searchProgress = 0,
  estimatedTime = 30,
  checkIn,
  checkOut,
  guests,
  rooms,
  className = "",
}: HotelSearchLoadingProps): React.JSX.Element {
  return (
    <div className={`min-h-screen bg-background ${className}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-foreground mb-2">
            Finding Your Perfect Stay
          </h1>
          <p className="text-muted-foreground">
            Searching hotels in {destination.city}, {destination.country}
          </p>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Animated Map - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <Suspense fallback={<MapFallback height="500px" />}>
              <AnimatedHotelMapAny
                destination={destination}
                animationDuration={5000}
                showSearchRadius={true}
                searchRadiusKm={5}
                height="500px"
                className="shadow-2xl"
              />
            </Suspense>
          </div>

          {/* Side panel */}
          <div className="space-y-6">
            {/* Search Progress */}
            <SearchProgress
              progress={searchProgress}
              estimatedTime={estimatedTime}
            />

            {/* Stay Info */}
            <StayInfo
              checkIn={checkIn}
              checkOut={checkOut}
              guests={guests}
              rooms={rooms}
            />

            {/* Weather Widget */}
            <WeatherWidget destination={destination} />

            {/* Currency Widget */}
            <CurrencyWidget
              userCurrency={userCurrency}
              destinationCurrency={destination.currency}
            />
          </div>
        </div>

        {/* Destination Info */}
        <div className="mt-8 bg-card/50 backdrop-blur-md rounded-2xl p-6 border border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                Destination
              </p>
              <p className="text-xl font-bold text-foreground">
                {destination.city}
              </p>
              <p className="text-sm text-muted-foreground">
                {destination.country}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                Area
              </p>
              <p className="text-xl font-bold text-foreground">
                {destination.name}
              </p>
              <p className="text-sm text-muted-foreground">
                City center & nearby
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                Local Currency
              </p>
              <p className="text-xl font-bold text-foreground">
                {CURRENCY_SYMBOLS[destination.currency]} {destination.currency}
              </p>
              <p className="text-sm text-muted-foreground">
                {CURRENCY_NAMES[destination.currency]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HotelSearchLoading;
