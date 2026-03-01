# Auto AI — Business Model + Battle Log Plan
**Ngày scan:** 2026-03-01
**Frontend:** `/mnt/d/du-an/cdhc/cdhc-game-vite/`
**Backend:** `/home/cdhc/apps/cdhc-be/`

---

## 1. Current State

### 1.1 Database Schema Summary

**Dialect:** PostgreSQL (Drizzle ORM, `drizzle-orm/pg-core`)

**File locations:**
- Global schema: `/home/cdhc/apps/cdhc-be/src/db/schema/`
- Game schema: `/home/cdhc/apps/cdhc-be/src/modules/game/schema/`

**Bảng liên quan đến Auto AI / Payment:**

| Bảng | File | Mô tả |
|------|------|-------|
| `player_stats` | `game/schema/player-stats.ts` | OGN balance (`ogn INTEGER DEFAULT 1250`), level, xp, stats |
| `ogn_transactions` | `game/schema/ogn-transactions.ts` | Log mọi +/- OGN |
| `boss_battles` | `game/schema/boss-battles.ts` | Battle result + `battle_log JSONB DEFAULT []` |
| `daily_battle_limits` | `game/schema/boss-battles.ts` | Daily battle count per user |
| `vip_orders` | `db/schema/farmverse-vip.ts` | Đơn hàng VIP (pending/completed) |
| `vip_subscriptions` | `db/schema/farmverse-vip.ts` | Subscription đang active |
| `payment_transactions` | `db/schema/farmverse-vip.ts` | Log tx AVAX payment |
| `custodial_wallets` | `db/schema/custodial-wallets.ts` | Ví custodial (private key encrypted) |
| `topup_orders` | `db/schema/topup-orders.ts` | Top-up AVAX via Stripe/PayPal |

**KHÔNG có bảng:** `auto_subscriptions`, `auto_purchases` → Cần tạo mới.

**OGN balance:**
- Lưu trong `player_stats.ogn` (INTEGER, không phải decimal)
- Default: 1250 OGN khi tạo tài khoản
- File: `player-stats.ts` line 13: `ogn: integer('ogn').notNull().default(1250)`

---

### 1.2 API Routes Summary

**Framework:** Hono.js
**Auth middleware:** `requireAuth` (JWT/session-based, mounted trên tất cả `/api/game/*`)

**Endpoint hiện có:**

| Route | File | Mô tả |
|-------|------|-------|
| `POST /api/game/boss/complete` | `game/routes/boss.ts` | Kết thúc trận đánh |
| `POST /api/game/battle/start` | `game/combat/battle.routes.ts` | Bắt đầu campaign battle |
| `GET /api/vip/status` | `modules/vip/vip.routes.ts` | Status VIP hiện tại |
| `GET /api/vip/plans` | `modules/vip/vip.routes.ts` | Danh sách gói VIP |
| `POST /api/vip/orders` | `modules/vip/vip.routes.ts` | Tạo đơn hàng VIP |
| `POST /api/vip/orders/:id/verify` | `modules/vip/vip.routes.ts` | Verify AVAX tx on-chain |
| `POST /api/vip/orders/:id/pay-custodial` | `modules/vip/vip.routes.ts` | Thanh toán từ ví custodial |
| `GET /api/game/auto-play/status` | ❌ **CHƯA CÓ** | Stubs trong FE, chưa implement BE |
| `POST /api/game/auto-play/purchase` | ❌ **CHƯA CÓ** | Stubs trong FE, chưa implement BE |

**KHÔNG có endpoint** cho thuê OGN/tuần hay mua AVAX Auto AI.

---

### 1.3 OGN Economy Summary

**Lưu trữ:** `player_stats.ogn` (INTEGER)
**Cộng OGN:** `reward.service.ts` → `addOGN()` function (line ~235)
**Trừ OGN:** Direct UPDATE qua Drizzle transaction
**Log:** `ognTransaction.service.ts` → `logOgnTransaction()` → bảng `ogn_transactions`

**OGN Transaction Types hiện tại** (`game/schema/ogn-transactions.ts` line 1-15):
```
plant_seed, harvest_sell, shop_buy, boss_reward, quiz_reward,
level_up_fee, referral_bonus, social_reward, vip_purchase, ...
```

**Check đủ OGN:** Có check trong service trước khi trừ (transaction + verify balance)
**Daily cap:** `capDailyBossOgn()` trong `boss-anti-cheat.ts`

**Cần thêm** type: `auto_ai_rent` cho việc thuê OGN/tuần.

---

### 1.4 AVAX Integration Summary

**Hai loại ví:**

1. **Custodial Wallet** (`modules/custodial-wallet/`):
   - BE giữ private key (encrypted với PIN)
   - Endpoint: `POST /api/custodial-wallet/send` → BE ký & broadcast tx
   - User chỉ cần nhập PIN

2. **Smart Wallet ERC-4337** (`modules/smart-wallet/`):
   - Counterfactual address, WebAuthn signing
   - Pimlico paymaster (gas sponsored)
   - Endpoint: `POST /prepare-op` → `POST /submit-op`

**Verify AVAX payment:** On-chain check trong `payment.service.ts:verifyAvaxPayment()`:
- Validate TX receiver đúng địa chỉ
- Validate amount đúng (±5% tolerance)
- Gọi `activateVip()` sau khi verify thành công

**VIP payment flow đã hoàn chỉnh** → **CÓ THỂ REUSE** cho Auto AI mua AVAX.

---

### 1.5 Battle Session Flow Summary

**startBattle:**
- File: `game/combat/battle.routes.ts`
- Tạo `battleSessionId` (UUID)
- Lưu Redis key: `battle:{userId}:{bossId}:{sessionId}` TTL 900s
- Set cooldown Redis: `campaign:cd:{userId}` 5s

**completeBoss (`boss.ts`):**
- Validate session Redis key (one-time use, bị xóa sau khi dùng)
- Anti-cheat: rate limit (2 req/s), duration validation, damage validation (±50%)
- Input interface `BossFightInput`:
  ```typescript
  {
    bossId: string;
    won: boolean;
    totalDamage: number;
    durationSeconds: number;
    stars?: number;
    playerHpPercent?: number;
    maxCombo?: number;
    dodgeCount?: number;
    isCampaign?: boolean;
    battleSessionId?: string;
  }
  ```
- Log vào `game_actions` với type `boss_complete`

**Battle log:** Bảng `boss_battles` đã có field `battle_log JSONB DEFAULT []` (boss-battles.ts line 56).
**Hiện tại:** Field này **chưa được ghi** trong completeBoss handler → Cơ hội bổ sung.

---

### 1.6 Frontend Shop/Payment Summary

**AutoPlayShopSection.tsx** (`src/modules/shop/components/`):
- 5 gói: Free (Lv1) → Elite MCTS-80 (Lv5)
- Giá chỉ là **AVAX mua một lần** (0.015–0.020 AVAX)
- **CHƯA có** tab Thuê OGN/tuần
- Comment trong code: `// TODO: integrate with AVAX payment flow` (line 76)
- Toast: thư viện `sonner`, cách gọi `toast.success()`

**useAutoPlayLevel.ts** (`src/shared/hooks/`):
- Đọc/ghi `localStorage['farmverse-autoplay-level']`
- Đọc/ghi `localStorage['farmverse-autoplay-purchased']` (array)
- **Không có** API call → Stale sau khi mua trên thiết bị khác

**api-autoplay.ts** (`src/shared/api/`):
- Stubs sẵn sàng: `autoPlayApi.getStatus()` + `autoPlayApi.purchase(level, txHash?)`
- Endpoint: `/api/game/auto-play/status` (GET) + `/api/game/auto-play/purchase` (POST)
- **Backend chưa có** endpoints này

**VIP Payment flow (có thể reuse):**
- `VipPurchaseScreen.tsx`: Full flow custodial + smart wallet
- `sendAvaxPayment.ts`: Helper gửi AVAX
- `PurchaseFlow.tsx`: Confirm dialog → Payment → Toast result

---

## 2. Business Model: Thuê + Mua Auto AI

### 2.1 Pricing Table

| Level | Tên | Algorithm | Thuê OGN/tuần | Mua AVAX | Features |
|-------|-----|-----------|---------------|----------|----------|
| Lv1 | Free | Random | Free | Free | Random swaps, 2500ms tick, 5 free dodges |
| Lv2 | Basic | Greedy Weighted | 1,000 OGN | 0.015 AVAX | Weighted scoring, situation awareness, 2000ms |
| Lv3 | Advanced | Cascade Sim | 2,500 OGN | 0.016 AVAX | Cascade simulation, auto-dodge, 1500ms |
| Lv4 | Pro | MCTS-30 | 5,000 OGN | 0.018 AVAX | Monte Carlo 30 sims, auto-ULT, 1200ms |
| Lv5 | Elite | MCTS-80 | 10,000 OGN | 0.020 AVAX | 80 sims, self-learning, 1000ms, 7 dodges |

**Ghi chú thiết kế:**
- "Mua vĩnh viễn" = lifetime access, không expire
- "Thuê tuần" = 7 ngày từ lúc kích hoạt (không kể ngày offline)
- Player chỉ có thể dùng **mức cao hơn** trong 2 loại (mua Lv3 + thuê Lv5 → dùng Lv5)
- Khi thuê hết hạn → fallback về level mua vĩnh viễn (nếu có) hoặc Lv1

---

### 2.2 Backend Changes Needed

#### New DB Table: `auto_subscriptions`

```typescript
// File: src/modules/game/schema/auto-subscriptions.ts
export const autoSubscriptions = pgTable(
  'auto_subscriptions',
  {
    id: serial('id').primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Thuê (OGN/tuần)
    rentedLevel: integer('rented_level'),          // 2-5, null nếu chưa thuê
    rentedAt: timestamp('rented_at', { withTimezone: true }),
    rentExpiresAt: timestamp('rent_expires_at', { withTimezone: true }),
    rentOgnPaid: integer('rent_ogn_paid'),          // OGN đã trừ

    // Mua vĩnh viễn (AVAX)
    purchasedLevel: integer('purchased_level'),    // 2-5, null nếu chưa mua
    purchasedAt: timestamp('purchased_at', { withTimezone: true }),
    purchaseTxHash: varchar('purchase_tx_hash', { length: 66 }),
    purchaseAvaxPaid: varchar('purchase_avax_paid', { length: 20 }),

    // Effective level = max(purchasedLevel, rentedLevel nếu chưa hết hạn)
    // → Tính runtime, không lưu DB

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userIdx: index('auto_subscriptions_user_idx').on(table.userId),
    rentExpiryIdx: index('auto_subscriptions_rent_expiry_idx').on(table.rentExpiresAt),
  }),
);
```

**Migration:** `bunx drizzle-kit push` sau khi thêm schema.

---

#### New API Endpoints

**File tạo mới:** `src/modules/game/routes/auto-play.ts`

| Method | Path | Mô tả |
|--------|------|-------|
| `GET` | `/api/game/auto-play/status` | Trả về purchased level + rent level + expiry |
| `POST` | `/api/game/auto-play/rent` | Thuê tuần bằng OGN |
| `POST` | `/api/game/auto-play/buy` | Mua vĩnh viễn bằng AVAX |
| `POST` | `/api/game/auto-play/cancel-rent` | Hủy thuê (không hoàn OGN) |

**GET /status response:**
```typescript
{
  purchasedLevel: number | null;    // Lv mua vĩnh viễn (null nếu chưa)
  rentedLevel: number | null;       // Lv đang thuê (null nếu chưa/hết hạn)
  rentExpiresAt: string | null;     // ISO timestamp
  effectiveLevel: number;           // max(purchased, rented) hoặc 1
  daysUntilExpiry: number | null;   // Số ngày còn lại
}
```

**POST /rent body:**
```typescript
{
  level: 2 | 3 | 4 | 5;
}
```

Logic:
1. Kiểm tra `level` hợp lệ (2-5)
2. Tính `ognCost = [1000, 2500, 5000, 10000][level - 2]`
3. Kiểm tra `player_stats.ogn >= ognCost`
4. Transaction: trừ OGN + upsert `auto_subscriptions`
5. Log `ogn_transactions` type = `'auto_ai_rent'`
6. Return status mới + OGN còn lại

**POST /buy body:**
```typescript
{
  level: 2 | 3 | 4 | 5;
  txHash: string;        // AVAX tx hash (non-custodial)
  // hoặc để trống nếu dùng custodial (BE tự ký)
}
```

Logic:
1. Nếu `txHash`: gọi `verifyAvaxPayment()` (reuse từ `payment.service.ts`)
2. Nếu custodial: gọi `payCustodial()` (reuse từ `payment.service.ts`)
3. Upsert `auto_subscriptions.purchased_level = max(current, level)`
4. Ghi `purchase_tx_hash`, `purchased_avax_paid`
5. Log `ogn_transactions` type = `'auto_ai_purchase'` (hoặc bảng riêng)
6. Return status mới

---

#### OGN Deduction Logic

**Reuse pattern từ** `reward.service.ts`:
```typescript
// Trong auto-play.service.ts
async rentAutoPlay(userId: string, level: number): Promise<void> {
  const ognCost = RENT_PRICES[level]; // { 2: 1000, 3: 2500, 4: 5000, 5: 10000 }

  await db.transaction(async (tx) => {
    // 1. Check balance
    const stats = await tx.select().from(playerStats)
      .where(eq(playerStats.userId, userId))
      .for('update')  // Row lock
      .limit(1);

    if (stats[0].ogn < ognCost) throw new Error('INSUFFICIENT_OGN');

    // 2. Deduct OGN
    await tx.update(playerStats)
      .set({ ogn: sql`${playerStats.ogn} - ${ognCost}` })
      .where(eq(playerStats.userId, userId));

    // 3. Upsert subscription
    await tx.insert(autoSubscriptions)
      .values({ userId, rentedLevel: level, rentedAt: new Date(), rentExpiresAt: addDays(new Date(), 7) })
      .onConflictDoUpdate({ target: autoSubscriptions.userId, set: { rentedLevel: level, ... } });
  });

  // 4. Log (outside tx, fire-and-forget)
  await logOgnTransaction({ userId, amount: -ognCost, type: 'auto_ai_rent', meta: { level } });
}
```

---

#### AVAX Verification Logic

**Reuse hoàn toàn** từ `payment.service.ts:verifyAvaxPayment()`:
- Receiver address = `PAYMENT_CONFIG.receiverAddress` (env var)
- Amount check: `AUTO_BUY_PRICES[level]` (0.015–0.020 AVAX)
- Tolerance: ±5%

---

#### Expiry Check

**Hai cách:**

1. **Lazy check (recommended):** Mỗi khi `/status` được gọi, so sánh `rent_expires_at` với `NOW()`. Không cần cron.

2. **Cron (optional):** Thêm vào `vip.cron.ts` — deactivate expired rent mỗi giờ (cập nhật `rented_level = null`). Chỉ cần cho báo cáo admin, không cần cho game logic.

---

#### Anti-Abuse Rules

- **Max rent level ≤ player_level-gated:** Lv4 yêu cầu player level ≥ 20, Lv5 yêu cầu player level ≥ 35 (tùy balance design)
- **Rate limit:** 3 rent actions/day (tránh farm OGN refund exploits nếu có hủy)
- **Stack rules:** Không thể thuê level thấp hơn đã mua vĩnh viễn
- **Concurrent lock:** Reuse `acquireBattleLock()` pattern cho rent/buy (tránh race condition)

---

### 2.3 Frontend Changes Needed

#### `AutoPlayShopSection.tsx` — Redesign với 2 tabs

**Cần thêm:**
```
[ Thuê (OGN) ] [ Mua vĩnh viễn (AVAX) ]  ← Tab switcher
```

Mỗi package card hiển thị:
- Tab Thuê: giá OGN/tuần + nút "Thuê 7 ngày" (disable nếu đủ điều kiện)
- Tab Mua: giá AVAX + nút "Mua vĩnh viễn" + badge "Đã mua" nếu sở hữu
- Dòng expiry: "Còn 3 ngày" hoặc "Hết hạn" cho gói thuê

**Files cần sửa:**
- `src/modules/shop/components/AutoPlayShopSection.tsx` (~100-150 lines mới)

---

#### `useAutoPlayLevel.ts` — Đổi từ localStorage sang API

**Hiện tại:** Chỉ dùng localStorage
**Cần đổi:**

```typescript
// useAutoPlayLevel.ts (mới)
export function useAutoPlayLevel() {
  const { data, refetch } = useQuery({
    queryKey: ['auto-play-status'],
    queryFn: () => autoPlayApi.getStatus(),
    staleTime: 5 * 60 * 1000,  // 5 phút cache
  });

  return {
    effectiveLevel: data?.effectiveLevel ?? 1,
    purchasedLevel: data?.purchasedLevel ?? null,
    rentedLevel: data?.rentedLevel ?? null,
    rentExpiresAt: data?.rentExpiresAt ?? null,
    daysUntilExpiry: data?.daysUntilExpiry ?? null,
    refetch,
  };
}
```

**Files cần sửa:** `src/shared/hooks/useAutoPlayLevel.ts`

---

#### Payment Flow (reuse VIP pattern)

**Thuê OGN:**
```
Nút "Thuê 7 ngày"
  → Confirm Dialog: "Trừ 2,500 OGN cho Auto AI Lv3?"
  → POST /api/game/auto-play/rent { level: 3 }
  → toast.success("Đã thuê Auto AI Lv3 — 7 ngày")
  → refetch useAutoPlayLevel()
```

**Mua AVAX (custodial):**
```
Nút "Mua vĩnh viễn"
  → PIN Modal (reuse PinInputModal.tsx)
  → POST /api/game/auto-play/buy { level: 3 } (BE ký custodial)
  → toast.success("Đã mua Auto AI Lv3 — Vĩnh viễn!")
  → refetch useAutoPlayLevel()
```

**Mua AVAX (external wallet):**
```
Nút "Mua vĩnh viễn"
  → WalletSelectModal.tsx → chọn MetaMask/WalletConnect
  → sendAvaxPayment(amount, receiver)
  → POST /api/game/auto-play/buy { level: 3, txHash: "0x..." }
  → toast.success("Đã xác nhận thanh toán!")
```

**Files cần sửa:**
- `src/shared/api/api-autoplay.ts` (thêm `rent`, `buy`, cập nhật `getStatus`)
- Tạo `src/shared/hooks/useAutoPlayRent.ts`
- Tạo `src/shared/hooks/useAutoPlayBuy.ts`

---

#### Fight Screens — Check Subscription trước khi enable Auto

**Cần thêm trong BossFightCampaign.tsx (line ~137):**
```typescript
const { effectiveLevel } = useAutoPlayLevel();
// Truyền vào controller thay vì đọc từ localStorage
```

**Expiry Warning component (mới):**
```tsx
{daysUntilExpiry !== null && daysUntilExpiry <= 2 && (
  <ExpiryBanner message={`Auto AI hết hạn trong ${daysUntilExpiry} ngày`} />
)}
```

---

#### `api-autoplay.ts` — Cập nhật stubs

```typescript
// Thêm vào api-autoplay.ts
export const autoPlayApi = {
  getStatus: () => apiGet<AutoPlayStatus>('/api/game/auto-play/status'),
  rent: (level: number) => apiPost('/api/game/auto-play/rent', { level }),
  buy: (level: number, txHash?: string) => apiPost('/api/game/auto-play/buy', { level, txHash }),
  cancelRent: () => apiPost('/api/game/auto-play/cancel-rent'),
};
```

---

### 2.4 Migration Path

**Step 1: Backend DB + API (không đụng FE)**
1. Tạo `auto-subscriptions.ts` schema
2. Run `bunx drizzle-kit push` để migrate DB
3. Tạo `auto-play.service.ts` với logic rent/buy
4. Tạo `auto-play.routes.ts` với 4 endpoints
5. Mount routes vào `game/index.ts`
6. Test bằng curl/Postman

**Step 2: Frontend hook đổi sang API**
1. Cập nhật `api-autoplay.ts` (thêm types + methods)
2. Refactor `useAutoPlayLevel.ts` dùng TanStack Query
3. Cập nhật `BossFightCampaign.tsx` + `BossFightM3.tsx` dùng hook mới
4. Backward compat: nếu API lỗi, fallback `effectiveLevel = 1`

**Step 3: Shop UI redesign**
1. Thêm tab Thuê/Mua vào `AutoPlayShopSection.tsx`
2. Wire payment flow (confirm dialog → API → toast → refetch)
3. Thêm ExpiryBanner component

**Step 4: Cron + cleanup**
1. Thêm expired rent cleanup vào `vip.cron.ts`
2. Add Redis cache cho status (TTL 5 phút, key: `autoplay:status:{userId}`)
3. QA toàn bộ flow

---

## 3. Battle Log for AI Training

### 3.1 Log Schema

**Tình trạng hiện tại:** Bảng `boss_battles` đã có field `battle_log JSONB DEFAULT []`
File: `src/modules/game/schema/boss-battles.ts` line 56:
```typescript
battleLog: jsonb('battle_log').$type<Record<string, unknown>[]>().default([]),
```

**→ Không cần tạo bảng mới.** Chỉ cần populate field này khi `completeBoss`.

**Proposed log structure per battle:**
```typescript
interface BattleLogEntry {
  // Summary (từ BattleStats interface, auto-learner.ts:17-28)
  bossId: number;
  bossArchetype: string;           // glass_cannon | assassin | tank | healer | controller
  won: boolean;
  totalTurns: number;
  turnLimit: number;
  timeSeconds: number;

  // Player final state
  playerHPPercent: number;

  // Gem usage breakdown
  gemsUsed: {
    atk: number;
    hp: number;
    def: number;
    star: number;
  };

  // Action counts
  dodgesUsed: number;
  ultsUsed: number;

  // Auto AI info
  autoAILevel: number;             // 0 = manual, 1-5 = AI level
  situationsEncountered: string[]; // List of unique situations during fight

  // Optional: per-turn data (chỉ khi AI active, level 4-5)
  turns?: TurnSnapshot[];          // Xem 3.2
}

interface TurnSnapshot {
  turn: number;
  situation: string;               // e.g. "playerCritical", "bossHighDef"
  scoreBefore: number;             // lastScore từ controller
  action: 'swap' | 'skill' | 'dodge' | 'ult';
  gemType?: 'atk' | 'hp' | 'def' | 'star';
}
```

**Size estimate:**
- Summary only: ~500 bytes/battle
- With turn snapshots (50 turns avg): ~2KB/battle
- 1000 battles/day × 2KB = **2MB/day** → Rất nhỏ, OK cho PostgreSQL

---

### 3.2 What to Log Per Battle

**Tier 1 — Summary (tất cả players, kể cả manual):**
Lấy từ `BattleStats` interface (auto-learner.ts:17-28) — đã track đủ.

| Field | Nguồn | Đã có? |
|-------|-------|--------|
| `won` | completeBoss input | ✅ |
| `bossArchetype` | BossFightCampaign.tsx → onBattleEnd | ✅ |
| `bossId` | completeBoss input | ✅ |
| `totalTurns` | controller.tickCount | ✅ |
| `gemsUsed` | controller.gemsUsed | ✅ |
| `playerHPPercent` | completeBoss input (playerHpPercent) | ✅ |
| `dodgesUsed` | completeBoss input (dodgeCount) | ✅ |
| `ultsUsed` | controller.ultsUsed | ❌ Cần thêm vào input |
| `timeSeconds` | completeBoss input (durationSeconds) | ✅ |
| `autoAILevel` | useAutoPlayLevel | ❌ Cần thêm vào input |

**Tier 2 — Per-turn snapshots (AI level 4-5 only):**

| Field | Nguồn | Đã có? |
|-------|-------|--------|
| `situation` per turn | controller.currentSituation | ✅ (per tick) |
| `lastScore` per turn | controller.lastScore | ✅ (per tick) |
| `action type` per turn | controller (swap/dodge/ult) | ❌ Cần thêm |

**Để thu thập per-turn:** Controller cần accumulate array `turnLog` rồi pass vào `onBattleEnd`.

**Tier 3 — Grid snapshots (optional, heavy):**
- ~200 bytes/grid × 50 turns = 10KB/battle
- Chỉ cần cho ML training level cao
- **Skip cho V1**, xem xét V2.

---

### 3.3 Frontend Changes

#### auto-controller.ts — Accumulate per-turn log

```typescript
// Thêm vào controller state (auto-controller.ts)
const turnLogRef = useRef<TurnSnapshot[]>([]);

// Trong mỗi tick (sau khi chọn action):
turnLogRef.current.push({
  turn: tickCountRef.current,
  situation: currentSituation,
  scoreBefore: lastScore,
  action: chosenAction,  // 'swap' | 'dodge' | 'ult' | 'skill'
  gemType: chosenGemType,
});

// Trong onBattleEnd callback → trả về turnLog
```

#### completeBoss mutation — Gửi log với result

**Hiện tại** (`completeBoss` input):
```typescript
{ bossId, won, totalDamage, durationSeconds, stars, playerHpPercent, dodgeCount, isCampaign, battleSessionId }
```

**Cần thêm:**
```typescript
{
  ultsUsed: number;           // Từ controller
  autoAILevel: number;        // Từ useAutoPlayLevel
  battleLog?: {
    gemsUsed: { atk, hp, def, star };
    situationsEncountered: string[];
    turns?: TurnSnapshot[];   // Chỉ Lv4-5
  };
}
```

**File cần sửa:**
- `src/modules/campaign/components/hooks/useBattleEnd.ts` — truyền thêm data
- `src/shared/api/api-boss.ts` — update type BossFightInput
- `src/shared/autoplay/auto-controller.ts` — accumulate turnLog

---

### 3.4 Backend Changes

#### completeBoss handler — Accept + store battleLog

**File:** `src/modules/game/routes/boss.ts`

```typescript
// Thêm vào BossFightInput (boss.service.ts:83-97):
ultsUsed?: number;
autoAILevel?: number;
battleLog?: {
  gemsUsed: { atk: number; hp: number; def: number; star: number };
  situationsEncountered: string[];
  turns?: Array<{ turn: number; situation: string; scoreBefore: number; action: string; gemType?: string }>;
};
```

**Trong completeCampaignFight handler**, sau khi validate session:
```typescript
// Sanitize log (max 100 turns, max 5KB)
const sanitizedLog = sanitizeBattleLog(input.battleLog, 100);

// Upsert vào boss_battles
await db.update(bossBattles)
  .set({
    battleLog: sanitizedLog,
    turnsUsed: input.totalTurns ?? 0,
    result: input.won ? 'win' : 'lose',
    ognEarned: reward.ogn,
    xpEarned: reward.xp,
  })
  .where(eq(bossBattles.id, battleId));
```

**Sanitize function** (chống abuse):
```typescript
function sanitizeBattleLog(log: unknown, maxTurns: number) {
  if (!log || typeof log !== 'object') return null;
  const l = log as BattleLog;
  return {
    gemsUsed: l.gemsUsed ?? { atk: 0, hp: 0, def: 0, star: 0 },
    situationsEncountered: (l.situationsEncountered ?? []).slice(0, 20),
    turns: (l.turns ?? []).slice(0, maxTurns).map(t => ({
      turn: Number(t.turn) || 0,
      situation: String(t.situation || '').slice(0, 30),
      scoreBefore: Number(t.scoreBefore) || 0,
      action: ['swap','dodge','ult','skill'].includes(t.action) ? t.action : 'swap',
      gemType: ['atk','hp','def','star'].includes(t.gemType) ? t.gemType : undefined,
    })),
  };
}
```

---

#### Storage Strategy

**Primary:** `boss_battles.battle_log JSONB` (đã có sẵn)

**Index cho analytics:**
```sql
-- Query fast để lấy battles theo archetype + outcome
CREATE INDEX boss_battles_log_archetype_idx
ON boss_battles USING gin((battle_log -> 'bossArchetype'));
```

**Auto-cleanup:** Thêm vào `vip.cron.ts`:
```typescript
// Xóa log chi tiết (turns) sau 30 ngày, giữ summary
await db.update(bossBattles)
  .set({ battleLog: sql`battle_log - 'turns'` })  // Xóa key 'turns' khỏi JSONB
  .where(and(
    lt(bossBattles.startedAt, subDays(new Date(), 30)),
    sql`battle_log ? 'turns'`
  ));
```

**Storage estimate:**
- 1,000 battles/day × 2KB = 2MB/day
- 30 days × 2MB = **60MB** → Rất nhỏ
- Sau 30 ngày cleanup turns: giữ ~500 bytes/battle = 15MB total

---

### 3.5 Offline Analysis Script (future)

**Query patterns để optimize AI weights:**

```sql
-- Win rate per archetype per AI level
SELECT
  battle_log->>'bossArchetype' AS archetype,
  (metadata->>'autoAILevel')::int AS ai_level,
  COUNT(*) FILTER (WHERE result = 'win') * 100.0 / COUNT(*) AS win_rate,
  AVG((battle_log->'gemsUsed'->>'atk')::int) AS avg_atk_gems,
  AVG((battle_log->'gemsUsed'->>'star')::int) AS avg_star_gems
FROM boss_battles
WHERE created_at > NOW() - INTERVAL '7 days'
  AND ai_level = 5
GROUP BY archetype, ai_level;

-- Most common situations in losing battles
SELECT
  jsonb_array_elements_text(battle_log->'situationsEncountered') AS situation,
  COUNT(*) AS loss_count
FROM boss_battles
WHERE result = 'lose' AND battle_log IS NOT NULL
GROUP BY situation ORDER BY loss_count DESC;
```

**Weight optimization pipeline:**
1. Query win-rate per situation per gem combo
2. Nếu `playerCritical` → HP gem thấp → tăng `situations.playerCritical.hp`
3. Export weights mới → update `auto-strategy.json`
4. FE rebuild (hoặc dynamic load từ API)

**Timeline:** Cần ~10,000 battles để có đủ data statistical significance.

---

## 4. Implementation Estimate

| Task | Complexity | Files | Est. Lines |
|------|-----------|-------|-----------|
| BE: `auto-subscriptions` schema | Low | 1 new | 60 |
| BE: `auto-play.service.ts` | Medium | 1 new | 200 |
| BE: `auto-play.routes.ts` | Low | 1 new | 120 |
| BE: Mount routes + middleware | Low | 1 edit | 10 |
| BE: `completeBoss` accept battleLog | Medium | 1 edit | 80 |
| BE: Sanitize + store battleLog | Low | 1 edit | 60 |
| BE: Cron cleanup + expiry check | Low | 1 edit | 30 |
| FE: `api-autoplay.ts` update | Low | 1 edit | 40 |
| FE: `useAutoPlayLevel.ts` refactor | Low | 1 edit | 60 |
| FE: `useAutoPlayRent.ts` hook | Low | 1 new | 50 |
| FE: `useAutoPlayBuy.ts` hook | Low | 1 new | 50 |
| FE: `AutoPlayShopSection.tsx` redesign | Medium | 1 edit | 200 |
| FE: ExpiryBanner component | Low | 1 new | 40 |
| FE: Fight screens use new hook | Low | 2 edit | 30 |
| FE: Controller accumulate turnLog | Medium | 1 edit | 80 |
| FE: `useBattleEnd.ts` extend input | Low | 1 edit | 40 |
| **TOTAL** | **Medium** | **17 files** | **~1,150 lines** |

---

## 5. Risks & Edge Cases

### Auto AI Business Model

| Risk | Mô tả | Mitigation |
|------|-------|-----------|
| **OGN insufficient** | Player không đủ OGN để thuê | Return `402 INSUFFICIENT_OGN`, FE hiện dialog "Cần thêm X OGN" |
| **AVAX tx pending** | TX chưa confirmed khi verify | Pessimistic: chờ 2 confirmations; set order expiry 10 phút |
| **Network offline** | App không load được status | Cache effectiveLevel trong localStorage, dùng làm fallback |
| **Stale cache** | Thuê xong nhưng game chưa refresh | `refetch()` sau mỗi rent/buy mutation; TanStack Query invalidate |
| **Level conflict** | Mua Lv3 + thuê Lv5 → dùng cái nào? | `effectiveLevel = max(purchasedLevel, rentedLevel nếu chưa hết hạn)` |
| **Rent expires mid-battle** | Thuê hết hạn đúng lúc đang đánh | Level check chỉ khi **bắt đầu trận**, không check trong battle |
| **Multi-device** | Mua trên web, play trên mobile | Dùng API thay localStorage → tự sync |
| **AVAX price volatility** | 0.020 AVAX = $2.60 hôm nay, $5 ngày mai | Option: rebalance giá AVAX theo USD peg (như topup packages) |
| **Free Lv1 cannibalization** | Lv2 không đủ khác biệt vs Lv1 | Hiển thị "win rate +35%" dựa trên battle log analytics |

### Battle Log

| Risk | Mô tả | Mitigation |
|------|-------|-----------|
| **Log too large** | Client gửi 10MB battleLog | `sanitizeBattleLog()` cap 100 turns, max size check BE |
| **Log injection** | Client gửi malicious JSONB | Sanitize tất cả fields, whitelist values |
| **FE tracks wrong turns** | turnLog drift nếu controller restart | Reset `turnLogRef` khi battle bắt đầu |
| **Storage explosion** | 10K players × 100 battles/day = 2GB/day | Chỉ lưu per-turn cho AI level 4-5; cleanup sau 30 ngày |
| **Replay bias** | AI học sai nếu data từ weak players | Filter: chỉ dùng data từ Lv5 AI cho weight optimization |

---

## 6. Decisions Summary

| Quyết định | Lựa chọn | Lý do |
|-----------|---------|-------|
| Thuê OGN hay Seed? | **OGN** | OGN là currency game chính, có sẵn balance |
| Mua: AVAX hay Stripe? | **AVAX** (custodial + external) | Consistent với VIP flow |
| Storage: new table hay extend? | **Extend `boss_battles`** | battleLog JSONB đã có sẵn |
| Expiry check: lazy hay cron? | **Lazy** (khi gọi /status) | Đơn giản hơn, đủ dùng |
| Per-turn log: all levels hay Lv4-5? | **Lv4-5 chỉ** | Lv1-3 data ít giá trị cho ML |
| Cache strategy: Redis hay TanStack? | **TanStack Query** (staleTime 5m) | Đủ dùng, không cần Redis thêm |
| Backward compat: giữ localStorage? | **Fallback only** | Nếu API error → effectiveLevel = 1 |
