# SCAN + TEST Report — Phase 1-4 (Prompt 1→7)
**Ngày:** 2026-02-28
**Phạm vi:** Combat Constants, Anti-Cheat, Player Skills, Fragments/Drops, Recipe Crafting + Farm Integration

---

## 1. TYPE CHECK

| Metric | Value |
|--------|-------|
| Tổng errors | 110 |
| Errors từ Prompt 1-7 | **0** |
| Errors cũ (pre-existing) | 110 |

**Pre-existing errors (KHÔNG liên quan Prompt 1-7):**
- `custodial-wallet.service.ts` — 17 errors (TS18048)
- `rwa.routes.ts` — 15 errors
- `delivery-blockchain.service.ts` — 15 errors
- `delivery-label.service.ts` — 14 errors
- `delivery.routes.ts` — 1 error
- `delivery.service.ts` — 2 errors
- `sensor-blockchain.service.ts` — 18 errors
- `smart-wallet.service.ts` — 11 errors
- `topup.admin.service.ts` — 3 errors
- `vip/payment.service.ts` — 14 errors

**Kết luận:** Code Prompt 1-7 **KHÔNG có type errors**. Tất cả 110 errors là pre-existing.

### Runtime Status
- PM2: 2 instances online, uptime 12m, 240MB RAM each
- Runtime error phát hiện: `ERR_INVALID_ARG_TYPE` — Date object passed as string trong `seed_conversions` query (KHÔNG liên quan Prompt 1-7)
- `TimeoutNegativeWarning` từ postgres reconnect — non-critical

---

## 2. DATABASE

| Table | Exists | Rows | Schema OK | Data OK |
|-------|--------|------|-----------|---------|
| player_skills | ✅ | 21 | ✅ | ✅ |
| fragment_definitions | ✅ | 30 | ✅ | ✅ |
| player_fragments | ✅ | 0 | ✅ | N/A |
| boss_drops | ✅ | 0 | ✅ | N/A |
| recipe_definitions | ✅ | 30 | ✅ | ✅ |
| player_recipes | ✅ | 0 | ✅ | N/A |
| active_farm_buffs | ✅ | 0 | ✅ | N/A |

### Fragment Definitions (30 records)
- 10 zones × 3 tiers = 30 ✅
- NULL fields: 0 ✅
- Duplicate fragment_keys: 0 ✅

### Recipe Definitions (30 records)
| Tier | Count | Yield | Time | Hours | Sell | Weather | NFT | Cross-Zone |
|------|-------|-------|------|-------|------|---------|-----|------------|
| common | 10 | 0.15 | 0 | 24 | 5,000 | false | false | false |
| rare | 10 | 0.30 | 0.20 | 48 | 25,000 | false | false | true |
| legendary | 10 | 0.50 | 0.30 | 72 | 100,000 | true | true | true |

**Tất cả giá trị khớp GDD v2** ✅

### Player Skills
| Skill | Players | Avg Level |
|-------|---------|-----------|
| sam_dong | 12 | 1.0 |
| ot_hiem | 5 | 1.0 |
| rom_boc | 4 | 1.0 |

- Total users with skills: 12
- Orphan records: 0 ✅
- Duplicate keys: 0 ✅

### Indexes
Đầy đủ indexes trên tất cả tables mới:
- `player_skills`: PK + user_skill_uniq
- `player_fragments`: PK + idx_user + user_fragment_uniq
- `boss_drops`: PK + idx_user + idx_user_dropped
- `player_recipes`: PK + idx_user
- `active_farm_buffs`: PK + idx_user + idx_expires
- `fragment_definitions`: PK + fragment_key_unique
- `recipe_definitions`: PK + recipe_key_unique

---

## 3. RECIPE SYSTEM (Prompt 7) — FOCUS

### 3.1 Fragment ↔ Recipe matching
- Recipe→Fragment mismatches: **0** ✅
- Matched pairs: **30/30** ✅
- Mỗi recipe_key có base_fragment tương ứng trong fragment_definitions cùng tier

### 3.2 Craft logic bugs

**BUG #1 — CRITICAL: craftRecipe() KHÔNG CÓ TRANSACTION**
- File: `recipe.service.ts` line ~140-185
- Fragment deduction (nhiều UPDATE) + recipe upsert KHÔNG wrapped trong `db.transaction()`
- **Hậu quả:** Nếu fail giữa chừng → fragments bị trừ nhưng recipe không được tạo
- **Race condition:** 2 request concurrent cùng lúc → có thể trừ fragments 2 lần

Craft logic flow (logic đúng, thiếu transaction):
1. Lookup recipe ✅
2. Validate total fragments = fragmentCost ✅
3. Validate tier match ✅
4. Validate same-zone minimum ✅
5. Check cross-zone allowed ✅
6. Check player owns enough ✅
7. ❌ Execute deduction + upsert **KHÔNG CÓ TRANSACTION**

### 3.3 Sell logic bugs

**BUG #2 — MEDIUM: sellRecipe() KHÔNG CÓ TRANSACTION**
- File: `recipe.service.ts` line ~194-215
- Recipe deduction + OGN addition KHÔNG wrapped
- **Hậu quả:** Concurrent sell khi quantity=1 → có thể sell 2 lần (double OGN)

Validation OK:
- `quantity <= 0` check ✅
- Zod validation `z.number().int().min(1).max(100)` ✅

### 3.4 Use logic bugs

**BUG #3 — MEDIUM: useRecipe() KHÔNG CÓ TRANSACTION**
- File: `recipe.service.ts` line ~222-265
- Recipe deduction + buff creation KHÔNG wrapped
- Tương tự concurrent issue

**MINOR #1: Không giới hạn số lượng active buffs**
- Player có thể activate unlimited buffs → stacking vô hạn
- Ví dụ: 10 legendary buffs = 1 + (10 × 0.50) = **6x yield multiplier**

### 3.5 Farm integration bugs

**BUG #4 — MEDIUM: timeReduction KHÔNG ĐƯỢC SỬ DỤNG**
- File: `farm.service.ts` — `calculateGrowth()` chỉ dùng `plantedAt` + `growthDurationMs`
- `getYieldMultiplier()` trả về `{ yieldMultiplier, immuneWeather }` nhưng **KHÔNG** trả về `timeReduction`
- Rare (+20% time) và Legendary (+30% time) buffs lưu vào DB nhưng **không có effect thực**
- `calculateGrowth()` ở line đầu hoàn toàn ignore buff:
  ```
  function calculateGrowth(plantedAt, growthDurationMs, now?) { ... }
  // Không nhận timeReduction parameter
  ```

**BUG #5 — LOW: immuneWeather KHÔNG ĐƯỢC CHECK**
- `getYieldMultiplier()` trả về `immuneWeather` nhưng farm.service.ts không dùng
- Hiện tại chưa có weather penalty system nên impact thấp

**OK:** Yield multiplier applied đúng chỗ:
- `harvestPlot()` gọi `recipeService.getYieldMultiplier(userId)` ✅
- `buffedOGN = Math.floor(plantType.rewardOGN * yieldMultiplier)` ✅
- `buffedXP = Math.floor(plantType.rewardXP * yieldMultiplier)` ✅
- Game action log ghi nhận `yieldMultiplier` + `baseOgn` ✅

### 3.6 Cross-zone validation bugs
- Common: same_zone_min=10, cross_zone=false ✅
- Rare: same_zone_min=5, cross_zone=true ✅
- Legendary: same_zone_min=5, cross_zone=true ✅
- Code validate đúng: nếu cross_zone=false + fragment khác zone → throw `CROSS_ZONE_NOT_ALLOWED` ✅

---

## 4. SKILL SYSTEM (Prompt 3-5)

### 4.1 Schema + seed OK
- Schema: `player_skills` table đúng cấu trúc ✅
- Unique constraint: `(userId, skillId)` ✅
- SKILL_DEFINITIONS: 3 skills × 5 levels, data đầy đủ ✅
- Data: 21 rows, 12 users ✅

### 4.2 Upgrade logic bugs

**BUG #6 — CRITICAL: upgradeSkill() KHÔNG CÓ TRANSACTION**
- File: `skill.service.ts` line ~155-230
- OGN check → fragment consume → OGN deduct → skill update — 4 bước KHÔNG wrap transaction
- **Worst case:** `consumeFragments` thành công → addOGN fail → fragments mất, OGN không trừ, skill không upgrade
- Note: Comment nói "// 8. Execute upgrade in transaction" nhưng **KHÔNG CÓ transaction thật**

Validation logic OK:
- Check skill exists ✅
- Check unlocked ✅
- Check level < 5 ✅
- Check boss clear requirement ✅
- Check OGN sufficient ✅
- Check fragments sufficient ✅

### 4.3 Combat integration bugs
- `skill-processor.ts` handles all 3 skills properly ✅
- Reflect cap 10% maxHP ✅ (line in `applyRomBocToIncoming`)
- ULT level scaling + stun + pierceShield ✅
- Buff expiry + cooldown tick ✅
- Ớt Hiểm cleanse + crit bonus + DEF bypass ✅

**NOTE #1: Skill levels NOT loaded from DB in boss routes**
- `boss.ts` routes không import/query player_skills
- Skill levels phải được truyền từ frontend hoặc loaded trong battle session creation
- Cần verify battle start endpoint load skills

### 4.4 Auto-unlock bugs
- `checkAndUnlockSkills()` logic đúng ✅
- sam_dong: 1+ boss cleared ✅
- ot_hiem: 4+ cleared ✅
- rom_boc: 8+ cleared ✅
- `onConflictDoNothing()` — xử lý duplicate đúng ✅
- Called sau campaign win trong boss.service.ts ✅

---

## 5. FRAGMENT/DROP SYSTEM (Prompt 6)

### 5.1 Drop rates OK
| Tier | Base Rate | Star 2 | Star 3 |
|------|-----------|--------|--------|
| None | 50% | 45% | 35% |
| Common | 35% | 35% | 35% |
| Rare | 12% | 17% | 22% |
| Legendary | 3% | 3% | 8% |
| Zone boss bonus | +10% rare | | |

Rates sum to 1.0 ✅

### 5.2 Pity counter logic
- Pity threshold: 20 fights without rare+ drop ✅
- Pity forces: 85% rare, 15% legendary ✅
- Counter resets on rare+ drop ✅
- Counter persists in boss_drops table ✅

### 5.3 Boss complete → drop hook
- `rollDrop()` called after campaign win ✅
- Parameters correct: `userId, bossId, zoneNumber, serverStars, isFirstClear, isBossTier` ✅
- Drop result included in API response: `...(dropResult && { drop: ... })` ✅
- First clear: guaranteed minimum (no "no drop") ✅

**BUG #7 — LOW: consumeFragments ignores tier**
- `consumeFragments(userId, amount)` — consumes ANY tier (common first, then rare, then legendary)
- Skill upgrade could eat valuable rare/legendary fragments
- `recipe.service.ts` craft properly validates tier per fragment ✅ (this is good)
- But skill service uses the generic consume — inconsistent

---

## 6. ANTI-CHEAT (Prompt 1-2)

### 6.1 Session enforcement
- `battle:{userId}:{bossId}` Redis key required ✅
- One-time use (deleted after validation) ✅
- Without session: `NO_ACTIVE_SESSION` error ✅

### 6.2 Combat constant fixes
- Shield cap: 80% max reduction ✅ (`Math.min(80, mech.damage_reduction || 0)`)
- Reflect cap: 10% maxHP ✅ (in skill-processor.ts)
- Rate limit: 2 req/s ✅
- Concurrent lock: 5s TTL, explicit release ✅
- Duration validation: min + max ✅
- Damage range: 0.8x–5x (campaign) ✅
- Daily win limit: 50/day ✅
- Daily OGN cap: 5,000/day ✅

---

## 7. ROUTE MOUNTING

| Route | Mounted | Auth | Tested |
|-------|---------|------|--------|
| `/game/skills` | ✅ | ✅ MISSING_TOKEN | ✅ |
| `/game/skills/upgrade` | ✅ | ✅ | Via Zod |
| `/game/fragments` | ✅ | ✅ MISSING_TOKEN | ✅ |
| `/game/recipes` | ✅ | ✅ MISSING_TOKEN | ✅ |
| `/game/recipes/inventory` | ✅ | ✅ | Via route def |
| `/game/recipes/craft` | ✅ | ✅ | Via route def |
| `/game/recipes/sell` | ✅ | ✅ | Via route def |
| `/game/recipes/use` | ✅ | ✅ | Via route def |
| `/game/recipes/buffs` | ✅ | ✅ | Via route def |

Tất cả routes mounted trong `routes/index.ts` ✅
Auth middleware (`authMiddleware` + `approvedMiddleware` + `ensurePlayerStats`) trên `/*` ✅

---

## 8. CROSS-SYSTEM ISSUES

- [x] Import chains OK — no circular dependencies
- [x] Schema exports OK — all new schemas in `schema/index.ts`
- [x] boss → skill hook (checkAndUnlockSkills) ✅
- [x] boss → drop hook (rollDrop) ✅
- [x] farm → recipe hook (getYieldMultiplier) ✅
- [x] skill → drop hook (consumeFragments) ✅
- [ ] **MISSING:** timeReduction NOT used in farm growth calculation
- [ ] **MISSING:** immuneWeather NOT used in farm (no weather penalty system)
- [ ] **NOTE:** Skill levels NOT loaded in boss routes (may be in battle session)

**Import Direction (no cycles):**
```
boss.service → skill.service → drop.service
boss.service → drop.service
farm.service → recipe.service → reward.service
```

---

## 9. SECURITY

- [x] SQL injection safe — Drizzle ORM parameterized queries
- [x] Negative quantity — Zod `z.number().int().min(1)` on sell/craft
- [x] Auth middleware on all game routes
- [x] Rate limit (2 req/s per user)
- [x] Concurrent battle lock
- [ ] **NO transactions on craft/sell/use/upgrade** — race condition risk
- [ ] **No max buff limit** — unlimited buff stacking possible

---

## 10. BUG LIST

| # | Severity | Location | Description | Suggested Fix |
|---|----------|----------|-------------|---------------|
| 1 | **CRITICAL** | `recipe.service.ts` craftRecipe() | NO TRANSACTION — fragment deduction + recipe insert not atomic. Concurrent craft can lose fragments. | Wrap in `db.transaction()` with SELECT FOR UPDATE on player_fragments |
| 2 | **MEDIUM** | `recipe.service.ts` sellRecipe() | NO TRANSACTION — recipe deduction + OGN add not atomic. Double sell possible. | Wrap in `db.transaction()` |
| 3 | **MEDIUM** | `recipe.service.ts` useRecipe() | NO TRANSACTION — recipe deduction + buff insert not atomic. | Wrap in `db.transaction()` |
| 4 | **MEDIUM** | `farm.service.ts` harvestPlot() | timeReduction from recipe buffs NOT applied to growth calculation. Rare/Legendary time bonuses have no effect. | Add timeReduction to `getYieldMultiplier()` return, apply to `calculateGrowth()` |
| 5 | **LOW** | `farm.service.ts` | immuneWeather returned but not used. No weather penalty system yet. | Implement when weather penalties added |
| 6 | **CRITICAL** | `skill.service.ts` upgradeSkill() | NO TRANSACTION — OGN deduct + fragment consume + skill update not atomic. Comment says "transaction" but no actual transaction. | Wrap in `db.transaction()` |
| 7 | **LOW** | `drop.service.ts` consumeFragments() | Consumes ANY tier fragments (common→rare→legendary). Skill upgrade can eat rare/legendary frags. | Add tier filter parameter or consume only common |
| 8 | **LOW** | `recipe.service.ts` useRecipe() | No max active buff limit. Player can stack unlimited buffs for extreme yield multiplier. | Add limit (e.g., max 3 active buffs) |

---

## 11. ĐỀ XUẤT FIX

| Priority | Bug # | Fix | Est. Effort |
|----------|-------|-----|-------------|
| **P0** | #1, #2, #3 | Wrap craftRecipe/sellRecipe/useRecipe trong `db.transaction()`. Dùng `SELECT ... FOR UPDATE` trên player_fragments/player_recipes rows. | 1-2 giờ |
| **P0** | #6 | Wrap upgradeSkill trong `db.transaction()`. Sequence: check OGN → lock player_stats → consume fragments → deduct OGN → update skill. | 1 giờ |
| **P1** | #4 | Thêm `timeReduction` vào `getYieldMultiplier()` return. Modify `calculateGrowth()` hoặc `harvestPlot()` để giảm effective growthDuration. | 30 phút |
| **P2** | #7 | Thêm tier parameter vào `consumeFragments(userId, tier, amount)`. Skill upgrade chỉ consume common fragments. | 30 phút |
| **P2** | #8 | Thêm check: `COUNT active_farm_buffs WHERE is_active=true` <= MAX_ACTIVE_BUFFS (suggest 3). | 15 phút |
| **P3** | #5 | Defer — implement khi có weather penalty system. | N/A |

---

## TỔNG KẾT

### Điểm mạnh
- **Type safety**: 0 new TypeScript errors từ 7 prompts code
- **Database**: Schema, seed data, indexes đều chính xác, khớp GDD
- **Anti-cheat**: 6-layer protection đầy đủ, session enforcement hoạt động
- **Combat integration**: skill-processor.ts xử lý đúng 3 skills, combat constants capped
- **Route mounting + Auth**: Tất cả routes mount đúng, auth middleware bảo vệ
- **Data integrity**: FK constraints, unique indexes, no orphans

### Điểm yếu cần fix NGAY
1. **4 service functions thiếu transaction** (craftRecipe, sellRecipe, useRecipe, upgradeSkill) — risk mất data khi concurrent
2. **timeReduction recipe buff không có effect** — Rare/Legendary buffs advertise time reduction nhưng farm code ignore

### Tổng: 8 bugs (2 CRITICAL, 3 MEDIUM, 3 LOW)
