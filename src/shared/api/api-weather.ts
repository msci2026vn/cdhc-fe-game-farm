// ═══════════════════════════════════════════════════════════════
// API WEATHER — GPS weather data
// ═══════════════════════════════════════════════════════════════

import { handleUnauthorized, API_BASE_URL } from './api-utils';
import { mapBackendWeatherToGameWeather } from '../utils/weatherMapper';

export const weatherApi = {
  /**
   * Get weather data by GPS coordinates
   * Bước 31 — Weather/GPS Integration
   * @param lat - Latitude (optional, uses cached GPS if not provided)
   * @param lon - Longitude (optional, uses cached GPS if not provided)
   */
  getWeather: async (lat?: number, lon?: number) => {
    let url = API_BASE_URL + '/api/weather/location';

    // Add lat/lon if provided
    if (lat !== undefined && lon !== undefined) {
      url += `?lat=${lat}&lon=${lon}`;
    }

    console.log('[FARM-DEBUG] gameApi.getWeather():', url);

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('[FARM-DEBUG] gameApi.getWeather() status:', response.status);

    if (response.status === 401) {
      handleUnauthorized('getWeather');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[FARM-DEBUG] gameApi.getWeather() ERROR:', error);
      throw new Error(error?.error?.message || `Failed to fetch weather: ${response.status}`);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.getWeather() SUCCESS:', json);

    // Map backend response to frontend WeatherData format
    const weatherData = mapBackendWeatherToGameWeather(json.data);
    console.log('[FARM-DEBUG] gameApi.getWeather() MAPPED:', weatherData);

    return weatherData;
  },
};
