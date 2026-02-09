import { create } from 'zustand';

export type WeatherType = 'sunny' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'wind' | 'cold' | 'hot';
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

interface WeatherState {
  weather: WeatherType;
  timeOfDay: TimeOfDay;
  setWeather: (w: WeatherType) => void;
  setTimeOfDay: (t: TimeOfDay) => void;
  cycleWeather: () => void;
  autoTimeOfDay: () => void;
}

const WEATHER_CYCLE: WeatherType[] = ['sunny', 'cloudy', 'rain', 'storm', 'snow', 'wind', 'cold', 'hot'];

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
  setWeather: (weather) => set({ weather }),
  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
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
