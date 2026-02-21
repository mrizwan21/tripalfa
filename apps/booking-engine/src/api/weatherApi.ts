import axios, { AxiosInstance } from 'axios';

/**
 * Weather API Client (OpenWeatherMap One Call API 3.0)
 * 
 * Provides current weather and forecast data for hotel locations
 * - Current weather conditions
 * - 48-hour hourly forecast
 * - 8-day daily forecast
 */

export interface WeatherCoordinates {
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  temp: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  description: string;
  icon: string;
  windSpeed: number;
  windGust?: number;
  cloudiness: number;
  uvi: number;
  visibility: number;
  precipitation?: number;
}

export interface HourlyForecast {
  dt: number;
  temp: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  description: string;
  icon: string;
  windSpeed: number;
  windGust?: number;
  cloudiness: number;
  precipitation?: number;
  pop: number; // Probability of precipitation
}

export interface DailyForecast {
  dt: number;
  temp: {
    day: number;
    min: number;
    max: number;
    night: number;
    eve: number;
    morn: number;
  };
  feelsLike: {
    day: number;
    night: number;
    eve: number;
    morn: number;
  };
  humidity: number;
  pressure: number;
  description: string;
  icon: string;
  windSpeed: number;
  windGust?: number;
  cloudiness: number;
  pop: number; // Probability of precipitation
  precipitation?: number;
  uvi: number;
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  timezone: string;
  timezone_offset: number;
}

class WeatherApi {
  private api: AxiosInstance;
  private apiKey: string;
  private baseURL = 'https://api.openweathermap.org/data/3.0/onecall';

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENWEATHERMAP_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('OpenWeatherMap API key not configured. Weather features will be unavailable.');
    }

    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get weather data for a location
   * @param coords - Hotel coordinates (latitude, longitude)
   * @param units - Temperature units: 'metric' (Celsius) | 'imperial' (Fahrenheit) | 'standard' (Kelvin)
   * @param lang - Language for weather descriptions (e.g., 'en', 'es', 'fr')
   */
  async getWeather(
    coords: WeatherCoordinates,
    units: 'metric' | 'imperial' | 'standard' = 'metric',
    lang: string = 'en'
  ): Promise<WeatherData> {
    if (!this.apiKey) {
      throw new Error('OpenWeatherMap API key is not configured');
    }

    try {
      const response = await this.api.get<any>('', {
        params: {
          lat: coords.latitude,
          lon: coords.longitude,
          appid: this.apiKey,
          units,
          lang,
          exclude: 'minutely', // Exclude minutely data to reduce response size
        },
      });

      return this.parseWeatherResponse(response.data);
    } catch (error: any) {
      console.error('Weather API error:', error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch weather data'
      );
    }
  }

  /**
   * Parse and normalize the OpenWeatherMap API response
   */
  private parseWeatherResponse(data: any): WeatherData {
    const current = data.current || {};
    const weather = current.weather?.[0] || {};

    return {
      current: {
        temp: current.temp,
        feelsLike: current.feels_like,
        humidity: current.humidity,
        pressure: current.pressure,
        description: weather.main || 'Unknown',
        icon: weather.icon || '',
        windSpeed: current.wind_speed,
        windGust: current.wind_gust,
        cloudiness: current.clouds,
        uvi: current.uvi,
        visibility: current.visibility,
        precipitation: current.rain?.['1h'] || current.snow?.['1h'],
      },
      hourly: (data.hourly || []).map((hour: any) => {
        const hourWeather = hour.weather?.[0] || {};
        return {
          dt: hour.dt,
          temp: hour.temp,
          feelsLike: hour.feels_like,
          humidity: hour.humidity,
          pressure: hour.pressure,
          description: hourWeather.main || 'Unknown',
          icon: hourWeather.icon || '',
          windSpeed: hour.wind_speed,
          windGust: hour.wind_gust,
          cloudiness: hour.clouds,
          precipitation: hour.rain?.['1h'] || hour.snow?.['1h'],
          pop: hour.pop,
        };
      }),
      daily: (data.daily || []).map((day: any) => {
        const dayWeather = day.weather?.[0] || {};
        return {
          dt: day.dt,
          temp: {
            day: day.temp.day,
            min: day.temp.min,
            max: day.temp.max,
            night: day.temp.night,
            eve: day.temp.eve,
            morn: day.temp.morn,
          },
          feelsLike: {
            day: day.feels_like.day,
            night: day.feels_like.night,
            eve: day.feels_like.eve,
            morn: day.feels_like.morn,
          },
          humidity: day.humidity,
          pressure: day.pressure,
          description: dayWeather.main || 'Unknown',
          icon: dayWeather.icon || '',
          windSpeed: day.wind_speed,
          windGust: day.wind_gust,
          cloudiness: day.clouds,
          pop: day.pop,
          precipitation: day.rain || day.snow,
          uvi: day.uvi,
        };
      }),
      timezone: data.timezone,
      timezone_offset: data.timezone_offset,
    };
  }
}

// Export singleton instance
export const weatherApi = new WeatherApi();
