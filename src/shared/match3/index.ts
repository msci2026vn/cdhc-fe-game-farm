// ═══════════════════════════════════════════════════════════════
// shared/match3 — barrel exports
// ═══════════════════════════════════════════════════════════════

// Board utilities
export {
  COLS, ROWS, GEM_TYPES, GEM_META,
  randomGem, createGrid, findMatches, findMatchGroups, applyGravity, areAdjacent,
  triggerStriped, triggerBomb, triggerRainbow, collectTriggeredCells,
} from './board.utils';
export type { GemType, Gem, SpecialGemType, MatchPattern, MatchGroup } from './board.utils';

// Combat config
export {
  COMBO_TIERS, getComboInfo, getComboTier, COMBO_VFX,
  BOSS_ATK_INTERVAL, BOSS_ATTACK_INTERVALS, getBossAttackInterval,
  BOSS_SKILL_CHANCE, SKILL_DMG_MULT, SKILL_WARNING_MS,
  ARCHETYPE_SKILLS, getBossSkillName,
  getEnrageMultiplier, bossDEFReduction,
  OT_HIEM_CONFIG, ROM_BOC_CONFIG, SAM_DONG_CONFIG,
  ANIM_TIMING,
} from './combat.config';
export type { ComboTier } from './combat.config';

// Combat types
export type {
  BossState, DamagePopup, ActiveDebuff, ActiveBossBuff, EggState,
  FightResult, BossAttackInfo, BossAttackWarning, SkillWarning,
  CombatStats, CombatNotifType, CombatNotif,
} from './combat.types';

// Shared hooks
export { useGemPointer } from './useGemPointer';
export { useComboParticles } from './useComboParticles';
export type { ComboParticle } from './useComboParticles';
