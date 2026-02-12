# 📊 FARMVERSE Level System — Complete Documentation

**Date:** 2026-02-11
**Version:** 1.0
**Status:** 🚨 CRITICAL IMBALANCE DETECTED

---

## 🔴 EXECUTIVE SUMMARY — GAME BREAKING IMBALANCE

### Current State: **QUÁ DỄ LÊN LEVEL**

| Metric | Value | Issue |
|--------|-------|-------|
| **XP per level** | 100 XP | ⚠️ QUÁ THẤP |
| **Bug catch reward** | 8 XP × 30/batch = 240 XP/min | ⛔ **EXPLOITABLE** |
| **Time to max level (50)** | ~8 hours play | ⛔ **UNLOCK EVERYTHING IN 1 DAY** |
| **Boss unlocks** | All in ~1 day | ⛔ **NO PROGRESSION** |
| **Daily XP cap** | NONE | ⛔ **UNLIMITED GRIND** |

**Conclusion:** Game progression is completely broken. Players can reach level 50 (unlock everything) in 8-12 hours of normal play.

---

## 📐 PART 1: LEVEL PROGRESSION SYSTEM

### 1.1 Level Formula

**Backend:** `reward.service.ts:15-16`
```typescript
const XP_PER_LEVEL = 100; // XP needed per level (simple: level = floor(xp / 100) + 1)
const MAX_LEVEL = 50;
const newLevel = Math.min(Math.floor(newXP / XP_PER_LEVEL) + 1, MAX_LEVEL);
```

**Formula:** `level = floor(xp / 100) + 1`

### 1.2 Level Progression Table

| Level | Total XP Needed | XP in Level | Time @ 300 XP/hour | Cumulative Time |
|-------|-----------------|--------------|---------------------|-----------------|
| 1 → 2 | 100 XP | 0-99 XP | 20 min | **20 min** |
| 2 → 3 | 200 XP | 100-199 XP | 20 min | **40 min** |
| 3 → 4 | 300 XP | 200-299 XP | 20 min | **1 hour** |
| 4 → 5 | 400 XP | 100 XP | 20 min | **1.3 hours** |
| 5 → 10 | 900 XP | 500-899 XP | 1.3 hours | **3 hours** |
| 10 → 20 | 1,900 XP | 900-1,899 XP | 3.3 hours | **6.3 hours** |
| 20 → 30 | 2,900 XP | 1,900-2,899 XP | 3.3 hours | **9.7 hours** |
| 30 → 40 | 3,900 XP | 2,900-3,899 XP | 3.3 hours | **13 hours** |
| 40 → 50 | 4,900 XP | 3,900-4,899 XP | 3.3 hours | **16.3 hours** |
| **TOTAL** | **4,900 XP** | | | **~16 hours** |

**Current Reality:** With bug catch exploit, can reach level 50 in **~2 hours** (see Section 3.3)

### 1.3 Level Titles

**Frontend:** `playerStore.ts:14-20`

| Level Range | Title | Vietnamese |
|------------|-------|------------|
| 1-2 | Nông dân Tập sự | Beginner Farmer |
| 3-4 | Nông dân Đồng | Bronze Farmer |
| 5-9 | Nông dân Bạc | Silver Farmer |
| 10-14 | Nông dân Vàng | Gold Farmer |
| 15+ | Nông dân Kim Cương | Diamond Farmer |

---

## 💰 PART 2: XP REWARDS COMPLETE TABLE

### 2.1 Farm Actions

| Action | OGN | XP | Cooldown | Max/batch | Notes |
|---------|------|----|----------|------------|-------|
| **Water plant** | 1 | 2 | 1h/plot | 20×/60s | Daily: ~288 XP (6 plots × 24h × 2) |
| **Harvest** | varies | varies | growth time | — | See Section 2.4 |
| **Plant seed** | -price | 0 | — | — | Costs OGN, no XP |

### 2.2 Harvest Rewards (Plant Types)

| Plant | OGN | XP | Growth Time | XP/hour | Notes |
|-------|------|----|-------------|-----------|-------|
| Cà chua | 10 | 25 | 2h | 12.5 | Best XP rate |
| Cà rốt | 8 | 20 | 2.5h | 8 | |
| Dưa leo | 12 | 30 | 1.5h | 20 | Best XP rate |
| Bí đao | 15 | 40 | 3h | 13.3 | |
| Khổ qua | 18 | 45 | 4h | 11.25 | |

**Best Farm Strategy:** Plant dưa leo (loofah) repeatedly:
- 30 XP/harvest × 24 harvests/day = 720 XP/day from farming alone

### 2.3 Special Actions

| Action | OGN | XP | Cooldown | Daily Max | Notes |
|---------|------|----|----------|------------|-------|
| **Bug catch** | 2 | 8 | — | 30×/60s = ∞ | ⛔ **MASSIVELY EXPLOITABLE** |
| **Daily check** | 5 | 5 | 1/day | 1 | Login bonus |
| **XP pickup** | 0 | 5 | — | 10×/60s | Small XP drops |

### 2.4 Boss Rewards

| Boss ID | Name | Difficulty | Unlock Lvl | HP | Atk | OGN | XP | XP/minute est. |
|---------|------|------------|-----------|-----|-----|-----|-----|---------------|
| rep-xanh | Rệp Xanh | Easy | 1 | 500 | 20 | 5 | 15 | ~15 |
| sau-to | Sâu Tơ | Easy | 1 | 800 | 25 | 8 | 25 | ~25 |
| bo-rua | Bọ Rùa | Medium | 3 | 1,200 | 35 | 12 | 40 | ~40 |
| chau-chau | Châu Chấu | Medium | 5 | 2,000 | 45 | 20 | 60 | ~60 |
| bo-xit | Bọ Xít | Hard | 8 | 3,000 | 55 | 30 | 80 | ~80 |
| oc-sen | Ốc Sên | Hard | 10 | 4,000 | 65 | 40 | 120 | ~120 |
| chuot-dong | Chuột Đồng | Hard | 12 | 5,000 | 80 | 50 | 150 | ~150 |
| rong-lua | Rồng Lửa | Legendary | 15 | 10,000 | 100 | 80 | 250 | ~250 |

**Time est:** Assumes 2-3 minute boss fight (match-3 gameplay)

### 2.5 Quiz Rewards

| Action | OGN | XP | Cooldown | Daily Max |
|---------|------|----|----------|------------|
| **Correct answer** | 2 | 5 | 5 min between quizzes | Unlimited |
| **Wrong answer** | 0 | 1 | — | Participation bonus |

**Best Quiz Strategy:** Spam quiz every 5 minutes = 60 XP/hour

### 2.6 Social Rewards

| Action | OGN | XP | Daily Limit | Notes |
|---------|------|----|------------|-------|
| **Visit friend** (water/like/gift) | 5 | 3 | 10 friends/day | Max 30 XP/day from social |
| **Referral commission** | 5% | 0 | — | When referred user spends OGN |

---

## ⚠️ PART 3: BALANCE ISSUES ANALYSIS

### 3.1 🐛 CRITICAL BUG: Bug Catch is EXPLOITABLE

**Current Config:**
```typescript
// sync.config.ts
MAX_PER_WINDOW: {
  'bug_catch': 30,   // max 30 bugs / 60s window
}
// sync reward
ACTION_REWARDS: {
  'bug_catch': { ogn: 2, xp: 8 },
}
```

**Exploit:**
- Player can catch 30 bugs every 60 seconds = 30×/min
- XP gain: 30 × 8 = **240 XP/min** = **14,400 XP/hour**
- **Time to level 50:** 4,900 XP ÷ 14,400 XP/hour = **~20 minutes** of AFK grinding

**Anti-cheat is ineffective:**
- 30 bugs/60s is NOT a limit — it's a "batch size"
- No daily cap
- No diminishing returns
- Players can literally leave game running overnight

### 3.2 ⚠️ NO DAILY XP CAP

Players can grind indefinitely:
- Bug catch: Unlimited
- Quiz: Unlimited (every 5 min)
- Water: Limited by plot count (6), but still ~288 XP/day
- Social: Limited to 10 friends/day = 30 XP/day (reasonable)

**Result:** No meaningful progression gate

### 3.3 ⚠️ XP_PER_LEVEL TOO LOW

At 100 XP/level:
- Level 1 → 10 in ~16 hours (for honest players)
- Boss unlocks: All unlocked by day 1-2
- **No sense of achievement**

**Comparison with other games:**
- **Adventure Capitalist:** 500-5,000 XP/level (progressive)
- **Empires & Puzzles:** Hours per level
- **Typical idle games:** 1-3 days per level at mid-game

### 3.4 📊 XP per Hour Comparison

| Source | XP/hour | Notes |
|--------|-----------|-------|
| **Bug catch exploit** | 14,400 XP | ⛔ BROKEN |
| **Loofah farming** | ~720 XP | Optimal plant |
| **Water farming** | ~288 XP | 6 plots × 24h |
| **Boss grinding** | ~200 XP | Assuming 15-min fights |
| **Quiz grinding** | ~60 XP | Every 5 min |
| **Social (max)** | 30 XP | Visit 10 friends |
| **Honest gameplay** | ~500-1,000 XP | Mix of activities |

**Problem:** Exploiting gives **28× more XP** than honest gameplay

### 3.5 ⚠️ NO MEANINGFUL MILESTONES

Current system:
- No milestone rewards
- No achievements (except tracking)
- No bonus for reaching level 10, 20, 30, etc.
- Level is just a number, not an achievement

---

## 🎯 PART 4: PROPOSED BALANCE OPTIONS

### Option A: Increase XP_PER_LEVEL (Simplest)

**Changes:**
```typescript
// reward.service.ts
const XP_PER_LEVEL = 500; // Changed from 100
```

**Impact:**
- Time to level 50: ~80 hours (vs ~16 currently)
- All unlocks take ~1 week of play
- Boss progression: More spaced out

**Pros:**
- ✅ Simple 1-line change
- ✅ Maintains linear formula
- ✅ Easy to communicate

**Cons:**
- ❌ Existing players feel "nerfed" (same XP, lower level)
- ❌ Still doesn't fix bug catch exploit

**Migration Required:** YES
```sql
-- Recalculate all player levels based on new formula
UPDATE player_stats
SET level = LEAST(FLOOR(xp::float / 500) + 1, 50);
```

---

### Option B: Progressive XP Table (Game-Like)

**Changes:**
```typescript
// reward.service.ts
const getXpForLevel = (level: number): number => {
  // Formula: 50 * level^1.5
  return Math.floor(50 * Math.pow(level, 1.5));
}

const getLevel = (xp: number): number => {
  let level = 1;
  let totalXp = 0;
  while (totalXp + getXpForLevel(level) <= xp) {
    totalXp += getXpForLevel(level);
    level++;
  }
  return Math.min(level - 1, 50);
}
```

**Progression Table:**

| Level | XP Needed | Cumulative XP | Time @ 500 XP/day |
|-------|-----------|----------------|---------------------|
| 1 → 2 | 50 | 50 | < 1 day |
| 2 → 3 | 141 | 191 | < 1 day |
| 3 → 4 | 260 | 451 | 1 day |
| 4 → 5 | 408 | 859 | 2 days |
| 5 → 10 | 3,535 | 4,394 | 9 days |
| 10 → 20 | 14,730 | 19,124 | 38 days |
| 20 → 30 | 42,587 | 61,711 | 123 days |
| 30 → 40 | 80,773 | 142,484 | 285 days |
| 40 → 50 | 135,187 | 277,671 | 555 days (~1.5 years) |

**Pros:**
- ✅ Natural progression (harder to level up as you advance)
- ✅ Sense of achievement
- ✅ Match-3 games typically use progressive curves

**Cons:**
- ❌ Complex to implement (backend + frontend)
- ❌ Harder to communicate
- ❌ Existing players severely affected
- ❌ Level 50 takes 1.5 years (too long?)

**Migration Required:** YES (complex)
```sql
-- Need to recalculate ALL levels based on new formula
-- Or "grandfather" existing players (unfair to new players)
```

---

### Option C: NERF EXPLOITS + Increase XP (Recommended)

**Changes:**

#### C.1 Fix Bug Catch
```typescript
// sync.config.ts
MAX_PER_WINDOW: {
  'bug_catch': 5,   // CHANGED: 30 → 5 (now per 60s, not batch)
}
ACTION_REWARDS: {
  'bug_catch': { ogn: 2, xp: 2 },  // CHANGED: 8 XP → 2 XP
}
```

**Add daily cap:**
```typescript
// NEW in sync.config.ts
DAILY_XP_CAPS: {
  'bug_catch': 50,    // Max 50 XP/day from bug catching
  'quiz': 100,         // Max 100 XP/day from quiz
  'boss': 500,         // Max 500 XP/day from boss
  'farm': 300,         // Max 300 XP/day from farming
  'total': 500,        // Max 500 XP total/day
}
```

#### C.2 Increase XP_PER_LEVEL
```typescript
// reward.service.ts
const XP_PER_LEVEL = 300; // CHANGED: 100 → 300
```

**New Progression:**

| Level | XP Needed | Cumulative | Time (honest) |
|-------|-----------|--------------|-----------------|
| 1 → 10 | 2,700 | 2,700 | ~5-7 days |
| 10 → 20 | 8,100 | 10,800 | ~2-3 weeks |
| 20 → 30 | 13,500 | 24,300 | ~1-2 months |
| 30 → 40 | 19,100 | 43,400 | ~2-3 months |
| 40 → 50 | 24,300 | 67,700 | ~4-5 months |

**Pros:**
- ✅ Fixes exploit (bug catch 8→2 XP, 30→5 cap)
- ✅ Adds daily caps (prevents infinite grind)
- ✅ Meaningful progression (2-3 months to level 50)
- ✅ Fair to both casual and hardcore players
- ✅ Preserves achievement value

**Cons:**
- ⚠️ Medium complexity (multiple files to change)
- ⚠️ Needs migration
- ⚠️ Some existing players may feel "nerfed"

**Migration Required:** YES
```sql
-- 1) Increase XP_PER_LEVEL constant in BE
-- 2) Recalculate levels
UPDATE player_stats
SET level = LEAST(FLOOR(xp::float / 300) + 1, 50);
-- 3) Optionally: compensate players who lost levels
-- (e.g., give bonus OGN or exclusive "pioneer" badge)
```

---

### Option D: Hybrid — Progressive + Caps + Milestones (Most Balanced)

**Formula:**
```typescript
// reward.service.ts
const XP_PER_LEVEL = 200; // Base: 200 XP/level

// Progressive modifier (optional)
const getXpForLevel = (level: number): number => {
  if (level <= 10) return 200;      // Levels 1-10: 200 XP each
  if (level <= 20) return 400;      // Levels 11-20: 400 XP each
  if (level <= 30) return 600;      // Levels 21-30: 600 XP each
  return 1000;                        // Levels 31-50: 1000 XP each
};
```

**Daily XP Caps:**
```typescript
DAILY_XP_CAPS: {
  'bug_catch': 30,     // Max ~15 catches/day @ 2 XP each
  'quiz': 50,          // Max 10 correct answers/day @ 5 XP each
  'boss': 300,         // Max ~6-15 boss fights/day
  'farm': 200,         // Max 8 harvests or ~100 waters
  'total': 500,        // HARD CAP: 500 XP total/day
}
```

**Milestone Rewards (NEW):**
```typescript
MILESTONE_REWARDS: {
  5: { ogn: 50, title: 'Thành tựu' },    // Reach level 5
  10: { ogn: 150, badge: 'Veteran' },  // Reach level 10
  20: { ogn: 500, badge: 'Master' },   // Reach level 20
  30: { ogn: 1000, badge: 'Legend' },  // Reach level 30
  50: { ogn: 5000, badge: 'Deity' },   // Reach level 50
}
```

**Progression:**

| Level | XP/Level | Cumulative | Time (500 XP/day) | Milestone |
|-------|-----------|------------|-------------------|-----------|
| 1 → 5 | 200 | 1,000 | 2 days | Level 5: +50 OGN |
| 5 → 10 | 400 | 3,000 | 6 days | Level 10: +150 OGN |
| 10 → 20 | 600 | 7,000 | 14 days | Level 20: +500 OGN |
| 20 → 30 | 1,000 | 17,000 | 34 days | Level 30: +1000 OGN |
| 30 → 40 | 1,000 | 27,000 | 54 days | — |
| 40 → 50 | 1,000 | 37,000 | 74 days | Level 50: +5000 OGN |

**Total Time to Max:** ~3-4 months for dedicated players

**Pros:**
- ✅ Best of all worlds
- ✅ Fixes exploits
- ✅ Meaningful progression
- ✅ Milestone rewards (engagement)
- ✅ Multiple progression speeds (casual vs hardcore)
- ✅ Fair daily caps

**Cons:**
- ⚠️ Most complex to implement
- ⚠️ Requires daily tracking system
- ⚠️ Major migration required

**Migration Required:** YES (complex)
- Database schema changes (add daily XP tracking)
- Daily cap enforcement logic
- Milestone reward distribution

---

## 📋 PART 5: IMPLEMENTATION CHECKLISTS

### For Option A (Simple Increase)

**Backend Changes:**
- [ ] `reward.service.ts`: Change `XP_PER_LEVEL` from 100 → 500
- [ ] Run migration SQL to recalculate all levels
- [ ] Test with existing accounts

**Frontend Changes:**
- [ ] `playerStore.ts`: Update `LEVEL_CONFIG.XP_PER_LEVEL` to 500
- [ ] Test all screens display correct XP/level

**Estimated Effort:** 2-4 hours

---

### For Option C (Recommended — Nerf + Caps)

**Backend Changes:**
- [ ] `sync.config.ts`:
  - [ ] Change `MAX_PER_WINDOW['bug_catch']` from 30 → 5
  - [ ] Change `ACTION_REWARDS['bug_catch'].xp` from 8 → 2
  - [ ] Add `DAILY_XP_CAPS` object
  - [ ] Implement daily cap checking in `sync.service.ts`
- [ ] `reward.service.ts`: Change `XP_PER_LEVEL` from 100 → 300
- [ ] Run migration SQL
- [ ] Add tests for daily caps

**Frontend Changes:**
- [ ] `playerStore.ts`: Update `LEVEL_CONFIG.XP_PER_LEVEL` to 300
- [ ] Add daily cap display in UI (optional)
- [ ] Test all screens

**Estimated Effort:** 1-2 days

---

### For Option D (Hybrid — Best Experience)

**Backend Changes:**
- [ ] Add daily XP tracking table:
  ```sql
  CREATE TABLE daily_xp (
    user_id UUID,
    date DATE,
    source TEXT, -- 'bug_catch', 'quiz', 'boss', 'farm'
    xp_earned INT,
    PRIMARY KEY (user_id, date, source)
  );
  ```
- [ ] Implement `getXpToday(userId, source)` function
- [ ] Add daily cap checks in all XP-adding functions
- [ ] `reward.service.ts`: Implement progressive `getXpForLevel()`
- [ ] Add milestone system:
  ```sql
  CREATE TABLE milestone_rewards (
    user_id UUID,
    milestone_level INT,
    rewarded_at TIMESTAMP,
    PRIMARY KEY (user_id, milestone_level)
  );
  ```
- [ ] Migration script
- [ ] Comprehensive testing

**Frontend Changes:**
- [ ] Update `playerStore.ts` with new formulas
- [ ] Add milestone popup/notification
- [ ] Add daily progress bars
- [ ] Update boss unlock display

**Estimated Effort:** 1 week

---

## 🎖️ PART 6: ANTI-CHEAT RECOMMENDATIONS

Regardless of which balance option is chosen, implement these:

### 6.1 Rate Limiting Per Endpoint

```typescript
// Add to Hono middleware
export const rateLimiter = (endpoint: string, maxPerMinute: number) => {
  return createMiddleware(async (c, next) => {
    const userId = c.get('user').id;
    const key = `ratelimit:${endpoint}:${userId}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 60);
    if (count > maxPerMinute) {
      return c.json({ error: 'RATE_LIMITED' }, 429);
    }
    await next();
  });
};

// Apply to sensitive endpoints
bossRoutes.post('/complete', rateLimiter('boss_complete', 10)); // Max 10 boss fights/min
quizRoutes.post('/answer', rateLimiter('quiz_answer', 20)); // Max 20 answers/min
```

### 6.2 Device Fingerprinting

Prevent users from running multiple accounts:
- Track device ID
- Limit 3 accounts per IP/device
- Flag suspicious patterns

### 6.3 Anomaly Detection

```typescript
// Detect impossible patterns
const ANOMALY_THRESHOLDS = {
  maxXpPerHour: 2000,     // More than 2000 XP/hour = bot
  maxBossFightsPerHour: 20, // More than 20 boss fights/hour = exploit
  maxActionsPerSecond: 2,    // More than 2 actions/sec = auto-clicker
};
```

---

## 📊 PART 7: DATABASE QUERIES FOR ANALYSIS

### Current Player Distribution

```sql
-- Level distribution
SELECT
    level,
    COUNT(*) as player_count,
    MIN(xp) as min_xp,
    MAX(xp) as max_xp,
    ROUND(AVG(xp)) as avg_xp,
    MIN(created_at) as first_seen,
    MAX(last_played_at) as last_seen
FROM player_stats
GROUP BY level
ORDER BY level;

-- Time to level analysis
SELECT
    user_id,
    level,
    xp,
    EXTRACT(EPOCH FROM (last_played_at - created_at)) / 3600 as hours_played,
    xp::float / GREATEST(EXTRACT(EPOCH FROM (last_played_at - created_at)) / 3600, 1) as xp_per_hour
FROM player_stats
WHERE last_played_at > NOW() - INTERVAL '7 days'
ORDER BY xp DESC
LIMIT 50;

-- Action breakdown (if game_actions table exists)
SELECT
    type,
    COUNT(*) as total_actions,
    SUM(COALESCE((data->>'xpGain')::int, 0)) as total_xp,
    AVG(COALESCE((data->>'xpGain')::int, 0)) as avg_xp_per_action
FROM game_actions
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY type
ORDER BY total_xp DESC;
```

---

## 📝 CONCLUSION

### Current State: 🔴 BROKEN

1. **Bug catch is severely exploitable** — 14,400 XP/hour possible
2. **No daily XP caps** — Unlimited grinding
3. **XP_PER_LEVEL too low** — Level 50 in 8-16 hours
4. **No meaningful progression** — Everything unlocked in 1-2 days

### Recommended Fix: ⭐ OPTION C (Nerf + Caps)

**Why Option C:**
- Fixes the exploit (critical priority)
- Adds daily caps (prevents grinding)
- Increases base XP to 300 (reasonable progression)
- Not too complex (1-2 days work)
- Preserves game integrity

### Immediate Actions:

1. **URGENT:** Fix bug catch exploit (8→2 XP, 30→5 per minute)
2. **HIGH:** Add daily XP caps (500/day total)
3. **MEDIUM:** Increase XP_PER_LEVEL to 300
4. **LOW:** Add milestone rewards for long-term engagement

---

**Document Version:** 1.0
**Last Updated:** 2026-02-11
**Authors:** Claude Code Analysis System
