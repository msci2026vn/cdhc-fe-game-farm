# Fix Report — FE Combat Formulas (FE Prompt 1)
**Date:** 2026-02-28

## Scan Results
- **FE project:** React + Vite + TanStack Query
- **Combat formulas file:** `src/shared/utils/combat-formulas.ts`
- **Combat config file:** `src/shared/match3/combat.config.ts`
- **Callers:**
  - `src/modules/boss/hooks/useMatch3.ts` — boss weekly combat
  - `src/modules/campaign/hooks/useMatch3Campaign.ts` — campaign combat
  - `src/modules/boss/hooks/match-processor.engine.ts` — match processing (boss)
  - `src/modules/campaign/hooks/match3-processor.engine.ts` — match processing (campaign)
  - `src/modules/boss/hooks/boss-damage.handler.ts` — boss damage handler
  - `src/modules/campaign/hooks/match3-damage.handler.ts` — campaign damage handler
  - `src/modules/boss/hooks/combat-effects.ts` — dodge + ultimate
  - `src/modules/boss/components/BossList.tsx` — stat preview (atkGemDamage, starGemDamage)
  - `src/modules/boss/hooks/boss-attack.loop.ts` — boss auto-attack (normal ATK random)
  - `src/modules/campaign/hooks/match3-boss-ai.ts` — campaign boss auto-attack (normal ATK random)

## 7 Formulas Fixed

| # | Formula | Old | New | File:Line | Test (ATK=100, HP=1000, DEF=500) |
|---|---------|-----|-----|-----------|----------------------------------|
| 1 | Sword gem | 30+ATK×0.5 | 40+ATK×0.6 | combat-formulas.ts:12 | 80→100 |
| 2 | Star gem | 20+ATK×0.2 | 25+ATK×0.3 | combat-formulas.ts:17 | 40→55 |
| 3 | Heart heal | 20+HP×0.02 | 25+HP×0.04 | combat-formulas.ts:34 | 40→65 |
| 4 | Shield gain | 15+DEF×0.03 | 20+DEF×0.02+HP×0.01 | combat-formulas.ts:38-39 | 30→40 |
| 5 | DEF reduction | min(DEF×0.0003,0.5) | DEF/(DEF+500) | combat-formulas.ts:45-46 | 15%→50% |
| 6 | Skill mult | ×2.5 | ×2.0 | combat.config.ts:33 | -20% burst |
| 7 | ATK random | ATK×0.3 | ATK×0.2 | boss-attack.loop.ts:65, match3-boss-ai.ts:78 | max 30→20 |

## Callers Updated (shield maxHP param)

| File | Change |
|------|--------|
| `src/modules/boss/hooks/useMatch3.ts:53` | `shieldPerGem(playerStats.def)` → `shieldPerGem(playerStats.def, playerStats.hp)` |
| `src/modules/campaign/hooks/useMatch3Campaign.ts:100` | Same — added `playerStats.hp` |

## Balance Impact
- **Overall player DPS:** +25% (sword base 30→40, scaling 0.5→0.6; star base 20→25, scaling 0.2→0.3)
- **Heal:** +62.5% (heart base 20→25, scaling 0.02→0.04)
- **Shield:** Added HP scaling → tank builds viable (DEF×0.02 + HP×0.01)
- **DEF reduction:** Much stronger at mid-range (DEF=500: 15%→50%), diminishing returns
- **Skill damage:** -20% burst (2.5→2.0 multiplier)
- **Boss randomness:** -33% variance (0.3→0.2 random range)

## Verify
- [x] 7/7 formulas fixed to correct values
- [x] 0 old formula values remaining in codebase
- [x] Type check passes (0 errors)
- [x] Shield callers updated with maxHp parameter (2 files)
- [x] Formula spot-check: all 7 values match expected output
- [ ] Git committed

## Next: FE Prompt 2 — Fix Balance + startBattle
