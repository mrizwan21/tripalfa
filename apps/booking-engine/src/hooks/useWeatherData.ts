import { useState, useEffect, useCallback } from "react";
import { weatherApi } from "../api/weatherApi";

type WeatherData = Record<string, any>;
type WeatherCoordinates = { latitude: number; longitude: number };

export interface UseWeatherDataResult {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  isConfigured: boolean;
}

/**
 * Custom hook to fetch weather data for a location
 * @param coordinates - Hotel coordinates (latitude, longitude)
 * @param units - Temperature units: 'metric' | 'imperial' | 'standard'
 * @param lang - Language for weather descriptions
 */
export function useWeatherData(
  coordinates: WeatherCoordinates | null | undefined,
  units: "metric" | "imperial" | "standard" = "metric",
  lang: string = "en",
): UseWeatherDataResult {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(true);

  const fetchWeather = useCallback(async () => {
    if (!coordinates?.latitude || !coordinates?.longitude) {
      setError("Location coordinates not available");
      return;
    }

    // Check if API key is configured
    const apiKey = import.meta.env.VITE_OPENWEATHERMAP_API_KEY;
    if (!apiKey) {
      setIsConfigured(false);
      setError(
        "Weather API key not configured. Please set VITE_OPENWEATHERMAP_API_KEY in your environment.",
      );
      return;
    }

    setLoading(true);
    setError(null);
    setIsConfigured(true);

    try {
      const data = await weatherApi.getWeather(coordinates, units, lang);
      setWeather(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch weather data");
      setWeather(null);
    } finally {
      setLoading(false);
    }
  }, [coordinates, units, lang]);

  // Fetch weather when coordinates change
  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  return {
    weather,
    loading,
    error,
    refetch: fetchWeather,
    isConfigured,
  };
}
