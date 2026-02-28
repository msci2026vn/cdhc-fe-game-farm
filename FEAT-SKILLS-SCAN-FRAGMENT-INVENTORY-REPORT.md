# Report — Skills Scan + Fragment Inventory (FE P3-5 Scan + P6)
**Ngay:** 2026-02-28

## PHAN 1: Skills UI Test (P3-5)
| Check | Status |
|-------|--------|
| tsc: 0 skill errors | PASS |
| Build pass | PASS |
| 7/7 new files | PASS |
| Config values GDD (Ot Hiem/Rom Boc/Sam Dong) | PASS |
| Ot Hiem damage boost + crit + defBypass | PASS |
| Rom Boc shield + damageReduction + HoT | PASS |
| ULT level scaling + stun + pierceShield | PASS |
| API connected (api-skills.ts + usePlayerSkills.ts) | PASS |
| Route mounted (/campaign/skills) | PASS |
| Level 0 locked | PASS |
| Shield cap intact (Math.min) | PASS |
| Cooldown non-negative (Math.max) | PASS |
| Bugs fixed | 2 bugs fixed (see below) |

### Bugs Fixed
1. **Reflect cap missing** — `match3-damage.handler.ts` lines 68,102: Added `Math.min(reflectDmg, Math.floor(prev.playerMaxHp * 0.10))` cap (10% maxHP, matching BE spec)
2. **Milestone reflect overwrites Rom Boc reflect** — `match3-damage.handler.ts` line 113: Changed `prev.bossHp` to `newBossHp` so both reflects stack correctly

## PHAN 2: Fragment Inventory + Drop (P6)
### Files Created
| File | Purpose |
|------|---------|
| `src/modules/campaign/types/fragment.types.ts` | Types, TIER_CONFIG, ZONE_NAMES |
| `src/shared/api/api-fragments.ts` | API getPlayerFragments + usePlayerFragments hook |
| `src/modules/campaign/components/DropAnimation.tsx` | Post-win drop popup with tier glow + pity bar |
| `src/modules/campaign/components/FragmentCard.tsx` | Individual fragment card with quantity badge |
| `src/modules/campaign/screens/FragmentInventoryScreen.tsx` | Full inventory grid grouped by zone with filter tabs |

### Files Modified
| File | Changes |
|------|---------|
| `src/shared/types/gameplay.types.ts` | Extended BossCompleteResult with `drop` field |
| `src/modules/campaign/components/BossFightCampaign.tsx` | DropAnimation state + render before BattleResult |
| `src/modules/campaign/hooks/match3-damage.handler.ts` | Reflect cap fix (10% maxHP) + milestone reflect fix |
| `src/App.tsx` | Route /campaign/fragments |
| `src/modules/campaign/screens/CampaignZoneScreen.tsx` | "Manh" nav button in ZoneBottomNav |

### Features
| Feature | Status |
|---------|--------|
| Drop animation (co/khong drop) | DONE |
| Tier glow (common/rare/legendary) | DONE |
| Pity counter + guaranteed display | DONE |
| Fragment inventory grid 10 zones | DONE |
| Filter tabs (All/Common/Rare/Legendary) | DONE |
| FragmentCard with quantity badge | DONE |
| Empty state | DONE |
| Route + navigation | DONE |
| API integration (usePlayerFragments) | DONE |
| tsc 0 errors | PASS |
| Build pass | PASS |

### Drop Animation Flow
```
Boss dies → complete API → if drop exists → DropAnimation overlay
→ player tap "Tiep tuc" → BattleResult (OGN/XP/Stars)
```

### Animation Sequence
1. Overlay fade in (200ms)
2. Card slide up (300ms, ease-out)
3. Fragment icon pulse + tier glow (400ms)
4. Pity bar fill (500ms transition)
5. Button fade in (300ms delay)

### Tier Visuals
- Common: gray border, no glow
- Rare: blue glow (#3b82f6), pulse
- Legendary: purple glow (#a855f7), intense + pulse

## Next: FE Prompt 7 — Recipe Crafting Screen
