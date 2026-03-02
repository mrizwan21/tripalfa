/**
 * Flight Search Loading Page
 * ==========================
 * A beautiful loading page shown during flight search with:
 * - Animated flight map showing plane moving from origin to destination
 * - Destination weather information
 * - Currency exchange rates
 */

import React, { useMemo } from "react";
import { AnimatedFlightMap } from "../components/map/AnimatedFlightMap";
import { useWeatherData } from "../hooks/useWeatherData";
import { useExchangeRate } from "../hooks/useExchangeRate";
import { CURRENCY_SYMBOLS, CURRENCY_NAMES } from "../api/exchangeRateApi";
import {
  DEFAULT_CONTENT_CONFIG,
  loadTenantContentConfig,
} from "../lib/tenantContentConfig";

type CurrencyCode = string;
type MapCoordinates = { latitude: number; longitude: number };

// ── Types ────────────────────────────────────────────────────────────────────

interface AirportInfo extends MapCoordinates {
  code: string;
  name: string;
  city: string;
  country: string;
  currency: CurrencyCode;
}

interface FlightSearchLoadingProps {
  origin: AirportInfo;
  destination: AirportInfo;
  searchProgress?: number; // 0-100
  estimatedTime?: number; // in seconds
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
  destination: AirportInfo;
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
  originCurrency,
  destinationCurrency,
  className = "",
}: {
  originCurrency: CurrencyCode;
  destinationCurrency: CurrencyCode;
  className?: string;
}): React.JSX.Element {
  const { conversion, rate, loading, error } = useExchangeRate({
    from: originCurrency,
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

  const originSymbol = CURRENCY_SYMBOLS[originCurrency] || originCurrency;
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
            1 {originCurrency} = {rate.toFixed(4)} {destinationCurrency}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {CURRENCY_NAMES[originCurrency]} →{" "}
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
  const [tips, setTips] = React.useState<string[]>(
    DEFAULT_CONTENT_CONFIG.searchLoading.flightTips,
  );

  const [currentTip, setCurrentTip] = React.useState(0);

  React.useEffect(() => {
    let active = true;

    const loadTips = async () => {
      const contentConfig = await loadTenantContentConfig();
      if (!active) return;
      setTips(contentConfig.searchLoading.flightTips);
    };

    void loadTips();

    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [tips.length]);

  return (
    <div className="bg-card/50 backdrop-blur-md rounded-2xl p-6 border border-border">
      <div className="flex items-center justify-between mb-4 gap-2">
        <p className="text-sm font-bold text-foreground">
          Searching flights...
        </p>
        <p className="text-xs text-muted-foreground">
          ~{estimatedTime}s remaining
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-border rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
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

// ── Main Component ───────────────────────────────────────────────────────────

export function FlightSearchLoading({
  origin,
  destination,
  searchProgress = 0,
  estimatedTime = 30,
  className = "",
}: FlightSearchLoadingProps): React.JSX.Element {
  return (
    <div className={`min-h-screen bg-background ${className}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-foreground mb-2">
            Finding Your Perfect Flight
          </h1>
          <p className="text-muted-foreground">
            Searching {origin.city} ({origin.code}) → {destination.city} (
            {destination.code})
          </p>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Animated Map - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <AnimatedFlightMap
              origin={origin}
              destination={destination}
              animationDuration={8000}
              loopAnimation={true}
              height="500px"
              className="shadow-2xl"
            />
          </div>

          {/* Side panel */}
          <div className="space-y-6">
            {/* Search Progress */}
            <SearchProgress
              progress={searchProgress}
              estimatedTime={estimatedTime}
            />

            {/* Weather Widget */}
            <WeatherWidget destination={destination} />

            {/* Currency Widget */}
            <CurrencyWidget
              originCurrency={origin.currency}
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
                Airport
              </p>
              <p className="text-xl font-bold text-foreground">
                {destination.code}
              </p>
              <p className="text-sm text-muted-foreground">
                {destination.name}
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

export default FlightSearchLoading;
