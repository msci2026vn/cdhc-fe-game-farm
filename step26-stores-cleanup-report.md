# Bước 26: Stores Cleanup — Report

**Ngày:** 2026-02-11
**Status:** ✅ COMPLETE

---

## Stores Trước/Sau

| Store | Trước | Sau | Status |
|-------|-------|-----|--------|
| playerStore | Zustand (utilities only) | Zustand (utilities only) | ✅ GIỮ |
| activityStore | Zustand (mock data) | XÓA | ✅ DELETED |
| bossProgressStore | Zustand (dead code) | XÓA | ✅ DELETED |
| farmStore | Zustand (UI only) | GIỮ | ✅ |
| weatherStore | Zustand (client) | GIỮ | ✅ |
| uiStore | Zustand (client) | GIỮ | ✅ |

**Stores còn lại: 4** (từ 6)

---

## Files Đã Sửa

### Hooks (1 file)
| File | Change | Status |
|------|--------|--------|
| useBossComplete.ts | Xóa commented import | ✅ |

### Components (3 files)
| File | Change | Status |
|------|--------|--------|
| FarmingScreen.tsx | Xóa `useActivityStore` import + `addHarvest` | ✅ |
| FriendGarden.tsx | Xóa `useActivityStore` + 4 action imports | ✅ |
| ProfileScreen.tsx | Xóa activity/inventory tabs, giữ stats/achievements | ✅ |

### Stores Deleted (2 files)
| File | Lines | Status |
|------|-------|--------|
| bossProgressStore.ts | 23 | ✅ DELETED |
| activityStore.ts | 90 | ✅ DELETED |

---

## Stores Còn Lại

### `/src/shared/stores/`
- **playerStore.ts** (33 lines) - Chỉ utility functions: `xpForLevel`, `xpForNextLevel`, `getLevelTitle`, `XP_REWARDS`
- **uiStore.ts** (35 lines) - Toast + FlyUp UI state (CORRECT Zustand usage)

### `/src/modules/farming/stores/`
- **farmStore.ts** (124 lines) - plots, waterCooldowns, happinessTick (UI state)
- **weatherStore.ts** (55 lines) - weather, timeOfDay (client-side visual)

---

## PlayerStore Utilities Usage

| File | Imports |
|------|---------|
| BossList.tsx | `xpForNextLevel` |
| FarmHeader.tsx | `xpForNextLevel`, `getLevelTitle` |
| ProfileScreen.tsx | `xpForNextLevel`, `getLevelTitle` |
| QuizScreen.tsx | `xpForNextLevel` |

**Total:** 4 components using utilities

---

## Audit

| Check | Count | Status |
|-------|-------|--------|
| activityStore imports remaining | 0 | ✅ CLEAN |
| bossProgressStore imports remaining | 0 | ✅ CLEAN |
| playerStore imports (utilities) | 4 | ✅ |
| Remaining stores | 4 | ✅ |

---

## Build

| Check | Status |
|-------|:------:|
| TypeScript 0 errors | ✅ |
| Vite build | ✅ 37.29s |

### Bundle Size (changed files)
| File | Size | Change |
|------|------|--------|
| ProfileScreen | 6.38 kB | -3.47 kB (removed tabs) |

---

## BE Endpoints

| Endpoint | Code | Status |
|----------|:----:|:------:|
| ping | 401 | ✅ |
| farm/plots | 401 | ✅ |
| boss/progress | 401 | ✅ |
| shop/items | 401 | ✅ |
| leaderboard | 401 | ✅ |

---

## Architectural Notes

### Why activityStore was deleted:
- Pure client-side demo data (likes, comments, gifts, inventory)
- Not synced with server
- ProfileScreen now shows stats from server API (`profile.likesCount`, etc.)
- Activity/Inventory tabs removed (can be re-added with server API later)

### Why bossProgressStore was deleted:
- Dead code - only 1 commented import
- Already replaced by TanStack Query: `useBossProgress()` hook
- Boss progress comes from API: `GET /boss/progress`

### Why playerStore was kept:
- Already clean - no Zustand create(), just utility functions
- Pure functions: `xpForLevel()`, `getLevelTitle()`, etc.
- 4 components depend on it
- Could rename to `player-utils.ts` but not critical

### Why uiStore + weatherStore were kept:
- Correct use of Zustand for ephemeral UI state
- Toast notifications, fly-up text
- Weather/time of day (client-side visual effects)

---

## Issues

| # | Issue | Status |
|---|-------|:------:|
| - | None | ✅ |

---

**Bước 26:** ✅ COMPLETE — 2 stores deleted, 4 stores remaining
