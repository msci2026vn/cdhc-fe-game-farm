# Scan & Fix Report — World Boss Module (Fullstack)

**Date:** 2026-03-02
**Model:** Opus 4.6 (scan) + Sonnet 4.6 (fix)
**Scope:** Frontend (23 files) + Backend (8 files) + Cross-module integration

## Summary

| Severity | BE Found | FE Found | Fixed |
|----------|----------|----------|-------|
| P0       | 1        | 0        | 0*    |
| P1       | 8        | 11       | 8     |
| P2       | 6        | 12       | 2     |
| P3       | 2        | 11       | 2     |

*P0 (hitsCount never populated) requires larger refactor — tracked for next sprint.

---

## Fixes Applied

### Backend (VPS via MCP)

#### 1. AlertService Date serialization (P0 — from previous session)
- **File:** `src/modules/conversion/alert.service.ts`
- **Bug:** `new Date()` objects passed to `db.execute(sql\`...\`)` raw queries — `postgres.js` crashes with `ERR_INVALID_ARG_TYPE`
- **Fix:** `.toISOString()` on 3 Date variables in `checkNewUserBurst()` and `checkMultiIpAlerts()`

#### 2. checkBossExpiry no distributed lock (P1)
- **File:** `src/modules/world-boss/world-boss.cron.ts`
- **Bug:** 2 PM2 instances both detect boss expired → both call `endBoss()` → duplicate reward distribution (XP + OGN doubled)
- **Fix:** Added `acquireExpiryLock()`/`releaseExpiryLock()` (Redis SET NX EX 30) — only 1 instance processes expiry

#### 3. setCurrentEvent no TTL (P1)
- **File:** `src/modules/world-boss/utils/world-boss.redis.ts`
- **Bug:** `worldboss:current` key has NO TTL — if `cleanupEvent()` fails, key persists forever, blocking all future boss spawns permanently
- **Fix:** Added `'EX', 86400` (24h safety TTL) to `redis.set()`

#### 4. Preset boss hp !== maxHp (P1)
- **File:** `src/modules/world-boss/world-boss.routes.ts:278`
- **Bug:** `hp: randBetween(...)` and `maxHp: randBetween(...)` are 2 separate random calls → different values → boss spawns with wrong max HP
- **Fix:** Single random value assigned to both `hp` and `maxHp`

#### 5. setLastHit on every attack (P1)
- **File:** `src/modules/world-boss/services/world-boss.service.ts:253`
- **Bug:** `setLastHit()` called in every attack's Redis pipeline — tracks "most recent attacker" not "killing blow". Last-hit 20% reward bonus goes to wrong player
- **Fix:** Moved `setLastHit()` to only fire when `newHp <= 0` (actual killing blow)

### Frontend (Local)

#### 6. cooldownTotal hardcoded to 20 (P1)
- **File:** `src/modules/world-boss/hooks/useWorldBossAttack.ts:109`
- **Bug:** `cooldownTotal: 20` hardcoded — if server sends `cooldownSeconds: 60`, progress bar fills at 20s while actual cooldown is 60s
- **Fix:** Dynamic `cooldownTotal` state from `result.cooldownSeconds`

#### 7. setTimeout not cleaned on unmount (P1)
- **File:** `src/modules/world-boss/hooks/useWorldBossAttack.ts:85`
- **Bug:** `setTimeout(1500ms)` for result→cooldown transition not cleaned on unmount → setState on unmounted component
- **Fix:** Added `resultTimerRef` + cleanup in `useEffect` return

#### 8. WorldBossMarquee timer leak + blank red bar (P1/P2)
- **File:** `src/modules/world-boss/components/WorldBossMarquee.tsx`
- **Bug 1:** `setTimeout(10s)` pause timer not cleared on unmount
- **Bug 2:** During 10s pause, red bar visible but empty (no text)
- **Fix:** Added cleanup `useEffect`, collapse height to 0 during pause

#### 9. DamageFloat missing animation (P2)
- **File:** `src/styles/base.css`
- **Bug:** `animate-damage-float` CSS class referenced in `DamageFloat.tsx` but keyframe never defined → damage popup appears static
- **Fix:** Added `@keyframes damage-float` (float up + fade out 1.2s)

#### 10. AttackButton un-accented Vietnamese (P3)
- **Files:** `AttackButton.tsx`, `BossDeadOverlay.tsx`
- **Bug:** Text like "Tan Cong", "Boss da bi ha!", "Dang gui..." — missing Vietnamese diacritics
- **Fix:** Proper Vietnamese: "Tấn Công", "Boss đã bị hạ!", "Đang gửi..."

#### 11. WorldBossScreen isError handling (from previous session)
- **File:** `src/modules/world-boss/screens/WorldBossScreen.tsx:129`
- **Bug:** When API errors (500/network), `data = undefined` → shows BossWaiting instead of error message
- **Fix:** Added `isError` check with retry button before BossWaiting fallback

---

## Known Issues (Not Fixed — Next Sprint)

| # | Severity | Issue | File |
|---|----------|-------|------|
| 1 | P0 | `hitsCount`, `bestSingleHit`, `maxCombo` never populated in participations | world-boss.service.ts — needs Redis per-user tracking in submitAttack |
| 2 | P1 | Reward tier mismatch: code uses S/A/B/C/D, admin expects legendary/epic/rare/common | world-boss.service.ts:540 |
| 3 | P1 | setImmediate endBoss on kill — race condition with concurrent attacks | world-boss.service.ts:255 |
| 4 | P1 | Feed username is `userId.slice(0,8)` — shows UUID prefix instead of display name | world-boss.service.ts:263 |
| 5 | P1 | Leaderboard entries have no `username` field — FE shows truncated UUID | world-boss.types.ts + world-boss.service.ts |
| 6 | P1 | RewardsScreen leaderboard drawer is a stub — no data fetched | RewardsScreen.tsx:164 |
| 7 | P1 | Match3 score display uses refs in JSX — stale values during gameplay | WorldBossMatch3.tsx:176 |
| 8 | P2 | Sequential reward distribution blocks for 100+ participants | world-boss.service.ts:610 |
| 9 | P2 | No unique constraint on rewards table — allows duplicate rows | world-boss.schema.ts |

## Verification

- Backend: PM2 restart OK, no new errors in error log
- Frontend: `tsc --noEmit` = 0 errors
- API `/current`: returns correct `{ active: false }` (boss expired normally)
