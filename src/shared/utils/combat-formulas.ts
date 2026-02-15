export interface PlayerCombatStats {
  atk: number;   // effective ATK (base + points * perPoint)
  hp: number;    // effective HP
  def: number;   // effective DEF
  mana: number;  // effective Mana
}

// === DAMAGE ===

/** Damage per sword gem */
export function atkGemDamage(atk: number): number {
  return 30 + atk * 0.5;
}

/** Damage per star gem */
export function starGemDamage(atk: number): number {
  return 20 + atk * 0.2;
}

// === HP & SHIELD ===

/** Max player HP = effectiveHP */
export function maxPlayerHp(hp: number): number {
  return hp;
}

/** Starting shield from DEF */
export function startingShield(def: number): number {
  return Math.floor(def * 0.5);
}

/** HP healed per HP gem */
export function hpPerGem(hp: number): number {
  return 20 + hp * 0.02;
}

/** Shield gained per DEF gem */
export function shieldPerGem(def: number): number {
  return 15 + def * 0.03;
}

// === BOSS DAMAGE REDUCTION ===

/** DEF damage reduction ratio (cap 50%) */
export function damageReduction(def: number): number {
  return Math.min(def * 0.0003, 0.5);
}

/** Actual boss damage after DEF reduction */
export function actualBossDamage(rawDamage: number, def: number): number {
  const reduced = rawDamage * (1 - damageReduction(def));
  return Math.max(1, Math.floor(reduced));
}

// === ULT & MANA ===

/** ULT damage based on ATK + Mana */
export function ultDamage(atk: number, mana: number): number {
  return Math.floor(atk * 3 + mana * 0.5);
}

/** Mana regen per turn */
export function manaRegenPerTurn(mana: number): number {
  return Math.floor(8 + mana / 25);
}

/** Dodge mana cost */
export function dodgeCost(hasSave1: boolean): number {
  return hasSave1 ? 25 : 30;
}

/** ULT mana cost */
export function ultCost(hasSave2: boolean): number {
  return hasSave2 ? 65 : 80;
}

// === MILESTONES IN COMBAT ===

export interface ActiveMilestones {
  critChance: number;       // 0, 0.10, or 0.15
  critMultiplier: number;   // 2.0
  hasDestroy: boolean;      // match-5 bonus
  regenPercent: number;     // 0, 0.05, or 0.08
  regenInterval: number;    // 5 turns
  hasImmortal: boolean;     // revive once
  reflectPercent: number;   // 0, 0.10, or 0.20
  hasFort: boolean;         // immune every 10 turns
  dodgeCostReduced: boolean;
  ultCostReduced: boolean;
  hasSuperMana: boolean;    // free ULT, 8 turn CD
}

export function getActiveMilestones(stats: PlayerCombatStats): ActiveMilestones {
  return {
    critChance: stats.atk >= 800 ? 0.15 : stats.atk >= 300 ? 0.10 : 0,
    critMultiplier: 2.0,
    hasDestroy: stats.atk >= 2000,
    regenPercent: stats.hp >= 5000 ? 0.08 : stats.hp >= 1500 ? 0.05 : 0,
    regenInterval: 5,
    hasImmortal: stats.hp >= 15000,
    reflectPercent: stats.def >= 600 ? 0.20 : stats.def >= 200 ? 0.10 : 0,
    hasFort: stats.def >= 1500,
    dodgeCostReduced: stats.mana >= 250,
    ultCostReduced: stats.mana >= 800,
    hasSuperMana: stats.mana >= 3000,
  };
}
