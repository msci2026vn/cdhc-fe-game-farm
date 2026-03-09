# FEAT: Skills Combat Integration (Prompt 5/12)

## Date: 2026-02-28

## Summary
Integrated 3 player skills into the turn-by-turn combat engine. Each skill has 5 levels with escalating effects. Skills are loaded from DB at battle start and stored in the Redis BattleSession.

## Files Created
1. **`src/modules/game/combat/skill-processor.ts`** (282 lines)
   - Central skill processing module, imported by battle-turn.ts
   - `castOtHiem(session, turnResult)` — check cooldown/mana, create buff, cleanse at Lv3+
   - `castRomBoc(session, turnResult)` — check cooldown/mana, create shield buff
   - `applyOtHiemToDamage(session, baseDamage, bossDef, turnResult)` — damage multiplier + DEF bypass
   - `getOtHiemCritBonus(session)` — extra crit chance from active buff
   - `applyRomBocToIncoming(session, incomingDamage, turnResult)` — damage reduction + shield absorb + reflect
   - `isDebuffImmune(session)` — Rom Boc Lv5 debuff immunity check
   - `processLeveledUlt(session, effectiveAtk, turnResult)` — level-scaled ULT damage
   - `tickSkillBuffs(session, turnResult)` — decrement durations, HOT healing, expire buffs, tick cooldowns

## Files Modified
2. **`src/modules/game/combat/combat.types.ts`**
   - Added interfaces: `PlayerSkillLevels`, `OtHiemBuff`, `RomBocBuff`, `SkillCooldowns`
   - Extended `BattleSession`: `playerSkillLevels`, `activeOtHiem`, `activeRomBoc`, `skillCooldowns`
   - Extended `PlayerAction`: `cast_ot_hiem`, `cast_rom_boc`
   - Extended `TurnResult`: `skillCast`, `skillBuffApplied`, `shieldAbsorbed`, `shieldReflected`, `hotHealed`

3. **`src/modules/game/combat/combat-engine.ts`** (+119 lines)
   - `calculateUltDamageWithLevel()` — level-aware ULT with pierce shield at Lv5, stun at Lv4-5
   - `createOtHiemBuff(level)` — creates OtHiemBuff from skill data
   - `createRomBocBuff(level, playerMaxHp)` — creates RomBocBuff with shield HP
   - `getSkillManaCost(skillId, level)` — mana cost lookup
   - `getSkillCooldownTurns(skillId, level)` — converts cd seconds to turns (/ 1.5)
   - `createSkillCooldowns()`, `createDefaultSkillLevels()` — factory helpers

4. **`src/modules/game/combat/battle-turn.ts`** (+87 lines, 7 patches)
   - Patch 1: Ot Hiem crit bonus in match case
   - Patch 2: Ot Hiem damage multiplier after match5Bonus
   - Patch 3: Level-scaled ULT replacing calculateUltDamage
   - Patch 4: ULT pierce shield for Lv5 (conditional shield reduction)
   - Patch 5: Rom Boc damage reduction on boss attack
   - Patch 6: Debuff immunity from Rom Boc Lv5 (wraps applyOnHitDot/applyOnHitStun)
   - Patch 7: Tick skill buffs at end-of-turn
   - Added `cast_ot_hiem` and `cast_rom_boc` action handlers

5. **`src/modules/game/combat/battle.routes.ts`** (+27 lines)
   - Loads player skill levels from DB at battle start
   - Injects `playerSkillLevels`, `activeOtHiem`, `activeRomBoc`, `skillCooldowns` into BattleSession
   - Updated `isValidAction` to accept `cast_ot_hiem`, `cast_rom_boc`

6. **`src/modules/game/combat/battle-orchestrator.ts`** (+4 lines)
   - Added TODO note: skills handled in turn-by-turn path only
   - Batch orchestrator NOT modified (doesn't process player skill actions)

## Skill Effects Summary

### Sam Dong (ULT Enhancement)
| Level | ATK Multiplier | Extra Effect |
|-------|---------------|--------------|
| 1     | 3.0x          | —            |
| 2     | 3.5x          | —            |
| 3     | 4.0x          | —            |
| 4     | 4.5x          | +Stun 1 turn |
| 5     | 5.0x          | +Stun + Pierce Shield |

### Ot Hiem (ATK Buff)
| Level | DMG Boost | Extra Effect |
|-------|-----------|--------------|
| 1     | +20%      | —            |
| 2     | +30%      | +5% crit     |
| 3     | +40%      | +Cleanse debuffs |
| 4     | +50%      | +Bypass 30% DEF |
| 5     | +60%      | +Bypass 50% DEF, +10% crit |

### Rom Boc (Shield/Heal)
| Level | DMG Reduction | Shield HP | Extra Effect |
|-------|--------------|-----------|--------------|
| 1     | 15%          | 10% maxHP | —            |
| 2     | 20%          | 15% maxHP | —            |
| 3     | 25%          | 20% maxHP | +HOT heal    |
| 4     | 30%          | 25% maxHP | +Reflect 10% |
| 5     | 35%          | 30% maxHP | +Debuff immune |

## Design Decisions
- **Duration conversion**: Skill durations (seconds) → turns via `Math.ceil(seconds / 1.5)` (1 turn ≈ 1.5s)
- **Orchestrator unchanged**: Batch path doesn't process player skill actions — skills only in turn-by-turn
- **Cast failure fallback**: If cast fails (cooldown/mana), action treated as match-3 skip with warning

## Verification
- `tsc --noEmit`: 0 new errors (110 pre-existing in unrelated modules)
- PM2 restart: server running clean
- All skill imports resolve correctly

## Git
- Commit: `e02ac93` on VPS (combined with Prompt 4 changes)
- 10 files total: 1,213 insertions, 212 deletions
- Push pending (no SSH key on VPS)
