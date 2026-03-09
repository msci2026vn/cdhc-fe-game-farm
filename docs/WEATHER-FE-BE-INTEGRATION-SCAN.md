# 🔍 Weather Frontend ↔ Backend Integration Scan Report

**Date:** 2026-02-12
**Status:** ✅ SCAN COMPLETE — READY FOR IMPLEMENTATION

---

## 1. BACKEND WEATHER API — Summary

### 1.1 Endpoints Available

| Endpoint | Auth Required | Response | Status |
|----------|---------------|----------|--------|
| `GET /api/weather/province/:code` | ❌ Public | ProvinceWeatherData | ✅ Working |
| `GET /api/weather/provinces` | ❌ Public | ProvinceWeatherData[] | ✅ Working |
| `GET /api/weather/location?lat={lat}&lon={lon}` | ❌ Public | ProvinceWeatherData | ✅ Working |
| `POST /api/weather/refresh` | ❌ Public | `{ success, message }` | ✅ Working |

**Note:** TẤT CẢ weather endpoints đều **KHÔNG cần auth** — public access

### 1.2 Response Format (From Test)

```json
{
  "success": true,
  "data": {
    "provinceCode": "41",
    "provinceName": "Thái Nguyên",
    "coordinates": { "lat": 21.625, "lon": 105.875 },
    "elevation": 34,
    "current": {
      "time": "2026-02-12T08:00",
      "temperature": 17.2,
      "precipitation": 0,
      "humidity": 94,
      "windSpeed": 2.2,
      "visibility": 24,
      "weatherCode": 3
    },
    "hourly": { "time": [...], "temperature_2m": [...], ... },
    "daily": { "time": [...], "temperature_2m_max": [...], ... },
    "lastUpdated": "2026-02-12T00:30:16.965Z"
  },
  "source": "nearest_province"
}
```

**Key Fields:**
- ✅ `data.current.temperature` — Nhiệt độ thực
- ✅ `data.current.weatherCode` — WMO code (0-99)
- ✅ `data.current.precipitation` — Lượng mưa
- ✅ `data.current.humidity` — Độ ẩm
- ✅ `data.current.windSpeed` — Tốc độ gió
- ✅ `data.coordinates.lat/lon` — GPS location
- ❌ KHÔNG có `weatherType` — Cần mapper từ WMO code
- ❌ Response size LỚN (~15KB với hourly data) — CHỈ cần current cho game

### 1.3 Cache Strategy

| Cache Key | TTL | Refresh |
|-----------|-----|---------|
| `weather:province:{code}` | 3600s (1h) | Every 30 min (cron) |
| `weather:gps:{lat},{lon}` | 7200s (2h) | On-demand |

---

## 2. FRONTEND WEATHER SYSTEM — Summary

### 2.1 WeatherStore Fields

**File:** `src/modules/farming/stores/weatherStore.ts`

```typescript
type WeatherType = 'sunny' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'wind' | 'cold' | 'hot';
type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

interface WeatherState {
  weather: WeatherType;           // Default: 'sunny'
  timeOfDay: TimeOfDay;          // Default: getTimeOfDay()
  setWeather: (w: WeatherType) => void;
  setTimeOfDay: (t: TimeOfDay) => void;
  cycleWeather: () => void;        // Manual cycle for dev
  autoTimeOfDay: () => void;       // Auto update from new Date()
}
```

**Key Findings:**
- ✅ `weather` field exists
- ❌ KHÔNG có `temperature` field — **Cần thêm**
- ❌ KHÔNG có `weatherCode` field — Cần thêm nếu muốn lưu WMO code gốc
- ✅ `timeOfDay` auto-update from `new Date().getHours()`
- ✅ `setWeather()` function available — **Để inject API data**

### 2.2 Temperature Display (HARDCODED)

**File:** `src/modules/farming/components/FarmHeader.tsx`

```tsx
// Line 135
<div className="font-heading text-base font-bold">28°C</div>
```

**⚠️ ISSUE:** `28°C` là **HARDCODED** — KHÔNG phải từ API

### 2.3 Weather Animation System

**File:** `src/modules/farming/components/WeatherOverlay.tsx`

**Animations Available:**
- ✅ `weather === 'rain'` → `<RainDrops />`
- ✅ `weather === 'storm'` → Rain + Flash + Wind
- ✅ `weather === 'snow'` → `<SnowFlakes />`
- ✅ `weather === 'wind'` → `<WindLines />`
- ✅ `weather === 'cold'` → Fog + Snow
- ✅ `weather === 'hot'` → Heat shimmer (CSS)

**Trigger:** `const weather = useWeatherStore((s) => s.weather);` — Line 164

**Key Finding:** ✅ Animation system ĐÃ HOÀN CHỈ — Chỉ cần `setWeather()` from API

### 2.4 Weather Effects on Gameplay

**File:** `src/modules/farming/utils/growth.ts`

```typescript
// Line 12-23
export function getWeatherGrowthMultiplier(weather: WeatherType): number {
  switch (weather) {
    case 'rain': return 1.5;      // +50% tốc độ
    case 'storm': return 1.2;     // +20%
    case 'sunny': return 1.0;     // bình thường
    case 'cloudy': return 0.9;    // -10%
    case 'hot': return 0.7;        // -30%
    case 'cold': return 0.6;       // -40%
    case 'snow': return 0.5;       // -50%
    case 'wind': return 0.85;      // -15%
  }
}
```

**Usage in FarmingScreen.tsx:**
```tsx
// Line 336
const growthMult = getWeatherGrowthMultiplier(weather);
```

**Key Finding:** Gameplay system ĐÃ có weather effects — Chỉ cần weather data chính xác

### 2.5 Weather Control UI (Dev Tool)

**File:** `src/modules/farming/components/WeatherControl.tsx`

**Features:**
- Modal để chọn weather type (8 types)
- Modal để chọn time of day (4 phases)
- **Current:** User manual set — KHÔNG có auto mode

### 2.6 Day/Night System

**File:** `weatherStore.ts` Lines 17-23

```typescript
function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h >= 5 && h < 7) return 'dawn';   // 05:00-06:59
  if (h >= 7 && h < 17) return 'day';   // 07:00-16:59
  if (h >= 17 && h < 19) return 'dusk';  // 17:00-18:59
  return 'night';                           // 19:00-04:59
}
```

**✅ STATUS:** ĐÃ hoạt động đúng — Dựa trên `new Date()` thực tế

---

## 3. INTERFACE MAPPING: BE Response → FE Store

### 3.1 Field Mapping Table

| Backend Field | Frontend Store | Mapper Needed | Action |
|--------------|-----------------|---------------|--------|
| `data.current.temperature` | ❌ KHÔNG CÓ | ❌ NO | **ADD** `temperature: number` |
| `data.current.weatherCode` | ❌ KHÔNG CÓ | ✅ YES | Mapper: WMO → WeatherType |
| `data.provinceName` | ❌ KHÔNG CÓ | ❌ NO | Optional: Display location name |
| `data.coordinates.lat/lon` | ❌ KHÔNG CÓ | ❌ NO | Optional: For future GPS feature |
| `data.current.precipitation` | ❌ KHÔNG CÓ | ❌ NO | Optional: Rain intensity |
| `data.current.humidity` | ❌ KHÔNG CÓ | ❌ NO | Optional: Display humidity |
| `data.current.windSpeed` | ❌ KHÔNG CÓ | ❌ NO | Optional: Display wind |

### 3.2 WMO Code → WeatherType Mapper (NEEDED)

Backend trả về `weatherCode` (WMO standard). Frontend cần `WeatherType`.

```typescript
// NEED TO CREATE: src/modules/farming/utils/weatherMapper.ts

export function mapWmoToWeatherType(wmoCode: number): WeatherType {
  // WMO Weather Codes: https://open-meteo.com/en/docs
  switch (wmoCode) {
    case 0: return 'sunny';        // Clear sky
    case 1:
    case 2:
    case 3: return 'cloudy';      // Partly cloudy
    case 45:
    case 48: return 'cloudy';      // Fog / depositing rime fog
    case 51:
    case 53:
    case 55: return 'rain';        // Drizzle
    case 56:
    case 57:
    case 61:
    case 63:
    case 65:
    case 66:
    case 67: return 'rain';        // Rain / Freezing rain
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86: return 'snow';        // Snow grains / Snow showers
    case 95:
    case 96:
    case 99: return 'storm';       // Thunderstorm
    case 80:
    case 81:
    case 82: return 'rain';        // Rain showers
    default: return 'sunny';
  }
}

export function getWeatherDescription(wmoCode: number): string {
  const descriptions: Record<number, string> = {
    0: 'Trời quang',
    1: 'Nhiều mây',
    2: 'Mây rải rác',
    3: 'Mây rải rác',
    45: 'Sương mù',
    51: 'Mưa phùn',
    61: 'Mưa nhỏ',
    63: 'Mưa vừa',
    65: 'Mưa',
    71: 'Tuyết nhẹ',
    73: 'Tuyết',
    80: 'Mưa rào',
    95: 'Giông bão',
    // ... etc
  };
  return descriptions[wmoCode] || 'Không rõ';
}
```

---

## 4. SO SÁNH 3 PHƯƠNG ÁN

### 4.1 Comparison Table

| Tiêu chí | Option A: Gọi `/api/weather` | Option B: Tạo `/api/game/weather` | Option C: Gọi Open-Meteo trực tiếp |
|-----------|------------------------------|-----------------------------------|--------------------------------|
| **Sửa Backend** | ❌ KHÔNG | ✅ CÓ (tạo endpoint mới) | ❌ KHÔNG |
| **Sửa Frontend** | ✅ CÓ (mapper + hook) | ✅ CÓ (hook + store) | ✅ CÓ (hook) |
| **Auth** | ❌ KHÔNG CẦN | ✅ Có thể dùng auth middleware | ❌ KHÔNG CẦN |
| **CORS** | ✅ Đã configured | ✅ Đã configured | ⚠️ Có thể block |
| **Cache** | ✅ Redis 1h | ✅ Redis 1h | ❌ KHÔNG CÓ |
| **GPS Support** | ✅ Có (nearest province) | ✅ Có thể extend user location | ✅ Có |
| **Fallback** | ✅ Province data | ✅ Province data | ❌ KHÔNG CÓ |
| **Response Size** | ❌ LỚN (~15KB) | ✅ Có thể optimize | ✅ NHỎ NHẤT |
| **Game-specific** | ❌ Province format | ✅ Custom format | ❌ Generic API |
| **Effort** | 2-3 hours (FE only) | 4-6 hours (BE + FE) | 1-2 hours (FE only) |
| **Maintainability** | ⚠️ Medium (mapper phức tạp) | ✅ HIGH (clean separation) | ❌ LOW (external dep) |
| **Rate Limit Risk** | ✅ LOW (cache BE) | ✅ LOW (cache BE) | ⚠️ HIGH (direct calls) |

### 4.2 Recommendation: **OPTION B (Tạo `/api/game/weather` endpoint)**

**Lý do:**
1. ✅ Clean architecture: `/api/game/*` cho game, `/api/weather/*` cho admin/public
2. ✅ Response format tối ưu — CHỈ cần fields game dùng
3. ✅ Có thể extend với user-specific location sau này
4. ✅ Maintainability cao hơn
5. ✅ Có thể reuse code weather module

---

## 5. IMPLEMENTATION PLAN (OPTION B)

### 5.1 Phase 1: Backend — `/api/game/weather` endpoint (2-3 hours)

**File 1: `src/modules/game/routes/weather.ts` (NEW)**

```typescript
import { Hono } from 'hono';
import type { GameEnv } from '../../types';
import { getGpsWeather, findNearestProvince } from '@/modules/weather';

const gameWeather = new Hono<GameEnv>();

// GET /api/game/weather — Default weather (Thái Nguyên)
gameWeather.get('/', async (c) => {
  try {
    const defaultProvinceCode = '41'; // Thái Nguyên
    const nearest = await findNearestProvince(21.5928, 105.8442);

    if (!nearest) {
      return c.json({ success: false, error: 'Weather not available' }, 503);
    }

    const gameData = mapProvinceToGameWeather(nearest);
    return c.json({ success: true, data: gameData });
  } catch (error) {
    console.error('[GAME-WEATHER] Error:', error);
    return c.json({ success: false, error: 'Internal error' }, 500);
  }
});

// GET /api/game/weather?lat={lat}&lon={lon}
gameWeather.get('/', async (c) => {
  const lat = Number.parseFloat(c.req.query('lat') || '0');
  const lon = Number.parseFloat(c.req.query('lon') || '0');

  if (!lat || !lon) {
    // Fallback to default province
    return c.json({ success: false, error: 'Missing coordinates' }, 400);
  }

  try {
    const data = await getGpsWeather(lat, lon);
    const gameData = mapProvinceToGameWeather(data);
    return c.json({ success: true, data: gameData });
  } catch (error) {
    console.error('[GAME-WEATHER] GPS Error:', error);
    return c.json({ success: false, error: 'Failed to fetch weather' }, 500);
  }
});

// Game-optimized response mapper
function mapProvinceToGameWeather(apiData: any): GameWeatherResponse {
  return {
    temperature: apiData.current.temperature,
    weatherCode: apiData.current.weatherCode,
    weatherType: mapWmoToWeatherType(apiData.current.weatherCode),
    description: getWeatherDescription(apiData.current.weatherCode),
    humidity: apiData.current.humidity,
    windSpeed: apiData.current.windSpeed,
    location: {
      name: apiData.provinceName,
      lat: apiData.coordinates.lat,
      lon: apiData.coordinates.lon,
    },
    lastUpdated: apiData.lastUpdated,
  };
}

export default gameWeather;
```

**File 2: `src/modules/game/routes/index.ts` (UPDATE)**

```typescript
// Line ~10: Add import
import weatherRoutes from './weather';

// Line ~45: Mount weather route
game.route('/weather', weatherRoutes);
```

### 5.2 Phase 2: Frontend — useWeather hook (1-2 hours)

**File: `src/shared/hooks/useWeather.ts` (NEW)**

```typescript
import { useQuery } from '@tanstack/react-query';

export function useWeather(lat?: number, lon?: number) {
  return useQuery({
    queryKey: ['weather', lat, lon],
    queryFn: async () => {
      // Build URL based on params
      let url = 'https://sta.cdhc.vn/api/game/weather';
      const params = new URLSearchParams();

      if (lat && lon) {
        params.append('lat', lat.toString());
        params.append('lon', lon.toString());
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const json = await response.json();
      if (!json.success) {
        throw new Error(json.error || 'Weather fetch failed');
      }

      return json.data;
    },
    refetchInterval: 300_000, // 5 minutes
    staleTime: 240_000, // 4 minutes — consider stale after 4min
  });
}
```

### 5.3 Phase 3: Frontend — Weather Mapper (1 hour)

**File: `src/modules/farming/utils/weatherMapper.ts` (NEW)**

```typescript
import { WeatherType } from '@/modules/farming/stores/weatherStore';

export function mapWmoToWeatherType(wmoCode: number): WeatherType {
  if (wmoCode === 0) return 'sunny';
  if (wmoCode >= 1 && wmoCode <= 3) return 'cloudy';
  if (wmoCode >= 45 && wmoCode <= 48) return 'cloudy'; // Fog
  if (wmoCode >= 51 && wmoCode <= 67) return 'rain';
  if (wmoCode >= 71 && wmoCode <= 77) return 'snow'; // Snow
  if (wmoCode >= 80 && wmoCode <= 82) return 'rain'; // Rain showers
  if (wmoCode >= 85 && wmoCode <= 86) return 'snow'; // Snow showers
  if (wmoCode >= 95 && wmoCode <= 99) return 'storm'; // Thunderstorm
  if (wmoCode >= 40 && wmoCode <= 49) return 'wind'; // Drizzle / freezing rain
  if (wmoCode === 24) return 'wind'; // Rain showers + thunderstorm
  if (wmoCode >= 96 && wmoCode <= 99) return 'storm';

  // Extreme temps
  if (wmoCode === null || wmoCode === undefined) return 'sunny';

  return 'sunny';
}

export function getWeatherDescription(wmoCode: number): string {
  const descriptions: Record<number, string> = {
    0: 'Trời quang',
    1: 'Gợi một chút mây',
    2: 'Nhiều mây',
    3: 'Mây rải rác',
    45: 'Sương mù',
    48: 'Sương mù có tuyết',
    51: 'Mưa phùn',
    61: 'Mưa nhỏ',
    63: 'Mưa',
    65: 'Mưa',
    71: 'Tuyết rơi rời',
    73: 'Tuyết',
    80: 'Mưa rào',
    95: 'Giông bão',
    99: 'Giông bão mạnh',
  };
  return descriptions[wmoCode] || 'Không rõ';
}

// Optional: For future use
export function mapWmoToGameGrowthMultiplier(wmoCode: number): number {
  const type = mapWmoToWeatherType(wmoCode);
  switch (type) {
    case 'rain': return 1.5;
    case 'storm': return 1.2;
    case 'sunny': return 1.0;
    case 'cloudy': return 0.9;
    case 'hot': return 0.7;
    case 'cold': return 0.6;
    case 'snow': return 0.5;
    case 'wind': return 0.85;
    default: return 1.0;
  }
}
```

### 5.4 Phase 4: Frontend — Update weatherStore (30 mins)

**File: `src/modules/farming/stores/weatherStore.ts` (UPDATE)**

```typescript
// ADD new fields to interface
interface WeatherState {
  weather: WeatherType;
  timeOfDay: TimeOfDay;
  temperature: number;        // ← NEW
  weatherCode: number;        // ← NEW (optional, for debugging)
  setWeather: (w: WeatherType) => void;
  setTimeOfDay: (t: TimeOfDay) => void;
  cycleWeather: () => void;
  autoTimeOfDay: () => void;
}

// UPDATE initial state
export const useWeatherStore = create<WeatherState>((set, get) => ({
  weather: 'sunny',
  timeOfDay: getTimeOfDay(),
  temperature: 28,              // ← NEW: Default fallback
  weatherCode: 0,               // ← NEW: Default fallback
  setWeather: (weather) => set({ weather }),
  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
  // ... rest unchanged
}));
```

### 5.5 Phase 5: Frontend — Update FarmHeader (30 mins)

**File: `src/modules/farming/components/FarmHeader.tsx` (UPDATE)**

```tsx
// Line 10: Import
import { useWeatherStore } from '@/modules/farming/stores/weatherStore';

// Inside component (replace line 10):
const weather = useWeatherStore((s) => s.weather);
const temperature = useWeatherStore((s) => s.temperature);

// Replace line 135:
<div className="font-heading text-base font-bold">
  {temperature ? `${Math.round(temperature)}°C` : '--°C'}
</div>
```

### 5.6 Phase 6: Frontend — Integration in FarmingScreen (1 hour)

**File: `src/modules/farming/screens/FarmingScreen.tsx` (UPDATE)**

```tsx
// Add import at top (Line ~20):
import { useWeather } from '@/shared/hooks/useWeather';
import { mapWmoToWeatherType } from '@/modules/farming/utils/weatherMapper';

// Inside component (after line 125):
// Auto-fetch and sync weather
const { data: weatherData } = useWeather();

useEffect(() => {
  if (weatherData) {
    const setWeather = useWeatherStore.getState().setWeather;
    const setTemperature = useWeatherStore.getState().setTemperature; // Add this

    // Map WMO code to WeatherType
    const weatherType = mapWmoToWeatherType(weatherData.weatherCode);

    // Update store
    setWeather(weatherType);
    setTemperature(weatherData.temperature);
  }
}, [weatherData]);
```

---

## 6. DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     WEATHER DATA FLOW                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  User mở FarmingScreen (game.cdhc.vn)                          │
│       ↓                                                             │
│  ┌─────────────────────────────────────────────────────┐              │
│  │ useEffect: Check if weather data exists            │              │
│  │   → No: Call useWeather()                      │              │
│  │   → Yes: Use cached data                         │              │
│  └─────────────────────────────────────────────────────┘              │
│       ↓                                                             │
│  ┌─────────────────────────────────────────────────────┐              │
│  │ useWeather() query:                             │              │
│  │   → GET /api/game/weather                        │              │
│  │   → OR: GET /api/game/weather?lat=XX&lon=YY  │              │
│  └─────────────────────────────────────────────────────┘              │
│       ↓                                                             │
│  ┌─────────────────────────────────────────────────────┐              │
│  │ Backend:                                         │              │
│  │   1. Check Redis cache                              │              │
│  │   2. If miss: findNearestProvince(lat, lon)       │              │
│  │   3. If miss: getGpsWeather(lat, lon)              │              │
│  │   4. Return: { temperature, weatherCode, ... }       │              │
│  └─────────────────────────────────────────────────────┘              │
│       ↓                                                             │
│  ┌─────────────────────────────────────────────────────┐              │
│  │ Response to FE:                                  │              │
│  │   { temperature: 17.2, weatherCode: 3, ... }      │              │
│  └─────────────────────────────────────────────────────┘              │
│       ↓                                                             │
│  ┌─────────────────────────────────────────────────────┐              │
│  │ FE: mapWmoToWeatherType(weatherCode)              │              │
│  │   → WeatherType: 'cloudy'                        │              │
│  └─────────────────────────────────────────────────────┘              │
│       ↓                                                             │
│  ┌─────────────────────────────────────────────────────┐              │
│  │ weatherStore:                                     │              │
│  │   setWeather('cloudy')                           │              │
│  │   setTemperature(17.2)                           │              │
│  └─────────────────────────────────────────────────────┘              │
│       ↓                                                             │
│  ┌─────────────────────────────────────────────────────┐              │
│  │ UI Updates:                                      │              │
│  │   • WeatherOverlay: render rain animation           │              │
│  │   • FarmHeader: "17°C"                         │              │
│  │   • growth.ts: getWeatherGrowthMultiplier('cloudy')  │              │
│  │   → 0.9x growth speed                              │              │
│  └─────────────────────────────────────────────────────┘              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. FILES TO CREATE/MODIFY

### Backend Files (3 files, ~200 lines)

| File | Action | Lines | Priority |
|------|--------|-------|-----------|
| `src/modules/game/routes/weather.ts` | CREATE NEW | +120 | HIGH |
| `src/modules/game/routes/index.ts` | UPDATE (add import + mount) | +5 | HIGH |
| `src/modules/weather/weather.service.ts` | ADD `mapProvinceToGameWeather()` | +40 | MEDIUM |

### Frontend Files (6 files, ~250 lines)

| File | Action | Lines | Priority |
|------|--------|-------|-----------|
| `src/shared/hooks/useWeather.ts` | CREATE NEW | +60 | HIGH |
| `src/modules/farming/utils/weatherMapper.ts` | CREATE NEW | +80 | HIGH |
| `src/modules/farming/stores/weatherStore.ts` | UPDATE (add 2 fields) | +5 | HIGH |
| `src/modules/farming/components/FarmHeader.tsx` | UPDATE (dynamic temp) | ~10 | HIGH |
| `src/modules/farming/screens/FarmingScreen.tsx` | UPDATE (add useEffect) | +15 | MEDIUM |
| `tailwind.config.ts` | UPDATE (optional new animations) | +0-20 | LOW |

**Total Effort:** 5-8 hours coding + 2 hours testing

---

## 8. RECOMMENDATION: OPTION B

### Why Option B?

1. **Clean Architecture:** Game endpoints in `/api/game/*`, admin in `/api/weather/*`
2. **Game-Specific Response:** Chỉ return fields game cần (temperature, weatherCode, type)
3. **Future-Proof:** Có thể extend với user location, personalized weather
4. **Maintainability:** Code separation, dễ maintain
5. **Auth Support:** Có thể dùng auth middleware (cho user-specific features sau này)
6. **Cache Efficiency:** Reuse existing Redis cache, không duplicate calls
7. **Fallback Strategy:** Province data làm backup nếu GPS fail

### Alternative: If rushed → Use Option A

**Quick Implementation (2-3 hours):**
- Frontend calls `/api/weather/provinces` directly
- Create mapper in FE only
- NO backend changes
- Trade-off: Response size LỚN, but workable

---

## 9. NEXT STEPS

1. ✅ **Review this report** — Confirm approach (Option A or B?)
2. ⏳ **Implement Phase 1** — Backend endpoint (nếu Option B)
3. ⏳ **Implement Phase 2** — Frontend useWeather hook
4. ⏳ **Implement Phase 3** — Weather mapper
5. ⏳ **Implement Phase 4** — Update weatherStore
6. ⏳ **Implement Phase 5** — Update FarmHeader
7. ⏳ **Implement Phase 6** — Integrate into FarmingScreen
8. ⏳ **Test real weather data** — Verify temp + animations sync
9. ⏳ **Deploy to staging** — Test on sta.cdhc.vn
10. ⏳ **Monitor** — Check API load, cache hit rate

---

## 10. SUMMARY

### ✅ ĐÃ CÓ

1. ✅ **Backend Weather Module** — Đầy đủ functions, cache, cron
2. ✅ **Weather API Endpoints** — 4 endpoints public access
3. ✅ **Real-time Data** — Open-Meteo, 34 provinces, GPS fallback
4. ✅ **Frontend Weather System** — Store, animations, effects on gameplay
5. ✅ **Day/Night Cycle** — Dựa trên `new Date()`
6. ✅ **WMO Code Standard** — Mapping table ready

### ❌ CHƯA CÓ

1. ❌ **Frontend → Backend Integration** — Weather API chưa được gọi
2. ❌ **Temperature Field** — Store thiếu `temperature`
3. ❌ **WMO Mapper** — Chưa có function mapWmoToWeatherType
4. ❌ **useWeather Hook** — Chưa có hook để call API
5. ❌ **Game Endpoint** — `/api/game/weather` chưa tồn tại

### 🎯 RECOMMENDED NEXT STEP

**Option B: Tạo `/api/game/weather` endpoint**
- Effort: 5-8 hours total
- Risk: Low
- Value: High (clean architecture, maintainable)

**Quick Start:** Implement Phase 2 (Frontend) trước nếu cần demo nhanh
- Deploy với mock data → Update với real API sau

---

*Report saved to:* `/mnt/d/du-an/cdhc/cdhc-game-vite/docs/WEATHER-FE-BE-INTEGRATION-SCAN.md`
