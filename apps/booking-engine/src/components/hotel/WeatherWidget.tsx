/**
 * Weather Display Component
 * Shows current weather and forecast for hotel location
 */

import React from "react";
import {
  CloudRain,
  CloudDrizzle,
  CloudFog,
  Cloudy,
  Sun,
  Wind,
  Droplets,
  Eye,
  AlertCircle,
} from "lucide-react";
import { CurrentWeather, DailyForecast } from "../../api/weatherApi";

interface WeatherWidgetProps {
  current: CurrentWeather;
  hourly?: Array<{
    dt: number;
    temp: number;
    icon: string;
    description: string;
  }>;
  daily?: DailyForecast[];
  timezone?: string;
  units?: "metric" | "imperial";
  loading?: boolean;
  error?: string | null;
}

/**
 * Get weather icon based on OpenWeatherMap icon code
 */
function getWeatherIcon(icon: string, size: number = 24): React.ReactNode {
  switch (icon) {
    // Clear sky
    case "01d":
    case "01n":
      return <Sun size={size} className="text-yellow-400" />;
    // Few clouds
    case "02d":
    case "02n":
      return <Cloudy size={size} className="text-gray-400" />;
    // Scattered/broken clouds
    case "03d":
    case "03n":
    case "04d":
    case "04n":
      return <Cloudy size={size} className="text-gray-500" />;
    // Rain
    case "09d":
    case "09n":
    case "10d":
    case "10n":
      return <CloudRain size={size} className="text-blue-400" />;
    // Thunderstorm
    case "11d":
    case "11n":
      return <CloudRain size={size} className="text-red-400" />;
    // Snow
    case "13d":
    case "13n":
      return <CloudRain size={size} className="text-blue-200" />;
    // Mist
    case "50d":
    case "50n":
      return <CloudFog size={size} className="text-gray-300" />;
    default:
      return <Sun size={size} className="text-gray-400" />;
  }
}

/**
 * Current Weather Card
 */
function WeatherCurrentCard({
  current,
  units = "metric",
  loading = false,
  error = null,
}: {
  current: CurrentWeather;
  units?: "metric" | "imperial";
  loading?: boolean;
  error?: string | null;
}): React.ReactNode {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100 rounded-2xl p-6 mb-4 animate-pulse">
        <div className="h-12 bg-blue-200 rounded w-1/3 mb-4" />
        <div className="h-8 bg-blue-200 rounded w-1/4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-2xl p-4 mb-4 border border-red-200 flex items-start gap-3">
        <AlertCircle
          size={20}
          className="text-red-500 flex-shrink-0 mt-0.5 gap-4"
        />
        <div>
          <p className="text-sm font-semibold text-red-900">
            Weather unavailable
          </p>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  const tempUnit = units === "metric" ? "°C" : "°F";
  const speedUnit = units === "metric" ? "m/s" : "mph";

  return (
    <div className="bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100 rounded-2xl p-6 mb-4 border border-blue-200">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">
            Current Weather
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-blue-900">
              {Math.round(current.temp)}
              {tempUnit}
            </span>
            <span className="text-sm font-semibold text-blue-700">
              {current.description}
            </span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Feels like {Math.round(current.feelsLike)}
            {tempUnit}
          </p>
        </div>
        <div className="text-blue-400">{getWeatherIcon(current.icon, 48)}</div>
      </div>

      {/* Weather details grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-blue-200">
        <div className="flex flex-col gap-4">
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">
            Humidity
          </p>
          <div className="flex items-center gap-2">
            <Droplets size={14} className="text-blue-500" />
            <span className="text-sm font-bold text-blue-900">
              {current.humidity}%
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">
            Wind
          </p>
          <div className="flex items-center gap-2">
            <Wind size={14} className="text-blue-500" />
            <span className="text-sm font-bold text-blue-900">
              {Math.round(current.windSpeed)} {speedUnit}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">
            Visibility
          </p>
          <div className="flex items-center gap-2">
            <Eye size={14} className="text-blue-500" />
            <span className="text-sm font-bold text-blue-900">
              {(current.visibility / 1000).toFixed(1)} km
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">
            UV Index
          </p>
          <span className="text-sm font-bold text-blue-900">
            {Math.round(current.uvi)}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Daily Forecast Cards
 */
function WeatherForecastCards({
  daily,
  units = "metric",
}: {
  daily: DailyForecast[];
  units?: "metric" | "imperial";
}): React.ReactNode {
  if (!daily || daily.length === 0) {
    return null;
  }

  const tempUnit = units === "metric" ? "°C" : "°F";
  const forecastDays = daily.slice(1, 6); // Skip today, show next 5 days

  return (
    <div className="mb-4">
      <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">
        5-Day Forecast
      </p>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {forecastDays.map((day) => (
          <div
            key={day.dt}
            className="bg-white rounded-xl p-3 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <p className="text-xs font-semibold text-gray-600 mb-2">
              {new Date(day.dt * 1000).toLocaleDateString("en-US", {
                weekday: "short",
                month: "numeric",
              })}
            </p>

            <div className="flex justify-center mb-2 gap-4">
              {getWeatherIcon(day.icon, 28)}
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">{day.description}</p>
              <div className="flex items-center justify-center gap-1">
                <span className="text-sm font-bold text-blue-900">
                  {Math.round(day.temp.max)}
                  {tempUnit}
                </span>
                <span className="text-xs text-gray-400">
                  {Math.round(day.temp.min)}
                  {tempUnit}
                </span>
              </div>
            </div>

            {day.pop > 0.1 && (
              <p className="text-xs text-blue-600 mt-2 flex items-center justify-center gap-1">
                <Droplets size={10} />
                {Math.round(day.pop * 100)}%
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Complete Weather Widget
 */
export function WeatherWidget({
  current,
  daily,
  units = "metric",
  loading = false,
  error = null,
}: WeatherWidgetProps): React.ReactNode {
  return (
    <div className="weather-widget">
      <WeatherCurrentCard
        current={current}
        units={units}
        loading={loading}
        error={error}
      />
      {!loading && !error && daily && (
        <WeatherForecastCards daily={daily} units={units} />
      )}
    </div>
  );
}
