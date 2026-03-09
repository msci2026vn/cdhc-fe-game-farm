# PRAYER SYSTEM — SCAN CHI TIET LAN 2
**Ngay: 2026-03-06 | Chi doc, KHONG sua code**

---

## PHAN 1: BACKEND CHI TIET

### 1A. Prayer Routes — routes.ts (~180 lines)

**Mount point:** `app.route('/api/prayer', prayerRoutes)` (index.ts:166)

**Middleware stack** (ap dung cho tat ca routes):
```typescript
prayer.use('/*', authMiddleware());      // JWT cookie auth
prayer.use('/*', approvedMiddleware());  // User approved in community
prayer.use('/*', ensurePlayerStats);     // Auto-create player_stats row
```

**7 Endpoints chi tiet:**

| # | Method | Path | Zod Schema | Handler | Error Codes |
|---|--------|------|------------|---------|-------------|
| 1 | POST | /offer | `offerPrayerSchema` | `prayerService.offerPrayer(userId, type, text, presetId)` | PRAYER_COOLDOWN (429), PRAYER_DAILY_LIMIT (429), PRAYER_MODERATION_FAILED (400), PRESET_NOT_FOUND (404), INTERNAL_ERROR (500) |
| 2 | GET | /status | none | `prayerService.getStatus(userId)` | INTERNAL_ERROR (500) |
| 3 | GET | /presets | `getPresetsSchema` | `prayerService.getPresets(limit, category)` | INTERNAL_ERROR (500) |
| 4 | GET | /history | `getHistorySchema` | `prayerService.getHistory(userId, page, limit)` | INTERNAL_ERROR (500) |
| 5 | GET | /leaderboard | `getLeaderboardSchema` | `prayerService.getLeaderboard(limit)` | INTERNAL_ERROR (500) |
| 6 | GET | /global | none | `prayerService.getGlobalStats()` | INTERNAL_ERROR (500) |
| 7 | GET | /categories | none | `prayerService.getCategoryStats()` | INTERNAL_ERROR (500) |

**Response format:** Tat ca tra ve `{ success: boolean, data: T }` hoac `{ success: false, error: { code, message, ...extras } }`

---

### 1B. Prayer Service — service.ts (~400 lines)

**Class:** `PrayerService` (singleton export: `prayerService`)

**Dependencies:**
```typescript
import { createHash } from 'node:crypto';
import { db } from '@/db/connection';
import { redis } from '@/db/redis';
import { users } from '@/db/schema/users';
import { rewardService } from '@/modules/game/services/reward.service';
import { moderatePrayerText } from './moderation';
import { rollPrayerReward } from './rewards';
import { prayerBatches, prayerPresets, prayerStats, prayers } from './schema';
```

**Functions chi tiet:**

#### `offerPrayer(userId, prayerType, text, presetId?) → PrayerOfferResponse`
10-step flow:
1. **Check cooldown** — Redis `prayer:cd:{userId}`, TTL > 0 → throw PRAYER_COOLDOWN
2. **Check daily limit** — Redis `prayer:daily:{free|custom}:{userId}:{YYYY-MM-DD}`, compare vs MAX_DAILY
3. **Moderate custom text** — `moderatePrayerText(text)` → {passed, sanitizedText, reason}
4. **Verify preset** (if type=preset) — DB lookup prayerPresets, increment usage_count (fire-and-forget)
5. **Hash prayer** — `SHA256("${userId}:${finalText}:${Date.now()}")` → "0x" prefixed hex
6. **Roll reward** — `rollPrayerReward(prayerType)` → {ognAmount, xpAmount, multiplier, tierIndex}
7. **Save to DB** — Insert prayers row, returning id
8. **Grant rewards** — `rewardService.addOGN()` + `rewardService.addXP()` (catch errors, non-fatal)
9. **Update Redis** — INCR daily counter, EXPIRE 86400s, SETEX cooldown 30s, INCR global count
10. **Update prayer_stats** — Upsert user stats (total, streak, rewards earned)

Return: `{ prayerId, ognReward, xpReward, multiplier, prayerHash, globalCount, milestone? }`

#### `getStatus(userId) → PrayerStatusResponse`
- Parallel Redis reads: freeUsed, customUsed, cooldownTTL, globalCount
- DB read: prayer_stats for user
- Return: `{ freeUsed, freeMax, customUsed, customMax, cooldownRemaining, canPray, currentStreak, totalPrayers, globalCount }`

#### `getPresets(limit=20, category?) → PresetPrayer[]`
- DB: `SELECT id, text, category FROM prayer_presets WHERE is_active=true [AND category=?] ORDER BY RANDOM() LIMIT ?`
- Return: `[{ id, text, category }]`

#### `getHistory(userId, page=1, limit=20) → PrayerHistoryItem[]`
- **Pagination: offset-based** — `offset = (page - 1) * limit`
- **Sort: `created_at DESC`**
- **Filter: by userId only** (no date range, no type filter)
- **Join: prayer_batches** — collects batchIds from results, batch query for status/txHash
- Return: `[{ id, text, type, category, ognReward, xpReward, multiplier, prayerHash, batchStatus, txHash, createdAt }]`

#### `getLeaderboard(limit=20) → PrayerLeaderboardEntry[]`
- **Rank by: total_prayers DESC** (all-time)
- **Join: users** for userName
- **No time range filter** — always all-time
- Return: `[{ userId, userName, totalPrayers, currentStreak, rank }]`

#### `getGlobalStats() → PrayerGlobalResponse`
- Redis: prayer:global:count (fallback to DB COUNT)
- DB: 3 subqueries in single `db.execute()`:
  - `COUNT(DISTINCT user_id) FROM prayers` — totalUsers
  - `COUNT(*) FROM prayer_batches` — totalBatches (always 0)
  - `COUNT(*) FROM prayers WHERE created_at >= CURRENT_DATE` — todayPrayers
- Computed: nextMilestone from PRAYER_MILESTONES array
- Return: `{ totalPrayers, totalUsers, totalBatches, todayPrayers, nextMilestone }`

#### `getCategoryStats() → { category, count, label }[]`
- DB: `SELECT category, COUNT(*) FROM prayer_presets WHERE is_active GROUP BY category`
- Hardcoded label map: peace→Hoa binh, nature→Thien nhien, etc.

#### Private helpers:
- `hashPrayer(userId, text, timestamp)` — `"0x" + SHA256("${userId}:${text}:${timestamp}")`
- `getGlobalCount()` — Redis GET, fallback DB COUNT + sync back
- `getUserStats(userId)` — DB SELECT FROM prayer_stats
- `updateStats(userId, prayerType, ognEarned, xpEarned)` — Upsert with streak calculation

**Streak logic:**
- Same day → no change
- Yesterday → streak + 1
- Older → reset to 1
- Uses `new Date().toISOString().split('T')[0]` → **UTC date, NOT Vietnam time**

---

### 1C. Validation Schemas — schemas.ts

```typescript
// POST /api/prayer/offer
offerPrayerSchema = z.object({
  type: z.enum(['preset', 'custom']),
  text: z.string().min(10).max(500).optional(),
  presetId: z.string().uuid().optional(),
}).refine(data => {
  if (data.type === 'custom') return !!data.text && data.text.length >= 10;
  if (data.type === 'preset') return !!data.presetId;
  return false;
});

// GET /api/prayer/presets
getPresetsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  category: z.enum(PRAYER_CATEGORIES).optional(),
});

// GET /api/prayer/history
getHistorySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// GET /api/prayer/leaderboard
getLeaderboardSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
```

---

### 1D. Types & Constants — types.ts

```typescript
// Categories
const PRAYER_CATEGORIES = ['peace','nature','harvest','health','family','community','earth','spiritual'];
type PrayerCategory = 'peace'|'nature'|'harvest'|'health'|'family'|'community'|'earth'|'spiritual';

// Types
type PrayerType = 'preset' | 'custom';
type ModerationStatus = 'approved' | 'pending' | 'rejected';
type BatchStatus = 'pending' | 'submitted' | 'confirmed' | 'failed';

// Limits
PRAYER_LIMITS = {
  MAX_DAILY_FREE: 5,
  MAX_DAILY_CUSTOM: 3,
  COOLDOWN_SECONDS: 30,
  MIN_TEXT_LENGTH: 10,
  MAX_TEXT_LENGTH: 500,
  BATCH_SIZE: 50,          // NOT IMPLEMENTED
  BATCH_INTERVAL_MINUTES: 10,  // NOT IMPLEMENTED
};

// Reward table
PRAYER_REWARD_TABLE = [
  { weight: 40, ognAmount: 5,  xpAmount: 0 },    // 40%
  { weight: 25, ognAmount: 10, xpAmount: 0 },    // 25%
  { weight: 15, ognAmount: 25, xpAmount: 0 },    // 15%
  { weight: 10, ognAmount: 50, xpAmount: 0 },    // 10%
  { weight: 5,  ognAmount: 0,  xpAmount: 100 },  // 5%
  { weight: 3,  ognAmount: 0,  xpAmount: 500 },  // 3%
  { weight: 2,  ognAmount: 10, xpAmount: 200 },  // 2%
];
CUSTOM_PRAYER_MULTIPLIER = 2;

// Redis keys
PRAYER_REDIS_KEYS = {
  DAILY_FREE: 'prayer:daily:free:',
  DAILY_CUSTOM: 'prayer:daily:custom:',
  COOLDOWN: 'prayer:cd:',
  GLOBAL_COUNT: 'prayer:global:count',
};

// Milestones
PRAYER_MILESTONES = [100, 500, 1000, 5000, 10000];

// Streak bonus (defined but NOT USED in code)
STREAK_BONUS = {
  DAYS_7: { bonusPrayers: 1 },
  DAYS_30: { bonusPrayers: 2 },
};
```

---

### 1E. Moderation — moderation.ts

```
Tang 1 — Blacklist Exact (30 tu): du, dit, deo, di, lon, buoi, cac, dai, dm, dcm, vl, vcl, vkl, clgt, dmm, ngu, stfu, wtf, lmao, fuck, shit, bitch, asshole, dick, pussy, damn, bastard, whore, slut, cunt

Tang 2 — Blacklist Phrases (18): oc cho, thang cho, con cho, do cho, me may, bo may, chet me, chet cha, casino, betting, slot machine, poker, crypto scam, ponzi, pyramid scheme, onlyfans, porn, xxx

Tang 3 — Suspicious Patterns (9):
- URL (https?://, www.)
- Phone number (9+ digits)
- Repeated chars (5+)
- Excessive caps (10+ consecutive)
- HTML tags
- Game manipulation (admin|hack|cheat|exploit)
- Excessive emojis (5+)
- Repeated phrase (3+ repetitions)

Text normalization: lowercase → NFD → strip diacritics → replace d/D → trim
HTML sanitization: stripHtml() from sanitize.service
```

---

### 1F. Rewards — rewards.ts

```typescript
function rollPrayerReward(prayerType: PrayerType): PrayerReward {
  // Weighted random from PRAYER_REWARD_TABLE (totalWeight = 100)
  // Custom prayers get CUSTOM_PRAYER_MULTIPLIER (2x) on both OGN and XP
  return { ognAmount, xpAmount, multiplier, tierIndex };
}
```

---

### 1G. Database Schema (SQL verified)

**prayers** — 13 columns, 6 indexes, 1 FK
```sql
id                  uuid        NOT NULL  DEFAULT gen_random_uuid()  -- PK
user_id             uuid        NOT NULL                             -- FK → users.id
text                text        NOT NULL
type                varchar(20) NOT NULL                             -- 'preset' | 'custom'
preset_id           varchar(50) YES
category            varchar(50) YES
moderation_status   varchar(20) NOT NULL  DEFAULT 'approved'
prayer_hash         varchar(66) YES                                  -- "0x" + SHA256 hex
batch_id            uuid        YES                                  -- FK → prayer_batches (unused)
ogn_reward          integer     NOT NULL  DEFAULT 0
xp_reward           integer     NOT NULL  DEFAULT 0
reward_multiplier   integer     NOT NULL  DEFAULT 1
created_at          timestamptz NOT NULL  DEFAULT now()

INDEXES:
  prayers_pkey             UNIQUE (id)
  prayers_user_id_idx      (user_id)
  prayers_batch_id_idx     (batch_id)
  prayers_created_at_idx   (created_at)
  prayers_user_created_idx (user_id, created_at)
  prayers_type_idx         (type)

FK: prayers.user_id → users.id (ON DELETE CASCADE)
-- NOTE: batch_id has NO foreign key constraint to prayer_batches
```

**prayer_batches** — 10 columns, 3 indexes, 0 FK, 0 ROWS
```sql
id            uuid        NOT NULL  DEFAULT gen_random_uuid()  -- PK
merkle_root   varchar(66) NOT NULL
prayer_count  integer     NOT NULL
tx_hash       varchar(66) YES
block_number  integer     YES
chain_id      integer     YES
status        varchar(20) NOT NULL  DEFAULT 'pending'
batched_at    timestamptz NOT NULL  DEFAULT now()
submitted_at  timestamptz YES
confirmed_at  timestamptz YES

INDEXES:
  prayer_batches_pkey            UNIQUE (id)
  prayer_batches_status_idx      (status)
  prayer_batches_batched_at_idx  (batched_at)
```

**prayer_presets** — 9 columns, 4 indexes, 0 FK
```sql
id          uuid        NOT NULL  DEFAULT gen_random_uuid()  -- PK
text        text        NOT NULL
category    varchar(50) NOT NULL
is_active   boolean     NOT NULL  DEFAULT true
sort_order  integer     NOT NULL  DEFAULT 0
usage_count integer     NOT NULL  DEFAULT 0
created_by  varchar(50) YES       DEFAULT 'system'
created_at  timestamptz NOT NULL  DEFAULT now()
updated_at  timestamptz NOT NULL  DEFAULT now()

INDEXES:
  prayer_presets_pkey             UNIQUE (id)
  prayer_presets_category_idx     (category)
  prayer_presets_is_active_idx    (is_active)
  prayer_presets_usage_count_idx  (usage_count)
```

**prayer_stats** — 10 columns, 3 indexes, 1 FK
```sql
user_id          uuid        NOT NULL  -- PK + FK → users.id
total_prayers    integer     NOT NULL  DEFAULT 0
total_custom     integer     NOT NULL  DEFAULT 0
total_preset     integer     NOT NULL  DEFAULT 0
current_streak   integer     NOT NULL  DEFAULT 0
longest_streak   integer     NOT NULL  DEFAULT 0
last_prayer_date varchar(10) YES                     -- "2026-03-04"
total_ogn_earned integer     NOT NULL  DEFAULT 0
total_xp_earned  integer     NOT NULL  DEFAULT 0
updated_at       timestamptz NOT NULL  DEFAULT now()

INDEXES:
  prayer_stats_pkey       UNIQUE (user_id)
  prayer_stats_total_idx  (total_prayers)
  prayer_stats_streak_idx (longest_streak)

FK: prayer_stats.user_id → users.id (ON DELETE CASCADE)
```

---

### 1H. Database Live Stats

```
TOTAL PRAYERS:     126
  - Preset:        95  (75.4%)
  - Custom:        31  (24.6%)

FIRST PRAYER:      2026-02-21T03:16:48Z
LAST PRAYER:       2026-03-04T10:56:51Z
ACTIVE PERIOD:     ~12 days

UNIQUE USERS:      10
TOP USERS:
  #1  user 36f2...  31 prayers  (3 custom, 28 preset)  streak=4  earned=335 OGN + 1100 XP
  #2  user 7d0f...  30 prayers  (24 custom, 6 preset)  streak=1  earned=530 OGN + 1600 XP
  #3  user 003b...  19 prayers  (0 custom, 19 preset)  streak=1  earned=185 OGN
  #4  user 71d0...  16 prayers  (0 custom, 16 preset)  streak=7  earned=230 OGN + 100 XP

PRESET CATEGORIES (each 15 presets, total 120):
  peace, nature, harvest, health, family, community, earth, spiritual

DAILY VOLUME (last 7 days):
  2026-03-04: 3
  2026-03-03: 12
  2026-03-02: 8
  2026-03-01: 16
  2026-02-28: 11
  2026-02-27: 12

PRAYER BATCHES: 0 rows (table empty)
```

---

### 1I. Redis Keys (Live)

```
KEY: prayer:global:count
TYPE: string
TTL: -1 (persistent, no expiry)
VALUE: "126"

NOTE: No daily/cooldown keys found — all have expired (TTL 86400s / 30s).
      This is expected since last prayer was 2026-03-04.
```

---

### 1J. Blockchain Infrastructure — Reusable Code

#### Merkle Tree (sensor-blockchain.service.ts)
```typescript
// EXACT reusable function:
function sha256(data: string): string {
  return `0x${createHash('sha256').update(data).digest('hex')}`;
}

function buildMerkleTree(hashes: string[]): { root: string; layers: string[][] } {
  // Sort-based pairing (smaller hash first for deterministic root)
  // Odd leaf gets promoted unpaired
  // Returns { root, layers }
}
```

#### Blockchain Config (blockchain.config.ts)
```typescript
BLOCKCHAIN_CONFIG = {
  chain: avalanche | avalancheFuji,
  chainId: MERKLE_CHAIN_ID env,
  rpcUrl: MERKLE_RPC_URL env,
  contractAddress: MERKLE_CONTRACT_ADDRESS env,
  deployerPrivateKey: DEPLOYER_PRIVATE_KEY env,
  explorerUrl: 'https://snowtrace.io' | 'https://testnet.snowtrace.io',
  abi: [
    storeRoot(root: bytes32, count: uint256),     // Store single Merkle root
    storeBatch(roots: bytes32[], counts: uint256[]), // Store multiple roots
    isRootStored(root: bytes32) → bool,           // Verify root exists
    getStats() → (rootCount, totalPrayers),       // Global stats
  ],
};

ENV VARS CONFIRMED PRESENT:
  DEPLOYER_PRIVATE_KEY=***
  MERKLE_CONTRACT_ADDRESS=***
  MERKLE_CHAIN_ID=***
  MERKLE_RPC_URL=***
  NFT_CONTRACT_ADDRESS=***
```

#### batchAndSubmit Pattern (sensor-blockchain.service.ts)
```
Flow: Query unbatched → Build hashes → Merkle tree → Check balance →
      Create pending log → Send TX → Wait receipt → Update status → Mark items as batched
```
**Reuse for prayer: ~80% — same pattern, different data source**

#### NFT Mint Pipeline (nft-orchestrator.service.ts)
```
Flow: Event trigger → Fetch user wallets (custodial preferred) →
      Generate image → Upload to R2 → Build metadata → Upload to IPFS →
      Mint via safeMint(toAddress, metadataUri) → Store tokenId in DB

Reuse for prayer NFT: ~60% — need different trigger (weekly winner vs boss defeat)
```

#### NFT Contract ABI (nft-card-abi.ts)
```typescript
NFT_CARD_ABI = [
  safeMint(to: address, uri: string),  // Mint new NFT
  tokenURI(tokenId) → string,          // Get metadata URI
  balanceOf(owner) → uint256,          // Count NFTs
  ownerOf(tokenId) → address,          // Get owner
  totalSupply() → uint256,             // Total minted
  transferFrom(from, to, tokenId),     // Transfer
  // + approve, setApprovalForAll, getApproved, Transfer event
];

NFT_CONTRACT_CONFIG = {
  chainId: 43114,
  rpcUrl: process.env.AVAX_RPC_URL,
  contractAddress: process.env.NFT_CONTRACT_ADDRESS,
  gasLimit: 300_000n,
  maxRetries: 3,
  retryDelayMs: 2000,
};
```

#### Custodial Wallet Service
```
Key functions:
- createWalletForUser(userId) → address
- getWalletStatus(userId) → WalletInfo
- sendTransaction(userId, to, value) → SendResult
- transferNft(userId, tokenId, toAddress) → txHash
- getNftOwner(tokenId) → address
- setPin / verifyPinWithRateLimit / changePin
```

#### Cron System (index.ts:213-230)
```
Existing crons (pattern to follow):
- startWeatherCron()
- startWitherCron()
- startLeaderboardWarmCron()
- startMarketCron()
- startConversionCron()
- startMockSensorCron()
- startVipCron()
- startDeliveryCron()
- startWorldBossCrons()
- startBattleSyncCron()
- startEmailChangeCron()
- startPricingCron()

=> Prayer batch cron would follow same pattern: export startPrayerBatchCron(), import in index.ts
```

---

## PHAN 2: FRONTEND CHI TIET

### 2A. Routing & Entry Point

```typescript
// App.tsx:52 — lazy load
const PrayerScreen = lazyWithRetry(() => import('@/modules/prayer/screens/PrayerScreen'));

// App.tsx:131 — route
<Route path="/prayer" element={<PrayerScreen />} />

// FarmToolbelt.tsx:15 — entry button
<button onClick={() => navigate('/prayer')}>
  <div className="w-10 h-10 rounded-2xl bg-gradient-to-b from-[#B39DDB] to-[#7E57C2]">
    <span className="text-xl">emoji_pray</span>
  </div>
</button>
```

No auth guard on route — BE enforces auth via middleware.

---

### 2B. API Client — client.ts

```typescript
// gameClient wraps fetch with cookie auth + { success, data } parsing
export const gameClient = {
  get: async <T>(path: string): Promise<T> => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      credentials: 'include',  // Cookie auth
      headers: { 'Accept': 'application/json' },
    });
    // 401 → throw (handled by game-api.ts handleUnauthorized)
    // !res.ok → throw error.message
    // Parse { success, data } → return data
  },
  post: async <T>(path: string, data?: unknown): Promise<T> => {
    // Same pattern with Content-Type: application/json + JSON.stringify body
  },
};
```

**IMPORTANT: NO dedicated api-prayer.ts file.** Hooks call `gameClient.post/get` directly.

---

### 2C. Types — prayer.types.ts (EXACT COPY)

```typescript
export interface PrayerStatusResponse {
  freeUsed: number;
  freeMax: number;
  customUsed: number;
  customMax: number;
  cooldownRemaining: number;
  canPray: boolean;
  currentStreak: number;
  totalPrayers: number;
  globalCount: number;
}

export interface PrayerOfferResponse {
  prayerId: string;
  ognReward: number;
  xpReward: number;
  multiplier: number;
  prayerHash: string;
  globalCount: number;
  milestone?: number;
}

export interface PrayerPreset {
  id: string;
  text: string;
  category: string;
}

export interface PrayerHistoryItem {
  id: string;
  text: string;
  type: 'preset' | 'custom';
  category: string | null;
  ognReward: number;
  xpReward: number;
  multiplier: number;
  prayerHash: string | null;
  batchStatus: string | null;   // ← EXISTS but NEVER rendered in UI
  txHash: string | null;         // ← EXISTS but NEVER rendered in UI
  createdAt: string;
}

export interface PrayerLeaderboardEntry {
  userId: string;
  userName: string;
  picture?: string | null;
  avatarUrl?: string | null;
  gmailAvatar?: string | null;
  gmailName?: string | null;
  totalPrayers: number;
  currentStreak: number;
  rank: number;
}

export interface PrayerGlobalResponse {
  totalPrayers: number;
  totalUsers: number;
  totalBatches: number;
  todayPrayers: number;
  nextMilestone: number;
}

export interface PrayerCategoryInfo {
  category: string;
  count: number;
  label: string;
}

export interface PrayerOfferPayload {
  type: 'preset' | 'custom';
  text?: string;
  presetId?: string;
}
```

**MISSING types for new features:**
- No `PrayerVote` type
- No `WeeklyWinner` type
- No `PrayerNft` type
- No `WorldRecordProgress` type

---

### 2D. Hooks (EXACT)

```typescript
// usePrayerStatus.ts
export const PRAYER_STATUS_KEY = ['game', 'prayer', 'status'];
useQuery<PrayerStatusResponse>({
  queryKey: PRAYER_STATUS_KEY,
  queryFn: () => gameClient.get('/api/prayer/status'),
  staleTime: 10_000,
  retry: 2,
  refetchOnWindowFocus: true,
});

// usePrayerPresets.ts
useQuery<PrayerPreset[]>({
  queryKey: ['game', 'prayer', 'presets', category || 'all'],
  queryFn: () => gameClient.get(`/api/prayer/presets?${params}`),
  staleTime: 60_000,
  retry: 2,
});

// usePrayerHistory.ts
useQuery<PrayerHistoryItem[]>({
  queryKey: ['game', 'prayer', 'history', page],
  queryFn: () => gameClient.get(`/api/prayer/history?page=${page}&limit=20`),
  staleTime: 30_000,
  retry: 2,
});

// usePrayerLeaderboard.ts
useQuery<PrayerLeaderboardEntry[]>({
  queryKey: ['game', 'prayer', 'leaderboard'],
  queryFn: () => gameClient.get(`/api/prayer/leaderboard?limit=${limit}`),
  staleTime: 60_000,
  retry: 2,
});

// usePrayerGlobal.ts
useQuery<PrayerGlobalResponse>({
  queryKey: ['game', 'prayer', 'global'],
  queryFn: () => gameClient.get('/api/prayer/global'),
  staleTime: 30_000,
  retry: 2,
});

// usePrayerOffer.ts
useMutation<PrayerOfferResponse, Error, PrayerOfferPayload>({
  mutationFn: (data) => gameClient.post('/api/prayer/offer', data),
  onSuccess: (data) => {
    // Toast: "+{ogn} OGN, +{xp} XP"
    // FlyUp: "+{ogn} OGN emoji_coin"
    // Invalidate: status, profile, history, leaderboard, global
  },
  onError: (error) => { toast error.message },
});
```

---

### 2E. Component Details

#### PrayerScreen.tsx (367 lines) — Main
- **State:** selectedPresetId, customText, rewardData, bottomTab('pray'|'history'), 5 modal booleans, showSparkles, flyText, lastCustomSuccess
- **Audio:** preloadScene('prayer') + startBgm('prayer') on mount, stopBgm on unmount
- **3 action handlers:** handleSelectPreset, handleCustomSubmit, handleQuickPray — all call offerMutation.mutate()
- **Layout:** h-[100dvh], max-w-[430px], flex col, overflow-hidden
- **Tabs:** Cau Nguyen (main), BXH (opens LeaderboardModal), Lich Su (opens HistoryModal)

#### PrayerPresetModal.tsx (132 lines)
- **Trigger:** "Chon Loi Chuc" button
- **Content:** Category filter tabs (8 categories + all), scrollable card list
- **Each card:** icon, title, text, category label, "Cau nguyen" button
- **Action:** onSelect(presetId, text) → triggers offerMutation in parent

#### PrayerCustomModal.tsx (163 lines)
- **Trigger:** "Viet Loi Chuc" button
- **Content:** Textarea with char counter (min 10, max 500), daily limit display ({used}/{max})
- **Cooldown:** Local countdown timer synced from server cooldownRemaining (+2s buffer)
- **Submit:** disabled if < 10 chars || isPending || limitUsed >= limitMax || inCooldown
- **Clear text:** only on successful submission (lastSubmitSuccess flag)

#### PrayerHistoryModal.tsx (140 lines)
- **Trigger:** "Lich Su" tab
- **Style:** Diary/journal aesthetic with paper texture, spiral binding visual
- **Content:** Paginated list (page 1 only — no pagination controls!), date + title + text + reward stamp
- **Action:** "Viet Loi Cau Nguyen Moi" button → opens CustomModal
- **NOTE:** Does NOT show prayerHash, batchStatus, or txHash

#### PrayerLeaderboardModal.tsx (380 lines)
- **Trigger:** "BXH" tab
- **Style:** Podium for top 3 (gold/silver/bronze), list for 4+
- **Tabs:** Tuan / Thang / Mua — but **Thang and Mua are disabled (cursor-not-allowed)**
- **Highlight:** Current user's rank with green badge "Ban"
- **Avatar:** Custom Avatar component with fallback initials

#### PrayerReward.tsx (61 lines)
- Auto-dismiss popup (2.5s normal, 3.5s with milestone)
- Shows OGN/XP amount, multiplier badge (x2 for custom), milestone badge

#### FloatingPrayers.tsx (125 lines)
- 30 hardcoded Vietnamese demo prayer texts
- Spawns bubbles every 3-7s (max 4 concurrent)
- Each bubble: random avatar (pravatar.cc), random position, 7-12s float-up animation
- User's prayer also added when flyText changes

#### PrayerSparkles.tsx (65 lines)
- 8-13 emoji sparkles (star_sparkles, star, star_dizzy, star, pray) at random positions
- 2s duration, CSS animation prayer-ascend

#### PrayerTextFly.tsx (35 lines)
- Prayer text in quotes, 1.5s fly-up with fade

---

### 2F. Audio Assets (verified on disk)

```
public/audio/sfx/prayer/prayer-submit.mp3    — SFX on prayer send
public/audio/sfx/prayer/prayer-reward.mp3    — SFX on reward display
public/audio/sfx/prayer/prayer-sparkle.mp3   — SFX on sparkle VFX
public/audio/bgm/prayer.mp3                  — BGM (Celestial_Sanctuary.mp3 aliased)

SoundRegistry entries:
  prayer_submit:  volume 0.35, category 'sfx'
  prayer_reward:  volume 0.40, category 'sfx'
  prayer_sparkle: volume 0.15, category 'sfx'
  prayer BGM:     volume 0.12, loop true
```

---

### 2G. CSS — prayer.css (81 lines)

```css
/* @layer utilities */
.halo-spin        — 20s linear infinite rotation
.float-gentle     — 4s ease-in-out translateY(-10px) bounce
.prayer-float-up  — 8s linear floatUp (translateY 40px → -850px with opacity fade)
.prayer-float-up-delayed — same with 4s delay

@keyframes floatUp — 5-stage animation: appear → rise → sway → fade → disappear
```

---

## PHAN 3: FILE MAP DAY DU

```
BACKEND (VPS: /home/cdhc/apps/cdhc-be/src/modules/prayer/):
├── index.ts                    (1 line)   — Re-export prayerRoutes
├── routes.ts                   (180 lines) — 7 Hono endpoints
├── service.ts                  (400 lines) — PrayerService class, 8 methods
├── types.ts                    (130 lines) — Types, constants, Redis keys
├── schemas.ts                  (35 lines)  — Zod validation
├── moderation.ts               (120 lines) — Blacklist + pattern filter
├── rewards.ts                  (35 lines)  — Gacha reward roller
└── schema/
    ├── index.ts                (4 lines)   — Re-export all schemas
    ├── prayers.ts              (45 lines)  — prayers table schema
    ├── prayer-batches.ts       (35 lines)  — prayer_batches schema (UNUSED)
    ├── prayer-presets.ts       (40 lines)  — prayer_presets schema
    └── prayer-stats.ts         (40 lines)  — prayer_stats schema

FRONTEND (Local: src/modules/prayer/):
├── screens/
│   └── PrayerScreen.tsx        (367 lines) — Main page
├── components/
│   ├── PrayerButton.tsx        (73 lines)  — Cooldown button
│   ├── PrayerCard.tsx          (43 lines)  — Preset display card
│   ├── PrayerInput.tsx         (43 lines)  — Custom textarea
│   ├── PrayerCounter.tsx       (25 lines)  — Global counter
│   ├── PrayerHistory.tsx       (35 lines)  — Simple history list
│   ├── PrayerHistoryModal.tsx  (140 lines) — Full diary history
│   ├── PrayerLeaderboard.tsx   (29 lines)  — Simple leaderboard
│   ├── PrayerLeaderboardModal.tsx (380 lines) — Full podium BXH
│   ├── PrayerReward.tsx        (61 lines)  — Reward popup
│   ├── PrayerSparkles.tsx      (65 lines)  — Sparkle VFX
│   ├── PrayerTextFly.tsx       (35 lines)  — Text fly animation
│   ├── FloatingPrayers.tsx     (125 lines) — Background bubbles
│   ├── PrayerPresetModal.tsx   (132 lines) — Choose preset
│   └── PrayerCustomModal.tsx   (163 lines) — Write custom
├── hooks/
│   ├── usePrayerOffer.ts       (44 lines)  — Mutation
│   ├── usePrayerStatus.ts      (16 lines)  — Status query
│   ├── usePrayerHistory.ts     (13 lines)  — History query
│   ├── usePrayerLeaderboard.ts (13 lines)  — BXH query
│   ├── usePrayerGlobal.ts      (13 lines)  — Global stats query
│   └── usePrayerPresets.ts     (16 lines)  — Presets query
└── types/
    └── prayer.types.ts         (78 lines)  — TypeScript interfaces

SHARED FILES:
├── src/shared/audio/hooks/usePrayerAudio.ts  (18 lines)
├── src/shared/audio/SoundRegistry.ts          (prayer entries)
├── src/styles/modules/prayer.css              (81 lines)
└── public/audio/
    ├── sfx/prayer/prayer-submit.mp3
    ├── sfx/prayer/prayer-reward.mp3
    ├── sfx/prayer/prayer-sparkle.mp3
    └── bgm/prayer.mp3

REUSABLE INFRASTRUCTURE:
├── BE: src/modules/rwa/services/sensor-blockchain.service.ts  — Merkle + on-chain
├── BE: src/modules/rwa/blockchain.config.ts                   — Chain config + contract ABI
├── BE: src/modules/rwa/services/delivery-blockchain.service.ts — Merkle batch + verify
├── BE: src/contracts/nft-card-abi.ts                          — NFT safeMint ABI
├── BE: src/modules/nft/nft-orchestrator.service.ts            — NFT generation pipeline
├── BE: src/modules/nft/nft-mint.service.ts                    — NFT mint logic
├── BE: src/modules/custodial-wallet/custodial-wallet.service.ts — Wallet + transferNft
└── BE: src/modules/nft/nft.routes.ts                          — NFT gallery API
```

---

## PHAN 4: DATA FLOW MAP

```
CURRENT FLOW (100% off-chain):

User → PrayerScreen
  ├── [Mount] GET /status → Redis(cooldown, daily counts) + DB(prayer_stats)
  ├── [Mount] GET /presets → DB(prayer_presets WHERE active, random)
  │
  ├── [Gui Nhanh] → random preset → POST /offer {type:'preset', presetId}
  ├── [Chon Loi Chuc] → PrayerPresetModal → POST /offer {type:'preset', presetId}
  ├── [Viet Loi Chuc] → PrayerCustomModal → POST /offer {type:'custom', text}
  │
  └── POST /offer flow:
        1. Redis: check cooldown (prayer:cd:{userId})
        2. Redis: check daily limit (prayer:daily:{type}:{userId}:{date})
        3. Moderate custom text (if type=custom)
        4. Verify preset exists (if type=preset)
        5. SHA256 hash: createHash("${userId}:${text}:${Date.now()}")
        6. Gacha reward: weighted random from PRAYER_REWARD_TABLE
        7. DB INSERT prayers (batch_id = null always)
        8. rewardService.addOGN() + addXP()
        9. Redis: INCR daily, SETEX cooldown 30s, INCR global
       10. DB UPSERT prayer_stats (totals, streak)
       → Response: { prayerId, ognReward, xpReward, multiplier, prayerHash, globalCount }

                                    ┌─────────────────────────────┐
                                    │  MISSING: BLOCKCHAIN LAYER  │
                                    │                             │
                                    │  prayer_batches: EMPTY      │
                                    │  Merkle tree: NOT BUILT     │
                                    │  On-chain TX: NOT SENT      │
                                    │  Cron job: NOT EXISTS       │
                                    └─────────────────────────────┘
```

---

## PHAN 5: READINESS ASSESSMENT — 4 FEATURES MOI

### FEATURE 1: Prayer-on-Chain (Merkle Batch)

```
BE CAN THEM:
├── prayer-batch.cron.ts (MỚI ~150 lines)
│   ├── startPrayerBatchCron() — setInterval every 10 min
│   ├── batchUnanchoredPrayers() — query prayers WHERE batch_id IS NULL
│   ├── buildMerkleTree(hashes) — REUSE from sensor-blockchain.service.ts
│   ├── submitToChain(merkleRoot, count) — REUSE blockchain.config + viem pattern
│   ├── updatePrayers(batchId) — SET batch_id on processed prayers
│   └── updateBatch(status, txHash, blockNumber) — prayer_batches row lifecycle
│
├── index.ts (SỬA 1 dòng) — add import startPrayerBatchCron
├── ../index.ts (SỬA 2 dòng) — import + startPrayerBatchCron()
│
BE CAN SUA:
├── service.ts — Thêm endpoint GET /api/prayer/batch-status/:batchId (optional)
│
FE CAN THEM:
├── components/BlockchainBadge.tsx (MỚI ~40 lines)
│   └── Show: pending/submitted/confirmed icon + Snowscan link
│
FE CAN SUA:
├── PrayerHistoryModal.tsx — Render batchStatus + txHash (fields already in type!)
├── PrayerHistory.tsx — Same
├── prayer.types.ts — Already has batchStatus/txHash — NO CHANGES NEEDED
│
SMART CONTRACT:
├── REUSE existing Merkle contract (MERKLE_CONTRACT_ADDRESS env)
│   storeRoot(root, count) — ALREADY DEPLOYED, ALREADY IN ABI
│
REUSE: ~80% from sensor-blockchain.service.ts
ESTIMATE: 1-2 prompts
```

### FEATURE 2: Weekly Vote

```
BE CAN THEM:
├── schema/prayer-votes.ts (MỚI ~40 lines)
│   └── prayer_votes table: id, user_id FK, prayer_id FK, week_key VARCHAR, created_at
│   └── UNIQUE constraint: (user_id, prayer_id) per week
│
├── vote.service.ts (MỚI ~120 lines)
│   ├── votePrayer(userId, prayerId) — insert vote, anti-self, anti-double
│   ├── getWeeklyTop(limit) — aggregate votes GROUP BY prayer_id WHERE week=current
│   ├── getVoteStatus(userId) — today's votes remaining
│   └── resetWeekly() — cron job hoặc week_key filter
│
├── routes.ts (SỬA ~40 lines thêm)
│   ├── POST /api/prayer/vote — { prayerId }
│   ├── GET /api/prayer/weekly-top — top voted this week
│   └── GET /api/prayer/vote-status — user's remaining votes
│
├── types.ts (SỬA ~20 lines thêm)
│   └── VOTE_LIMITS, VoteResponse types
│
BE CAN SUA:
├── service.ts getHistory() — thêm join vote count per prayer
├── service.ts getLeaderboard() — thêm filter tuần/tháng (tabs đã có nhưng disabled)
│
FE CAN THEM:
├── hooks/usePrayerVote.ts (MỚI ~20 lines) — useMutation
├── hooks/useWeeklyTop.ts (MỚI ~15 lines) — useQuery
├── components/VoteButton.tsx (MỚI ~40 lines) — heart button + count
├── components/WeeklyTopSection.tsx (MỚI ~60 lines) — top voted prayers
│
FE CAN SUA:
├── PrayerHistoryModal.tsx — thêm VoteButton trên mỗi prayer card
├── PrayerScreen.tsx — thêm WeeklyTopSection
├── PrayerLeaderboardModal.tsx — enable Thang/Mua tabs (currently disabled)
├── prayer.types.ts — thêm PrayerVote, WeeklyTopEntry types
│
SMART CONTRACT: Không cần
REUSE: Leaderboard pattern từ prayer_stats, news_likes pattern
ESTIMATE: 2-3 prompts
```

### FEATURE 3: NFT Mint Winner

```
BE CAN THEM:
├── prayer-nft.service.ts (MỚI ~150 lines)
│   ├── selectWeeklyWinner() — query prayer_votes WHERE week=last, ORDER BY count DESC
│   ├── generatePrayerNftCard(winnerId, prayerText, ...) — ADAPT from nft-orchestrator
│   ├── mintPrayerNft(walletAddress, metadataUri) — REUSE nft-mint.service.ts
│   └── storePrayerNftResult(prayerId, tokenId, txHash) — update DB
│
├── schema/prayer-nft-winners.ts (MỚI ~30 lines)
│   └── prayer_nft_winners: id, prayer_id FK, user_id FK, week_key, nft_token_id, tx_hash, status
│
├── prayer-nft.cron.ts (MỚI ~50 lines)
│   └── Weekly cron: Monday 00:00 → selectWinner → generateNft → mint
│
├── routes.ts (SỬA ~20 lines thêm)
│   ├── GET /api/prayer/weekly-winner — current/past winners
│   └── GET /api/prayer/my-nfts — user's prayer NFTs
│
FE CAN THEM:
├── components/WeeklyWinnerBanner.tsx (MỚI ~60 lines)
├── components/PrayerNftCard.tsx (MỚI ~50 lines)
├── hooks/useWeeklyWinner.ts (MỚI ~15 lines)
├── hooks/usePrayerNfts.ts (MỚI ~15 lines)
│
FE CAN SUA:
├── PrayerScreen.tsx — thêm WeeklyWinnerBanner
├── PrayerHistoryModal.tsx — highlight winning prayer with NFT badge
│
SMART CONTRACT:
├── REUSE NFT_CARD_ABI safeMint(to, uri) — ALREADY DEPLOYED
│   Or deploy separate Prayer NFT contract (for distinct collection)
│
REUSE:
├── ~60% from nft-orchestrator.service.ts (image gen, IPFS upload, mint)
├── ~90% from custodial-wallet.service.ts (wallet address lookup)
├── ~80% from nft.routes.ts (gallery API pattern)
│
ESTIMATE: 2-3 prompts (depends on NFT image generation complexity)
```

### FEATURE 4: World Record Tracker

```
BE CAN THEM:
├── Minimal — mostly use existing data
│
BE CAN SUA:
├── service.ts getGlobalStats() — thêm worldRecordGoal, progressPercent, dailyAverage
├── types.ts — thêm WorldRecordProgress type
│
FE CAN THEM:
├── components/WorldRecordProgress.tsx (MỚI ~60 lines)
│   └── Progress bar, milestone markers, animated counter, daily pace
│
FE CAN SUA:
├── PrayerScreen.tsx — thêm WorldRecordProgress component
├── PrayerCounter.tsx — enhance with progress visualization
├── prayer.types.ts — thêm worldRecordGoal, progressPercent fields
│
SMART CONTRACT: Optional — on-chain counter via getStats() already exists in Merkle contract
│
REUSE:
├── prayer:global:count Redis key — ALREADY EXISTS (val: 126)
├── PrayerCounter component — ALREADY EXISTS
├── AnimatedNumber component — ALREADY EXISTS
│
ESTIMATE: 1 prompt
```

---

## PHAN 6: DEPENDENCY ORDER KHUYEN NGHI

```
Phase 1: Prayer-on-Chain (1-2 prompts)
  → Foundation: Merkle batching cron, blockchain status in history UI
  → Prerequisite for World Record (need on-chain count)

Phase 2: World Record Tracker (1 prompt)
  → Depends on Phase 1 for meaningful on-chain count
  → Simple UI enhancement

Phase 3: Weekly Vote (2-3 prompts)
  → Independent of blockchain
  → New DB table + endpoints + UI

Phase 4: NFT Mint Winner (2-3 prompts)
  → Depends on Phase 3 (weekly vote results)
  → Reuses existing NFT pipeline

TOTAL: 6-9 prompts
```

---

*Report v2 generated: 2026-03-06*
*All code read-only — zero modifications made*
