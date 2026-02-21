/**
 * Hotel Search Loading Page
 * =========================
 * A beautiful loading page shown during hotel search with:
 * - Animated hotel map showing hotels appearing around destination
 * - Destination weather information
 * - Currency exchange rates
 */

import React, { useState, useEffect } from 'react';
import { AnimatedHotelMap } from '../components/map/AnimatedHotelMap';
import { useWeatherData } from '../hooks/useWeatherData';
import { useExchangeRate } from '../hooks/useExchangeRate';
import {
  CurrencyCode,
  CURRENCY_SYMBOLS,
  CURRENCY_NAMES,
} from '../api/exchangeRateApi';
import { MapCoordinates } from '../lib/mapbox-config';

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

function WeatherIcon({ condition, size = 48 }: { condition: string; size?: number }): React.JSX.Element {
  const iconMap: Record<string, string> = {
    'clear': '☀️',
    'sunny': '☀️',
    'partly-cloudy': '⛅',
    'cloudy': '☁️',
    'overcast': '☁️',
    'rain': '🌧️',
    'light-rain': '🌦️',
    'heavy-rain': '⛈️',
    'thunderstorm': '⛈️',
    'snow': '❄️',
    'fog': '🌫️',
    'wind': '💨',
    'default': '🌤️',
  };

  const key = condition.toLowerCase().replace(/\s+/g, '-');
  const icon = iconMap[key] || iconMap['default'];
  
  return (
    <span style={{ fontSize: size }} className="drop-shadow-lg">
      {icon}
    </span>
  );
}

// ── Weather Widget Component ─────────────────────────────────────────────────

function WeatherWidget({
  destination,
  className = '',
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
      <div className={`bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-gray-700 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/2 mb-4" />
          <div className="h-8 bg-gray-700 rounded w-2/3 mb-2" />
          <div className="h-3 bg-gray-700 rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className={`bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-gray-700 ${className}`}>
        <p className="text-gray-400 text-sm">Weather unavailable</p>
      </div>
    );
  }

  const current = weather.current;
  const temp = Math.round(current.temp);
  const feelsLike = Math.round(current.feelsLike);
  const condition = current.description || 'Clear';
  const description = current.description || 'Clear sky';
  const humidity = current.humidity;
  const windSpeed = Math.round(current.windSpeed);

  return (
    <div className={`bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
            Weather in {destination.city}
          </p>
          <p className="text-4xl font-black text-white">{temp}°C</p>
        </div>
        <WeatherIcon condition={condition} size={56} />
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-gray-300 capitalize">{description}</p>
        <div className="flex gap-4 text-xs text-gray-400">
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
  className = '',
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
      <div className={`bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-gray-700 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/2 mb-4" />
          <div className="h-8 bg-gray-700 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (error || !rate) {
    return (
      <div className={`bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-gray-700 ${className}`}>
        <p className="text-gray-400 text-sm">Currency conversion unavailable</p>
      </div>
    );
  }

  const originSymbol = CURRENCY_SYMBOLS[userCurrency] || userCurrency;
  const destSymbol = CURRENCY_SYMBOLS[destinationCurrency] || destinationCurrency;

  return (
    <div className={`bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-gray-700 ${className}`}>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
        Currency Exchange
      </p>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-300 text-sm">
            {originSymbol} 100
          </span>
          <span className="text-gray-500">→</span>
          <span className="text-white font-bold text-lg">
            {destSymbol} {conversion?.result.toFixed(2)}
          </span>
        </div>
        
        <div className="pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-400">
            1 {userCurrency} = {rate.toFixed(4)} {destinationCurrency}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">
            {CURRENCY_NAMES[userCurrency]} → {CURRENCY_NAMES[destinationCurrency]}
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
  const tips = [
    '💡 Tip: Book hotels on weekdays for better rates',
    '💡 Tip: Check for free cancellation options',
    '💡 Tip: Compare prices across different dates',
    '💡 Tip: Look for hotels with free breakfast',
    '💡 Tip: Consider staying slightly outside city center',
    '💡 Tip: Book early for popular destinations',
    '💡 Tip: Read recent guest reviews before booking',
    '💡 Tip: Check hotel amenities before booking',
  ];

  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [tips.length]);

  return (
    <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-white">Searching hotels...</p>
        <p className="text-xs text-gray-400">~{estimatedTime}s remaining</p>
      </div>
      
      {/* Progress bar */}
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Animated tip */}
      <div className="h-12 flex items-center">
        <p className="text-xs text-gray-400 animate-fade-in" key={currentTip}>
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
    if (!dateStr) return 'Select dates';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const nights = checkIn && checkOut 
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-gray-700">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
        Your Stay
      </p>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-400 mb-1">Check-in</p>
          <p className="text-sm font-bold text-white">{formatDate(checkIn)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Check-out</p>
          <p className="text-sm font-bold text-white">{formatDate(checkOut)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Guests</p>
          <p className="text-sm font-bold text-white">{guests || 2} guests</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Rooms</p>
          <p className="text-sm font-bold text-white">{rooms || 1} room{(rooms || 1) > 1 ? 's' : ''}</p>
        </div>
      </div>
      
      {nights > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-center">
            <span className="text-2xl font-black text-amber-500">{nights}</span>
            <span className="text-sm text-gray-400 ml-2">night{nights > 1 ? 's' : ''}</span>
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function HotelSearchLoading({
  destination,
  userCurrency = 'USD',
  searchProgress = 0,
  estimatedTime = 30,
  checkIn,
  checkOut,
  guests,
  rooms,
  className = '',
}: HotelSearchLoadingProps): React.JSX.Element {
  return (
    <div className={`min-h-screen bg-gray-900 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white mb-2">
            Finding Your Perfect Stay
          </h1>
          <p className="text-gray-400">
            Searching hotels in {destination.city}, {destination.country}
          </p>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Animated Map - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <AnimatedHotelMap
              destination={destination}
              animationDuration={5000}
              showSearchRadius={true}
              searchRadiusKm={5}
              height="500px"
              className="shadow-2xl"
            />
          </div>

          {/* Side panel */}
          <div className="space-y-6">
            {/* Search Progress */}
            <SearchProgress progress={searchProgress} estimatedTime={estimatedTime} />
            
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
        <div className="mt-8 bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                Destination
              </p>
              <p className="text-xl font-bold text-white">{destination.city}</p>
              <p className="text-sm text-gray-400">{destination.country}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                Area
              </p>
              <p className="text-xl font-bold text-white">{destination.name}</p>
              <p className="text-sm text-gray-400">City center & nearby</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                Local Currency
              </p>
              <p className="text-xl font-bold text-white">
                {CURRENCY_SYMBOLS[destination.currency]} {destination.currency}
              </p>
              <p className="text-sm text-gray-400">{CURRENCY_NAMES[destination.currency]}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HotelSearchLoading;
