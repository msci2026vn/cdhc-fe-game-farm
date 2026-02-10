export const API_BASE_URL = 'https://sta.cdhc.vn/api';

export const COOLDOWN = {
  WATER: 3600, // 1 hour in seconds
  FERTILIZE: 7200,
  CHECKIN: 86400,
  SHARE: 86400,
} as const;

export const STALE_TIME = {
  PLOTS: 60_000,
  SENSOR: 30_000,
  LEADERBOARD: 300_000,
  CAMERA: 120_000,
  WEATHER: 300_000,
} as const;

export const PLANT_STAGES = ['seed', 'sprout', 'seedling', 'mature', 'dead'] as const;
