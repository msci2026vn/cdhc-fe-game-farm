# Feat Report — Achievements + Login Streak + Combo Leaderboard (Prompt 10 - FINAL)
**Date:** 2026-02-28
**Commit:** `a083d1d` on branch `avalan`

## Tables Created
| Table | Rows | Purpose |
|-------|------|---------|
| achievement_definitions | 16 | 6 campaign + 4 combat + 3 collection + 2 farming + 1 social |
| player_achievements | dynamic | Progress + unlock + claim per player |
| login_streaks | dynamic | 1 row per player, streak tracking |
| combo_records | dynamic | Personal best combo per period (weekly/monthly/alltime) |

## Files Created/Modified
| File | Action | Purpose |
|------|--------|---------|
| schema/achievements.ts | NEW | 4 table schemas |
| services/achievement.service.ts | NEW | Lazy eval progress from live DB, claim rewards |
| services/achievement-fragment-helper.ts | NEW | Shared fragment grant helper |
| services/login-streak.service.ts | NEW | recordLogin + streak rewards + milestones |
| services/combo-leaderboard.service.ts | NEW | recordCombo + getLeaderboard + getPlayerRank |
| routes/achievement.ts | NEW | 4 endpoints (achievements + login-streak) |
| routes/combo-leaderboard.ts | NEW | 2 endpoints (leaderboard + player rank) |
| routes/index.ts | EDIT | Mount /achievements + /leaderboard/combo |
| services/boss.service.ts | EDIT | Hook recordCombo after campaign win |
| middleware/ensurePlayer.ts | EDIT | Hook recordLogin (fire-and-forget) |
| schema/index.ts | EDIT | Export achievements schema |

## API Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/game/achievements | All 16 achievements + live progress |
| POST | /api/game/achievements/claim | Claim single `{achievementId}` |
| POST | /api/game/achievements/claim-all | Claim all unlocked |
| GET | /api/game/achievements/login-streak | Current streak + milestones |
| GET | /api/game/leaderboard/combo?period= | Top 100 combo (weekly/monthly/alltime) |
| GET | /api/game/leaderboard/combo/me?period= | Player's rank |

## 16 Achievements
| Category | Count | Total OGN | Titles |
|----------|-------|-----------|--------|
| Campaign | 6 | 9,900 | Tan Binh, Nong Dan Tap Su, Chien Binh Huu Co, De Vuong, Hoan Hao, Huyen Thoai |
| Combat | 4 | 2,200 | Combo Master, Combo King, Ngoi Sao, Bong Ma |
| Collection | 3 | 2,300 | — (fragment rewards: 1 rare, 1 legendary) |
| Farming | 2 | 500 | Nong Dan Cham Chi, Trieu Phu |
| Social | 1 | 2,000 | Kien Tri |
| **TOTAL** | **16** | **16,900** | **11 titles** |

### Achievement Conditions
| Key | Condition | Target | Category |
|-----|-----------|--------|----------|
| first_blood | boss_clear_count | 1 | campaign |
| zone_1_clear | zone_clear | 1 | campaign |
| zone_5_clear | zone_clear | 5 | campaign |
| zone_10_clear | zone_clear | 10 | campaign (hidden) |
| perfect_zone | perfect_zone | 1 | campaign |
| boss_40_clear | boss_clear_count | 40 | campaign (hidden) |
| combo_king_10 | combo_max | 10 | combat |
| combo_king_20 | combo_max | 20 | combat |
| star_collector_50 | star_3_count | 50 | combat |
| dodge_master | dodge_total | 100 | combat |
| recipe_beginner | recipe_count | 5 | collection |
| recipe_master | recipe_count | 20 | collection |
| fragment_hoarder | fragment_count | 100 | collection |
| harvest_100 | harvest_count | 100 | farming |
| ogn_millionaire | total_ogn | 1,000,000 | farming (hidden) |
| login_28 | login_streak | 28 | social |

## Login Streak Rewards (28-day monthly)
| Day | OGN | Fragments | Title |
|-----|-----|-----------|-------|
| 1 | 50 | — | — |
| 3 | 100 | — | — |
| 7 | 200 | 1 common | — |
| 14 | 500 | 1 rare | — |
| 21 | 1,000 | 2 rare | — |
| 28 | 2,000 | 1 legendary | Kien Tri |
| Other days | 30 | — | — |

**Streak logic:**
- Consecutive daily login increments streak
- Missing a day resets to 1
- Monthly tracking resets each month
- Redis cache `login:{userId}:{date}` prevents duplicate recording
- Hooked into `ensurePlayerStats` middleware (every game API request)

## Combo Leaderboard
- 3 periods: weekly, monthly, alltime
- Top 100 per period
- Personal best only (upsert GREATEST on higher combo)
- Hooked into `boss.service.ts` after campaign boss win
- Stores bossId, zoneNumber, stars alongside combo

## Key Design Decisions
1. **Lazy evaluation** for achievements — progress computed from live DB on each GET, no hooks needed
2. **Auto-unlock** — achievements auto-unlock when progress >= target during GET
3. **Manual claim** — player must explicitly claim rewards
4. **Fire-and-forget** — login streak + combo recording never block main flow
5. **Redis skip** — login recording skips if already recorded today (90s TTL cache)
6. **VN timezone** — all date calculations use UTC+7

## Verification
- TypeScript: 0 new errors (110 pre-existing in other modules)
- PM2 restart: clean
- GET /achievements: Returns 16 achievements with live progress, 4 auto-unlocked for test user
- POST /achievements/claim: Successfully claimed first_blood (100 OGN + title "Tan Binh")
- GET /achievements/login-streak: Day 1 recorded, 6 milestones displayed
- GET /leaderboard/combo: Empty (will populate on boss fights)
- GET /leaderboard/combo/me: Returns rank=null (no data yet)

---

## BACKEND BOSS CAMPAIGN — COMPLETE (10 Prompts)

| Prompt | Feature | Status |
|--------|---------|--------|
| P1-2 | Combat fixes + anti-cheat | Done |
| P3-5 | Player skills (3 skills x 5 levels) | Done |
| P6 | Fragments + drops (30 defs, pity system) | Done |
| P7 | Recipes + farm buffs (30 defs, craft/sell/use) | Done |
| P8 | Bug fixes (8 bugs, transactions) | Done |
| P9 | Daily/Weekly missions (10 missions, auto-track) | Done |
| P10 | Achievements (16) + Login streak (28-day) + Combo leaderboard | Done |

### Total Economy Impact
| System | OGN/day | OGN/week | OGN one-time |
|--------|---------|----------|--------------|
| Daily missions | 270 | 1,890 | — |
| Weekly missions | — | 1,450 | — |
| Login streak | 30-2,000 | ~350 avg | — |
| Achievements | — | — | 16,900 |
| **Combined** | **~300** | **~3,690** | **16,900** |
