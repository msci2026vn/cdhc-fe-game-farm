// ═════════════════════════════════════════════════════════════════════════
// USE WEATHER HOOK — Fetch weather once, refresh every 30min
// GPS obtained once on mount, weather fetched after GPS resolves
// ═════════════════════════════════════════════════════════════════════════

import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gameApi } from '@/shared/api/game-api';
import type { WeatherData } from '@/shared/types/game-api.types';

// Query configuration
const WEATHER_STALE_TIME = 25 * 60 * 1000; // 25 minutes
const WEATHER_REFETCH_INTERVAL = 30 * 60 * 1000; // 30 minutes

// Default coords (Hà Nội)
const DEFAULT_COORDS = { lat: 21.0285, lon: 105.8542 };

/**
 * Main hook to fetch weather data
 * - Gets GPS once (with 5s timeout for speed)
 * - Falls back to Hà Nội if GPS fails/denied
 * - Only starts weather fetch AFTER coords are resolved (no double fetch)
 */
export function useWeather() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const gpsAttempted = useRef(false);

  // === GET GPS ONCE — then set coords ===
  useEffect(() => {
    if (gpsAttempted.current) return;
    gpsAttempted.current = true;

    if (!navigator.geolocation) {
      setCoords(DEFAULT_COORDS);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => {
        // GPS failed/denied → use default
        setCoords(DEFAULT_COORDS);
      },
      { timeout: 5_000, enableHighAccuracy: false }
    );
  }, []);

  // === WEATHER FETCH — only after coords resolved (enabled: !!coords) ===
  const weatherQuery = useQuery<WeatherData>({
    queryKey: ['weather', coords?.lat ?? 0, coords?.lon ?? 0],
    queryFn: async () => {
      console.log('[useWeather] Fetching weather for coords:', coords);
      const weather = await gameApi.getWeather(coords!.lat, coords!.lon);
      console.log('[useWeather] Weather data received:', weather);
      return weather;
    },
    enabled: !!coords, // Only fetch when coords are resolved
    staleTime: WEATHER_STALE_TIME,
    refetchInterval: WEATHER_REFETCH_INTERVAL,
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
  });

  return weatherQuery;
}

/**
 * Hook to fetch weather by specific coordinates
 */
export function useWeatherByCoords(lat: number, lon: number) {
  return useQuery<WeatherData>({
    queryKey: ['weather', lat, lon],
    queryFn: async () => {
      const weather = await gameApi.getWeather(lat, lon);
      return weather;
    },
    staleTime: WEATHER_STALE_TIME,
    refetchInterval: WEATHER_REFETCH_INTERVAL,
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    enabled: lat !== 0 && lon !== 0,
  });
}
