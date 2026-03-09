// ═══════════════════════════════════════════════════════════════
// GAME WEATHER ROUTE — /api/game/weather
// Backend endpoint for weather data with GPS support
// ═══════════════════════════════════════════════════════════════
//
// This file should be placed at: /home/cdhc/apps/cdhc-be/src/modules/game/routes/weather.ts
//
// Mount this route in: /home/cdhc/apps/cdhc-be/src/modules/game/routes/index.ts
//   import weatherRoutes from './routes/weather';
//   game.route('/weather', weatherRoutes);
// ═══════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AuthVariables } from '@/modules/auth/types';
import { getGpsWeather, findNearestProvince } from '@/modules/weather/weather.service';

type GameEnv = { Variables: AuthVariables };

const weather = new Hono<GameEnv>();

// WMO Code to Weather Condition Mapping
function wmoToWeatherCondition(
  wmoCode: number,
  temperature: number,
  windSpeed: number,
  isDay: boolean
): string {
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

// Get time of day from current hour
function getTimeOfDay(hour: number): string {
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 17) return 'day';
  if (hour >= 17 && hour < 19) return 'dusk';
  return 'night';
}

// Check if it's daytime based on hour
function isDayTime(hour: number): boolean {
  return hour >= 6 && hour < 18;
}

// Query schema
const WeatherQuerySchema = z.object({
  lat: z.coerce.number().optional().default(21.0285), // Default: Hanoi
  lon: z.coerce.number().optional().default(105.8542), // Default: Hanoi
});

/**
 * GET /api/game/weather
 * Get weather data by GPS coordinates (or defaults to Hanoi)
 */
weather.get('/', zValidator('query', WeatherQuerySchema), async (c) => {
  const user = c.get('user');
  const { lat, lon } = c.req.valid('query');

  console.log('[Weather] Fetching weather for userId:', user?.id, 'at', { lat, lon });

  try {
    // Find nearest province (for province name)
    const province = findNearestProvince(lat, lon);

    // Fetch weather from Open-Meteo via weather service
    const weatherData = await getGpsWeather(lat, lon);

    if (!weatherData) {
      return c.json({
        success: false,
        error: { message: 'Failed to fetch weather data' },
      }, 500);
    }

    // Get current hour for time calculation
    const hour = new Date().getHours();

    // Get temperature
    const temperature = weatherData.current_weather.temperature;

    // Get humidity from hourly data (use current hour)
    const humidity = weatherData.hourly?.relativehumidity_2m?.[hour] ?? 60;

    // Get wind speed
    const windSpeed = weatherData.current_weather.windspeed;

    // Get WMO code
    const wmoCode = weatherData.current_weather.weathercode;

    // Get time of day
    const timeOfDay = getTimeOfDay(hour);
    const isDay = isDayTime(hour);

    // Map to game weather condition
    const condition = wmoToWeatherCondition(wmoCode, temperature, windSpeed, isDay);

    return c.json({
      success: true,
      data: {
        condition,
        temperature,
        humidity,
        windSpeed,
        wmoCode,
        location: {
          lat,
          lon,
          province: province?.name,
        },
        timeOfDay,
        isDay,
        lastUpdated: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[Weather] Error fetching weather:', error);
    return c.json({
      success: false,
      error: { message: 'Failed to fetch weather data' },
    }, 500);
  }
});

export default weather;
