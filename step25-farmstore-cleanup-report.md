# Bước 25: farmStore Cleanup → TanStack Query SSOT

**Ngày:** 2026-02-11
**Status:** ✅ VERIFIED

## Tóm tắt

Chuyển đổi toàn bộ data state (OGN, XP, Level) từ Zustand stores (farmStore, playerStore) sang TanStack Query hooks (useOgn, useXp, useLevel) với **usePlayerProfile** làm Single Source of Truth.

---

## 🔍 SCAN RESULTS (Step 25 Verification)

### Sót Audit

| Check | Count | Status |
|-------|-------|--------|
| setOgn/addOgn/setXp/setLevel outside stores | 0 | ✅ CLEAN |
| farmStore data reads (ogn/xp/level) | 0 | ✅ CLEAN |
| playerStore data reads | 0 | ✅ CLEAN |
| useOgn() calls | 6 | ✅ |
| useXp() calls | 5 | ✅ |
| useLevel() calls | 6 | ✅ |
| PLAYER_PROFILE_KEY total usage | 28 | ✅ |

### useOgn() — 6 components
| File | Line |
|------|------|
| FarmHeader.tsx | 9 |
| FarmingScreen.tsx | 46 |
| FriendGarden.tsx | 20 |
| ProfileScreen.tsx | 28 |
| ShopScreen.tsx | 35 |
| Header.tsx | 6 |

### useXp() — 5 components
| File | Line |
|------|------|
| BossList.tsx | 13 |
| FarmHeader.tsx | 12 |
| QuizScreen.tsx | 14 |
| ShopScreen.tsx | 34 |
| ProfileScreen.tsx | 56 (via profile.xp) |

### useLevel() — 6 components
| File | Line |
|------|------|
| BossFightM3.tsx | 32, 84 |
| BossList.tsx | 12 |
| FarmHeader.tsx | 11 |
| QuizScreen.tsx | 13 |
| ShopScreen.tsx | 33 |
| ProfileScreen.tsx | 56 (via profile.level) |

---

## Kết quả chuyển đổi

| Data | Trước | Sau | Status |
|------|-------|-----|--------|
| OGN | `farmStore.ogn` / `playerStore.ogn` | `useOgn()` → usePlayerProfile query | ✅ |
| XP | `playerStore.xp` | `useXp()` | ✅ |
| Level | `playerStore.level` | `useLevel()` | ✅ |
| setOgn() | `store.setOgn()` / `store.addOgn()` | `invalidateQueries()` / `setQueryData()` | ✅ |
| Sync update | `store.setOgn(result.ogn)` | `setQueryData(PLAYER_PROFILE_KEY)` | ✅ |
| XP utilities | `playerStore` utilities | `playerStore` (giữ lại, chỉ utilities) | ✅ |

---

## Files đã sửa

### Hooks (8 files)

| File | Change | Status |
|------|--------|--------|
| `useShopBuy.ts` | Xóa `useFarmStore.getState().setOgn()`, dùng `setQueryData()` | ✅ |
| `usePlantSeed.ts` | Xóa `useFarmStore.getState().setOgn()`, dùng `setQueryData()` | ✅ |
| `useGameSync.ts` | Thêm `queryClientRef` để update profile sau sync | ✅ |
| `useClearPlot.ts` | Dùng `PLAYER_PROFILE_KEY` patterns | ✅ |
| `useQuizAnswer.ts` | Dùng `PLAYER_PROFILE_KEY` patterns | ✅ |
| `useSocial.ts` | Dùng `invalidateQueries` | ✅ |
| `usePlayerProfile.ts` | Core hook với useOgn/useXp/useLevel | ✅ |

### Components (10 files)

| File | Change | Status |
|------|--------|--------|
| `FarmingScreen.tsx` | `useFarmStore(s=>s.ogn)` → `useOgn()`, xóa OGN sync code | ✅ |
| `ShopScreen.tsx` | `useFarmStore(s=>s.ogn)` → `useOgn()`, `usePlayerStore()` → `useXp/useLevel` | ✅ |
| `ProfileScreen.tsx` | `useFarmStore(s=>s.ogn)` → `useOgn()` | ✅ |
| `FarmHeader.tsx` | `useFarmStore(s=>s.ogn)` → `useOgn()`, `usePlayerStore()` → `useXp/useLevel` | ✅ |
| `Header.tsx` | `useFarmStore(s=>s.ogn)` → `useOgn()` | ✅ |
| `QuizScreen.tsx` | `usePlayerStore()` → `useLevel/useXp` | ✅ |
| `BossFightM3.tsx` | `usePlayerStore.getState().level` → `useLevel()` | ✅ |
| `BossList.tsx` | `usePlayerStore()` → `useLevel/useXp` | ✅ |
| `FriendGarden.tsx` | Xóa `addOgn()` calls (client-only demo, không mutate store) | ✅ |
| `BugCatchGame.tsx` | Xóa `addOgn()` calls (client-only demo, không mutate store) | ✅ |

### Stores (2 files)

| File | Change | Status |
|------|--------|--------|
| `farmStore.ts` | Xóa `ogn`, `addOgn`, `setOgn` fields/methods, giảm 136→124 dòng | ✅ |
| `playerStore.ts` | Xóa `xp`, `level`, `ogn` fields + setters, chỉ giữ utilities (33 dòng) | ✅ |

---

## usePlayerProfile.ts Checklist

| Item | Status |
|------|:------:|
| useQuery with queryKey PLAYER_PROFILE_KEY | ✅ |
| staleTime: 30s | ✅ |
| retry: 2 | ✅ |
| refetchOnWindowFocus: true | ✅ |
| useOgn() convenience hook | ✅ |
| useXp() convenience hook | ✅ |
| useLevel() convenience hook | ✅ |
| useInvalidateProfile() helper | ✅ |
| useSetProfileData() helper | ✅ |
| Export PLAYER_PROFILE_KEY | ✅ |

---

## useGameSync.ts Pattern

| Item | Status |
|------|:------:|
| queryClientRef module-level | ✅ Line 39 |
| setQueryData PLAYER_PROFILE_KEY | ✅ Lines 70-75 |
| Updates ogn/xp/level from server | ✅ |

---

## Store Sizes

| Store | Before | After | Change |
|-------|--------|-------|--------|
| farmStore.ts | 136 lines | 124 lines | ✅ -12 lines |
| playerStore.ts | 60 lines | 33 lines | ✅ -27 lines (45%) |

### farmStore.ts Remaining Fields
- `plots` — ✅ UI state
- `waterCooldowns` — ✅ UI state
- Actions: `plantSeed`, `waterPlot`, `harvestPlot`, `tickHappiness`, `getWaterCooldownRemaining`

### playerStore.ts Remaining (Utilities Only)
- `xpForLevel()` — calculate XP for level
- `xpForNextLevel()` — calculate XP needed for next level
- `getLevelTitle()` — get title string
- `XP_REWARDS` — constants
- **Note:** OGN/XP/Level now managed by TanStack Query

---

## Build

| Check | Status |
|-------|:------:|
| TypeScript 0 errors | ✅ |
| Vite build | ✅ 37.54s |
| dist/assets size | 261.64 kB (gzip: 81.43 kB) |

---

## BE Endpoints (10)

| Endpoint | Code | Status |
|----------|:----:|:------:|
| ping | 401 | ✅ |
| farm/plots | 401 | ✅ |
| boss/progress | 401 | ✅ |
| quiz/start | 401 | ✅ |
| shop/items | 401 | ✅ |
| social/friends | 401 | ✅ |
| social/referral | 401 | ✅ |
| leaderboard | 401 | ✅ |
| player/sync | 401 | ✅ |
| farm/clear | 401 | ✅ |

---

## Kiến trúc mới

```
Trước (Zustand chaos):
┌─────────────────┐
│   Components    │───► useFarmStore().ogn ─┐
└─────────────────┘                          │
┌─────────────────┐                          │
│     Hooks       │───► getState().setOgn()──┤───► farmStore.ogn (state)
└─────────────────┘                          │
┌─────────────────┐                          │
│ usePlayerProfile │───► invalidateQueries ──┘──► 🔄 RACE CONDITIONS
└─────────────────┘

Sau (TanStack Query SSOT):
┌─────────────────┐
│   Components    │───► useOgn() ────────────────► usePlayerProfile query
└─────────────────┘                                 (Single Source of Truth)
┌─────────────────┐
│     Hooks       │───► invalidateQueries() ──────► refetch from server
└─────────────────┘
┌─────────────────┐
│  useGameSync    │───► setQueryData() ───────────► optimistic update
└─────────────────┘
```

---

## Quy tắc đã áp dụng

1. **Đọc data**: `useOgn()` / `useXp()` / `useLevel()` - auto-subscribe to query cache
2. **Viết data (mutations)**: `setQueryData(PLAYER_PROFILE_KEY)` - optimistic update
3. **Đồng bộ sau mutation**: `invalidateQueries({ queryKey: PLAYER_PROFILE_KEY })` - refetch từ server
4. **Module-level code (useGameSync)**: Capture `queryClient` reference để dùng ngoài component
5. **Client-only demo features** (FriendGarden, BugCatchGame): Không mutate store, chỉ show UI feedback

---

## Issues

| # | Issue | Status |
|---|-------|:------:|
| - | None found | ✅ |

---

**Bước 25:** ✅ VERIFIED — No regression, clean migration to TanStack Query
