// ═══════════════════════════════════════════════════════════════
// Combat types — shared interfaces for match-3 combat system
// ═══════════════════════════════════════════════════════════════

export interface BossState {
  bossHp: number; bossMaxHp: number;
  playerHp: number; playerMaxHp: number;
  shield: number; ultCharge: number;
  mana: number; maxMana: number;
  turnCount: number;
  immortalUsed: boolean;
  lastCrit: boolean;
  ultCooldown: number;
}

export interface DamagePopup { id: number; text: string; color: string; x: number; y: number; expiresAt?: number; }

export interface ActiveDebuff {
  type: string;
  remainingSec: number;
  icon: string;
  label: string;
  value: number;
}

export interface ActiveBossBuff {
  type: string;
  remainingSec: number;
  icon: string;
  label: string;
}

export interface EggState {
  hp: number;
  maxHp: number;
  countdown: number;
  healPercent: number;
}

export type FightResult = 'fighting' | 'victory' | 'defeat';

export interface BossAttackInfo { name: string; emoji: string; dmgMult: number; }

export interface BossAttackWarning {
  skill: BossAttackInfo | null;
  rawDmg: number;
  phase: 'warning' | 'dodge_window' | 'hit';
}

export interface SkillWarning {
  name: string;
  damage: number;
  countdown: number;
}

export interface CombatStats {
  critCount: number;
  reflectTotal: number;
  dodgeCount: number;
  ultCount: number;
  totalHealed: number;
  totalShieldGained: number;
  turnsPlayed: number;
}

export type CombatNotifType = 'crit' | 'reflect' | 'regen' | 'fort' | 'immortal' | 'dodge';

export interface CombatNotif {
  id: number;
  type: CombatNotifType;
  text: string;
  color: string;
  expiresAt?: number;
}
