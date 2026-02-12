// ═══════════════════════════════════════════════════════════════
// WEATHER MAPPER — Convert WMO codes to Game Weather Types
// ═══════════════════════════════════════════════════════════════
//
// Open-Meteo WMO Code → Game Weather Type Mapping
// Source: https://open-meteo.com/en/docs
//
// WMO Code Interpretation:
// 0: Clear sky
// 1, 2, 3: Mainly clear, partly cloudy, overcast
// 45, 48: Fog
// 51-55: Drizzle
// 56-57: Freezing drizzle
// 61-65: Rain
// 66-67: Freezing rain
// 71-77: Snow
// 80-82: Showers
// 85-86: Snow showers
// 95-99: Thunderstorm
// ═══════════════════════════════════════════════════════════════

import type { WeatherCondition, TimeOfDay, WeatherData } from '@/shared/types/game-api.types';

/**
 * Convert WMO code to game weather condition
 * @param wmoCode - WMO weather code (0-99)
 * @param temperature - Temperature in Celsius (used for cold/hot detection)
 * @param windSpeed - Wind speed in km/h (used for wind detection)
 * @param isDay - Whether it's currently daytime
 */
export function wmoToWeatherCondition(
  wmoCode: number,
  temperature: number,
  windSpeed: number,
  isDay: boolean
): WeatherCondition {
  // Thunderstorm (highest priority)
  if (wmoCode >= 95) return 'storm';

  // Snow
  if (wmoCode >= 71 && wmoCode <= 86) return 'snow';
  if (wmoCode >= 77 && wmoCode <= 77) return 'snow'; // Snow grains

  // Rain
  if (wmoCode >= 51 && wmoCode <= 67) return 'rain';
  if (wmoCode >= 80 && wmoCode <= 82) return 'rain'; // Showers

  // Windy (high wind speed regardless of weather code)
  if (windSpeed > 25) return 'wind';

  // Fog/Mist
  if (wmoCode >= 45 && wmoCode <= 48) return 'cloudy';

  // Cloudy
  if (wmoCode >= 1 && wmoCode <= 3) return 'cloudy';

  // Temperature-based conditions (only for clear skies)
  if (wmoCode === 0) {
    if (temperature >= 35) return 'hot';
    if (temperature <= 15) return 'cold';
  }

  // Default to sunny
  return 'sunny';
}

/**
 * Get time of day from current hour
 */
export function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 17) return 'day';
  if (hour >= 17 && hour < 19) return 'dusk';
  return 'night';
}

/**
 * Check if it's daytime based on hour
 */
export function isDayTime(hour: number): boolean {
  return hour >= 6 && hour < 18;
}

/**
 * Map backend weather response to frontend WeatherData
 * Backend returns format: { current: {...}, coordinates: {...}, provinceName }
 * Frontend needs game format WeatherData
 */
export function mapBackendWeatherToGameWeather(
  backendData: {
    current?: {
      temperature: number;
      humidity: number;
      windSpeed: number;
      weatherCode: number;
    };
    coordinates?: {
      lat: number;
      lon: number;
    };
    provinceName?: string;
    hourly?: {
      relative_humidity_2m?: number[];
    };
  },
  timestamp: string = new Date().toISOString()
): WeatherData {
  const current = backendData.current;
  const coordinates = backendData.coordinates;
  const hour = new Date().getHours();

  // Get temperature
  const temperature = current?.temperature ?? 28;

  // Get humidity from current weather (backend now provides it directly)
  const humidity = current?.humidity ?? 60;

  // Get wind speed
  const windSpeed = current?.windSpeed ?? 5;

  // Get WMO code
  const wmoCode = current?.weatherCode ?? 0;

  // Get time of day
  const timeOfDay = getTimeOfDay(hour);
  const isDay = isDayTime(hour);

  // Map to game weather condition
  const condition = wmoToWeatherCondition(wmoCode, temperature, windSpeed, isDay);

  return {
    condition,
    temperature,
    humidity,
    windSpeed,
    wmoCode,
    location: {
      lat: coordinates?.lat ?? 21.0285,
      lon: coordinates?.lon ?? 105.8542,
      province: backendData.provinceName,
    },
    timeOfDay,
    isDay,
    lastUpdated: timestamp,
  };
}

/**
 * Get user location from browser (no cache, fresh GPS every time)
 * Browser caches GPS permission, so no need to store ourselves
 */
export async function getUserLocation(): Promise<{ lat: number; lon: number }> {
  const DEFAULT_LOCATION = { lat: 21.0285, lon: 105.8542 }; // Hà Nội

  if (!navigator.geolocation) return DEFAULT_LOCATION;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(DEFAULT_LOCATION),
      { timeout: 10_000, enableHighAccuracy: false }
    );
  });
}

// WMO Code reference for debugging
export const WMO_CODE_REFERENCE: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};
