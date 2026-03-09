# Fix Report — 9 Known Issues (Sprint 2)

**Date:** 2026-03-02
**Baseline:** WORLD-BOSS-SCAN-FIX-REPORT.md (12 fixes applied)

## Issues Fixed

| # | Severity | Issue | Status |
|---|----------|-------|--------|
| 1 | P0 | hitsCount/bestSingleHit/maxCombo not populated | ✅ Redis HASH tracking via Lua atomic max |
| 2 | P1 | Reward tier naming S/A/B/C/D vs descriptive | ✅ TIER_LABELS mapping exported |
| 3 | P1 | endBoss race condition (setImmediate) | ✅ Redis end_lock (SET NX EX 30) |
| 4 | P1 | Feed missing username | ✅ Query users table, inject into feed |
| 5 | P1 | Leaderboard missing username | ✅ Batch query users via inArray |
| 6 | P1 | RewardsScreen leaderboard stub | ✅ Wired useWorldBossHistoryLeaderboard |
| 7 | P1 | Match3 stale refs in JSX | ✅ Ref→state sync for display values |
| 8 | P2 | Sequential reward distribution | ✅ Promise.allSettled batch of 10 |
| 9 | P2 | No unique constraint rewards | ✅ DB migration applied |

## Files Changed

### Backend (VPS)
- `src/modules/world-boss/services/world-boss.service.ts` — Issues #1,2,3,4,5,8
- `src/modules/world-boss/utils/world-boss.redis.ts` — Issues #1,3 (acquireEndLock, trackUserStats, getUserStats, cleanupUserStats)
- `src/modules/world-boss/schema/world-boss.schema.ts` — Issue #9 (unique constraint)
- `drizzle/0018_black_lucky_pierre.sql` — Migration file

### Frontend (Local)
- `src/modules/world-boss/components/RewardsScreen.tsx` — Issue #6
- `src/modules/world-boss/components/WorldBossMatch3.tsx` — Issue #7

## Technical Details

### Issue #1: Redis HASH User Stats
- Key pattern: `worldboss:userstats:{eventId}:{userId}`
- Lua script for atomic max on bestHit/maxCombo
- HINCRBY for hits count
- Flushed to DB in endBoss() before participation insert

### Issue #3: End Lock
- `acquireEndLock(eventId)` — SET NX EX 30
- Only first caller triggers endBoss, others skip silently

### Issue #8: Parallel Rewards
- Batch size: 10 users per Promise.allSettled
- allSettled prevents single user failure from blocking others

### Issue #9: DB Constraint
- Applied directly via ALTER TABLE (drizzle-kit migrate had missing file issue)
- Verified: `world_boss_rewards_event_user_uniq` UNIQUE(event_id, user_id) active

## Verification
- BE tsc: ✅ 0 new errors (pre-existing errors unchanged)
- FE tsc: ✅ 0 errors in world-boss
- PM2: ✅ restarted, no errors
- DB: ✅ unique constraint active, 0 duplicates
- API: No active boss during test — username injection verified in code

## Pending
- BE git commit: Changes saved on VPS, MCP disconnected before commit
- FE git commit: Changes ready locally
- Git push: Pending after commits
