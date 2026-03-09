# FARMVERSE — Tính Năng Thăm Vườn Bạn Bè

> **Date:** 2026-02-15
> **Status:** Phase 1 deployed, Phase 2 designed
> **Commit:** feat: view friend farm (real data)

---

## 1. Tổng Quan

### Mô tả
Người chơi ấn vào bạn bè trong danh sách → xem vườn thật của bạn (6 slots, cây đang trồng, tiến độ, happiness). Có thể tưới/thích để nhận OGN.

### Flow

```
[/friends] Danh sách bạn bè (GET /social/friends)
    │
    ▼ Click bạn
[FriendGarden] useFriendFarm(friendId)
    │
    ▼ GET /social/friend-farm/:friendId
[Backend]
    ├── Check friendships table (status = 'accepted')
    ├── Get friend info (users + player_stats)
    ├── farmService.getPlots(friendId) ← reuse existing
    ├── Enrich plots with growthDurationMs
    └── Return { friend, plots, totalSlots: 6 }
    │
    ▼ Response
[FriendGarden]
    ├── useGrowthTimer(plots) → setInterval(1s) client-side
    ├── Render 6-slot grid (2x3)
    │   ├── Has plant: emoji + % + countdown + happiness
    │   ├── Empty: "Trống" (dashed border)
    │   └── Dead: greyed emoji + "Đã chết"
    ├── 💧 Tưới → POST /social/interact {type:'water'} → +5 OGN both
    ├── ❤️ Thích → POST /social/interact {type:'like'} → +5 OGN both
    └── ← Back → setVisitingFriend(null)
```

### Phase 1 vs Phase 2

| Feature | Phase 1 (Done) | Phase 2 (Designed) |
|---------|---------------|--------------------|
| Xem vườn bạn (6 slots) | Yes | - |
| Growth timer client-side | Yes | - |
| Tưới (+5 OGN cả 2) | Yes | - |
| Thích (+5 OGN cả 2) | Yes | - |
| Tặng quà (OGN, items) | - | Planned |
| Bình luận vào vườn | - | Planned |
| Tưới cây hộ bạn (+happiness) | - | Optional |

---

## 2. API Reference

### 2.1 GET /social/friend-farm/:friendId

**Description:** Xem vườn bạn bè (view-only). Trả về thông tin bạn + plots đang trồng.

**Auth:** Required (session cookie / Authorization header)

**Params:**
| Param | Type | Description |
|-------|------|-------------|
| `friendId` | UUID (path) | ID người bạn muốn xem vườn |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "friend": {
      "id": "83ac57c9-e2f5-46f5-bd21-eab39f1eddd6",
      "name": "Sin. Club",
      "picture": "https://...",
      "level": 20,
      "ogn": 1525
    },
    "plots": [
      {
        "id": "uuid-of-plot",
        "slotIndex": 0,
        "plantTypeId": "tomato",
        "plantedAt": 1739600000000,
        "happiness": 85,
        "lastWateredAt": 1739600060000,
        "isDead": false,
        "diedAt": null,
        "plantName": "Cà Chua",
        "plantEmoji": "🍅",
        "growthPercent": 65,
        "isReady": false,
        "growthDurationMs": 120000
      }
    ],
    "totalSlots": 6
  }
}
```

**Response (empty farm):**
```json
{
  "success": true,
  "data": {
    "friend": { "id": "...", "name": "...", "picture": null, "level": 1, "ogn": 500 },
    "plots": [],
    "totalSlots": 6
  }
}
```

**Error Codes:**

| Status | Code | Message | When |
|--------|------|---------|------|
| 400 | `INVALID_ID` | ID không hợp lệ | friendId not UUID format |
| 401 | `MISSING_TOKEN` | Authorization header is required | No session/token |
| 403 | `NOT_FRIENDS` | Chưa kết bạn | No accepted friendship |
| 404 | `USER_NOT_FOUND` | Không tìm thấy | friendId not in users table |
| 500 | `INTERNAL_ERROR` | Lỗi hệ thống | Server error |

**Notes:**
- Friendship check is bidirectional: checks `(userId→friendId)` OR `(friendId→userId)` with status `'accepted'`
- `growthDurationMs` is included so client can run local timer without extra API calls
- `growthPercent` is server-calculated at request time; client recalculates via `useGrowthTimer`
- Auth middleware runs before route handler, so invalid UUIDs without auth get 401 (not 400)

### 2.2 POST /social/interact (existing)

**Description:** Tương tác với bạn. Cả 2 nhận +5 OGN + 3 XP. Daily limit 10.

**Body:**
```json
{
  "friendId": "83ac57c9-...",
  "type": "water"  // 'water' | 'like' | 'gift'
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "ognGain": 5,
    "xpGain": 3,
    "friendOgnGain": 5,
    "dailyCount": 1,
    "dailyLimit": 10
  }
}
```

**Error Codes:**

| Status | Code | When |
|--------|------|------|
| 403 | `NOT_FRIENDS` | Not friends |
| 409 | `ALREADY_INTERACTED_TODAY` | Already interacted with this friend today (same type) |
| 429 | `DAILY_LIMIT` | 10 interactions/day reached |

**Config (SOCIAL_CONFIG):**
```
MAX_DAILY_INTERACTIONS: 10
OGN_PER_INTERACTION: 5
XP_PER_INTERACTION: 3
BOTH_RECEIVE_REWARD: true
MAX_FRIENDS: 100
```

### 2.3 (Phase 2) POST /social/gift

```
Body: { friendId, giftType: 'ogn'|'seed_wheat'|'fertilizer'|'water_can', value: 50, message?: 'Tặng bạn!' }
Response: { success, giftId, ognSpent, friendReceived }
Errors: NOT_FRIENDS, INSUFFICIENT_OGN, DAILY_GIFT_LIMIT
```

### 2.4 (Phase 2) POST /social/farm-comment

```
Body: { farmOwnerId, content: 'Vườn đẹp quá!' }   (max 200 chars)
Response: { comment: { id, authorName, content, createdAt } }
Errors: NOT_FRIENDS, CONTENT_TOO_LONG, DAILY_COMMENT_LIMIT
```

### 2.5 (Phase 2) GET /social/farm-comments/:farmOwnerId

```
Query: ?limit=20&offset=0
Response: { comments: [...], total }
Errors: NOT_FRIENDS
```

---

## 3. Database Schema

### 3.1 friendships (existing)

```
                           Table "public.friendships"
   Column   |           Type           | Nullable |  Default
------------+--------------------------+----------+-----------
 user_id    | uuid                     | not null |
 friend_id  | uuid                     | not null |
 status     | varchar(20)              | not null | 'pending'
 created_at | timestamptz              | not null | now()
 updated_at | timestamptz              | not null | now()

PK: (user_id, friend_id)
FK: user_id → users(id) ON DELETE CASCADE
FK: friend_id → users(id) ON DELETE CASCADE

Status values: 'pending' | 'accepted' | 'blocked'
Note: Bi-directional — both (A→B) and (B→A) rows exist when accepted
```

### 3.2 farm_plots (existing)

```
                           Table "public.farm_plots"
     Column      |    Type     | Nullable |  Default
-----------------+-------------+----------+-------------------
 id              | uuid        | not null | gen_random_uuid()
 user_id         | uuid        | not null |
 slot_index      | integer     | not null |
 plant_type_id   | varchar(20) | not null |
 planted_at      | bigint      | not null |
 happiness       | integer     | not null | 100
 last_watered_at | bigint      |          |
 is_dead         | boolean     | not null | false
 harvested_at    | timestamptz |          |
 created_at      | timestamptz | not null | now()
 updated_at      | timestamptz | not null | now()
 died_at         | timestamptz |          |

Indexes: farm_plots_user_id_idx, farm_plots_user_slot_idx
FK: plant_type_id → plant_types(id), user_id → users(id)
```

### 3.3 daily_interactions (existing)

```
                    Table "public.daily_interactions"
      Column      |    Type     | Nullable | Default
------------------+-------------+----------+---------
 user_id          | uuid        | not null |
 friend_id        | uuid        | not null |
 type             | varchar(20) | not null |
 interaction_date | date        | not null |
 created_at       | timestamptz | not null | now()

PK: (user_id, friend_id, type, interaction_date)
→ 1 interact per type per friend per day
```

### 3.4 plant_types (reference)

```
   id   |  name   | shop_price | reward_ogn | growth_duration_ms
--------+---------+------------+------------+--------------------
 wheat  | Lúa mì  |         50 |        100 |              30000
 tomato | Cà Chua |        200 |        400 |             120000
 carrot | Cà Rốt  |        280 |        560 |             150000
 chili  | Ớt      |        400 |        800 |             200000
```

### 3.5 (Phase 2) farm_gifts — Design

```sql
CREATE TABLE farm_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gift_type VARCHAR(20) NOT NULL,    -- 'ogn' | 'seed_wheat' | 'seed_tomato' | 'fertilizer' | 'water_can'
  gift_value INTEGER NOT NULL,        -- OGN amount or item quantity
  message TEXT,                       -- optional message (max 100 chars)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ                 -- NULL = unread
);

CREATE INDEX idx_farm_gifts_to_user ON farm_gifts(to_user_id, created_at DESC);

-- Gift types:
-- ogn:         Tặng OGN (10-1000)
-- seed_wheat:  Tặng hạt Lúa Mì (cost = shop_price)
-- seed_tomato: Tặng hạt Cà Chua
-- fertilizer:  Phân bón (tăng tốc 50%, cost 100 OGN)
-- water_can:   Bình tưới (reset cooldown, cost 50 OGN)
```

### 3.6 (Phase 2) farm_comments — Design

```sql
CREATE TABLE farm_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,               -- max 200 chars
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_farm_comments_owner ON farm_comments(farm_owner_id, created_at DESC);

-- Rules:
-- Only friends can comment
-- Author or farm owner can delete
-- Max 200 characters
-- Max 20 comments/day per user (across all farms)
-- Content filter: no bad words (server-side)
```

---

## 4. Frontend Components

### 4.1 FriendGarden.tsx

**Path:** `src/modules/friends/components/FriendGarden.tsx`

**Props:**
```typescript
interface FriendGardenProps {
  friend: FriendData;   // from GET /social/friends list
  onBack: () => void;   // return to friends list
}
```

**Data Flow:**
```
FriendGarden(friend)
  │
  ├── useFriendFarm(friend.id)
  │     └── GET /social/friend-farm/:friendId
  │         queryKey: ['game', 'social', 'friend-farm', friendId]
  │         staleTime: 30s, gcTime: 5min, retry: 1
  │
  ├── useGrowthTimer(plots)
  │     └── setInterval(1s) → Map<plotId, GrowthState>
  │         GrowthState = { percent, isReady, remainingMs, remainingText }
  │         Auto-stops when all ready/dead
  │
  ├── useInteractFriend() (from useSocial.ts)
  │     └── POST /social/interact
  │         onSuccess: toast + invalidate profile + friends list
  │         onError: toast with specific error message
  │
  └── Render
      ├── Header: back btn + avatar + name + level + online status
      ├── Stats: OGN | plots used/total | total harvests
      ├── Badge: "👀 Đang thăm vườn"
      ├── Grid (2x3):
      │   ├── Plot with plant: emoji + name + growth bar + countdown + happiness
      │   ├── Empty slot: "🌱 Trống" (dashed)
      │   └── Dead plant: greyed emoji + "Đã chết"
      └── Actions: 💧 Tưới (+5) | ❤️ Thích (+5)
```

**States:**
| State | UI |
|-------|-----|
| Loading | Spinner + "Đang tải vườn..." |
| Error | 😢 + error message |
| Empty farm | 6 empty "Trống" slots |
| Has plants | Mix of plant cards + empty slots |
| Interact pending | Buttons show "..." and disabled |

### 4.2 FriendsScreen.tsx

**Path:** `src/modules/friends/screens/FriendsScreen.tsx`

**Navigation:**
```typescript
const [visitingFriend, setVisitingFriend] = useState<FriendData | null>(null);

// If visiting, show FriendGarden (full screen overlay)
if (visitingFriend) {
  return <FriendGarden friend={visitingFriend} onBack={() => setVisitingFriend(null)} />;
}

// Otherwise show friends list
// Each friend row: onClick={() => setVisitingFriend(friend)}
```

No React Router route needed — state-based navigation via `visitingFriend`.

### 4.3 useFriendFarm.ts

**Path:** `src/shared/hooks/useFriendFarm.ts`

```typescript
export function useFriendFarm(friendId: string | null) {
  return useQuery({
    queryKey: ['game', 'social', 'friend-farm', friendId],
    queryFn: () => gameApi.getFriendFarm(friendId!),
    enabled: !!friendId,
    staleTime: 30_000,   // 30s — friend's farm updates occasionally
    gcTime: 5 * 60_000,  // 5min cache
    retry: 1,
  });
}
```

### 4.4 Types (game-api.types.ts)

```typescript
export interface FriendFarmPlot {
  id: string;
  slotIndex: number;
  plantTypeId: string;
  plantName: string;
  plantEmoji: string;
  plantedAt: number;          // epoch ms
  happiness: number;          // 0-100
  lastWateredAt: number | null;
  isDead: boolean;
  growthPercent: number;      // 0-100 (server-calculated)
  isReady: boolean;           // true when growthPercent >= 100
  growthDurationMs: number;   // for client-side timer
}

export interface FriendFarmData {
  friend: {
    id: string;
    name: string | null;
    picture: string | null;
    level: number;
    ogn: number;
  };
  plots: FriendFarmPlot[];
  totalSlots: number;         // always 6
}
```

---

## 5. Bảo Mật

| Check | Where | How |
|-------|-------|-----|
| **Auth required** | `authMiddleware()` in routes/index.ts | All `/game/*` routes require valid session |
| **Friendship check** | `getFriendFarm()` in social.service.ts | Query friendships with `status = 'accepted'`, bidirectional |
| **UUID validation** | Route handler | Regex `/^[0-9a-f-]{36}$/i` before DB query |
| **View-only** | Architecture | No write endpoints exposed; farm actions (plant/water/harvest) check `user.id` from session |
| **Interact limit** | `interact()` in social.service.ts | 10/day total, 1/friend/type/day via `daily_interactions` PK |
| **No data leak** | Response shape | Only expose: plots, friend name/level/ogn. Never expose: email, password, internal IDs |

**Recommendations for Phase 2:**
- Rate limit `GET /social/friend-farm` to prevent scraping (e.g., 60/min)
- Content filter on farm comments (bad words, spam)
- Gift amount validation (min 10, max 1000 OGN)
- Anti-abuse: max 5 gifts/day per sender

---

## 6. Performance

| Aspect | Implementation | Impact |
|--------|---------------|--------|
| **Growth timer** | Client-side `setInterval(1s)`, zero API calls | No server load for progress updates |
| **Auto-stop** | Timer stops when all plots ready or dead | No unnecessary re-renders |
| **Query cache** | `staleTime: 30s`, `gcTime: 5min` | Revisiting same friend = instant (within 30s) |
| **Farm plots query** | `getPlots()` uses index on `user_id` | O(1) index lookup |
| **Friendship check** | PK lookup `(user_id, friend_id)` | O(1) |
| **Plant types** | Queried once per request, 4 rows | Negligible |
| **No polling** | Data only fetched on mount, invalidated by interact | Minimal API calls |

**Scaling considerations (10,000+ users):**
- `farm_plots_user_id_idx` index handles efficient per-user queries
- `friendships` PK handles efficient friendship lookups
- Consider caching plant_types in memory (only 4 rows, rarely changes)
- Growth calculation is 100% client-side — zero server impact

---

## 7. Phase 2 — Thiết Kế Chi Tiết

### 7.1 Tặng Quà

**Gift Types:**

| Type | Name | Cost | Effect |
|------|------|------|--------|
| `ogn` | Tặng OGN | 10-1000 | Direct OGN transfer |
| `seed_wheat` | Hạt Lúa Mì | 50 | Add seed to friend's inventory |
| `seed_tomato` | Hạt Cà Chua | 200 | Add seed to friend's inventory |
| `seed_carrot` | Hạt Cà Rốt | 280 | Add seed to friend's inventory |
| `seed_chili` | Hạt Ớt | 400 | Add seed to friend's inventory |
| `fertilizer` | Phân bón | 100 | Speed up growth 50% for 1 plot |
| `water_can` | Bình tưới | 50 | Reset water cooldown for friend |

**Business Rules:**
- Max 5 gifts/day per sender (across all friends)
- Min 10 OGN per gift
- Max 1000 OGN per gift
- Friend must be `status = 'accepted'`
- Sender must have enough OGN
- Gift notification: unread badge on friend's profile

**API:**
```
POST /social/gift
Body: {
  friendId: UUID,
  giftType: 'ogn' | 'seed_wheat' | ... | 'fertilizer' | 'water_can',
  value: number,       // OGN amount for 'ogn', quantity for items
  message?: string     // max 100 chars
}
Response: {
  giftId: UUID,
  ognSpent: number,
  friendReceived: { type, value, message }
}
```

**UI Mockup:**
```
┌──────────────────────────────┐
│ 🎁 Tặng quà cho Sin. Club   │
├──────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ │
│ │  💰  │ │  🌾  │ │  🍅  │ │
│ │ OGN  │ │ Lúa  │ │ Cà   │ │
│ │ 10+  │ │ 50   │ │ 200  │ │
│ └──────┘ └──────┘ └──────┘ │
│ ┌──────┐ ┌──────┐ ┌──────┐ │
│ │  🧪  │ │  💧  │ │  🌶️  │ │
│ │ Phân │ │ Tưới │ │ Ớt   │ │
│ │ 100  │ │  50  │ │ 400  │ │
│ └──────┘ └──────┘ └──────┘ │
│                              │
│ [Lời nhắn...]      [Tặng]  │
│ Số dư: 🪙 1,525 OGN         │
└──────────────────────────────┘
```

### 7.2 Bình Luận

**Business Rules:**
- Only friends can comment
- Max 200 characters per comment
- Max 20 comments/day per author
- Author or farm owner can delete
- Server-side content filter (bad words list)
- Show latest 20 comments, load more on scroll

**API:**
```
POST /social/farm-comment
Body: { farmOwnerId: UUID, content: string }
Response: { comment: { id, authorId, authorName, authorPicture, content, createdAt } }

GET /social/farm-comments/:farmOwnerId?limit=20&offset=0
Response: { comments: [...], total: number }

DELETE /social/farm-comment/:commentId
Response: { deleted: true }
```

**UI Mockup:**
```
┌──────────────────────────────┐
│ 💬 Bình luận (3)      [✕]   │
├──────────────────────────────┤
│ 👤 CryptoFarmer · 2h trước  │
│    Vườn đẹp quá bạn ơi! 🌾  │
│                              │
│ 👤 FarmKing · 5h trước       │
│    Cà Chua sắp chín nè 🍅   │
│                              │
│ 👤 Bạn · Vừa xong           │
│    Chúc mùa vụ tốt lành!    │
├──────────────────────────────┤
│ [Viết bình luận...]   [📩]  │
└──────────────────────────────┘
```

### 7.3 Tưới Cây Hộ Bạn (Optional)

**Concept:** Tưới trực tiếp lên cây bạn, tăng happiness cho bạn (khác với interact water +OGN).

**Rules:**
- Max 3 lần/ngày/bạn
- +10 happiness cho cây được tưới
- +2 OGN cho người tưới (phần thưởng nhỏ)
- Cần endpoint mới: `POST /social/water-friend-plot`
- Body: `{ friendId, plotId }`
- Check: friendship + plot belongs to friend + plot not dead

**Decision:** Optional — phức tạp hơn vì cần chọn cây cụ thể. Consider for Phase 3.

---

## 8. File Locations

### Backend (VPS: `/home/cdhc/apps/cdhc-be/`)

| File | Description |
|------|-------------|
| `src/modules/game/routes/social.ts` | Social routes: friends, interact, add-friend, **friend-farm** |
| `src/modules/game/services/social.service.ts` | Social service: getFriends, interact, addFriend, **getFriendFarm**, processCommission |
| `src/modules/game/services/farm.service.ts` | Farm service: **getPlots(userId)** (reused), plantSeed, waterPlot, harvestPlot |
| `src/modules/game/schema/friendships.ts` | Drizzle schema: friendships table |
| `src/modules/game/schema/farm-plots.ts` | Drizzle schema: farm_plots table |
| `src/modules/game/schema/daily-interactions.ts` | Drizzle schema: daily_interactions table |
| `src/modules/game/routes/index.ts` | Route registration: `game.route('/social', socialRoutes)` |

### Frontend (Local: `cdhc-game-vite/`)

| File | Description |
|------|-------------|
| `src/modules/friends/components/FriendGarden.tsx` | **Main component** — 6-slot grid, growth timer, water/like |
| `src/modules/friends/screens/FriendsScreen.tsx` | Friends list + navigation to FriendGarden |
| `src/modules/friends/components/FriendsList.tsx` | Friends list modal (used in FarmingScreen) |
| `src/shared/hooks/useFriendFarm.ts` | TanStack Query hook for friend farm data |
| `src/shared/hooks/useGrowthTimer.ts` | Client-side growth timer (setInterval 1s) |
| `src/shared/hooks/useSocial.ts` | useFriends, useInteractFriend, useAddFriend hooks |
| `src/shared/api/game-api.ts` | API calls: getFriendFarm, interactFriend |
| `src/shared/types/game-api.types.ts` | Types: FriendFarmPlot, FriendFarmData, FriendData |
| `src/modules/friends/data/friends.ts` | **UNUSED** — old demo data (can delete) |

---

## 9. Test Results

### API Tests (2026-02-15)

| # | Test Case | Method | Expected | Result |
|---|-----------|--------|----------|--------|
| 1 | No auth | GET /social/friend-farm/:id | 401 MISSING_TOKEN | PASS |
| 2 | Invalid UUID (no auth) | GET /social/friend-farm/not-a-uuid | 401 (auth first) | PASS |
| 3 | Backend tsc | `bunx tsc --noEmit` | 0 errors | PASS |
| 4 | Frontend tsc | `npx tsc --noEmit` | 0 errors | PASS |
| 5 | PM2 restart | `pm2 restart cdhc-api` | online | PASS |

**Note:** Happy-path tests (with auth) require browser session. The following are verified by code review:
- Friendship check: bidirectional `or()` query with `status = 'accepted'`
- Empty farm: returns `plots: []`, `totalSlots: 6`
- getPlots reuse: `farmService.getPlots(friendId)` is identical to own-farm query
- growthDurationMs enrichment: maps each plot's plantTypeId to plant_types table

### Current Data

```
Users: 5 (Gin Orange, Msci Backend, Nguyễn Đức Thuận, Sin. Club, tuyen huan)
Friendships: 1 pair (Msci Backend ↔ Sin. Club, status: accepted)
Farm plots: 0 (all users have empty farms currently)
```

---

## 10. Checklist Bảo Trì

### Thêm interaction type mới
1. Backend: Add to `interactSchema` z.enum in `social.ts`
2. Backend: Handle in `social.service.ts` `interact()` if needed
3. Frontend: Add button in `FriendGarden.tsx`
4. Frontend: Update `useInteractFriend` mutation type

### Thêm gift type mới (Phase 2)
1. Add to `gift_type` enum in farm_gifts table
2. Add pricing/logic in social.service.ts
3. Add UI card in gift picker modal

### Sửa giới hạn interact/ngày
1. Edit `SOCIAL_CONFIG.MAX_DAILY_INTERACTIONS` in `social.service.ts`
2. No frontend changes needed (limit comes from API response)

### Thêm slot vườn (> 6)
1. Backend: Change `totalSlots` return value in `getFriendFarm()`
2. Backend: Change `MAX_SLOTS` in `farm.service.ts`
3. Frontend: Grid auto-adapts (uses `totalSlots` from response)

### Deploy changes
```bash
# Backend
cd /home/cdhc/apps/cdhc-be
git pull
bunx tsc --noEmit
pm2 restart cdhc-api

# Frontend
cd /path/to/cdhc-game-vite
npx tsc --noEmit
npm run build   # or bun run build
# Deploy dist/ to hosting
```
