# Report — Scan P6-8 + Achievements Hub (FE Prompt 9)
**Ngay:** 2026-02-28

## PHAN 1: Scan P6-8
| Check | Status |
|-------|--------|
| tsc: 0 errors | ✅ |
| build: pass | ✅ |
| P6 Fragment: 4 files + route | ✅ |
| P7 Recipe: 4 files + 10 hooks (6 query/mutation) + 3 tabs + route | ✅ |
| P8 Missions: 4 files + 7 hooks (4 query/mutation) + VN tz + route | ✅ |
| Bottom nav updated (C.Thuc + N.Vu) | ✅ |

## PHAN 2: Achievements Hub (P9)

### Files Created (6 new)
| File | Purpose |
|------|---------|
| achievement.types.ts | Achievement, LoginStreak, ComboLeaderboardEntry, CATEGORY_CONFIG (5 cats), STREAK_MILESTONES (28-day) |
| api-achievements.ts | 6 hooks: useAchievements, useClaimAchievement, useClaimAllAchievements, useLoginStreak, useComboLeaderboard, useMyComboRank |
| AchievementCard.tsx | 4 states: claimable (pulse), in-progress (bar), hidden (???), claimed (grey) |
| LoginStreakCalendar.tsx | 28-day grid (4x7), milestone rewards, today gold pulse, streak fire, longest record |
| LeaderboardRow.tsx | Rank row, top 3 medals, avatar, combo count, stars, boss name |
| AchievementsHubScreen.tsx | 3 tabs: Thanh Tuu / Diem Danh / BXH (341 lines) |

### Files Modified (2)
| File | Changes |
|------|---------|
| App.tsx | +1 lazy import, +1 route /campaign/achievements |
| CampaignZoneScreen.tsx | Nav: replaced Manh with T.Tuu (emoji_events) |

### Features
| Feature | Status |
|---------|--------|
| 16 achievements with 5-category filter | ✅ |
| Achievement sort (claimable > unlocked > progress > hidden > claimed) | ✅ |
| Hidden achievements "???" with lock icon | ✅ |
| Claim single + Claim all (>= 2 claimable) | ✅ |
| 28-day login streak calendar (4x7 grid) | ✅ |
| Milestone rewards (Day 1/3/7/14/21/28) | ✅ |
| Today indicator (gold pulse animation) | ✅ |
| Day 28 legendary crown | ✅ |
| Streak counter + longest record | ✅ |
| Combo leaderboard top 100 | ✅ |
| 3 periods (weekly/monthly/alltime) | ✅ |
| My rank sticky card | ✅ |
| Top 3 medals (gold/silver/bronze) | ✅ |
| Empty states for all tabs | ✅ |
| Badge count on Thanh Tuu tab (red pulse) | ✅ |

### Build
- tsc --noEmit: 0 errors ✅
- vite build: success (58s) ✅

### Commits
1. `c083c50` feat: recipe crafting + missions screens (P7+P8)
2. `4ef417d` feat: achievements hub — achievements, login streak calendar, combo leaderboard (P9)

### Nav State (ZoneBottomNav)
Map | Skills | C.Thuc | N.Vu | T.Tuu

## Next: FE Prompt 10
