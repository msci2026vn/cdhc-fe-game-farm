# Backend Weather Integration — Deployment Guide

## Overview
This guide shows how to deploy the weather integration to the backend at `/home/cdhc/apps/cdhc-be/src/modules/game/`.

## Files to Create/Update

### 1. Create Weather Routes File
**Path:** `/home/cdhc/apps/cdhc-be/src/modules/game/routes/weather.ts`

Copy the contents of `backend-weather-endpoint.ts` to this location.

### 2. Update Game Routes Index
**Path:** `/home/cdhc/apps/cdhc-be/src/modules/game/routes/index.ts`

Add the weather route import and mount:

```typescript
import { Hono } from 'hono';
import { authMiddleware, approvedMiddleware } from '@/modules/auth/middleware';
import type { AuthVariables } from '@/modules/auth/types';
import playerRoutes from './player';
import farmRoutes from './farm';
import bossRoutes from './boss';
import quizRoutes from './quiz';
import shopRoutes from './shop';
import socialRoutes from './social';
import weatherRoutes from './weather'; // ← NEW

type GameEnv = { Variables: AuthVariables };

const game = new Hono<GameEnv>();

// Apply auth middleware to ALL game routes
game.use('/*', authMiddleware());
game.use('/*', approvedMiddleware());

// ... existing code ...

// === WEATHER ROUTES ===  // ← NEW
game.route('/weather', weatherRoutes);

export default game;
```

## Testing the Endpoint

### 1. Test Auth Health Check First
```bash
curl -X GET 'https://sta.cdhc.vn/api/game/ping' \
  -H 'Cookie: cdhc_session=YOUR_SESSION_COOKIE' \
  -v
```

### 2. Test Weather Endpoint
```bash
# Test with Hanoi coordinates (default)
curl -X GET 'https://sta.cdhc.vn/api/game/weather' \
  -H 'Cookie: cdhc_session=YOUR_SESSION_COOKIE' \
  -v

# Test with GPS coordinates (Ho Chi Minh City)
curl -X GET 'https://sta.cdhc.vn/api/game/weather?lat=10.8231&lon=106.6297' \
  -H 'Cookie: cdhc_session=YOUR_SESSION_COOKIE' \
  -v
```

### Expected Response Format
```json
{
  "success": true,
  "data": {
    "condition": "sunny",
    "temperature": 32,
    "humidity": 75,
    "windSpeed": 8.5,
    "wmoCode": 0,
    "location": {
      "lat": 21.0285,
      "lon": 105.8542,
      "province": "Hà Nội"
    },
    "timeOfDay": "day",
    "isDay": true,
    "lastUpdated": "2026-02-12T07:30:00.000Z"
  }
}
```

## WMO Weather Codes Reference

The endpoint uses WMO (World Meteorological Organization) codes from Open-Meteo:

| Code | Description | Game Weather |
|------|-------------|--------------|
| 0 | Clear sky | sunny/cold/hot |
| 1-3 | Cloudy | cloudy |
| 45-48 | Fog | cloudy |
| 51-67 | Rain | rain |
| 71-86 | Snow | snow |
| 80-82 | Showers | rain |
| 95-99 | Thunderstorm | storm |

## Troubleshooting

### Weather endpoint returns 401/403
- Make sure user is authenticated
- Check that authMiddleware is working
- Verify session cookie is valid

### Weather endpoint returns 500
- Check backend logs: `tail -f /home/cdhc/apps/cdhc-be/logs/app.log`
- Verify Open-Meteo service is accessible: `curl https://api.open-meteo.com`
- Check Redis connection: `redis-cli ping`

### Weather data not updating
- Check Redis TTL settings in weather.service.ts
- Verify cron job is running: `crontab -l`
- Manually refresh weather: `curl https://sta.cdhc.vn/api/weather/refresh`

## Frontend Integration (Already Complete)

The frontend has been updated with:
- ✅ `useWeather` hook in `src/shared/hooks/useWeather.ts`
- ✅ Weather mapper utility in `src/shared/utils/weatherMapper.ts`
- ✅ `getWeather()` API function in `src/shared/api/game-api.ts`
- ✅ Weather types in `src/shared/types/game-api.types.ts`
- ✅ Updated `weatherStore` with temperature field
- ✅ Updated `FarmHeader` to display real temperature
- ✅ Updated `FarmingScreen` to fetch and sync weather data

## Next Steps

1. Deploy the backend changes (create weather.ts, update routes/index.ts)
2. Test the weather endpoint with curl
3. Start the frontend development server
4. Test GPS permission flow in browser
5. Verify temperature display updates correctly
6. Check weather animations match API data

## Rollback Plan

If issues occur:
1. Remove weather route import from game/routes/index.ts
2. Comment out `useWeather` call in FarmingScreen.tsx
3. Hardcode temperature back to 28°C in FarmHeader.tsx
