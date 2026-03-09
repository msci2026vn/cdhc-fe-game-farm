# PRAYER SYSTEM — SCAN REPORT
**Ngay: 2026-03-06 | Chi doc, KHONG sua code**

---

## PHAN 1: BACKEND (VPS)

### 1.1 File Inventory

| # | File | Path | Lines | Role |
|---|------|------|-------|------|
| 1 | prayers.ts | src/modules/prayer/schema/prayers.ts | ~45 | Schema - bang prayers |
| 2 | prayer-batches.ts | src/modules/prayer/schema/prayer-batches.ts | ~35 | Schema - bang prayer_batches (Merkle) |
| 3 | prayer-presets.ts | src/modules/prayer/schema/prayer-presets.ts | ~40 | Schema - bang prayer_presets |
| 4 | prayer-stats.ts | src/modules/prayer/schema/prayer-stats.ts | ~40 | Schema - bang prayer_stats |
| 5 | index.ts | src/modules/prayer/schema/index.ts | 4 | Re-export all schemas |
| 6 | routes.ts | src/modules/prayer/routes.ts | ~180 | Hono routes - 7 endpoints |
| 7 | service.ts | src/modules/prayer/service.ts | ~400 | Core business logic |
| 8 | types.ts | src/modules/prayer/types.ts | ~130 | Types, constants, limits |
| 9 | moderation.ts | src/modules/prayer/moderation.ts | ~120 | Content filter (blacklist + regex) |
| 10 | rewards.ts | src/modules/prayer/rewards.ts | ~35 | Gacha reward roller |
| 11 | schemas.ts | src/modules/prayer/schemas.ts | ~35 | Zod validation schemas |
| 12 | index.ts | src/modules/prayer/index.ts | 1 | Re-export routes |

---

### 1.2 Database Schema

```
prayers
  id              UUID PK (random)
  user_id         UUID FK -> users.id (cascade)
  text            TEXT NOT NULL
  type            VARCHAR(20) NOT NULL ('preset' | 'custom')
  preset_id       VARCHAR(50) nullable
  category        VARCHAR(50) nullable
  moderation_status VARCHAR(20) DEFAULT 'approved'
  prayer_hash     VARCHAR(66) — SHA256 hash: "0x{userId}:{text}:{timestamp}"
  batch_id        UUID nullable — FK to prayer_batches (chua duoc su dung)
  ogn_reward      INTEGER DEFAULT 0
  xp_reward       INTEGER DEFAULT 0
  reward_multiplier INTEGER DEFAULT 1
  created_at      TIMESTAMPTZ DEFAULT NOW()

  Indexes: user_id, batch_id, created_at, (user_id,created_at), type

prayer_batches
  id              UUID PK
  merkle_root     VARCHAR(66) NOT NULL
  prayer_count    INTEGER NOT NULL
  tx_hash         VARCHAR(66) nullable
  block_number    INTEGER nullable
  chain_id        INTEGER nullable
  status          VARCHAR(20) DEFAULT 'pending' ('pending'|'submitted'|'confirmed'|'failed')
  batched_at      TIMESTAMPTZ DEFAULT NOW()
  submitted_at    TIMESTAMPTZ nullable
  confirmed_at    TIMESTAMPTZ nullable

  Indexes: status, batched_at

prayer_presets
  id              UUID PK
  text            TEXT NOT NULL
  category        VARCHAR(50) NOT NULL
  is_active       BOOLEAN DEFAULT true
  sort_order      INTEGER DEFAULT 0
  usage_count     INTEGER DEFAULT 0
  created_by      VARCHAR(50) DEFAULT 'system'
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ

  Indexes: category, is_active, usage_count

prayer_stats (1 row per user)
  user_id         UUID PK FK -> users.id
  total_prayers   INTEGER DEFAULT 0
  total_custom    INTEGER DEFAULT 0
  total_preset    INTEGER DEFAULT 0
  current_streak  INTEGER DEFAULT 0
  longest_streak  INTEGER DEFAULT 0
  last_prayer_date VARCHAR(10) — "YYYY-MM-DD"
  total_ogn_earned INTEGER DEFAULT 0
  total_xp_earned  INTEGER DEFAULT 0
  updated_at      TIMESTAMPTZ

  Indexes: total_prayers, longest_streak
```

### 1.3 Database Stats (Live)

| Table | Row Count |
|-------|-----------|
| prayers | **126** |
| prayer_batches | **0** (chua co batch nao!) |
| prayer_presets | **120** |
| prayer_stats | **10** users |

- Tat ca 126 prayers deu co `batch_id = null` — chua duoc batch vao Merkle tree
- Phan lon la type `preset`, rat it `custom`
- Vote/Reaction tables hien co: `news_comment_likes`, `news_likes` (khong lien quan prayer)

### 1.4 API Endpoints

| Method | Endpoint | Auth | Mo ta |
|--------|----------|------|-------|
| POST | /api/prayer/offer | Yes (approved) | Gui cau nguyen (preset hoac custom) |
| GET | /api/prayer/status | Yes (approved) | Trang thai hom nay (limit, cooldown, streak) |
| GET | /api/prayer/presets | Yes (approved) | Lay loi cau nguyen co san (random, co filter category) |
| GET | /api/prayer/history | Yes (approved) | Lich su cau nguyen cua user (co pagination) |
| GET | /api/prayer/leaderboard | Yes (approved) | BXH theo total_prayers |
| GET | /api/prayer/global | Yes (approved) | Thong ke toan cau |
| GET | /api/prayer/categories | Yes (approved) | Danh sach categories + count |

### 1.5 Rate Limits & Constants

```
MAX_DAILY_FREE:     5 luot/ngay (preset)
MAX_DAILY_CUSTOM:   3 luot/ngay (custom)
COOLDOWN_SECONDS:   30s giua moi lan pray
MIN_TEXT_LENGTH:    10 ky tu
MAX_TEXT_LENGTH:    500 ky tu
BATCH_SIZE:         50 prayers/batch (chua implement)
BATCH_INTERVAL:     10 phut (chua implement)
```

### 1.6 Reward System (Gacha)

| Weight | OGN | XP | Xac suat |
|--------|-----|-----|----------|
| 40 | 5 | 0 | 40% |
| 25 | 10 | 0 | 25% |
| 15 | 25 | 0 | 15% |
| 10 | 50 | 0 | 10% |
| 5 | 0 | 100 | 5% |
| 3 | 0 | 500 | 3% |
| 2 | 10 | 200 | 2% |

- Custom prayer duoc nhan x2 (CUSTOM_PRAYER_MULTIPLIER = 2)
- Milestone thresholds: 100, 500, 1000, 5000, 10000

### 1.7 Moderation

- **Tang 1 — Blacklist**: 30+ tu cam (Viet + English), phrase blacklist
- **Tang 2 — Pattern**: URL, phone number, repeated chars, HTML tags, excessive caps/emoji, game manipulation terms
- HTML sanitized via `stripHtml()`
- Chi ap dung cho `custom` prayers, `preset` da duoc pre-approved

### 1.8 Redis Keys

```
prayer:daily:free:{userId}:{YYYY-MM-DD}  — TTL 86400s
prayer:daily:custom:{userId}:{YYYY-MM-DD} — TTL 86400s
prayer:cd:{userId}                        — TTL 30s
prayer:global:count                       — Persistent counter
```

**Luu y**: Redis keys scan tra ve empty (co the da het TTL hoac counter = 0).

### 1.9 Blockchain Integration — HIEN TAI

**PHAT HIEN QUAN TRONG:**

- **prayer_batches table da duoc tao nhung CHUA DUOC SU DUNG** (0 rows)
- Schema co cot `merkle_root`, `tx_hash`, `block_number`, `chain_id` — thiet ke cho Merkle batch → on-chain
- prayer.service.ts co code doc batch status trong `getHistory()` — nhung khong co code TAO batch
- **KHONG co cron job** nao lien quan prayer batching
- **KHONG co code** gui transaction len Avalanche cho prayer
- `prayer_hash` duoc tinh bang SHA256 local (`createHash('sha256')`) — chi la hash off-chain, CHUA gui len chain
- Constants da define `BATCH_SIZE: 50`, `BATCH_INTERVAL_MINUTES: 10` nhung **chua implement**

=> **Ket luan: Prayer hien tai 100% off-chain. Blockchain integration da thiet ke schema nhung chua code.**

---

## PHAN 2: FRONTEND (LOCAL)

### 2.1 File Inventory

| # | File | Path | Lines | Role |
|---|------|------|-------|------|
| 1 | PrayerScreen.tsx | modules/prayer/screens/ | 367 | Main screen |
| 2 | PrayerButton.tsx | modules/prayer/components/ | 73 | Cooldown button |
| 3 | PrayerCard.tsx | modules/prayer/components/ | 43 | Preset card display |
| 4 | PrayerInput.tsx | modules/prayer/components/ | 43 | Custom text textarea |
| 5 | PrayerCounter.tsx | modules/prayer/components/ | 25 | Global prayer counter |
| 6 | PrayerHistory.tsx | modules/prayer/components/ | 35 | Simple history list |
| 7 | PrayerHistoryModal.tsx | modules/prayer/components/ | 140 | Full-screen diary-style history |
| 8 | PrayerLeaderboard.tsx | modules/prayer/components/ | 29 | Simple leaderboard |
| 9 | PrayerLeaderboardModal.tsx | modules/prayer/components/ | 380 | Full-screen podium leaderboard |
| 10 | PrayerReward.tsx | modules/prayer/components/ | 61 | Reward popup overlay |
| 11 | PrayerSparkles.tsx | modules/prayer/components/ | 65 | Sparkle VFX |
| 12 | PrayerTextFly.tsx | modules/prayer/components/ | 35 | Text fly-up animation |
| 13 | FloatingPrayers.tsx | modules/prayer/components/ | 125 | Background floating prayers |
| 14 | PrayerPresetModal.tsx | modules/prayer/components/ | 132 | Choose preset prayer modal |
| 15 | PrayerCustomModal.tsx | modules/prayer/components/ | 163 | Write custom prayer modal |
| 16 | prayer.types.ts | modules/prayer/types/ | 78 | TypeScript interfaces |
| 17 | usePrayerOffer.ts | modules/prayer/hooks/ | 44 | Mutation hook |
| 18 | usePrayerStatus.ts | modules/prayer/hooks/ | 16 | Status query hook |
| 19 | usePrayerHistory.ts | modules/prayer/hooks/ | 13 | History query hook |
| 20 | usePrayerLeaderboard.ts | modules/prayer/hooks/ | 13 | Leaderboard query hook |
| 21 | usePrayerGlobal.ts | modules/prayer/hooks/ | 13 | Global stats query hook |
| 22 | usePrayerPresets.ts | modules/prayer/hooks/ | 16 | Presets query hook |
| 23 | usePrayerAudio.ts | shared/audio/hooks/ | 18 | Audio hook |
| 24 | prayer.css | styles/modules/ | 81 | CSS animations |

### 2.2 Routing

- Route: `/prayer` → `PrayerScreen` (lazy loaded)
- Entry point: `FarmToolbelt.tsx` co nut navigate den `/prayer`
- Middleware: Auth + Approved required (BE enforced)

### 2.3 UI Architecture

```
PrayerScreen
  ├── Header (back button + title "Den Tho Me Thien Nhien")
  ├── Tabs: [Cau Nguyen | BXH | Lich Su]
  ├── Main Content (bottomTab === 'pray')
  │   ├── Me Thien Nhien image (animated, halo spin)
  │   ├── Stats cards (streak + total sent)
  │   ├── Daily limit info
  │   ├── Action Buttons
  │   │   ├── "Gui Nhanh" — random preset (mien phi)
  │   │   ├── "Chon Loi Chuc" → PrayerPresetModal
  │   │   └── "Viet Loi Chuc" → PrayerCustomModal
  │   └── Message from Mother Nature (static quote)
  ├── FloatingPrayers (background animated bubbles)
  ├── PrayerSparkles (VFX on submit)
  ├── PrayerTextFly (text float-up on submit)
  ├── PrayerReward (reward popup with OGN/XP/milestone)
  ├── PrayerPresetModal (full-screen, category filter, card list)
  ├── PrayerCustomModal (full-screen, textarea, cooldown)
  ├── PrayerLeaderboardModal (full-screen, podium top3 + list)
  └── PrayerHistoryModal (full-screen, diary-style)
```

### 2.4 State Management

- **TanStack Query** for all data fetching:
  - `['game', 'prayer', 'status']` — staleTime 10s, refetchOnWindowFocus
  - `['game', 'prayer', 'presets', category]` — staleTime 60s
  - `['game', 'prayer', 'history', page]` — staleTime 30s
  - `['game', 'prayer', 'leaderboard']` — staleTime 60s
  - `['game', 'prayer', 'global']` — staleTime 30s
- **useMutation** for offer prayer — invalidates all prayer queries + player profile
- Local useState for UI state (modals, cooldown countdown)

### 2.5 Audio System

- BGM: `Celestial_Sanctuary.mp3` (loop, volume 0.12)
- SFX: `prayer_submit.mp3`, `prayer_reward.mp3`, `prayer_sparkle.mp3`
- Auto-preload on screen mount
- `usePrayerAudio()` hook with `.submit()`, `.reward()`, `.sparkle()`

### 2.6 VFX/Animations

- **Halo spin**: 2 concentric circles rotating around Me Thien Nhien image
- **Float gentle**: Me Thien Nhien image bobbing up/down
- **FloatingPrayers**: Demo prayers bubble up from bottom (3-7s interval, max 4 active)
- **PrayerSparkles**: 8-13 emoji sparkles on prayer submit
- **PrayerTextFly**: Prayer text floats up and fades
- **PrayerReward**: Bounce-in popup with reward amount + milestone badge
- CSS in `prayer.css`: `halo-spin`, `float-gentle`, `prayer-float-up`, `floatUp`

### 2.7 Blockchain UI — HIEN TAI

- `PrayerHistoryItem` type co truong `batchStatus` va `txHash` — **nhung KHONG co UI hien thi chung**
- `PrayerHistory.tsx` va `PrayerHistoryModal.tsx` deu KHONG render `batchStatus`, `txHash`, hay `prayerHash`
- **Khong co link ra Snowscan**
- **Khong co Merkle proof verification UI**

=> **FE da co data structure nhung chua hien thi bat ky thong tin blockchain nao**

---

## PHAN 3: TONG HOP

### 3.1 API Endpoint Map

| Method | Endpoint | Auth | FE goi tu | Mo ta |
|--------|----------|------|-----------|-------|
| POST | /api/prayer/offer | Yes | usePrayerOffer.ts | Tao prayer (preset/custom) |
| GET | /api/prayer/status | Yes | usePrayerStatus.ts | Daily limits + cooldown |
| GET | /api/prayer/presets | Yes | usePrayerPresets.ts | Random presets (filter category) |
| GET | /api/prayer/history | Yes | usePrayerHistory.ts | User prayer history (paginated) |
| GET | /api/prayer/leaderboard | Yes | usePrayerLeaderboard.ts | Top users by total_prayers |
| GET | /api/prayer/global | Yes | usePrayerGlobal.ts | Global stats (total, today, batches) |
| GET | /api/prayer/categories | Yes | (chua dung o FE) | Category list + count |

### 3.2 Blockchain Flow Hien Tai

```
User gui prayer
  → [BE] Validate + Moderate (custom only)
  → [BE] SHA256 hash (off-chain, userId:text:timestamp)
  → [BE] Save to DB (batch_id = null)
  → [BE] Grant OGN/XP rewards
  → [BE] Update Redis counters
  → [BE] Update prayer_stats
  → DONE (khong co buoc blockchain nao)

prayer_batches table: EXISTS nhung EMPTY (0 rows)
Merkle tree code: KHONG TON TAI
On-chain submission code: KHONG TON TAI
Cron job for batching: KHONG TON TAI
```

### 3.3 Existing NFT/Blockchain Infrastructure (Reusable)

Tu scan BE, da co:
- **NFT routes**: `/api/nft` — nft.routes.ts
- **NFT listings**: nft_listings table (marketplace)
- **World Boss NFT rewards**: world_boss_rewards table co cot `nft_token_id`
- **Sensor blockchain logs**: Merkle batch → Avalanche (farmverse-iot.ts) — **co the tham khao pattern**
- **Delivery blockchain service**: delivery-blockchain.service.ts — **co the reuse logic**

### 3.4 Gap Analysis cho Feature Moi

| Feature | Can gi o BE | Can gi o FE | Can gi o Blockchain | Da co san? |
|---------|-------------|-------------|---------------------|-----------|
| **Prayer-on-Chain** | Merkle batching cron (gom 50 prayers → hash → submit), update batch_id tren prayers | Hien thi batchStatus, txHash, link Snowscan | Smart contract nhan Merkle root (co the dung contract da co tu IoT) | Schema co, logic CHUA |
| **Weekly Vote** | Bang `prayer_votes` (user_id, prayer_id, week), endpoint POST /vote, GET /weekly-top, cron reset weekly | Vote button tren prayer card, weekly top list, vote count | Khong can (off-chain vote) | CHUA co gi |
| **NFT Mint Winner** | Endpoint mint NFT cho winner, integrate voi custodial wallet, store nft_token_id | Winner announcement UI, NFT display, wallet link | Smart contract safeMint (co the reuse World Boss NFT contract) | NFT pipeline co (World Boss), can adapt |
| **World Record Tracker** | Endpoint /api/prayer/world-record, counter logic (da co prayer:global:count trong Redis) | Counter component (da co PrayerCounter), them milestone progress bar, world record goal display | On-chain counter (optional) | Counter logic CO, UI CO (PrayerCounter) |

---

## PHAN 4: TRA LOI CAC CAU HOI

### 1. Prayer hien tai co dua len blockchain khong?
**KHONG.** Prayer hien tai 100% off-chain. Schema `prayer_batches` da duoc thiet ke voi `merkle_root`, `tx_hash`, `chain_id` nhung chua co bat ky dong code nao thuc hien batching hoac submission len chain. Tat ca 126 prayers deu co `batch_id = null`.

### 2. Co he thong vote/like nao chua?
**CHUA co cho prayer.** He thong co `news_comment_likes` va `news_likes` (cho News module) nhung khong co gi cho prayer. Can build vote system tu dau: bang `prayer_votes`, anti-double-vote logic, weekly aggregation.

### 3. NFT mint pipeline da co san — reuse duoc bao nhieu %?
**~40-50% reusable:**
- World Boss da co NFT reward flow: mint → store token_id → user claim
- `nft_listings` table co the dung cho marketplace
- Custodial wallet (da fix commit c6d0d5f) co the dung de mint ve vi user
- CAN MOI: Smart contract cho "Prayer NFT" (khac metadata voi World Boss NFT), mint trigger logic, winner selection logic

### 4. Custodial wallet co the dung cho prayer NFT?
**CO.** Custodial wallet da fix va dang hoat dong. Flow: BE mint NFT → gui ve custodial wallet address cua user. Khong can user ky transaction. Tuy nhien can dam bao contract cho phep BE wallet mint (role MINTER).

### 5. Bao nhieu prayer trong DB hien tai?
**126 prayers** tu **10 users**. Scale rat nho hien tai. Cho world record tracker:
- Neu 100 users x 8 prayers/ngay = 800/ngay = 292,000/nam
- World record can nghien cuu — hien tai chua co "prayer on-chain" record nao duoc ghi nhan
- Voi 126 prayers, can tang traffic dang ke truoc khi claim record

### 6. FE prayer page hien tai co nhung element nao? Can them gi cho vote UI?
**Da co:**
- PrayerScreen voi 3 tabs (Cau Nguyen, BXH, Lich Su)
- PrayerPresetModal (chon loi chuc)
- PrayerCustomModal (viet loi chuc tu do)
- PrayerLeaderboardModal (podium top3 + list)
- PrayerHistoryModal (diary-style)
- Reward popup, VFX (sparkles, text fly, floating prayers)

**Can them cho vote:**
- Vote button (heart/star) tren moi prayer card trong history/feed
- "Loi cau nguyen hay nhat tuan" section tren PrayerScreen
- Vote count hien thi
- Weekly winner announcement banner
- NFT badge cho winner

### 7. Rate limit prayer hien tai?
- **5 free (preset) + 3 custom = 8 prayers/ngay/user**
- **30s cooldown** giua moi lan
- Content moderation cho custom prayers (blacklist + pattern)
- **Khi co vote incentive**: Can them rate limit cho vote (VD: max 5-10 votes/ngay), anti-self-vote, anti-vote-farming

---

## PHAN 5: GHI CHU KY THUAT

### Bugs/Issues phat hien (KHONG fix):
1. **FloatingPrayers.tsx:92** — `useEffect` dependency `[activePrayers.length]` co the gay re-render loop khi length thay doi lien tuc
2. **PrayerCustomModal.tsx:36** — eslint-disable for exhaustive-deps (cooldown > 0 dep)
3. **PrayerScreen.tsx:310** — Hardcoded external URL cho wood texture pattern (transparenttextures.com) — nen self-host
4. **FloatingPrayers.tsx:81** — Dung pravatar.cc cho demo avatars — external dependency

### Security notes:
- Moderation system oke cho use case hien tai
- SHA256 hash khong co salt rieng biet — neu cung userId + text + timestamp thi hash giong nhau (unlikely nhung co the xay ra)
- Rate limiting qua Redis — solid

### Performance notes:
- 7 queries per screen mount (status + presets + co the leaderboard/history) — co the optimize
- FloatingPrayers spawn timer co the leak memory neu component unmount giua timeout
- PrayerLeaderboardModal fetch 50 entries — ok cho hien tai

---

*Report generated: 2026-03-06*
*Backend: /home/cdhc/apps/cdhc-be/src/modules/prayer/*
*Frontend: /mnt/d/du-an/cdhc/cdhc-game-vite/src/modules/prayer/*
