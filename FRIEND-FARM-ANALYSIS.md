# FRIEND FARM — Scan & Analysis

> **Date:** 2026-02-15
> **Goal:** Click friend → view their farm (plots, plants, growth, happiness). View-only.

---

## 1. CURRENT STATE

### 1.1 Backend — What Exists

| Component | Status | Notes |
|-----------|--------|-------|
| `friendships` table | Exists | `userId + friendId` PK, `status` (pending/accepted/blocked) |
| `GET /social/friends` | Exists | Returns friends list: id, name, email, picture, level, ogn, interactedToday |
| `POST /social/interact` | Exists | water/like/gift → +5 OGN both sides, daily limit 10 |
| `POST /social/add-friend` | Exists | By friendId or referralCode |
| `farmService.getPlots(userId)` | Exists | **Already accepts any userId** — queries `farm_plots WHERE user_id = $1` |
| `GET /farm/plots` | Exists | But passes `user.id` from session only — no param for other users |
| **GET friend's plots** | **MISSING** | No endpoint to fetch another user's farm |

### 1.2 Frontend — What Exists

| Component | Status | Notes |
|-----------|--------|-------|
| `/friends` route | Exists | `FriendsScreen` → friend list from real API |
| `FriendsScreen.tsx` | Exists | Clicks friend → `setVisitingFriend(friend)` → shows `FriendGarden` |
| `FriendGarden.tsx` | Exists | **BUT uses DEMO data** — shows 1 plant, hardcoded interactions |
| `FriendData` type | Exists | id, name, avatar, level, title, online, plantCount, totalHarvest, ogn |
| `Friend` type (demo) | Exists | Has `plant: { emoji, name, growthPct, stage, happiness }` — **NOT from API** |
| `/friends/:id` route | **MISSING** | No dedicated route — uses state-based navigation (OK) |
| `getFriendFarm()` API | **MISSING** | No API call to get friend's plots |

### 1.3 Key Problems

1. **Backend gap:** `farmService.getPlots(userId)` works for any user but the route only exposes it for the session user
2. **Type mismatch:** `FriendsScreen` passes `FriendData` as `any` to `FriendGarden` which expects `Friend` (demo type with plant info)
3. **Single plant display:** `FriendGarden` only shows 1 plant — should show all 6 slots like FarmingScreen
4. **Fake interactions:** Water/Like/Gift/Comment buttons in `FriendGarden` are local state only — don't call real API
5. **No friendship check:** Need to verify users are friends before exposing farm data

---

## 2. PROPOSED APPROACH

### 2.1 Backend — New Endpoint

**Option chosen: New route in social module** (keeps friendship check co-located)

```
GET /api/game/social/friend-farm/:friendId
```

**Logic:**
1. Verify `friendId` is valid UUID
2. Check `friendships` table: `userId=session.user.id, friendId=param, status='accepted'`
3. Call existing `farmService.getPlots(friendId)`
4. Query friend's basic info (name, picture, level, ogn) from `users + player_stats`
5. Return: `{ friend: { id, name, picture, level, ogn }, plots: [...], totalSlots: 6 }`

**Why social module, not farm module:**
- Friendship check belongs in social domain
- Farm routes should only expose own data
- Cleaner separation of concerns

### 2.2 Backend — Code Changes

**File: `src/modules/game/routes/social.ts`** — Add route

```typescript
/**
 * GET /social/friend-farm/:friendId
 * View friend's farm plots (view-only)
 */
social.get('/friend-farm/:friendId', async (c) => {
  const user = c.get('user');
  const friendId = c.req.param('friendId');

  // Validate UUID format
  if (!friendId || !/^[0-9a-f-]{36}$/i.test(friendId)) {
    return c.json({ success: false, error: { code: 'INVALID_ID', message: 'ID không hợp lệ' } }, 400);
  }

  try {
    const result = await socialService.getFriendFarm(user.id, friendId);
    return c.json({ success: true, data: result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg === 'NOT_FRIENDS') {
      return c.json({ success: false, error: { code: 'NOT_FRIENDS', message: 'Chưa kết bạn' } }, 403);
    }
    if (msg === 'USER_NOT_FOUND') {
      return c.json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'Không tìm thấy người dùng' } }, 404);
    }
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Lỗi hệ thống' } }, 500);
  }
});
```

**File: `src/modules/game/services/social.service.ts`** — Add method

```typescript
async getFriendFarm(userId: string, friendId: string): Promise<{
  friend: { id: string; name: string | null; picture: string | null; level: number; ogn: number };
  plots: Array<{ id: string; slotIndex: number; plantTypeId: string; plantName: string; plantEmoji: string; plantedAt: number; happiness: number; lastWateredAt: number | null; isDead: boolean; growthPercent: number; isReady: boolean; growthDurationMs: number }>;
  totalSlots: number;
}> {
  // 1. Check friendship
  const friendship = await db
    .select()
    .from(friendships)
    .where(and(eq(friendships.userId, userId), eq(friendships.friendId, friendId), eq(friendships.status, 'accepted')))
    .limit(1);

  if (friendship.length === 0) throw new Error('NOT_FRIENDS');

  // 2. Get friend info
  const friendInfo = await db
    .select({ id: users.id, name: users.name, picture: users.picture, level: playerStats.level, ogn: playerStats.ogn })
    .from(users)
    .innerJoin(playerStats, eq(users.id, playerStats.userId))
    .where(eq(users.id, friendId))
    .limit(1);

  if (friendInfo.length === 0) throw new Error('USER_NOT_FOUND');

  // 3. Get friend's plots — reuse existing farmService.getPlots
  const plots = await farmService.getPlots(friendId);

  // 4. Enrich with growthDurationMs for client-side timer
  const allPlantTypes = await db.select().from(plantTypes);
  const ptMap = new Map(allPlantTypes.map(pt => [pt.id, pt]));

  const enrichedPlots = plots.map(plot => ({
    ...plot,
    growthDurationMs: ptMap.get(plot.plantTypeId)?.growthDurationMs ?? 0,
  }));

  return {
    friend: friendInfo[0]!,
    plots: enrichedPlots,
    totalSlots: 6,
  };
}
```

### 2.3 Frontend — Code Changes

#### New Types

**File: `src/shared/types/game-api.types.ts`** — Add types

```typescript
// FRIEND FARM (view-only)
export interface FriendFarmPlot {
  id: string;
  slotIndex: number;
  plantTypeId: string;
  plantName: string;
  plantEmoji: string;
  plantedAt: number;
  happiness: number;
  lastWateredAt: number | null;
  isDead: boolean;
  growthPercent: number;
  isReady: boolean;
  growthDurationMs: number;
}

export interface FriendFarmResult {
  friend: {
    id: string;
    name: string | null;
    picture: string | null;
    level: number;
    ogn: number;
  };
  plots: FriendFarmPlot[];
  totalSlots: number;
}
```

#### New API Call

**File: `src/shared/api/game-api.ts`** — Add method

```typescript
getFriendFarm: async (friendId: string): Promise<FriendFarmResult> => {
  const url = `https://sta.cdhc.vn/api/game/social/friend-farm/${friendId}`;
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (response.status === 401) { handleUnauthorized('getFriendFarm'); throw new Error('Session expired'); }
  if (!response.ok) await handleApiError(response);
  const json = await response.json();
  return json.data;
},
```

#### New Hook

**File: `src/shared/hooks/useFriendFarm.ts`** — New file

```typescript
import { useQuery } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';

export function useFriendFarm(friendId: string | null) {
  return useQuery({
    queryKey: ['game', 'social', 'friend-farm', friendId],
    queryFn: () => gameApi.getFriendFarm(friendId!),
    enabled: !!friendId,
    staleTime: 30_000,  // 30s — friend's farm changes occasionally
    gcTime: 5 * 60_000, // 5min cache
  });
}
```

#### Rewrite FriendGarden

**File: `src/modules/friends/components/FriendGarden.tsx`** — Major rewrite

Current: Shows 1 plant from demo data, fake interactions
New: Fetch real plots, show all 6 slots, use `useGrowthTimer` for progress, real interact API

```
Key changes:
- Accept FriendData (real API type) instead of Friend (demo type)
- Call useFriendFarm(friend.id) to fetch plots
- Show 6-slot grid (like FarmingScreen)
- Each slot: plant emoji + growth bar + happiness + countdown timer
- Empty slots show "Trống"
- useGrowthTimer for client-side progress updates
- Replace fake water/like handlers with useInteractFriend mutation
- Remove comment/gift (not in backend interact types, or add later)
- Header: friend name, level, OGN, online status
- "View-only" badge — no Plant/Harvest buttons
```

### 2.4 Frontend — Routing

**No new route needed.** Current approach is fine:
- `FriendsScreen` → click friend → `setVisitingFriend(friend)` → render `FriendGarden`
- State-based navigation avoids URL complexity
- Back button → `setVisitingFriend(null)` → return to list

---

## 3. FILE CHANGE ESTIMATE

### Backend (2 files)

| File | Change | Effort |
|------|--------|--------|
| `src/modules/game/routes/social.ts` | Add `GET /friend-farm/:friendId` route | Small |
| `src/modules/game/services/social.service.ts` | Add `getFriendFarm()` method | Medium |

### Frontend (5-6 files)

| File | Change | Effort |
|------|--------|--------|
| `src/shared/types/game-api.types.ts` | Add `FriendFarmPlot`, `FriendFarmResult` types | Small |
| `src/shared/api/game-api.ts` | Add `getFriendFarm()` API call | Small |
| `src/shared/hooks/useFriendFarm.ts` | **NEW** — TanStack Query hook | Small |
| `src/modules/friends/components/FriendGarden.tsx` | **REWRITE** — Real API, 6-slot grid, growth timer | Large |
| `src/modules/friends/screens/FriendsScreen.tsx` | Remove `as any` cast, pass correct type | Small |
| `src/modules/friends/data/friends.ts` | Can DELETE — demo data no longer needed | Small |

**Total: ~7 files, estimated effort: Medium**

---

## 4. SECURITY CONSIDERATIONS

1. **Friendship check:** Backend MUST verify `friendships.status = 'accepted'` before exposing plots. Done in `getFriendFarm()`.

2. **No write access:** The endpoint is GET-only. Friend cannot plant/water/harvest on behalf of another user. Existing farm routes already check `user.id` from session.

3. **Rate limiting:** Optional — could add rate limit to prevent scraping all users' farms. Not critical for MVP.

4. **Data exposure:** Only expose: plotId, slotIndex, plantType, plantedAt, happiness, isDead, growth. Do NOT expose: `user_id` (they already know it), `harvested_at`, `created_at`.

5. **UUID validation:** Route validates friendId is UUID format before querying DB.

---

## 5. INTERACTION FLOW (EXISTING vs NEW)

### Current Flow (Broken)
```
FriendsScreen → click friend → FriendGarden(FriendData as any)
  → Shows DEMO plant data (not real)
  → Water/Like buttons are LOCAL STATE only
  → Comments/Gifts are FAKE
```

### New Flow
```
FriendsScreen → click friend → FriendGarden(friend: FriendData)
  → useFriendFarm(friend.id) → GET /social/friend-farm/:id
  → Server: check friendship → getPlots(friendId) → return plots
  → Client: render 6-slot grid with real data
  → useGrowthTimer(plots) → client-side progress (1s interval)
  → Water button → useInteractFriend('water') → +5 OGN both (existing API)
  → Like button → useInteractFriend('like') → +5 OGN both (existing API)
  → NO Plant/Harvest/Clear buttons (view-only)
```

---

## 6. UI MOCKUP

```
┌──────────────────────────────┐
│ ← │ 👨‍🌾 CryptoFarmer          │
│   │ Lv.12 · 🟢 Online        │
├──────────────────────────────┤
│ 🪙 5,200  │ 🌾 38  │ 📅 45d  │
├──────────────────────────────┤
│ 👀 Đang thăm vườn            │
│                              │
│  ┌──────┐ ┌──────┐ ┌──────┐ │
│  │ 🍅   │ │ 🌾   │ │ 🌶️   │ │
│  │ 82%  │ │ 45%  │ │ 100% │ │
│  │ ⏳1m  │ │ ⏳2m  │ │ 🌾!  │ │
│  │ ❤️90% │ │ ❤️65% │ │ ❤️95% │ │
│  └──────┘ └──────┘ └──────┘ │
│  ┌──────┐ ┌──────┐ ┌──────┐ │
│  │ 🥕   │ │      │ │      │ │
│  │ 20%  │ │ Trống │ │ Trống │ │
│  │ ⏳3m  │ │      │ │      │ │
│  │ ❤️50% │ │      │ │      │ │
│  └──────┘ └──────┘ └──────┘ │
│                              │
├──────────────────────────────┤
│  💧 Tưới (+5)  │  ❤️ Thích   │
└──────────────────────────────┘
```

---

## 7. IMPLEMENTATION ORDER

1. **Backend:** Add `getFriendFarm()` to social.service.ts
2. **Backend:** Add route to social.ts
3. **Backend:** Test: `curl /api/game/social/friend-farm/<friend-uuid>`
4. **Frontend:** Add types + API call + hook
5. **Frontend:** Rewrite `FriendGarden.tsx`
6. **Frontend:** Fix `FriendsScreen.tsx` type cast
7. **Frontend:** Delete `friends/data/friends.ts` (demo data)
8. **Test end-to-end:** Click friend → see real farm data
