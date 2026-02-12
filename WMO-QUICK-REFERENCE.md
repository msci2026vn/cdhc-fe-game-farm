# WMO Weather Code Quick Reference

## WMO Codes → Game Weather Mapping

| WMO | Description | Game Weather | Temperature Threshold |
|-----|-------------|--------------|---------------------|
| 0 | Clear sky | sunny / hot / cold | ≥35°C = hot, ≤15°C = cold |
| 1 | Mainly clear | cloudy | - |
| 2 | Partly cloudy | cloudy | - |
| 3 | Overcast | cloudy | - |
| 45 | Fog | cloudy | - |
| 48 | Depositing rime fog | cloudy | - |
| 51 | Light drizzle | rain | - |
| 53 | Moderate drizzle | rain | - |
| 55 | Dense drizzle | rain | - |
| 56 | Light freezing drizzle | rain | - |
| 57 | Dense freezing drizzle | rain | - |
| 61 | Slight rain | rain | - |
| 63 | Moderate rain | rain | - |
| 65 | Heavy rain | rain | - |
| 66 | Light freezing rain | rain | - |
| 67 | Heavy freezing rain | rain | - |
| 71 | Slight snow fall | snow | - |
| 73 | Moderate snow fall | snow | - |
| 75 | Heavy snow fall | snow | - |
| 77 | Snow grains | snow | - |
| 80 | Slight rain showers | rain | - |
| 81 | Moderate rain showers | rain | - |
| 82 | Violent rain showers | rain | - |
| 85 | Slight snow showers | snow | - |
| 86 | Heavy snow showers | snow | - |
| 95 | Thunderstorm | storm | - |
| 96 | Thunderstorm with slight hail | storm | - |
| 99 | Thunderstorm with heavy hail | storm | - |

## Wind Speed Thresholds

| Wind Speed | Game Weather |
|------------|--------------|
| ≤25 km/h | Normal (based on WMO code) |
| >25 km/h | wind (overrides WMO code) |

## Time of Day

| Hour (24h) | Time | Is Day |
|------------|------|--------|
| 0-4 | night | false |
| 5-6 | dawn | true |
| 7-16 | day | true |
| 17-18 | dusk | false |
| 19-23 | night | false |

## Temperature Effects (Clear Skies Only)

| Temp | Weather |
|------|---------|
| ≥35°C | hot |
| ≤15°C | cold |
| 16-34°C | sunny |

## Priority Order

1. **Storm** (WMO 95-99) — highest priority
2. **Snow** (WMO 71-86)
3. **Rain** (WMO 51-67, 80-82)
4. **Wind** (>25 km/h) — overrides WMO code
5. **Fog** (WMO 45-48)
6. **Cloudy** (WMO 1-3)
7. **Temperature-based** (WMO 0 only)
   - hot (≥35°C)
   - cold (≤15°C)
   - sunny (default)
