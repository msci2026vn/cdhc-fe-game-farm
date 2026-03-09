# Feat Report — Skills UI Complete (FE Prompt 3+4+5)
**Ngay:** 2026-02-28

## Phan A: Skill Buttons ✅
| Item | Status |
|------|--------|
| CampaignSkillButton.tsx component | ✅ |
| 🌶️ Ớt Hiểm button in combat | ✅ |
| 🪹 Rơm Bọc button in combat | ✅ |
| Cooldown ring animation (radial sweep) | ✅ |
| Active duration bar | ✅ |
| Locked state (level=0 → 🔒) | ✅ |
| Skill levels loaded from API (useSkillLevels) | ✅ |
| Cooldown tick (1s interval, pause-aware) | ✅ |
| Skill state + cast actions in useMatch3Campaign | ✅ |

## Phan B: Skill Upgrade Screen ✅
| Item | Status |
|------|--------|
| SkillUpgradeScreen.tsx | ✅ |
| SkillCard.tsx (3 cards) | ✅ |
| Level display + star tier | ✅ |
| Current effects + next level preview | ✅ |
| Upgrade cost (OGN + fragments) | ✅ |
| POST /api/game/skills/upgrade API call | ✅ |
| Success flash animation | ✅ |
| Error handling (insufficient funds) | ✅ |
| Route /campaign/skills mounted | ✅ |
| Navigation: Skills button in zone bottom nav | ✅ |
| OGN + Fragment currency bar | ✅ |
| Default skill data fallback | ✅ |

## Phan C: Skill Effects ✅
| Item | Status |
|------|--------|
| OT_HIEM_CONFIG (5 levels) | ✅ |
| ROM_BOC_CONFIG (5 levels) | ✅ |
| SAM_DONG_CONFIG (5 levels) | ✅ |
| Ớt Hiểm damage boost (+20-60%) in processor | ✅ |
| Ớt Hiểm crit bonus (Lv4+: 15-20%) | ✅ |
| Ớt Hiểm DEF bypass (Lv5: 50%) | ✅ |
| Ớt Hiểm cleanse debuffs (Lv3+) | ✅ |
| Rơm Bọc shield grant (10-30% maxHP) | ✅ |
| Rơm Bọc damage reduction (-15-35%) | ✅ |
| Rơm Bọc heal over time (Lv3+: 2-3%/sec) | ✅ |
| Rơm Bọc reflect damage (Lv4+: 5-8%) | ✅ |
| ULT level scaling (x3.0 → x5.0) | ✅ |
| ULT stun popup (Lv4+) | ✅ |
| ULT pierce shield (Lv5) | ✅ |
| BuffIndicator component (active buffs HUD) | ✅ |
| Visual: grid glow red (Ớt Hiểm active) | ✅ |
| Visual: grid glow green (Rơm Bọc active) | ✅ |
| Visual: enrage indicator in buff bar | ✅ |

## Files Created (7)
| File | Purpose |
|------|---------|
| `src/modules/campaign/types/skill.types.ts` | SkillId, PlayerSkill, PlayerSkillLevels types |
| `src/shared/api/api-skills.ts` | getPlayerSkills, upgradeSkill API |
| `src/shared/hooks/usePlayerSkills.ts` | TanStack Query hooks: usePlayerSkills, useSkillLevels, useUpgradeSkill |
| `src/modules/campaign/components/CampaignSkillButton.tsx` | Skill button with cooldown ring, active pulse, locked state |
| `src/modules/campaign/components/SkillCard.tsx` | Skill card for upgrade screen (level, effects, cost, upgrade) |
| `src/modules/campaign/screens/SkillUpgradeScreen.tsx` | Full skill upgrade screen with 3 cards |
| `src/modules/campaign/components/BuffIndicator.tsx` | Active buff HUD display with time bars |

## Files Modified (7)
| File | Changes |
|------|---------|
| `src/shared/match3/combat.config.ts` | Added OT_HIEM_CONFIG, ROM_BOC_CONFIG, SAM_DONG_CONFIG |
| `src/shared/match3/index.ts` | Export new configs |
| `src/modules/campaign/hooks/useMatch3Campaign.ts` | Skill state, cast actions, cooldown tick, HoT, ULT scaling |
| `src/modules/campaign/hooks/match3-processor.engine.ts` | Ớt Hiểm damage boost + crit + DEF bypass |
| `src/modules/campaign/hooks/match3-damage.handler.ts` | Rơm Bọc damage reduction + reflect |
| `src/modules/campaign/components/BossFightCampaign.tsx` | Render skill buttons, BuffIndicator, visual cues |
| `src/App.tsx` | Route /campaign/skills |
| `src/modules/campaign/screens/CampaignZoneScreen.tsx` | Skills nav button in bottom nav |

## Skill Configs Summary

### 🌶️ Ớt Hiểm (Active Damage Buff)
| Level | Duration | Damage+ | Crit+ | DEF Bypass | Cleanse |
|-------|----------|---------|-------|------------|---------|
| 1 | 6s | +20% | - | - | - |
| 2 | 7s | +30% | - | - | - |
| 3 | 8s | +40% | - | - | ✅ |
| 4 | 9s | +50% | 15% | - | ✅ |
| 5 | 10s | +60% | 20% | 50% | ✅ |
Cooldown: 20s

### 🪹 Rơm Bọc (Active Defense Buff)
| Level | Duration | Shield | DMG Red | HoT | Reflect | Debuff Immune |
|-------|----------|--------|---------|-----|---------|---------------|
| 1 | 4s | 10% HP | -15% | - | - | - |
| 2 | 5s | 15% HP | -20% | - | - | - |
| 3 | 5s | 20% HP | -25% | 2%/s | - | - |
| 4 | 6s | 25% HP | -30% | 2%/s | 5% | - |
| 5 | 7s | 30% HP | -35% | 3%/s | 8% | ✅ |
Cooldown: 25s

### ⚡ Sấm Đồng ULT (Level Scaling)
| Level | Damage | Stun | Pierce Shield |
|-------|--------|------|---------------|
| 1 | x3.0 ATK | - | - |
| 2 | x3.5 ATK | - | - |
| 3 | x4.0 ATK | - | - |
| 4 | x4.5 ATK | 1.5s | - |
| 5 | x5.0 ATK | 2.0s | ✅ |

## Build Status
- TypeScript: ✅ 0 errors
- Vite build: ✅ Success (1m 15s)

## Next: FE Prompt 6 — Fragment Inventory + Drop Animation
