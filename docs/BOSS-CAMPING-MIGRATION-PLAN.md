# Boss Camping Migration Plan

> Scan date: 2026-03-02 | Model: Opus 4.6

---

## 1. Phát Hiện Từ Scan

### 1.1 Backend Hiện Tại

**Công thức damage** (`world-boss.service.ts:calculateWorldBossDamage`):
```
baseDamage = player.atk × (score / 100)
comboMulti = min(3.0, 1 + maxCombo × 0.1)
specialMulti = min(2.5, 1 + specialGems × 0.15)
critMulti = isCrit ? 1.5 : 1.0  (critRate mặc định 5%)
finalDamage = clamp(baseDamage × comboMulti × specialMulti × critMulti, 100, 50000)
```

- **Input hiện tại:** `{ eventId, gemsMatched, maxCombo, specialGems, score }` — tất cả đều là match-3 metrics
- **Player stats nguồn:** DB `player_stats` → `getEffectiveStats()` → `atk = 100 + statAtk × 20`
- **Cooldown:** 20 giây cứng (`COOLDOWN_SECONDS = 20`), Redis key TTL
- **Redis atomic:** `decrBossHP` dùng `DECRBY` — atomic, không race condition
- **Per-user tracking:** Lua script atomic: hits, bestHit, maxCombo
- **Clamp:** MIN_DAMAGE=100, MAX_DAMAGE=50,000

**Validation route** (`world-boss.routes.ts`):
```
gemsMatched: clamp(3, 100)
maxCombo: clamp(0, 50)
specialGems: clamp(0, 20)
score: clamp(0, 10000)
```

### 1.2 Frontend Hiện Tại

**State machine** (`useWorldBossAttack.ts`) — 7 states:
| State | Mô tả | Sau migration |
|-------|--------|---------------|
| `idle` | Chờ player bấm | **GIỮ** — chờ bắt đầu tap |
| `match3` | Đang chơi match-3 overlay | **XÓA** |
| `submitting` | Đang gửi POST /attack | **ĐỔI** → batch submitting |
| `result` | Hiển thị damage 1.5s | **ĐỔI** → hiển thị ngay khi tap |
| `cooldown` | Đếm ngược 20s | **XÓA** (không cần cooldown lớn) |
| `boss_dead` | Boss đã chết | **GIỮ** |
| `error` | Lỗi kết nối | **GIỮ** |

**Flow hiện tại:**
```
idle → [bấm Tấn Công] → match3 → [chơi 5 lượt]
→ submitting → [POST /attack] → result (1.5s) → cooldown (20s) → idle
```

**Flow mới mong muốn:**
```
idle → [bấm Tấn Công liên tục] → (FE tích lũy damage, hiển thị float)
       ↓ (mỗi 3s interval)
       submitting → [POST /attack batch] → cập nhật HP → tiếp tục tap

[ngừng tap 5s] → flush cuối → idle
```

**Files FE world-boss:**
| File | Vai trò | Thay đổi? |
|------|---------|-----------|
| `useWorldBossAttack.ts` | State machine + API call | **REFACTOR LỚN** |
| `WorldBossMatch3.tsx` | Match-3 overlay 5 lượt | **XÓA/HIDE** |
| `AttackButton.tsx` | Nút tấn công + trạng thái | **SỬA** |
| `WorldBossScreen.tsx` | Main screen, import Match3 | **SỬA** |
| `DamageFloat.tsx` | Hiển thị damage popup | **GIỮ** |
| `api-world-boss.ts` | API caller | **SỬA payload** |
| `world-boss.types.ts` | TypeScript types | **SỬA** |
| `BossDisplay.tsx` | Boss sprite hiển thị | Giữ nguyên |
| `HpBar.tsx` | HP bar | Giữ nguyên |
| `LiveFeed.tsx` | Feed realtime | Giữ nguyên |

**WorldBossMatch3.tsx** — Component riêng biệt cho world boss, KHÔNG dùng ở nơi khác. Import từ `@/shared/match3/board.utils` nhưng bản thân component chỉ dùng trong `WorldBossScreen`. An toàn để xóa.

---

## 2. Phương Án Đề Xuất

### PHƯƠNG ÁN A: FE Tính Damage + Backend Tin Tưởng (Nhanh, Rủi ro cao)

**Mô tả:** FE tự tính damage mỗi tap dựa trên player stats (cache từ API), gom 3s gửi `{ totalDamage, hitsCount }` lên BE. BE tin tưởng totalDamage, chỉ clamp.

**FE changes:**
- `useWorldBossAttack.ts` → refactor thành `useBossCampingAttack.ts`
- `AttackButton.tsx` → đổi thành nút tap liên tục (không disable khi đang đánh)
- `WorldBossScreen.tsx` → xóa Match3 overlay, thêm damage float mỗi tap
- `api-world-boss.ts` → đổi payload `attack()`
- `world-boss.types.ts` → đổi `WorldBossAttackData`

**BE changes:**
- `world-boss.routes.ts` → đổi validation schema
- `world-boss.service.ts` → đổi `submitAttack()` nhận `{ totalDamage, hitsCount }`, bỏ `calculateWorldBossDamage` cho camping
- `world-boss.redis.ts` → giảm cooldown xuống 3s hoặc bỏ

**Risk:** **HIGH** — Client gửi damage tùy ý → cheat dễ dàng. Cần anti-cheat validation.
**Effort:** ~4-6 giờ
**Ưu:** Nhanh implement, FE responsive ngay
**Nhược:** Exploit nghiêm trọng — player hack totalDamage

---

### PHƯƠNG ÁN B: Backend Tính Damage, FE Gửi Hit Count (Khuyến nghị)

**Mô tả:** FE chỉ gửi `{ hitsCount }` mỗi 3s. BE tự tính damage = `hitsCount × playerDamagePerHit`. Player damage per hit tính từ DB stats + random variance. FE hiển thị damage ước tính (optimistic UI).

**FE changes:**
- `useWorldBossAttack.ts` → refactor: đếm clicks, interval 3s gửi hitsCount
- `AttackButton.tsx` → nút tap liên tục, hiển thị DPS thay vì cooldown
- `WorldBossScreen.tsx` → xóa Match3, thêm tap animation
- `DamageFloat.tsx` → hiển thị ước tính mỗi tap (dùng cached player ATK)
- `api-world-boss.ts` → đổi payload
- `world-boss.types.ts` → đổi types

**BE changes:**
- `world-boss.routes.ts` → validation: `{ eventId, hitsCount: clamp(1, 30) }`
- `world-boss.service.ts`:
  - `submitAttack()` → nhận `hitsCount`, gọi `calculateCampingDamage(stats, hitsCount)`
  - Thêm `calculateCampingDamage()`: `damage = hitsCount × (atk × 0.5 + random(0, atk × 0.2))`
  - Cooldown đổi thành 3s (hoặc dùng rate limit: max 1 request/3s)
- `world-boss.redis.ts` → setCooldown thành 3s

**Risk:** **LOW** — Server kiểm soát damage, client chỉ gửi số clicks (clamp 1-30 per 3s = max 10 clicks/s hợp lý)
**Effort:** ~6-8 giờ
**Ưu:** An toàn, server-authoritative, anti-cheat tự nhiên
**Nhược:** Hơi phức tạp hơn, damage float FE là ước tính (có thể sai nhẹ so với BE)

---

## 3. Implementation Plan (Phương Án B — Khuyến Nghị)

### 3.1 Backend Changes

#### Step 1: Thêm `calculateCampingDamage()` trong `world-boss.service.ts`
```typescript
const CAMPING_COOLDOWN = 3; // 3s thay vì 20s
const MAX_HITS_PER_BATCH = 30; // anti-cheat: max 10 clicks/s × 3s

export function calculateCampingDamage(
  stats: { atk: number; critRate?: number; critDmg?: number },
  hitsCount: number,
): { totalDamage: number; isCrit: boolean; hits: number } {
  let totalDamage = 0;
  let anyCrit = false;
  const safeHits = Math.min(hitsCount, MAX_HITS_PER_BATCH);

  for (let i = 0; i < safeHits; i++) {
    // Base per-hit = 50% ATK + random 0-20% ATK
    const perHit = stats.atk * 0.5 + Math.random() * stats.atk * 0.2;
    const isCrit = Math.random() < (stats.critRate ?? 0.05);
    if (isCrit) anyCrit = true;
    totalDamage += Math.floor(perHit * (isCrit ? (stats.critDmg ?? 1.5) : 1.0));
  }

  return {
    totalDamage: Math.max(MIN_DAMAGE, Math.min(MAX_DAMAGE * 2, totalDamage)),
    isCrit: anyCrit,
    hits: safeHits,
  };
}
```

#### Step 2: Đổi `submitAttack()` — dual mode (giữ backward compat tạm thời)
```typescript
export type CampingAttackData = {
  eventId: string;
  hitsCount: number;
  mode: 'camping';
};

// submitAttack detect mode từ payload
// Nếu có `mode: 'camping'` → dùng calculateCampingDamage
// Nếu có `score` → legacy match-3 (giữ tạm, xóa sau)
```

#### Step 3: Route validation
```typescript
// Thêm camping schema
const campingSchema = {
  eventId: string,
  hitsCount: number (1-30),
  mode: 'camping',
};
```

#### Step 4: Cooldown 3s
```
COOLDOWN_SECONDS = 3 (cho camping mode)
```

### 3.2 Frontend Changes

#### Step 1: Tạo hook `useBossCampingAttack.ts`
```typescript
export type CampingState = 'idle' | 'attacking' | 'submitting' | 'boss_dead' | 'error';

export function useBossCampingAttack(eventId: string | undefined) {
  const [state, setState] = useState<CampingState>('idle');
  const pendingHits = useRef(0);
  const batchTimer = useRef<ReturnType<typeof setInterval>>();
  const [estimatedDamage, setEstimatedDamage] = useState(0);
  const [lastResult, setLastResult] = useState<WorldBossAttackResult | null>(null);

  // Cached player ATK for optimistic damage display
  const playerAtk = useRef(100); // fetch from player stats or profile

  const startAttacking = useCallback(() => {
    if (state !== 'idle') return;
    setState('attacking');
    batchTimer.current = setInterval(flushBatch, 3000);
  }, [state]);

  const onTap = useCallback(() => {
    if (state !== 'attacking' && state !== 'idle') return;
    if (state === 'idle') startAttacking();

    pendingHits.current += 1;
    // Optimistic damage float
    const estDmg = Math.floor(playerAtk.current * 0.5 + Math.random() * playerAtk.current * 0.2);
    setEstimatedDamage(estDmg);
  }, [state, startAttacking]);

  const flushBatch = useCallback(async () => {
    if (pendingHits.current === 0) return;
    const hits = pendingHits.current;
    pendingHits.current = 0;

    try {
      const result = await worldBossApi.campingAttack({ eventId, hitsCount: hits, mode: 'camping' });
      setLastResult(result);
      // Handle boss dead, errors...
    } catch { /* error handling */ }
  }, [eventId]);

  const stopAttacking = useCallback(() => {
    clearInterval(batchTimer.current);
    flushBatch(); // flush remaining
    setState('idle');
  }, [flushBatch]);

  // Cleanup on unmount
  useEffect(() => () => {
    clearInterval(batchTimer.current);
  }, []);

  return { state, onTap, stopAttacking, estimatedDamage, lastResult };
}
```

#### Step 2: Sửa `AttackButton.tsx`
- State `idle`: Nút "Tấn Công" — bấm để bắt đầu
- State `attacking`: Nút "Đang tấn công..." — tap liên tục, animation pulse
- Xóa state `match3`, `cooldown`

#### Step 3: Sửa `WorldBossScreen.tsx`
- Xóa import `WorldBossMatch3`
- Xóa `{combat.state === 'match3' && <WorldBossMatch3 ... />}`
- Đổi `AttackButton onPress` → `onTap` cho camping

#### Step 4: Sửa types + API
- `WorldBossAttackData` thêm variant camping
- `api-world-boss.ts` thêm `campingAttack()` hoặc đổi `attack()`

### 3.3 Batch Logic — Chi Tiết

```
Player tap liên tục:
  tap → pendingHits++ → hiển thị DamageFloat (ước tính)
  tap → pendingHits++ → hiển thị DamageFloat
  tap → pendingHits++ → hiển thị DamageFloat
  ...

  [3s interval fires]
  → POST /attack { eventId, hitsCount: N, mode: 'camping' }
  → BE: damage = calculateCampingDamage(playerStats, N)
  → BE: Redis DECRBY hp, ZINCRBY damage, setCooldown 3s
  → Response: { damage, newBossHp, bossHpPercent, ... }
  → FE: cập nhật HP bar, leaderboard

  [Player ngừng tap]
  → 5s inactivity timer → flush cuối → state = idle
```

### 3.4 Anti-Cheat

| Vector | Mitigation |
|--------|-----------|
| Client gửi hitsCount > 30 | BE clamp: `min(hitsCount, 30)` |
| Client gửi request < 3s | Redis cooldown 3s, trả 429 |
| Bot auto-tap | Rate limit: max 10 clicks/s thực tế = 30 hits/3s = ~1500 damage/3s (chấp nhận được) |
| Modified client gửi damage | Server tự tính damage, không tin client |

### 3.5 Redis — Tương Thích

- `decrBossHP(eventId, damage)` → DECRBY atomic — **KHÔNG thay đổi**, vẫn hoạt động với camping
- `addDamage(eventId, userId, damage, ttl)` → ZINCRBY — **KHÔNG thay đổi**
- `setCooldown(eventId, userId, 3)` → chỉ đổi TTL 20→3
- `trackUserStats` → vẫn dùng Lua script, truyền maxCombo=0 cho camping

**Kết luận:** Redis layer KHÔNG cần sửa gì, chỉ đổi tham số cooldown.

---

## 4. Migration Checklist

- [ ] BE: Thêm `calculateCampingDamage()` trong `world-boss.service.ts`
- [ ] BE: Sửa `submitAttack()` hỗ trợ dual mode (match3 + camping)
- [ ] BE: Sửa route validation hỗ trợ camping payload
- [ ] BE: Test trên VPS, restart PM2
- [ ] FE: Tạo `useBossCampingAttack.ts` hook mới
- [ ] FE: Sửa `AttackButton.tsx` — tap liên tục
- [ ] FE: Sửa `WorldBossScreen.tsx` — xóa Match3 overlay
- [ ] FE: Sửa types + API layer
- [ ] FE: Test local
- [ ] FE: Build + deploy
- [ ] Cleanup: Xóa `WorldBossMatch3.tsx` (sau khi ổn định)
- [ ] Cleanup: Xóa match3 mode từ BE (sau 1 tuần)

---

## 5. Damage Balance — So Sánh

| Metric | Match-3 (hiện tại) | Camping (mới) |
|--------|-------------------|---------------|
| DPS cycle | 20s cooldown + 5 lượt match3 ≈ 25s | 3s batch, tap liên tục |
| Damage/cycle | 100–50,000 (phụ thuộc skill match3) | hitsCount × (ATK×0.5 + rand) |
| Player ATK=100 | ~100-3000 per cycle | ~5-10 hits × 50-70 = 250-700 per 3s |
| Player ATK=500 | ~500-15000 per cycle | ~5-10 hits × 250-350 = 1250-3500 per 3s |
| Engagement | Puzzle (skill-based) | Tap (action-based, casual) |
| Anti-cheat | Khó hack match3 score | Server tính, clamp hits |

**Note:** Cần tune hệ số `0.5` và `0.2` cho phù hợp. Boss HP hiện tại (normal: 5k-50k, extreme: 200k-1M) có thể cần điều chỉnh nếu DPS tăng đáng kể.
