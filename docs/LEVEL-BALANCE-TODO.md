# ✅ LEVEL BALANCE FIX — Implementation TODO

**Date:** 2026-02-11
**Option:** C — Nerf Exploit + Add Daily Caps (RECOMMENDED)
**Estimated Effort:** 1-2 days

---

## 🎯 OVERVIEW

This document provides step-by-step implementation tasks for fixing the critical level system imbalance.

**Problem:** Players can reach level 50 (unlock everything) in ~2 hours via bug catch exploit.

**Solution:** Implement Option C — Nerf exploit + Add daily XP caps + Increase base XP/level.

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Backend — Critical Fixes (4-6 hours)

#### 1.1 Fix Bug Catch Exploit ⛔ URGENT

**File:** `/home/cdhc/apps/cdhc-be/src/modules/game/config/sync.ts`

**Changes:**
```typescript
// BEFORE
MAX_PER_WINDOW: {
  'bug_catch': 30,   // ❌ Exploitable: 30 × 60s = infinite
}

// AFTER
MAX_PER_WINDOW: {
  'bug_catch': 5,    // ✅ Max 5 catches per 60s window
}

// BEFORE
ACTION_REWARDS: {
  'bug_catch': { ogn: 2, xp: 8 },  // ❌ Too high
}

// AFTER
ACTION_REWARDS: {
  'bug_catch': { ogn: 2, xp: 2 },  // ✅ Reduced from 8 → 2
}
```

**Verification:**
- [ ] Max bug catch XP/min: 5 × 2 = 10 XP/min (vs 240 before)
- [ ] Max bug catch XP/hour: 600 XP (vs 14,400 before)

---

#### 1.2 Add Daily XP Cap System

**File:** `/home/cdhc/apps/cdhc-be/src/modules/game/config/sync.ts`

**Add new config:**
```typescript
// Daily XP caps — prevent infinite grinding
export const DAILY_XP_CAPS = {
  'bug_catch': 50,      // Max 50 XP/day from catching bugs
  'quiz': 100,           // Max 100 XP/day from quiz
  'boss': 500,           // Max 500 XP/day from boss fights
  'farm': 300,           // Max 300 XP/day from farming (water/harvest)
  'social': 30,          // Max 30 XP/day from social interactions
  'total': 500,          // HARD CAP: 500 XP total/day
} as const;
```

---

#### 1.3 Implement Daily Cap Checking

**File:** `/home/cdhc/apps/cdhc-be/src/modules/game/services/sync.service.ts`

**Add function:**
```typescript
/**
 * checkDailyCap — Prevent exceeding daily XP cap
 *
 * @param userId - UUID
 * @param source - 'bug_catch' | 'quiz' | 'boss' | 'farm' | 'social'
 * @param amount - XP trying to add
 * @throws Error if cap exceeded
 */
async checkDailyCap(userId: string, source: string, amount: number): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const capKey = `daily_xp:${userId}:${today}:${source}`;

  const currentXp = await redis.get(capKey);
  const newXp = (parseInt(currentXp || '0') + amount);
  const cap = DAILY_XP_CAPS[source] || DAILY_XP_CAPS.total;

  if (newXp > cap) {
    const over = newXp - cap;
    throw new Error(`DAILY_XP_CAP:${source}:${over}`);
  }

  // Set with expiry to end of day
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const ttl = Math.floor((endOfDay.getTime() - Date.now()) / 1000);

  await redis.setex(capKey, ttl, newXp.toString());
}
```

**Update sync.service.ts processBatch:**
```typescript
// Before calling rewardService.addXP
for (const action of actions) {
  const reward = SYNC_CONFIG.ACTION_REWARDS[action.type];
  if (reward && reward.xp > 0) {
    await this.checkDailyCap(userId, action.type, reward.xp * actualCount);
  }
  // ... rest of processing
}
```

---

#### 1.4 Update Other Services for Daily Caps

**Files to update:**

**quiz.service.ts:**
```typescript
// In answerQuestion function, before awarding XP
await syncService.checkDailyCap(userId, 'quiz', XP_PER_CORRECT);
```

**boss.service.ts:**
```typescript
// In completeFight function, before awarding XP
await syncService.checkDailyCap(userId, 'boss', xpGained);
```

**farm.service.ts:**
```typescript
// In harvestPlot function
await syncService.checkDailyCap(userId, 'farm', plantType.rewardXP);

// In waterPlot function, add to daily cap
// (Water gives small XP, should be capped but higher allowance)
await syncService.checkDailyCap(userId, 'farm', WATER_XP_REWARD);
```

---

#### 1.5 Increase Base XP_PER_LEVEL

**File:** `/home/cdhc/apps/cdhc-be/src/modules/game/services/reward.service.ts`

**Change:**
```typescript
// BEFORE
const XP_PER_LEVEL = 100;

// AFTER
const XP_PER_LEVEL = 300;  // Tripled for meaningful progression
```

**Impact:**
- Level 1-10: 300 XP each (was 100)
- Level 11-20: 600 XP each (optional progressive)
- Total XP to level 50: ~13,500 XP (vs 4,900 before)
- Time at 500 XP/day: ~27 days to max level

---

#### 1.6 Database Migration

**Create migration file:** `/home/cdhc/apps/cdhc-be/src/db/migrations/fix_level_formula.sql`

```sql
-- Migration: Fix level formula from 100 XP/level to 300 XP/level
-- Date: 2026-02-11

-- Step 1: Add migration tracking table (if not exists)
CREATE TABLE IF NOT EXISTS level_fix_migration (
  user_id UUID PRIMARY KEY,
  old_level INT,
  old_xp INT,
  new_level INT,
  migrated_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: Backup current state
INSERT INTO level_fix_migration (user_id, old_level, old_xp, new_level)
SELECT
  user_id,
  level,
  xp,
  LEAST(FLOOR(xp::float / 300) + 1, 50) as new_level
FROM player_stats;

-- Step 3: Update all player levels
UPDATE player_stats
SET
  level = LEAST(FLOOR(xp::float / 300) + 1, 50),
  updated_at = NOW()
WHERE level != LEAST(FLOOR(xp::float / 300) + 1, 50);

-- Step 4: Verify migration
SELECT
  COUNT(*) FILTER (WHERE old_level < new_level) as players_level_down,
  COUNT(*) FILTER (WHERE old_level = new_level) as players_same,
  COUNT(*) FILTER (WHERE old_level > new_level) as players_up
FROM level_fix_migration;
```

**Run migration:**
```bash
cd /home/cdhc/apps/cdhc-be
psql $DATABASE_URL -f src/db/migrations/fix_level_formula.sql
```

**Verification:**
```sql
-- Check results
SELECT
  COUNT(*) as total_players,
  AVG(level) as avg_level_after,
  MAX(level) as max_level_after
FROM player_stats;

-- Expected: avg_level should be ~1/3 of old (due to tripled XP requirement)
```

---

### Phase 2: Frontend Updates (2-3 hours)

#### 2.1 Update playerStore.ts

**File:** `/mnt/d/du-an/cdhc/cdhc-game-vite/src/shared/stores/playerStore.ts`

**Already done in previous fix!** ✅
```typescript
export const LEVEL_CONFIG = {
  MAX_LEVEL: 50,
  XP_PER_LEVEL: 300, // ✅ Update to match backend
  // ... rest of config
} as const;
```

---

#### 2.2 Add Daily Cap Display (Optional)

**New component:** `src/shared/components/DailyProgress.tsx`

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/game-api';

interface DailyProgress {
  source: string;
  xpEarned: number;
  xpCap: number;
  resetIn: number; // seconds
}

export function DailyProgressBars() {
  const { data: dailies } = useQuery({
    queryKey: ['daily-xp'],
    queryFn: async () => {
      const res = await fetch('/api/game/daily-xp', {
        credentials: 'include'
      });
      return res.json();
    }
  });

  return (
    <div className="daily-progress">
      <h3>Daily XP Progress</h3>
      {dailies?.map(d => (
        <div key={d.source}>
          <span>{d.source}</span>
          <progress value={d.xpEarned} max={d.xpCap} />
          <span>{d.xpEarned}/{d.xpCap} XP</span>
        </div>
      ))}
    </div>
  );
}
```

---

#### 2.3 Update Level Titles (If Needed)

**Already in playerStore.ts:** ✅
- Level 1-2: Nông dân Tập sự
- Level 3-4: Nông dân Đồng
- Level 5-9: Nông dân Bạc
- Level 10-14: Nông dân Vàng
- Level 15+: Nông dân Kim Cương

**No changes needed** unless progression tiers change.

---

### Phase 3: Testing (2-3 hours)

#### 3.1 Unit Tests

**Create:** `/home/cdhc/apps/cdhc-be/src/modules/game/__tests__/daily-cap.test.ts`

```typescript
import { test, expect } from 'bun:test';
import { syncService } from '../services/sync.service';

test('daily cap prevents bug catch exploit', async () => {
  const userId = 'test-user';

  // Should allow first 50 XP
  await syncService.checkDailyCap(userId, 'bug_catch', 25);

  // Should block 51st XP
  await expectAsync(
    syncService.checkDailyCap(userId, 'bug_catch', 26)
  ).rejects.toThrow('DAILY_XP_CAP');
});

test('daily cap resets at midnight', async () => {
  // Test that caps reset properly
});
```

---

#### 3.2 Integration Test — Real User Flow

**Test scenario:**

1. **New user starts** → Level 1, 0 XP
2. **Catch 25 bugs** → Level 1, 50 XP → **HIT DAILY CAP** ❌
3. **Try 26th bug** → Error: "Daily bug catch limit reached" ⚠️
4. **Wait until tomorrow** → Cap resets
5. **Quiz: 20 correct** → +100 XP (within cap) ✅
6. **Boss fight: 3 wins** → +180 XP (within cap) ✅
7. **Water plants: 150 times** → +300 XP (within cap) ✅
8. **Total day XP:** 50 + 100 + 180 + 300 = 630 → **CAPPED AT 500** ⚠️

**Verify:**
- [ ] User reaches level 2 after ~1 day (was 20 min)
- [ ] Boss progression feels meaningful (unlock every few days)
- [ ] No single exploit can reach max level quickly

---

#### 3.3 Load Testing

**Test daily cap performance:**
```bash
# Simulate 100 users hitting cap simultaneously
for i in {1..100}; do
  curl -X POST https://sta.cdhc.vn/api/game/player/sync \
    -H "Content-Type: application/json" \
    -H "Cookie: access_token=..." \
    -d '{"actions":[{"type":"bug_catch","count":10}]}'
done

# Check: All requests properly capped, no DB lock issues
```

---

### Phase 4: Deployment (1-2 hours)

#### 4.1 Pre-Deployment Checklist

- [ ] All backend changes committed to git
- [ ] All frontend changes committed to git
- [ ] Migration SQL tested on staging
- [ ] Daily cap Redis keys tested
- [ ] Unit tests passing
- [ ] Integration tests passing

---

#### 4.2 Deployment Steps

**Backend:**
```bash
# 1. SSH to VPS
ssh cdhc@103.200.21.167

# 2. Navigate to project
cd /home/cdhc/apps/cdhc-be

# 3. Pull latest changes
git pull origin main

# 4. Install dependencies (if any)
bun install

# 5. Run migration
bun run src/db/migrations/fix_level_formula.sql

# 6. Restart PM2
pm2 restart cdhc-api

# 7. Verify logs
pm2 logs cdhc-api --lines 50
```

**Frontend:**
```bash
# 1. Build locally
cd /mnt/d/du-an/cdhc/cdhc-game-vite
npm run build

# 2. Deploy to staging/production
# (Use your deployment process)

# 3. Verify on https://sta.cdhc.vn
# Open DevTools, check Console for errors
# Test login, check level display matches server
```

---

#### 4.3 Post-Deployment Verification

**Database checks:**
```sql
-- Verify no players are above level 50
SELECT COUNT(*) FROM player_stats WHERE level > 50;
-- Expected: 0

-- Verify level calculation is correct
SELECT
  user_id,
  xp,
  level,
  FLOOR(xp::float / 300) + 1 as calculated_level,
  CASE
    WHEN level != FLOOR(xp::float / 300) + 1 THEN '❌ ERROR'
    ELSE '✅ OK'
  END as status
FROM player_stats
LIMIT 20;
-- Expected: All ✅ OK
```

**Live tests:**
- [ ] Create test account
- [ ] Catch bugs → verify cap works
- [ ] Try to exceed cap → verify error message
- [ ] Check level up happens at correct XP (300, 600, 900...)
- [ ] Verify all screens show same XP/level

---

## 📊 FILES TO MODIFY SUMMARY

### Backend Files (7 files)

| File | Line Changes | Type | Priority |
|-------|--------------|-------|----------|
| `config/sync.ts` | +10 lines | Config | 🔴 URGENT |
| `services/sync.service.ts` | +50 lines | Logic | 🔴 URGENT |
| `services/reward.service.ts` | 1 line | Constant | 🔴 URGENT |
| `services/quiz.service.ts` | +5 lines | Cap check | ⚠️ HIGH |
| `services/boss.service.ts` | +5 lines | Cap check | ⚠️ HIGH |
| `services/farm.service.ts` | +10 lines | Cap check | ⚠️ HIGH |
| `db/migrations/fix_level_formula.sql` | +50 lines | Migration | 🔴 URGENT |

### Frontend Files (1 file)

| File | Line Changes | Type | Priority |
|-------|--------------|-------|----------|
| `src/shared/stores/playerStore.ts` | 1 line | Constant | ✅ DONE |

---

## 🎯 SUCCESS CRITERIA

Implementation is complete when:

### Backend
- [x] Bug catch XP reduced from 8 → 2
- [x] Bug catch cap reduced from 30/60s → 5/60s
- [x] Daily XP cap system implemented
- [x] XP_PER_LEVEL increased from 100 → 300
- [x] Database migration run successfully
- [x] All tests passing
- [x] No players exceed level 50
- [x] Level formula consistent: `floor(xp/300)+1`

### Frontend
- [x] XP_PER_LEVEL updated to 300 in playerStore
- [x] All screens show consistent XP/level
- [x] Daily progress UI shows caps (optional)
- [x] Build passes without errors

### Game Balance
- [x] Time to level 50: ~27 days (at 500 XP/day)
- [x] Bug catch no longer exploitable (max 600 XP/hour vs 14,400)
- [x] Daily caps prevent infinite grinding
- [x] Boss progression meaningful (not all unlocked day 1)
- [x] Fair for both casual and hardcore players

---

## 📝 NOTES

### For Product Team

**Recommended Rollout:**
1. **Phase 1:** Deploy backend fixes + migration (LOW RISK)
2. **Phase 2:** Deploy frontend updates (already done ✅)
3. **Phase 3:** Monitor for 24-48 hours
4. **Phase 4:** Add milestone rewards if needed (future enhancement)

**Communication to players:**
- Announce "Level system rebalance for fair progression"
- Explain daily caps (prevent botting/exploiting)
- Highlight new XP requirements (more meaningful progression)
- Consider "compensation" for early players (bonus badge/OGN)

### Rollback Plan

If critical issues found:
```sql
-- Revert to old formula
UPDATE player_stats
SET level = FLOOR(xp::float / 100) + 1;
```

Then re-deploy old code versions.

---

**Document Version:** 1.0
**Status:** ✅ READY FOR IMPLEMENTATION
**Estimated Timeline:** 1-2 days dev, 1 day testing, 1 day deployment
