# OGN & XP ECONOMY ANALYSIS — FARMVERSE

> **Scan Date:** 2026-02-15
> **Status:** CRITICAL — Multiple economy-breaking exploits found
> **Scope:** All OGN income/XP sources, all sinks, cross-check with proposed new level table

---

## 1. EXECUTIVE SUMMARY

| Metric | Legit Play (3h/day) | Exploit Play (3h/day) | Ratio |
|--------|--------------------:|----------------------:|------:|
| OGN/day | **3,955** | **35,635** | 9x |
| XP/day | **1,181** | **114,581** | 97x |
| Days to Lv50 | **11.1** | **0.11** (2.7h) | 100x |
| Days to Lv100 | **63.6** | **0.66** (15.7h) | 97x |

**Verdict:** The proposed plant data is well-balanced, but 3 other systems completely break the economy:
1. **Boss fights** — NO cooldown, NO daily limit → 18,000 XP/hr
2. **Bug catch sync** — 30/min cap too high → 14,400 XP/hr
3. **Current wheat DB** — 30s growth time → 27,000 OGN/hr

---

## 2. ALL OGN & XP SOURCES — CURRENT PRODUCTION

### 2.1 FARMING (Harvest) — Database Values

Farm service reads `plant_types` table from DB, NOT from `plants.ts` hardcoded file.

**Current Production DB Values:**

| Plant | Buy | Sell (rewardOGN) | XP | Growth (DB) | Growth (plants.ts) |
|-------|----:|--:|---:|-------------|---------------------|
| Wheat | 50 | 100 | 5 | **30,000ms (30s!)** | 240,000ms (4min) |
| Tomato | 200 | 400 | 25 | 120,000ms (2min) | 120,000ms (2min) |
| Carrot | 280 | 560 | 25 | 150,000ms (2.5min) | 150,000ms (2.5min) |
| Chili | 400 | 800 | 25 | 200,000ms (3.3min) | 200,000ms (3.3min) |

> **BUG:** Wheat has 30s growth in DB but 4min in `plants.ts`. DB wins because `farm.service.ts` queries `plant_types` table directly.

**Current Production Income (6 plots, active play):**

| Plant | Net Profit/harvest | Harvests/hr/plot | OGN/hr (6 plots) | XP/hr (6 plots) |
|-------|---------:|------:|-------:|-------:|
| Wheat | +50 | 120 | **36,000** | **3,600** |
| Tomato | +200 | 30 | **36,000** | **4,500** |
| Carrot | +280 | 24 | **40,320** | **3,600** |
| Chili | +400 | 18 | **43,200** | **2,700** |

> **ALL plants are broken** at current growth speeds. Even chili produces 43K OGN/hr.
> The 30-second wheat is the worst offender — a player can earn 36,000 OGN/hr just by spamming plant→wait 30s→harvest.

### 2.2 FARMING — PROPOSED NEW Plant Data

| Plant | Buy | Sell | XP | Growth | Net Profit |
|-------|----:|-----:|---:|--------|--------:|
| Wheat (Lúa Mì) | 50 | 100 | 5 | 15 min | +50 |
| Tomato (Cà Chua) | 200 | 400 | 15 | 1 hr | +200 |
| Carrot (Cà Rốt) | 400 | 800 | 30 | 3 hr | +400 |
| Chili (Ớt) | 800 | 1,600 | 50 | 6 hr | +800 |

**Proposed Income (6 plots, active play):**

| Plant | Harvests/hr/plot | OGN/hr (6 plots) | XP/hr (6 plots) | Play Style |
|-------|------:|-------:|-------:|------------|
| Wheat | 4 | **1,200** | **120** | Active (replant every 15min) |
| Tomato | 1 | **1,200** | **90** | Semi-active (replant every 1hr) |
| Carrot | 0.33 | **800** | **60** | Passive (replant every 3hr) |
| Chili | 0.167 | **800** | **50** | Very passive (replant every 6hr) |

> **BALANCED!** All plants converge around 800-1,200 OGN/hr. Active play (wheat) rewards more XP but same OGN as passive play. Good design.

### 2.3 BOSS FIGHTS — NO COOLDOWN! (CRITICAL EXPLOIT)

**Source:** `boss.service.ts` — Zero cooldown, zero daily limit.
**Anti-cheat:** Only `MIN_BOSS_DURATION_FACTOR = 0.005` (minimum fight time = HP × 0.005 seconds).

| Boss | HP | Min Duration | OGN | XP | Max Fights/hr | Max OGN/hr | Max XP/hr |
|------|---:|------:|----:|---:|------:|-------:|--------:|
| Rệp Xanh | 500 | 2.5s | 5 | 15 | 1,440 | 7,200 | **21,600** |
| Sâu Tơ | 800 | 4s | 8 | 25 | 900 | 7,200 | **22,500** |
| Bọ Rùa | 1,200 | 6s | 12 | 40 | 600 | 7,200 | **24,000** |
| Châu Chấu | 2,000 | 10s | 20 | 60 | 360 | 7,200 | **21,600** |
| Bọ Xít | 3,000 | 15s | 30 | 80 | 240 | 7,200 | **19,200** |
| Ốc Sên | 4,000 | 20s | 40 | 120 | 180 | 7,200 | **21,600** |
| Chuột Đồng | 5,000 | 25s | 50 | 150 | 144 | 7,200 | **21,600** |
| **Rồng Lửa** | 10,000 | **50s** | 80 | 250 | 72 | **5,760** | **18,000** |

> **All bosses yield ~7,200 OGN/hr and ~20,000 XP/hr** at minimum duration.
> Even at realistic 3x minimum duration, bosses yield 6,000-7,000 XP/hr — still economy-breaking.
>
> **"Realistic" Estimates (3× min duration):**
> - Rep Xanh (7.5s): 2,400 OGN/hr, **7,200 XP/hr**
> - Rồng Lửa (2.5min): 1,920 OGN/hr, **6,000 XP/hr**

### 2.4 QUIZ — Well Balanced

**Source:** `quiz.service.ts`
**Cooldown:** 5 min between quiz sessions. 5 questions per quiz.

| Metric | Per Correct | Per Wrong | Per Quiz (100%) | Per Hour (max 10 quizzes) |
|--------|---:|---:|---:|---:|
| OGN | 2 | 0 | 10 | **100** |
| XP | 5 | 1 | 25 | **250** |

> **BALANCED.** 100 OGN/hr and 250 XP/hr is reasonable. 5-min cooldown prevents spam. Good design.

### 2.5 SYNC ACTIONS — Bug Catch is BROKEN

**Source:** `sync.config.ts` — Sync every 60s. Caps per 60-second window.

| Action | OGN | XP | Cap/min | OGN/hr | XP/hr | Severity |
|--------|----:|---:|--------:|-------:|------:|----------|
| **bug_catch** | 2 | 8 | 30 | **3,600** | **14,400** | CRITICAL |
| xp_pickup | 0 | 5 | 10 | 0 | **3,000** | HIGH |
| sync_water | 1 | 2 | 20 | **1,200** | **2,400** | MEDIUM |
| daily_check | 5 | 5 | 1/day | 5/day | 5/day | OK |

> **Bug catch is the #1 XP exploit in the game.** At 14,400 XP/hr, a player reaches Lv100 (75,150 XP) in just 5.2 hours of tapping.
>
> **xp_pickup** is the #2 XP exploit at 3,000 XP/hr.
>
> **sync_water** gives 1,200 OGN/hr which is comparable to wheat farming — it should not be this high for a minigame tap action.

### 2.6 SOCIAL INTERACTIONS — Well Balanced

**Source:** `social.service.ts`

| Metric | Per Interaction | Daily Cap | Daily Total |
|--------|---:|---:|---:|
| OGN | 5 | 10 | **50** |
| XP | 3 | 10 | **30** |

> **BALANCED.** Hard daily cap of 10 interactions (50 OGN, 30 XP). Both players receive rewards. Good design.

### 2.7 DIRECT WATERING — Balanced

**Source:** `farm.service.ts` — 1-hour cooldown per plot via Redis.

| Metric | Per Plot | Plots | Cooldown | Per Hour |
|--------|---:|---:|---:|---:|
| OGN | 0 | 6 | 1hr | **0** |
| XP | 2 | 6 | 1hr | **12** |

> **BALANCED.** 12 XP/hr from watering is negligible. Cooldown prevents spam.

### 2.8 REFERRAL COMMISSION — Passive Income

**Source:** `social.service.ts` — `REFERRAL_COMMISSION_RATE = 0.05` (5%)

| Metric | Value |
|--------|-------|
| Commission Rate | 5% of referred user's OGN spending |
| Min per tx | 1 OGN |
| Max per tx | 500 OGN |
| Max friends | 100 |

> **Variable.** Passive income depends on referral network activity. If 10 active referrals each spend 1,000 OGN/day → 500 OGN/day passive. Reasonable with the 500 OGN/tx cap.

### 2.9 WELCOME BONUS — One-Time

| Metric | Value |
|--------|-------|
| Starting OGN | 1,250 |
| Enough for | 25× wheat, or 6× tomato, or 3× chili |

> **Reasonable.** Enough to start farming immediately but not enough to buy shop items.

### 2.10 MARKET PREDICT — NOT IMPLEMENTED

> Confirmed: No `market.service.ts` or predict endpoint exists on the production server. The `game_action_type` enum includes `market_predict` but it's unused.

---

## 3. ALL OGN SINKS

### 3.1 Planting Seeds

| Plant | Cost | Recovered at Harvest | Net Sink |
|-------|-----:|----:|---:|
| Wheat | 50 | 100 | -50 (profit) |
| Tomato | 200 | 400 | -200 (profit) |
| Carrot | 400 | 800 | -400 (profit) |
| Chili | 800 | 1,600 | -800 (profit) |

> Planting is NOT a sink — it's an investment that always returns 2× (new data). Current production returns 2× for all except carrot (2× shopPrice).

### 3.2 Shop Purchases

| Category | Price Range | Count | Total OGN to Buy All |
|----------|--------:|----:|----:|
| Seeds | 250 — 1,500 | 4 | 3,950 |
| Tools | 300 — 900 | 6 | 3,600 |
| Cards | 200 — 1,200 | 6 | 3,550 |
| NFTs | 1,500 — 5,000 | 6 | 18,500 |
| **TOTAL** | | **22** | **29,600** |

> Shop is the primary OGN sink. NFTs alone cost 18,500 OGN. At legit income of ~4,000 OGN/day, buying all NFTs takes ~5 days.
>
> **Note:** Shop items trigger referral commission (5% flows to referrer).

### 3.3 Level-Up OGN Fees (Proposed New Table)

> The user's proposal mentions OGN fees ranging from 100/lv to 18,000/lv. Exact per-tier breakdown was not provided in full. Estimated based on XP scaling:

| Tier | Levels | XP/lv | Est. OGN/lv | XP Total | OGN Total |
|------|--------|------:|----------:|-------:|--------:|
| 1-5 | 5 | 50 | ~100 | 250 | ~500 |
| 6-10 | 5 | 80 | ~160 | 400 | ~800 |
| 11-15 | 5 | 120 | ~240 | 600 | ~1,200 |
| 16-20 | 5 | 180 | ~360 | 900 | ~1,800 |
| 21-30 | 10 | 250 | ~500 | 2,500 | ~5,000 |
| 31-40 | 10 | 350 | ~700 | 3,500 | ~7,000 |
| 41-50 | 10 | 500 | ~1,000 | 5,000 | ~10,000 |
| 51-60 | 10 | 700 | ~1,400 | 7,000 | ~14,000 |
| 61-70 | 10 | 1,000 | ~2,000 | 10,000 | ~20,000 |
| 71-80 | 10 | 1,200 | ~2,400 | 12,000 | ~24,000 |
| 81-90 | 10 | 1,500 | ~3,000 | 15,000 | ~30,000 |
| 91-100 | 10 | 1,800 | ~3,600 | 18,000 | ~36,000 |
| **TOTAL** | **99** | | | **75,150** | **~150,300** |

> Level-up fees are a significant OGN sink: ~150K OGN total to reach Lv100. At legit income of ~4K OGN/day (minus planting costs), this takes **~50+ days** of pure saving. This is healthy progression IF exploits are fixed.

---

## 4. INCOME vs LEVEL COST — CROSS-CHECK

### 4.1 Legit Play Progression (3h/day, wheat farming + quiz + social)

| Income Source | OGN/day | XP/day |
|---------------|-------:|-------:|
| Wheat farming (6 plots, NEW 15min) | 3,600 | 360 |
| Quiz (10 quizzes/hr × 3h) | 300 | 750 |
| Social (daily cap) | 50 | 30 |
| Direct watering (6 plots) | 0 | 36 |
| Daily check | 5 | 5 |
| **TOTAL** | **3,955** | **1,181** |

**Progression Timeline (legit play, 1,181 XP/day):**

| Level | Cumulative XP | Days | Calendar |
|------:|--------:|-----:|----------|
| 5 | 250 | 0.2 | Day 1 |
| 10 | 650 | 0.6 | Day 1 |
| 15 | 1,250 | 1.1 | Day 2 |
| 20 | 2,150 | 1.8 | Day 2 |
| 30 | 4,650 | 3.9 | Day 4 |
| 40 | 8,150 | 6.9 | Week 1 |
| 50 | 13,150 | **11.1** | Week 2 |
| 60 | 20,150 | 17.1 | Week 3 |
| 70 | 30,150 | 25.5 | Week 4 |
| 80 | 42,150 | 35.7 | Week 5 |
| 90 | 57,150 | 48.4 | Week 7 |
| 100 | 75,150 | **63.6** | Week 9 |

> **HEALTHY progression curve** — Lv50 in ~2 weeks, Lv100 in ~2 months of daily play. This is good for retention IF AND ONLY IF exploits are patched.

### 4.2 OGN Balance Check (Legit Play)

**Net daily OGN = Income - Planting Cost**
- Wheat farming: plant 6 × 4/hr × 3h = 72 plants × 50 = 3,600 OGN spent → 7,200 OGN earned → Net: +3,600
- Quiz: +300
- Social: +50
- Daily check: +5
- **Net daily income: ~3,955 OGN**

**Daily OGN sinks (estimated):**
- Re-planting: already counted above (cost baked into net profit)
- Level-up fees: ~1,500 OGN/day average (150K / 100 days)
- Shop: variable

**OGN surplus: ~2,500 OGN/day** (after level-up fees, before shop)

> This is healthy. Players accumulate ~2,500 OGN/day for shop purchases after covering level costs. It takes ~12 days of saving to buy the most expensive NFT (5,000 OGN).

### 4.3 EXPLOIT PLAY — Economy Destruction

| Source | OGN/day (3h) | XP/day (3h) |
|--------|-------:|--------:|
| Bug catch (14,400 XP/hr) | 10,800 | **43,200** |
| Boss spam (rong-lua, 72/hr) | 17,280 | **54,000** |
| XP pickup (3,000/hr) | 0 | **9,000** |
| Sync water (1,200/hr) | 3,600 | 7,200 |
| Legit sources | 3,955 | 1,181 |
| **TOTAL** | **35,635** | **114,581** |

**Exploit Progression:**

| Level | Days |
|------:|-----:|
| 50 | **0.11** (2.7 hours) |
| 100 | **0.66** (15.7 hours) |

> A cheater reaches Lv100 in less than 1 day. The economy is completely broken by these 3 exploits.

---

## 5. EXPLOIT SEVERITY RANKING

### CRITICAL (Economy-breaking, must fix before launch)

| # | Exploit | Income Rate | Severity | Root Cause |
|---|---------|--------:|----------|------------|
| 1 | **Boss spam (no limit)** | 18,000 XP/hr + 5,760 OGN/hr | CRITICAL | Zero cooldown, zero daily limit in `boss.service.ts` |
| 2 | **Bug catch spam** | 14,400 XP/hr + 3,600 OGN/hr | CRITICAL | `MAX_PER_WINDOW=30` in `sync.config.ts` too high (30/min = 1,800/hr) |
| 3 | **Wheat 30s growth (DB)** | 36,000 OGN/hr + 3,600 XP/hr | CRITICAL | `plant_types.growth_duration_ms = 30000` in DB, should be 900,000ms (15min) |

### HIGH (Significant imbalance)

| # | Issue | Impact | Root Cause |
|---|-------|--------|------------|
| 4 | XP pickup spam | 3,000 XP/hr | `MAX_PER_WINDOW=10` (10/min) in `sync.config.ts` |
| 5 | Sync water spam | 1,200 OGN/hr + 2,400 XP/hr | `MAX_PER_WINDOW=20` (20/min) — way too high for 6-plot game |
| 6 | Backend `plants.ts` vs DB mismatch | Confusion, potential bugs | Wheat: code=240s, DB=30s. DB wins. |

### MEDIUM (Design concerns)

| # | Issue | Impact | Details |
|---|-------|--------|---------|
| 7 | FE `XP_REWARDS` mismatch | UI shows wrong XP gains | FE: water=5, plantSeed=10. BE: water=2, plantSeed=0 |
| 8 | Harvest not logged in `game_actions` | Can't audit XP/OGN from harvests | `farm.service.ts` missing `gameActions.insert()` call in `harvestPlot()` |
| 9 | No global daily XP cap | Uncapped total XP/day | No system-wide daily XP ceiling |

### LOW (Minor)

| # | Issue | Impact |
|---|-------|--------|
| 10 | Current `XP_PER_LEVEL=100` in production | Needs update to new progressive table |
| 11 | Ghost plant types in game_actions | corn/sunflower/lettuce in DB, don't exist |
| 12 | Market predict unimplemented | Enum exists but no service |

---

## 6. INCOME RATE COMPARISON — ALL SOURCES

**Sorted by XP/hr (descending) — shows where the economy breaks:**

| Rank | Source | OGN/hr | XP/hr | Daily Cap? | Verdict |
|-----:|--------|-------:|------:|:----------:|---------|
| 1 | Boss spam (rong-lua) | 5,760 | **18,000** | NO | BROKEN |
| 2 | Bug catch (sync) | 3,600 | **14,400** | 30/min | BROKEN |
| 3 | Boss spam (rep-xanh) | 7,200 | **7,200** | NO | BROKEN |
| 4 | XP pickup (sync) | 0 | **3,000** | 10/min | HIGH |
| 5 | Sync water (sync) | 1,200 | **2,400** | 20/min | HIGH |
| 6 | Wheat (CURRENT 30s DB) | 36,000 | **3,600** | NO | BROKEN |
| 7 | Quiz | 100 | **250** | 5min CD | OK |
| 8 | Wheat (NEW 15min) | 1,200 | **120** | NO | OK |
| 9 | Tomato (NEW 1hr) | 1,200 | **90** | NO | OK |
| 10 | Carrot (NEW 3hr) | 800 | **60** | NO | OK |
| 11 | Chili (NEW 6hr) | 800 | **50** | NO | OK |
| 12 | Social interactions | ~17/hr | **10** | 10/day | OK |
| 13 | Direct watering | 0 | **12** | 1hr/plot | OK |
| 14 | Daily check | 5/day | **5/day** | 1/day | OK |
| 15 | Referral commission | Variable | **0** | 500/tx | OK |

> **Pattern:** Sources with proper cooldowns/caps (quiz, social, watering, daily check) are balanced.
> Sources without limits (boss, sync actions) are catastrophically broken.

---

## 7. INVENTORY SELL SYSTEM — Analysis

**Source:** `inventory.service.ts`

**Sell Formula:** `sellPrice = shopPrice × 1.1 × seasonMultiplier × freshnessMultiplier`

| Multiplier | Condition | Value |
|-----------|-----------|------:|
| Season (in) | Plant's available months match current month | 2.0 |
| Season (off) | Out of season | 0.4 |
| Fresh (>50%) | Just harvested | 1.0 |
| Aging (20-50%) | Been sitting a while | 0.7 |
| Old (0-20%) | About to expire | 0.4 |
| Expired | Past expiry | 0 (can't sell) |

**Sell Prices (NEW plant data, in-season, fresh):**

| Plant | Shop Price | Sell (direct) | Sell (inventory, in-season fresh) |
|-------|---:|---:|---:|
| Wheat | 50 | 100 | 50 × 1.1 × 2.0 = **110** |
| Tomato | 200 | 400 | 200 × 1.1 × 2.0 = **440** |
| Carrot | 400 | 800 | 400 × 1.1 × 2.0 = **880** |
| Chili | 800 | 1,600 | 800 × 1.1 × 2.0 = **1,760** |

> **Note:** Currently harvest gives OGN directly (rewardOGN). If harvest→inventory flow is implemented, the sell formula gives ~10% more than direct harvest (in-season, fresh). Off-season selling gives only 44% of shop price (shopPrice × 1.1 × 0.4 = 0.44 × shopPrice), which is a NET LOSS.
>
> **Design insight:** The seasonal system creates strategic depth — plant in-season crops for profit, off-season planting is risky.

---

## 8. DETAILED NERF RECOMMENDATIONS

### 8.1 Boss System — Add Daily Limit + Cooldown

```
CURRENT:  No cooldown, no daily limit → 18,000 XP/hr
PROPOSED: 5-min cooldown + 5 fights/day cap

With fix: 5 × 250 XP = 1,250 XP/day max (rong-lua)
          5 × 80 OGN = 400 OGN/day max
```

**Impact:** Reduces boss XP from 54,000/session to 1,250/day (43× nerf). Bosses become a supplementary XP source, not the primary one.

### 8.2 Bug Catch — Slash Cap + Add Daily Limit

```
CURRENT:  30/min = 1,800/hr × 8 XP = 14,400 XP/hr
PROPOSED: 5/min + 50/day cap

With fix: 50 × 8 = 400 XP/day max
          50 × 2 = 100 OGN/day max
```

**Impact:** Reduces bug catch XP from 43,200/session to 400/day (108× nerf). Bug catching becomes a fun mini-game, not an XP farm.

### 8.3 XP Pickup — Reduce Cap

```
CURRENT:  10/min = 600/hr × 5 XP = 3,000 XP/hr
PROPOSED: 3/min + 30/day cap

With fix: 30 × 5 = 150 XP/day max
```

### 8.4 Sync Water — Match Plot Count

```
CURRENT:  20/min = 1,200/hr × 1 OGN = 1,200 OGN/hr
PROPOSED: 6/min (= number of plots) + align with direct water cooldown

With fix: 6 × 1 = 6 OGN/min = 360 OGN/hr max
          Recommend removing sync water entirely —
          direct watering (farm.service.ts) already handles this.
```

### 8.5 Wheat Growth — Fix Database

```
CURRENT DB:  30,000ms (30 seconds!)
PROPOSED:    900,000ms (15 minutes, per new plant data)

SQL: UPDATE plant_types SET growth_duration_ms = 900000 WHERE id = 'wheat';
```

### 8.6 All Plant Data — Update Database to Match Proposal

```sql
-- NEW PLANT DATA
UPDATE plant_types SET
  growth_duration_ms = 900000,   -- 15 min
  reward_ogn = 100,
  reward_xp = 5,
  shop_price = 50
WHERE id = 'wheat';

UPDATE plant_types SET
  growth_duration_ms = 3600000,  -- 1 hr
  reward_ogn = 400,
  reward_xp = 15,
  shop_price = 200
WHERE id = 'tomato';

UPDATE plant_types SET
  growth_duration_ms = 10800000, -- 3 hr
  reward_ogn = 800,
  reward_xp = 30,
  shop_price = 400
WHERE id = 'carrot';

UPDATE plant_types SET
  growth_duration_ms = 21600000, -- 6 hr
  reward_ogn = 1600,
  reward_xp = 50,
  shop_price = 800
WHERE id = 'chili';
```

### 8.7 Global Daily XP Cap (NEW — Recommended)

```
PROPOSED: 2,000 XP/day hard cap across ALL sources

Reasoning:
- Legit play earns ~1,181 XP/day → under cap, unaffected
- Exploit play capped at 2,000 → Lv100 in 37.6 days minimum
- Prevents ANY single exploit from breaking progression
```

---

## 9. ECONOMY AFTER ALL FIXES

**Projected income with all nerfs applied:**

| Source | OGN/day | XP/day |
|--------|-------:|-------:|
| Wheat farming (6 plots, 15min) | 3,600 | 360 |
| Quiz (30 quizzes/day) | 300 | 750 |
| Boss (5 fights/day, rong-lua) | 400 | 1,250 |
| Bug catch (50/day) | 100 | 400 |
| Social (10/day) | 50 | 30 |
| XP pickup (30/day) | 0 | 150 |
| Watering (6 plots) | 0 | 36 |
| Daily check | 5 | 5 |
| **TOTAL** | **4,455** | **2,981** |
| **With 2K XP cap** | **4,455** | **2,000** |

**Post-fix Progression (2,000 XP/day cap):**

| Level | Days | Calendar |
|------:|-----:|----------|
| 10 | 0.3 | Day 1 |
| 20 | 1.1 | Day 2 |
| 30 | 2.3 | Day 3 |
| 50 | 6.6 | Week 1 |
| 70 | 15.1 | Week 3 |
| 100 | **37.6** | **Week 6** |

> **HEALTHY.** Lv100 takes ~5-6 weeks of daily play. Fast enough to keep players engaged, slow enough to maintain long-term progression.

**Post-fix OGN Balance:**
- Daily income: 4,455 OGN
- Level-up fees: ~1,500 OGN/day average
- Surplus: ~2,955 OGN/day for shop/upgrades
- Time to buy all shop items: ~10 days
- Time to buy all NFTs: ~6 days

---

## 10. FILES THAT NEED CHANGES

| Priority | File | What to Change |
|----------|------|---------------|
| P0 | **DB: `plant_types` table** | Update growth times + rewards (see SQL in 8.6) |
| P0 | **`boss.service.ts`** | Add `BOSS_COOLDOWN_SEC = 300`, `MAX_DAILY_BOSS_FIGHTS = 5` |
| P0 | **`sync.config.ts`** | Nerf `bug_catch` to 5/min, add daily caps |
| P1 | **`reward.service.ts`** | Replace `XP_PER_LEVEL=100` with progressive level table |
| P1 | **`farm.service.ts`** | Add `gameActions.insert()` in `harvestPlot()` for audit |
| P1 | **Backend `plants.ts`** | Sync with DB values (or remove — DB is source of truth) |
| P2 | **FE `playerStore.ts`** | Fix `XP_REWARDS` to match backend (water: 2, plantSeed: 0) |
| P2 | **FE `useFarmPlots.ts`** | Update hardcoded plant rewards to match new DB values |
| P2 | **FE `plants.ts`** | Update prices and growth times to match new DB values |
| P3 | **`reward.service.ts`** | Add global daily XP cap (2,000 XP/day) |

---

## 11. CURRENT vs PROPOSED — SUMMARY MATRIX

| Metric | Current Production | With NEW Plants Only | With ALL Fixes |
|--------|-------:|-------:|-------:|
| Max OGN/hr (farming) | 43,200 | 1,200 | 1,200 |
| Max XP/hr (boss) | 21,600 | 21,600 | 250 (capped) |
| Max XP/hr (bug catch) | 14,400 | 14,400 | 33 (capped) |
| Legit OGN/day | ~4,000 | ~4,000 | ~4,455 |
| Legit XP/day | ~1,181 | ~1,181 | ~2,000 (capped) |
| Exploit XP/day | 114,581 | 114,581 | **2,000** (capped) |
| Days to Lv100 (legit) | 63.6 | 63.6 | **37.6** |
| Days to Lv100 (exploit) | 0.66 | 0.66 | **37.6** |
| Exploit/Legit ratio | **97×** | **97×** | **1×** |

> **Key takeaway:** Updating plant data alone does NOT fix the economy. You MUST also fix boss limits, sync caps, and add a global XP cap.

---

## 12. DATA SOURCES USED

| Source | Location | Access Method |
|--------|----------|--------------|
| Production DB | PostgreSQL on server | `bun -e` with `pg` module |
| Backend services | `/home/cdhc/apps/cdhc-be/src/` | MCP bash `cat` |
| Frontend code | `/mnt/d/du-an/cdhc/cdhc-game-vite/src/` | Local Grep/Read tools |
| Plant DB values | `plant_types` table | SQL query |
| Player data | `player_stats` table | SQL query |
| Game actions | `game_actions` table | SQL query |

---

*Report generated 2026-02-15. Analysis based on production database + source code scan. NO code was modified.*
