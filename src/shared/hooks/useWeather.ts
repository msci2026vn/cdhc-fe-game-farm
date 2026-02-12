// ═════════════════════════════════════════════════════════════════════════
// USE WEATHER HOOK — Separate GPS refresh (3h) and Weather refresh (30min)
// ═══════════════════════════════════════════════════════════════════════
//
// GPS Refresh: 3 giờ/lần (giữ tọa độ trong state)
// Weather Refresh: 30 phút/lần (fetch API với tọa độ hiện tại)
// ═════════════════════════════════════════════════════════════════════

import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gameApi } from '@/shared/api/game-api';
import type { WeatherData } from '@/shared/types/game-api.types';

// Weather query key factory
export const weatherKeys = {
  all: ['weather'] as const,
  details: () => [...weatherKeys.all, 'detail'] as const,
  detail: (lat: number, lon: number) => [...weatherKeys.details(), lat, lon] as const,
};

// Query configuration
const WEATHER_STALE_TIME = 25 * 60 * 1000; // 25 minutes (data fresh within 25min)
const WEATHER_REFETCH_INTERVAL = 30 * 60 * 1000; // 30 minutes
const GPS_REFETCH_INTERVAL = 3 * 60 * 60 * 1000; // 3 hours

/**
 * Main hook to fetch weather data
 * GPS coordinates stored in state, refreshed every 3 hours
 * Weather data fetched every 30 minutes using current GPS coordinates
 */
export function useWeather() {
  // GPS state - default Hà Nội, cập nhật khi GPS thành công
  const [coords, setCoords] = useState<{ lat: number; lon: number }>({
    lat: 21.0285,
    lon: 105.8542,
  });
  const hasEverGotGPS = useRef(false);

  // === GPS REFRESH: 3 giờ/lần ===
  useEffect(() => {
    const fetchGPS = () => {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          hasEverGotGPS.current = true;
        },
        () => {
          // Lỗi GPS:
          // - Nếu chưa bao giờ có GPS → giữ Hà Nội (default)
          // - Nếu đã có GPS trước đó → giữ tọa độ cũ (KHÔNG reset)
          // → Không cần làm gì, coords giữ nguyên giá trị cũ
        },
        { timeout: 10_000, enableHighAccuracy: false }
      );
    };

    fetchGPS(); // Lần đầu chạy ngay
    const gpsInterval = setInterval(fetchGPS, GPS_REFETCH_INTERVAL);
    return () => clearInterval(gpsInterval);
  }, []); // Chạy 1 lần duy nhất

  // === WEATHER REFRESH: 30 phút/lần ===
  const weatherQuery = useQuery<WeatherData>({
    queryKey: ['weather', coords.lat, coords.lon], // Key thay đổi khi coords thay đổi
    queryFn: async () => {
      console.log('[useWeather] Fetching weather for coords:', coords);

      try {
        const weather = await gameApi.getWeather(coords.lat, coords.lon);
        console.log('[useWeather] Weather data received:', weather);
        return weather;
      } catch (error) {
        console.error('[useWeather] Failed to fetch weather:', error);
        throw error;
      }
    },
    staleTime: WEATHER_STALE_TIME, // 25 phút
    refetchInterval: WEATHER_REFETCH_INTERVAL, // 30 phút
    enabled: true, // Luôn chạy (dù GPS hay default)
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
  });

  return weatherQuery;
}

/**
 * Hook to fetch weather by specific coordinates
 * Use this for manual weather selection or testing
 */
export function useWeatherByCoords(lat: number, lon: number) {
  return useQuery<WeatherData>({
    queryKey: weatherKeys.detail(lat, lon),
    queryFn: async () => {
      console.log('[useWeatherByCoords] Fetching weather for:', { lat, lon });
      const weather = await gameApi.getWeather(lat, lon);
      console.log('[useWeatherByCoords] Weather data received:', weather);
      return weather;
    },
    staleTime: WEATHER_STALE_TIME,
    refetchInterval: WEATHER_REFETCH_INTERVAL,
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    enabled: lat !== 0 && lon !== 0, // Only run if coordinates are valid
  });
}

/**
 * Hook to fetch weather without GPS (use default location)
 * Fallback for when GPS is denied/unavailable
 */
export function useDefaultWeather() {
  return useQuery<WeatherData>({
    queryKey: [...weatherKeys.all, 'default'],
    queryFn: async () => {
      console.log('[useDefaultWeather] Fetching default weather (Hanoi)...');

      // Default to Hanoi coordinates
      const HANOI_COORDS = { lat: 21.0285, lon: 105.8542 };
      const weather = await gameApi.getWeather(HANOI_COORDS.lat, HANOI_COORDS.lon);

      console.log('[useDefaultWeather] Weather data received:', weather);
      return weather;
    },
    staleTime: WEATHER_STALE_TIME,
    refetchInterval: WEATHER_REFETCH_INTERVAL,
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
  });
}
