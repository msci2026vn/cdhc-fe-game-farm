// ═══════════════════════════════════════════════════════════════
// Match processor — gem tally, crit, damage calc, heal/shield/mana
// ═══════════════════════════════════════════════════════════════

import type { Dispatch, SetStateAction, MutableRefObject } from 'react';
import type { GemType, Gem } from '@/shared/match3/board.utils';
import { findMatches, applyGravity } from '@/shared/match3/board.utils';
import { getComboInfo } from '@/shared/match3/combat.config';
import type { BossState, CombatStats, CombatNotifType } from '@/shared/match3/combat.types';
import type { ActiveMilestones } from '@/shared/utils/combat-formulas';
import { playSound, AudioManager } from '@/shared/audio';

export interface MatchProcessorDeps {
  setBoss: Dispatch<SetStateAction<BossState>>;
  setMatchedCells: Dispatch<SetStateAction<Set<number>>>;
  setCombo: Dispatch<SetStateAction<number>>;
  setShowCombo: Dispatch<SetStateAction<boolean>>;
  comboRef: MutableRefObject<number>;
  maxComboRef: MutableRefObject<number>;
  setAnimating: Dispatch<SetStateAction<boolean>>;
  setGrid: Dispatch<SetStateAction<Gem[]>>;
  setTotalDmgDealt: Dispatch<SetStateAction<number>>;
  setCombatStatsTracker: Dispatch<SetStateAction<CombatStats>>;
  addPopup: (text: string, color: string) => void;
  addCombatNotif: (type: CombatNotifType, text: string, color: string) => void;
  dmgPerGem: Record<GemType, number>;
  hpHealPerGem: number;
  shieldGainPerGem: number;
  manaRegen: number;
  milestones: ActiveMilestones;
  setLandedGems: Dispatch<SetStateAction<Set<number>>>;
}

export function processMatchesImpl(
  deps: MatchProcessorDeps,
  currentGrid: Gem[],
  currentCombo: number,
  recurse: (grid: Gem[], combo: number) => void,
): void {
  const {
    setBoss, setMatchedCells, setCombo, setShowCombo, comboRef, maxComboRef,
    setAnimating, setGrid, setTotalDmgDealt, setCombatStatsTracker,
    addPopup, addCombatNotif,
    dmgPerGem, hpHealPerGem, shieldGainPerGem, manaRegen, milestones,
    setLandedGems,
  } = deps;

  const matched = findMatches(currentGrid);
  if (matched.size === 0) {
    if (currentCombo > 1) setTimeout(() => setShowCombo(false), 1500);
    else setShowCombo(false);
    comboRef.current = 0;
    setAnimating(false);
    return;
  }
  const newCombo = currentCombo + 1;
  comboRef.current = newCombo;
  if (newCombo > maxComboRef.current) maxComboRef.current = newCombo;
  setCombo(newCombo);
  if (newCombo >= 2) setShowCombo(true);
  const comboInfo = getComboInfo(newCombo);

  // Sound: gem match + combo escalation
  const comboSfx = AudioManager.comboSound(newCombo);
  if (comboSfx) playSound(comboSfx);
  else playSound('gem_match');

  const tally: Partial<Record<GemType, number>> = {};
  matched.forEach(idx => { const t = currentGrid[idx].type; tally[t] = (tally[t] || 0) + 1; });
  setMatchedCells(new Set(matched));

  setTimeout(() => {
    setBoss(prev => {
      let { bossHp, playerHp, shield, ultCharge, mana, turnCount, ultCooldown } = prev;
      const atkCount = tally.atk || 0;
      const hpCount = tally.hp || 0;
      const defCount = tally.def || 0;
      const starCount = tally.star || 0;

      // Increment turn
      turnCount++;
      if (ultCooldown > 0) ultCooldown--;

      // Stat-based damage
      const baseDmg = atkCount * dmgPerGem.atk + starCount * dmgPerGem.star;
      let totalDmg = Math.round(baseDmg * comboInfo.mult);

      // Crit check
      let isCrit = false;
      if (milestones.critChance > 0 && totalDmg > 0 && Math.random() < milestones.critChance) {
        totalDmg = Math.round(totalDmg * milestones.critMultiplier);
        isCrit = true;
        setCombatStatsTracker(s => ({ ...s, critCount: s.critCount + 1 }));
        addCombatNotif('crit', `CRIT! x${milestones.critMultiplier}`, '#ff6b6b');
        playSound('damage_crit');
      }

      bossHp = Math.max(0, bossHp - totalDmg);

      // Stat-based heal & shield
      const healAmt = Math.round(hpCount * hpHealPerGem * comboInfo.mult);
      playerHp = Math.min(prev.playerMaxHp, playerHp + healAmt);
      const shieldAmt = Math.round(defCount * shieldGainPerGem * comboInfo.mult);
      shield = Math.min(shield + shieldAmt, prev.playerMaxHp);

      if (healAmt > 0) setCombatStatsTracker(s => ({ ...s, totalHealed: s.totalHealed + healAmt }));
      if (shieldAmt > 0) setCombatStatsTracker(s => ({ ...s, totalShieldGained: s.totalShieldGained + shieldAmt }));

      // Mana regen per turn
      mana = Math.min(prev.maxMana, mana + manaRegen);

      // ULT charge (unchanged formula)
      ultCharge = Math.min(100, ultCharge + starCount * 8 + atkCount * 3 + (newCombo >= 2 ? 5 : 0));

      // HP regen milestone (every N turns)
      if (milestones.regenPercent > 0 && turnCount % milestones.regenInterval === 0) {
        const regenHp = Math.floor(prev.playerMaxHp * milestones.regenPercent);
        playerHp = Math.min(prev.playerMaxHp, playerHp + regenHp);
        addPopup(`💚 Hoi +${regenHp} HP`, '#55efc4');
        addCombatNotif('regen', `💚 Hoi phuc +${regenHp} HP`, '#55efc4');
        setCombatStatsTracker(s => ({ ...s, totalHealed: s.totalHealed + regenHp }));
      }

      setCombatStatsTracker(s => ({ ...s, turnsPlayed: turnCount }));

      if (totalDmg > 0) {
        setTotalDmgDealt(d => d + totalDmg);
        const critLabel = isCrit ? ' CRIT!' : '';
        const label = newCombo >= 2 ? `-${totalDmg} (x${comboInfo.mult})${critLabel}` : `-${totalDmg}${critLabel}`;
        addPopup(label, isCrit ? '#ff6b6b' : comboInfo.color);
        if (!isCrit) playSound('damage_dealt');
      }
      if (hpCount > 0) { addPopup(`+${healAmt} HP`, '#55efc4'); playSound('heal'); }
      if (defCount > 0) { addPopup(`+${shieldAmt} 🛡️`, '#74b9ff'); playSound('shield_gain'); }

      return { ...prev, bossHp, playerHp, shield, ultCharge, mana, turnCount, ultCooldown, lastCrit: isCrit };
    });

    const cleared = currentGrid.map((g, i) => matched.has(i) ? null : g) as (Gem | null)[];
    const fallen = applyGravity(cleared as Gem[]);
    
    // Track which gems landed/fell to trigger animation
    const landed = new Set<number>();
    fallen.forEach((g, i) => {
      if (g && currentGrid[i]?.id !== g.id) {
        landed.add(g.id);
      }
    });
    setLandedGems(landed);
    // Clear landed gems after animation
    setTimeout(() => setLandedGems(new Set()), 400);

    setGrid(fallen);
    setMatchedCells(new Set());
    setTimeout(() => recurse(fallen, newCombo), 300);
  }, 350);
}
