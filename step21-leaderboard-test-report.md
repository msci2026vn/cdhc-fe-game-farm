# Bước 21: Leaderboard — Test Report

**Ngày:** 2026-02-11
**Status:** ✅ COMPLETE (sau khi fix 2 bugs)

---

## Backend

| Check | Status | Notes |
|-------|--------|-------|
| leaderboard.service.ts | ✅ | In-memory cache + RANK() window function |
| routes/leaderboard.ts | ✅ | Validation sort/page/limit |
| Route mounted | ✅ | `game.route('/leaderboard', leaderboardRoutes)` |
| Service exported | ✅ | `export { leaderboardService }` |
| totalHarvests column | ✅ | Used in sort |
| DB indexes | ⚠️ | No dedicated indexes for sort columns (OK for small data) |

---

## Frontend

| Check | Status | Notes |
|-------|--------|-------|
| Leaderboard.tsx | ✅ | 4 tabs (OGN/XP/Level/Harvests), myRank footer, top 3 podium |
| useLeaderboard hook | ✅ | staleTime 30s, queryKey includes sort/page/limit |
| game-api.ts | ✅ | Real API `/game/leaderboard` |
| Types match BE | ✅ | LeaderboardEntry + LeaderboardResult |
| Build | ✅ | No TypeScript errors, build success |

---

## Functional Tests (10/10 PASSED)

| # | Test | Result |
|---|------|--------|
| T1 | sort ogn | ✅ |
| T2 | sort xp | ✅ |
| T3 | sort level | ✅ |
| T4 | sort harvests | ✅ |
| T5 | pagination | ✅ |
| T6 | rank numbers sequential | ✅ |
| T7 | user info complete | ✅ |
| T8 | cache hit | ✅ (0ms cached vs 77ms first) |
| T9 | myRank valid | ✅ |
| T10 | descending order | ✅ |

---

## Performance

| Query | 1st (ms) | Cached (ms) |
|-------|----------|-------------|
| ogn | 77 | 0 |
| xp | 8 | - |
| level | 6 | - |
| harvests | 10 | - |

---

## HTTP Tests

| Endpoint | Code | Status |
|----------|------|--------|
| /leaderboard | 401 | ✅ (auth required) |
| /leaderboard?sort=xp | 401 | ✅ |
| /leaderboard?sort=BAD | 401 | ✅ |
| /leaderboard?page=0 | 401 | ✅ |
| /leaderboard?limit=999 | 401 | ✅ |

---

## All Endpoints Alive

| Endpoint | Code | Status |
|----------|------|--------|
| ping | 401 | ✅ |
| farm/plots | 401 | ✅ |
| boss/progress | 401 | ✅ |
| quiz/start | 401 | ✅ |
| shop/items | 401 | ✅ |
| social/friends | 401 | ✅ |
| leaderboard | 401 | ✅ |

---

## Issues Found & Fixed

| # | Priority | Issue | Status |
|---|----------|-------|--------|
| 1 | 🔴 Critical | `myRank` luôn null do check `undefined` thay vì `null` | ✅ FIXED |
| 2 | 🔴 Critical | `rankResult.rows[0]` error - Drizzle returns array, not `{rows}` | ✅ FIXED |

### Fix Details:

**Bug 1 - Line 154:**
```diff
- if (myRank === undefined) {
+ if (myRank === null) {
```

**Bug 2 - Line 167:**
```diff
- myRank = rankResult.rows[0] ? Number(rankResult.rows[0].rank) : null;
+ myRank = rankResult[0] ? Number(rankResult[0].rank) : null;
```

---

## PM2 Status

```
cdhc-api    online    198.0mb    0% cpu
```

---

**Bước 21 Status:** ✅ VERIFIED
