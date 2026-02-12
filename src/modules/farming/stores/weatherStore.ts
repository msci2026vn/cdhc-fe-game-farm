import { create } from 'zustand';
import type { WeatherCondition, TimeOfDay, WeatherData } from '@/shared/types/game-api.types';

export type { TimeOfDay };
export type WeatherType = WeatherCondition;

interface WeatherState {
  weather: WeatherType;
  timeOfDay: TimeOfDay;
  temperature: number;     // Celsius
  humidity: number;        // Percentage
  windSpeed: number;       // km/h
  wmoCode: number;        // WMO weather code
  location: { lat: number; lon: number; province?: string };
  lastUpdated: string;     // ISO timestamp
  setWeather: (w: WeatherType) => void;
  setTimeOfDay: (t: TimeOfDay) => void;
  setWeatherData: (data: WeatherData) => void;
  cycleWeather: () => void;
  autoTimeOfDay: () => void;
}

const WEATHER_CYCLE: WeatherType[] = ['sunny', 'cloudy', 'rain', 'storm', 'snow', 'wind', 'cold', 'hot'];

// Type guard to validate weather condition values
function isValidWeatherType(value: string): value is WeatherType {
  return WEATHER_CYCLE.includes(value as WeatherType);
}

function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h >= 5 && h < 7) return 'dawn';
  if (h >= 7 && h < 17) return 'day';
  if (h >= 17 && h < 19) return 'dusk';
  return 'night';
}

export const useWeatherStore = create<WeatherState>((set, get) => ({
  weather: 'sunny',
  timeOfDay: getTimeOfDay(),
  temperature: 28,
  humidity: 60,
  windSpeed: 5,
  wmoCode: 0,
  location: { lat: 21.0285, lon: 105.8542, province: 'Hà Nội' },
  lastUpdated: new Date().toISOString(),
  setWeather: (weather) => set({ weather }),
  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
  setWeatherData: (data) => set({
    weather: isValidWeatherType(data.condition) ? data.condition : 'sunny',
    timeOfDay: data.timeOfDay ?? 'day',
    temperature: data.temperature ?? 28,
    humidity: data.humidity ?? 60,
    windSpeed: data.windSpeed ?? 5,
    wmoCode: data.wmoCode ?? 0,
    location: data.location ?? { lat: 21.0285, lon: 105.8542 },
    lastUpdated: data.lastUpdated ?? new Date().toISOString(),
  }),
  cycleWeather: () => {
    const curr = get().weather;
    const idx = WEATHER_CYCLE.indexOf(curr);
    set({ weather: WEATHER_CYCLE[(idx + 1) % WEATHER_CYCLE.length] });
  },
  autoTimeOfDay: () => set({ timeOfDay: getTimeOfDay() }),
}));

export const WEATHER_INFO: Record<WeatherType, { emoji: string; label: string }> = {
  sunny: { emoji: '☀️', label: 'Nắng' },
  cloudy: { emoji: '⛅', label: 'Mây' },
  rain: { emoji: '🌧️', label: 'Mưa' },
  storm: { emoji: '⛈️', label: 'Bão' },
  snow: { emoji: '🌨️', label: 'Tuyết' },
  wind: { emoji: '💨', label: 'Gió' },
  cold: { emoji: '🥶', label: 'Lạnh' },
  hot: { emoji: '🔥', label: 'Nóng' },
};

export const TIME_INFO: Record<TimeOfDay, { emoji: string; label: string }> = {
  dawn: { emoji: '🌅', label: 'Bình minh' },
  day: { emoji: '☀️', label: 'Ban ngày' },
  dusk: { emoji: '🌇', label: 'Hoàng hôn' },
  night: { emoji: '🌙', label: 'Ban đêm' },
};
