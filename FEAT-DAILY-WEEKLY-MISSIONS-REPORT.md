# Feat Report — Daily/Weekly Missions (Prompt 9)
**Date:** 2026-02-28
**Commit:** `9547683` on branch `avalan`

## Tables
| Table | Rows | Purpose |
|-------|------|---------|
| mission_definitions | 10 | 5 daily + 5 weekly mission definitions |
| player_missions | dynamic | Progress per player per period (lazy-init) |

## Files Created/Modified
| File | Action | Purpose |
|------|--------|---------|
| schema/missions.ts | NEW | 2 table schemas + 2 enums (mission_type, mission_action_type) |
| services/mission.service.ts | NEW | 6 functions: getPlayerMissions, trackMissionProgress, claimMission, claimAllCompleted, getCurrentPeriodKey, grantFragments |
| routes/mission.ts | NEW | 4 endpoints |
| routes/index.ts | EDIT | Mount /missions route |
| services/boss.service.ts | EDIT | Track boss_win, boss_campaign, star_3, combo_5, dodge |
| services/farm.service.ts | EDIT | Track harvest |
| services/recipe.service.ts | EDIT | Track recipe_craft |
| services/drop.service.ts | EDIT | Track fragment_collect |
| schema/index.ts | EDIT | Export missions schema |

## API Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/game/missions/daily | Today's 5 daily missions + progress |
| GET | /api/game/missions/weekly | This week's 5 weekly missions + progress |
| POST | /api/game/missions/claim | Claim single mission reward `{missionId}` |
| POST | /api/game/missions/claim-all | Claim all completed `{type: 'daily'|'weekly'}` |

## Daily Missions (270 OGN/day, 110 XP/day)
| Mission | Action | Target | OGN | XP |
|---------|--------|--------|-----|-----|
| Thu hoach 3 cay | harvest | 3 | 50 | 20 |
| Thang 2 boss | boss_win | 2 | 60 | 30 |
| Ne 3 don skill | dodge | 3 | 40 | 15 |
| Combo 5+ | combo_5 | 1 | 50 | 20 |
| 3 star mot tran | star_3 | 1 | 70 | 25 |

## Weekly Missions (1,450 OGN + 480 XP + 3 rare fragments/week)
| Mission | Action | Target | OGN | XP | Fragments |
|---------|--------|--------|-----|-----|-----------|
| Thang 10 boss | boss_win | 10 | 300 | 100 | — |
| 5 campaign boss | boss_campaign | 5 | 350 | 120 | 1 rare |
| Thu hoach 15 | harvest | 15 | 250 | 80 | — |
| Che tao 1 CT | recipe_craft | 1 | 300 | 100 | 1 rare |
| Thu 20 manh | fragment_collect | 20 | 250 | 80 | 1 rare |

## Auto-tracking Hooks
| Service | Actions Tracked |
|---------|-----------------|
| boss.service.ts | boss_win, boss_campaign, star_3, combo_5, dodge |
| farm.service.ts | harvest |
| recipe.service.ts | recipe_craft |
| drop.service.ts | fragment_collect |

## Key Design Decisions
1. **period_key** approach (daily=`YYYY-MM-DD`, weekly=`YYYY-WNN`) — NO cron needed for reset
2. **Lazy init** — player_missions rows created on first GET request per period
3. **Fire-and-forget tracking** — `trackMissionProgress` wrapped in try/catch, never blocks main flow
4. **Manual claim** — Player must explicitly claim rewards (no auto-claim)
5. **VN timezone** — UTC+7 for period calculation
6. **Fragment rewards** — Random fragment from matching tier, uses same upsert pattern as drop.service
7. **Progress cap** — `LEAST(progress + count, target)` prevents overflow

## Verification
- TypeScript: 0 mission-related errors (110 pre-existing in other modules)
- PM2 restart: clean, no errors
- GET /daily: Returns 5 missions with correct period_key `2026-02-28`
- GET /weekly: Returns 5 missions with correct period_key `2026-W09`
- POST /claim: Correctly rejects uncompleted missions (`MISSION_NOT_COMPLETED`)
- DB: `mission_definitions` = 10 rows, daily total = 270 OGN, weekly total = 1,450 OGN

## Next: Prompt 10 — Achievements + Login Streak + Combo Leaderboard
