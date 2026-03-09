# Bước 23: Wither Cron + Dead Plants — Test Report

**Ngày:** 2026-02-11
**Status:** ✅ VERIFIED

---

## Backend Scan

| Check | Status | Details |
|-------|--------|---------|
| wither.service.ts exists | ✅ | `/src/modules/game/services/wither.service.ts` |
| checkWitheredPlots() | ✅ | Query `happiness ≤ 0 AND isDead = false` → set `isDead=true, diedAt=now` |
| clearDeadPlot() | ✅ | Ownership check + `isDead=true` required → delete |
| Cron 5min registered | ✅ | `startWitherCron()` in `index.ts:176` |
| POST /farm/clear route | ✅ | `farm.post('/clear', ...)` in `farm.ts:158` |
| getPlots returns diedAt | ✅ | `farm.service.ts:33-34` returns `isDead, diedAt` |
| harvest blocks isDead | ✅ | `farm.service.ts:144` throws if `isDead` |
| DB columns | ✅ | `is_dead (boolean), died_at (timestamp), happiness (integer)` |

---

## Frontend Scan

| Check | Status | Details |
|-------|--------|---------|
| FarmPlot type diedAt | ✅ | `game-api.types.ts:50-51` — `isDead: boolean; diedAt: string \| null` |
| clearPlot API fn | ✅ | `game-api.ts:220` — POST to `/farm/clear` |
| useClearPlot hook | ✅ | `useClearPlot.ts` — TanStack mutation with optimistic update |
| Dead plant UI | ✅ | FarmScreen renders dead plants with clear button |
| Build | ✅ | TypeScript + Vite build pass |

---

## Functional Tests (11/11)

| # | Test | Result |
|---|------|--------|
| T1 | cron runs | ✅ |
| T2 | happiness 0 → dead | ✅ |
| T3 | healthy safe (happiness 80) | ✅ |
| T4 | already dead skip | ✅ |
| T5 | clear dead ok | ✅ |
| T5b | deleted from DB | ✅ |
| T6 | clear alive reject | ✅ |
| T7 | wrong user reject | ✅ |
| T8 | fake plotId reject | ✅ |
| T9 | getPlots has diedAt | ✅ |
| T10 | perf <500ms | ✅ (2ms) |

---

## HTTP Tests (10/10)

| Endpoint | Code | Status |
|----------|------|--------|
| POST /farm/clear | 401 | ✅ |
| GET /ping | 401 | ✅ |
| GET /farm/plots | 401 | ✅ |
| GET /boss/progress | 401 | ✅ |
| GET /quiz/start | 401 | ✅ |
| GET /shop/items | 401 | ✅ |
| GET /social/friends | 401 | ✅ |
| GET /social/referral | 401 | ✅ |
| GET /leaderboard | 401 | ✅ |
| POST /player/sync | 401 | ✅ |

> 401 = Expected (requires auth)

---

## Cron Logs

```
[FARM-DEBUG] Wither cron completed: 0 plots withered
```

Cron running every 5 minutes. No dead plots in production DB currently.

---

## Code Quality

### wither.service.ts
- ✅ Proper error handling
- ✅ Ownership verification before clear
- ✅ Atomic update with returning
- ✅ Logging for debugging

### useClearPlot.ts (Frontend)
- ✅ Optimistic update
- ✅ Rollback on error
- ✅ Query invalidation

---

## Issues Found

| # | Priority | Issue | Status |
|---|----------|-------|--------|
| - | - | None | - |

---

**Bước 23:** ✅ **VERIFIED — 11/11 PASS**
