// ═══════════════════════════════════════════════════════════════
// Campaign match processor — DEF → Egg → Shield → Boss → Reflect
// ═══════════════════════════════════════════════════════════════

import type { Dispatch, SetStateAction, MutableRefObject } from 'react';
import type { GemType, Gem } from '@/shared/match3/board.utils';
import { findMatches, applyGravity } from '@/shared/match3/board.utils';
import { getComboInfo, bossDEFReduction } from '@/shared/match3/combat.config';
import type { BossState, CombatStats, CombatNotifType, ActiveDebuff, ActiveBossBuff, EggState } from '@/shared/match3/combat.types';
import type { ActiveMilestones } from '@/shared/utils/combat-formulas';
import { playSound, AudioManager } from '@/shared/audio';

export interface CampaignProcessorDeps {
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
  // Campaign-specific refs
  activeBossStats: MutableRefObject<{ atk: number; def: number; freq: number; healPercent: number }>;
  eggRef: MutableRefObject<EggState | null>;
  setEgg: Dispatch<SetStateAction<EggState | null>>;
  activeBossBuffsRef: MutableRefObject<ActiveBossBuff[]>;
  activeDebuffsRef: MutableRefObject<ActiveDebuff[]>;
}

export function processCampaignMatchesImpl(
  deps: CampaignProcessorDeps,
  currentGrid: Gem[],
  currentCombo: number,
  recurse: (grid: Gem[], combo: number) => void,
): void {
  const {
    setBoss, setMatchedCells, setCombo, setShowCombo, comboRef, maxComboRef,
    setAnimating, setGrid, setTotalDmgDealt, setCombatStatsTracker,
    addPopup, addCombatNotif,
    dmgPerGem, hpHealPerGem, shieldGainPerGem, manaRegen, milestones,
    activeBossStats, eggRef, setEgg, activeBossBuffsRef, activeDebuffsRef,
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

  // Audio: combo sounds or basic gem_match
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

      turnCount++;
      if (ultCooldown > 0) ultCooldown--;

      // Raw damage calculation
      const baseDmg = atkCount * dmgPerGem.atk + starCount * dmgPerGem.star;
      let totalDmg = Math.round(baseDmg * comboInfo.mult);

      // Crit check
      let isCrit = false;
      if (milestones.critChance > 0 && totalDmg > 0 && Math.random() < milestones.critChance) {
        totalDmg = Math.round(totalDmg * milestones.critMultiplier);
        isCrit = true;
        playSound('damage_crit');
        setCombatStatsTracker(s => ({ ...s, critCount: s.critCount + 1 }));
        addCombatNotif('crit', `CRIT! x${milestones.critMultiplier}`, '#ff6b6b');
      }

      // ═══ DAMAGE PIPELINE: DEF → Egg → Shield → Boss → Reflect ═══
      const currentDef = activeBossStats.current.def;
      const dmgAfterDef = bossDEFReduction(totalDmg, currentDef);
      let actualDmg = dmgAfterDef;

      // 1. Egg absorbs damage first
      const pipelineEgg = eggRef.current;
      if (pipelineEgg && pipelineEgg.hp > 0 && actualDmg > 0) {
        const absorbed = Math.min(pipelineEgg.hp, actualDmg);
        actualDmg -= absorbed;
        const newEggHp = pipelineEgg.hp - absorbed;
        addPopup(`🥚 -${absorbed}`, '#fdcb6e');
        if (newEggHp <= 0) {
          eggRef.current = null;
          setEgg(null);
          addPopup('🥚💥 Trứng vỡ!', '#fd79a8');
        } else {
          eggRef.current = { ...pipelineEgg, hp: newEggHp };
          setEgg({ ...pipelineEgg, hp: newEggHp });
        }
      }

      // 2. Boss shield: 80% damage reduction (not full block)
      if (activeBossBuffsRef.current.some(b => b.type === 'shield') && actualDmg > 0) {
        actualDmg = Math.floor(actualDmg * 0.2);
        addPopup('🛡️ Giảm 80%!', '#74b9ff');
      }

      // 3. Apply damage to boss
      bossHp = Math.max(0, bossHp - actualDmg);

      // 4. Reflect: % of DEF-reduced damage back to player
      const reflectBuff = activeBossBuffsRef.current.find(b => b.type === 'reflect');
      if (reflectBuff && dmgAfterDef > 0) {
        const reflectDmg = Math.round(dmgAfterDef * 0.3);
        if (reflectDmg > 0) {
          playerHp = Math.max(0, playerHp - reflectDmg);
          addPopup(`🔄 Phản -${reflectDmg}`, '#e056fd');
        }
      }

      // Stat-based heal & shield (check debuffs)
      const isHealBlocked = activeDebuffsRef.current.some(d => d.type === 'heal_block');
      const healAmt = isHealBlocked ? 0 : Math.round(hpCount * hpHealPerGem * comboInfo.mult);
      playerHp = Math.min(prev.playerMaxHp, playerHp + healAmt);
      const isArmorBrokenMatch = activeDebuffsRef.current.some(d => d.type === 'armor_break');
      const shieldAmt = isArmorBrokenMatch ? 0 : Math.round(defCount * shieldGainPerGem * comboInfo.mult);
      shield = Math.min(shield + shieldAmt, prev.playerMaxHp);

      if (healAmt > 0) setCombatStatsTracker(s => ({ ...s, totalHealed: s.totalHealed + healAmt }));
      if (shieldAmt > 0) setCombatStatsTracker(s => ({ ...s, totalShieldGained: s.totalShieldGained + shieldAmt }));

      // Mana regen per turn
      mana = Math.min(prev.maxMana, mana + manaRegen);

      // ULT charge
      ultCharge = Math.min(100, ultCharge + starCount * 8 + atkCount * 3 + (newCombo >= 2 ? 5 : 0));

      // HP regen milestone
      if (milestones.regenPercent > 0 && turnCount % milestones.regenInterval === 0) {
        const regenHp = Math.floor(prev.playerMaxHp * milestones.regenPercent);
        playerHp = Math.min(prev.playerMaxHp, playerHp + regenHp);
        addPopup(`💚 Hoi +${regenHp} HP`, '#55efc4');
        addCombatNotif('regen', `💚 Hoi phuc +${regenHp} HP`, '#55efc4');
        setCombatStatsTracker(s => ({ ...s, totalHealed: s.totalHealed + regenHp }));
      }

      setCombatStatsTracker(s => ({ ...s, turnsPlayed: turnCount }));

      if (actualDmg > 0) {
        setTotalDmgDealt(d => d + actualDmg);
        if (!isCrit) playSound('damage_dealt');
        const critLabel = isCrit ? ' CRIT!' : '';
        const defLabel = currentDef > 0 ? ' 🛡️' : '';
        const label = newCombo >= 2
          ? `-${actualDmg} (x${comboInfo.mult})${critLabel}${defLabel}`
          : `-${actualDmg}${critLabel}${defLabel}`;
        addPopup(label, isCrit ? '#ff6b6b' : comboInfo.color);
      }
      if (hpCount > 0) {
        if (isHealBlocked) addPopup('🚫 Khóa hồi!', '#a29bfe');
        else { addPopup(`+${healAmt} HP`, '#55efc4'); if (healAmt > 0) playSound('heal'); }
      }
      if (defCount > 0) {
        if (isArmorBrokenMatch) addPopup('💔 DEF 0!', '#fd79a8');
        else { addPopup(`+${shieldAmt} 🛡️`, '#74b9ff'); if (shieldAmt > 0) playSound('shield_gain'); }
      }

      return { ...prev, bossHp, playerHp, shield, ultCharge, mana, turnCount, ultCooldown, lastCrit: isCrit };
    });

    const cleared = currentGrid.map((g, i) => matched.has(i) ? null : g) as (Gem | null)[];
    const fallen = applyGravity(cleared as Gem[]);
    setGrid(fallen);
    setMatchedCells(new Set());
    setTimeout(() => recurse(fallen, newCombo), 300);
  }, 350);
}
