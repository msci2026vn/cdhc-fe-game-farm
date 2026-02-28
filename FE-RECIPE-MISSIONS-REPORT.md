# Report — Recipe Crafting + Missions (FE Prompt 7+8)

## Phan A: Recipe Crafting
| Item | Status |
|------|--------|
| recipe.types.ts (RecipeDefinition, PlayerRecipe, ActiveFarmBuff, MAX_BUFF_SLOTS) | ✅ |
| api-recipes.ts (6 hooks: definitions, inventory, buffs, craft, sell, use) | ✅ |
| RecipeCard.tsx (ingredients check, tier display, craft button) | ✅ |
| RecipeCraftScreen.tsx (3 tabs: Che Tao / Kho CT / Buff) | ✅ |
| Craft/Sell/Use flows with confirm modal | ✅ |
| Tier filter (all/common/rare/legendary) + Zone filter (1-10) | ✅ |
| Active buff countdown (useEffect interval 1s) | ✅ |
| Max 3 buff slots (visual indicator + disable Use button) | ✅ |
| Route /campaign/recipes + nav (C.Thuc) | ✅ |

## Phan B: Missions
| Item | Status |
|------|--------|
| mission.types.ts + MISSION_ICONS (12 icons) + getMissionIcon() | ✅ |
| api-missions.ts (4 hooks: daily, weekly, claim, claim-all) | ✅ |
| MissionCard.tsx (3 states: in-progress, claimable pulse, claimed greyed) | ✅ |
| MissionScreen.tsx (2 tabs: Daily / Weekly) | ✅ |
| Claim single + Claim All (>= 2 claimable) | ✅ |
| Reset timer (VN timezone UTC+7, daily midnight, weekly Monday) | ✅ |
| Sort: claimable first -> in-progress -> claimed | ✅ |
| Weekly fragment rewards display | ✅ |
| Badge count on tab (red pulse badge) | ✅ |
| Route /campaign/missions + nav (N.Vu) | ✅ |

## Build
- tsc --noEmit: 0 errors ✅
- vite build: success (1m 2s) ✅

## Files Created (8 new, 2 modified)
- `src/modules/campaign/types/recipe.types.ts` — NEW
- `src/shared/api/api-recipes.ts` — NEW (6 hooks)
- `src/modules/campaign/components/RecipeCard.tsx` — NEW
- `src/modules/campaign/screens/RecipeCraftScreen.tsx` — NEW (531 lines)
- `src/modules/campaign/types/mission.types.ts` — NEW
- `src/shared/api/api-missions.ts` — NEW (4 hooks)
- `src/modules/campaign/components/MissionCard.tsx` — NEW
- `src/modules/campaign/screens/MissionScreen.tsx` — NEW (240 lines)
- `src/App.tsx` — MODIFIED (added 2 routes + 2 lazy imports)
- `src/modules/campaign/screens/CampaignZoneScreen.tsx` — MODIFIED (ZoneBottomNav: replaced Shop/Farm with C.Thuc/N.Vu)

## Commit
`c083c50` feat: recipe crafting + missions screens — craft/sell/use, daily/weekly quests

## Next: FE Prompt 9 — Achievements + Login Streak + Leaderboard
