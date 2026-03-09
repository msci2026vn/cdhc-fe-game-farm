# Fix Report — 7 Bugs from Final Test (Prompt 11)
**Ngày:** 2026-02-28
**Commit:** `74c700b` on branch `avalan`

## Bugs Fixed

| # | Severity | Bug | Fix | File |
|---|----------|-----|-----|------|
| 1 | P0 | `new Date()` in onConflictDoUpdate | `sql\`now()\`` | boss.service.ts (bossProgress) |
| 2 | P0 | `new Date()` in onConflictDoUpdate | `sql\`now()\`` | boss.service.ts (campaignProgress) |
| 3 | P0 | `new Date()` in onConflictDoUpdate | `sql\`now()\`` | achievement.service.ts |
| 4 | P0 | `new Date()` in onConflictDoUpdate | `sql\`now()\`` | achievement-fragment-helper.ts |
| 5 | P1 | grantFragmentsHelper no tx param | Added `trx = db` param, pass `tx` from caller | achievement-fragment-helper.ts + achievement.service.ts |
| 6 | P3 | Login streak reward not in transaction | Wrapped `db.transaction()` for streak + OGN + fragments | login-streak.service.ts |
| 7 | P2 | Achievement tracks current inventory not lifetime | `COUNT(*)` from player_recipes + boss_drops | achievement.service.ts |

### Bonus: 4 additional files fixed (same `new Date()` pattern)

| File | Line | Field |
|------|------|-------|
| shop.service.ts | 170 | `updatedAt` |
| drop.service.ts | 236 | `updatedAt` |
| mission.service.ts | 347 | `updatedAt` |
| market.service.ts | 197 | `fetchedAt` |

## Root Cause Pattern

`new Date()` trong Drizzle `onConflictDoUpdate.set` → postgres wire protocol error (`ERR_INVALID_ARG_TYPE`).
Fix: dùng `sql\`now()\`` cho timestamp trong onConflictDoUpdate.
Pattern này CHỈ ảnh hưởng `onConflictDoUpdate`, KHÔNG ảnh hưởng `.values()` hay `.update().set()`.

## Changes Summary

### Files Modified (8 files, +97 -118 lines)
1. `boss.service.ts` — 4x `new Date()` → `sql\`now()\`` in 2 onConflictDoUpdate blocks
2. `achievement.service.ts` — 1x `new Date()` → `sql\`now()\``, import bossDrops, lifetime counters
3. `achievement-fragment-helper.ts` — 1x `new Date()` → `sql\`now()\``, add `trx` param, use `trx` instead of `db`
4. `login-streak.service.ts` — wrap streak update + rewards in `db.transaction()`, pass `tx` to addOGN + grantFragmentsHelper
5. `shop.service.ts` — 1x `new Date()` → `sql\`now()\``
6. `drop.service.ts` — 1x `new Date()` → `sql\`now()\``
7. `mission.service.ts` — 1x `new Date()` → `sql\`now()\``
8. `market.service.ts` — 1x `new Date()` → `sql\`now()\``

## Verify Results

- [x] 0 `new Date()` in any onConflictDoUpdate (grep confirms 0 results)
- [x] 0 DrizzleQueryError / ERR_INVALID_ARG in PM2 logs after restart
- [x] grantFragmentsHelper accepts `trx` param (defaults to `db`)
- [x] achievement.service.ts passes `tx` to grantFragmentsHelper
- [x] login-streak.service.ts has `db.transaction()` wrapping all mutations
- [x] achievement recipe_count uses `COUNT(*)` from player_recipes (lifetime)
- [x] achievement fragment_count uses `COUNT(*)` from boss_drops (lifetime)
- [x] tsc = 0 new errors (110 pre-existing in unrelated files)
- [x] PM2 restart successful, API online
- [x] Git committed (`74c700b`), push failed (no SSH key — known issue)

## BACKEND BOSS CAMPAIGN — PRODUCTION READY
