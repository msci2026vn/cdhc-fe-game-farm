# Report — Fix Warnings + Boss Intervals + Combo Tiers (FE P11)
**Date:** 2026-02-28

## Warnings Fixed
| # | Warning | Fix |
|---|---------|-----|
| W1 | Shake 350/500 hardcode in processor | ANIM_TIMING.SHAKE_BOMB_MS / SHAKE_RAINBOW_MS |
| W2 | setTimeout no cleanup after unmount | mountedRef guard on all 6 setTimeout callbacks |

## Boss Attack Intervals (Zone-scaled)
| Zone | Interval | Difficulty |
|------|----------|------------|
| 1-3 | 5000ms | Easy — newbie friendly |
| 4-6 | 4000ms | Medium — moderate pressure |
| 7-8 | 3500ms | Hard — fast reflexes needed |
| 9-10 | 3000ms | Hardcore — no rest |

- Config: `BOSS_ATTACK_INTERVALS` in combat.config.ts
- Helper: `getBossAttackInterval(zone)` with fallback to 4000ms
- Zone number threaded: CampaignBattleScreen → BossFightCampaign → useMatch3Campaign → match3-boss-ai
- Weekly boss unchanged (still uses fixed BOSS_ATK_INTERVAL = 4000)

## Combo Tiers (8 levels, replaces old 6-tier system)
| Tier | Min Combo | Multiplier | VFX |
|------|-----------|------------|-----|
| (none) | 0 | x1.0 | simple x{n} badge |
| NICE | 3 | x1.0 | fade in, green |
| GREAT | 5 | x1.1 | slide up + bounce, blue |
| EXCELLENT | 8 | x1.2 | bounce, purple, glow |
| AMAZING | 12 | x1.3 | shake + bounce, amber, pulse |
| EPIC | 20 | x1.5 | slam in, red, heavy glow |
| LEGENDARY | 30 | x1.8 | letter-spaced, gold, screen shake |
| MYTHIC | 50 | x2.0 | explosion in, rainbow text, heavy shake |

### VFX details:
- **Tier-up screen shake**: when combo crosses into AMAZING+ tier (shake=true)
- **CSS animations**: unique @keyframes per tier (combo-nice through combo-mythic)
- **Mythic rainbow text**: CSS gradient text with infinite animation
- **Legendary+ letter spacing**: spaced-out letters for dramatic effect
- **ComboDisplay enhanced**: tier-aware backgrounds, glow sizes, animation classes

### Damage model change:
- Old: combo 2 = 1.5x, combo 8 = 5.0x (aggressive scaling)
- New: combo 3 = 1.0x, combo 50 = 2.0x (gentler, rewards sustained combos)

## Files Modified
| Action | File |
|--------|------|
| MODIFY | `src/shared/match3/combat.config.ts` — COMBO_TIERS, BOSS_ATTACK_INTERVALS, ANIM_TIMING |
| MODIFY | `src/shared/match3/index.ts` — barrel exports |
| MODIFY | `src/modules/campaign/hooks/match3-processor.engine.ts` — mountedRef guard, ANIM_TIMING, tier shake |
| MODIFY | `src/modules/campaign/hooks/match3-boss-ai.ts` — zone-based attack interval |
| MODIFY | `src/modules/campaign/hooks/useMatch3Campaign.ts` — mountedRef, zoneNumber param |
| MODIFY | `src/modules/campaign/components/BossFightCampaign.tsx` — zoneNumber prop, flash thresholds |
| MODIFY | `src/modules/campaign/screens/CampaignBattleScreen.tsx` — pass zoneNumber |
| MODIFY | `src/modules/boss/components/hud/ComboDisplay.tsx` — tier-aware VFX rendering |
| MODIFY | `src/index.css` — combo tier animations + mythic effects |

## Build Status
- tsc --noEmit: PASS (0 errors)
- vite build: PASS (built in ~87s)
