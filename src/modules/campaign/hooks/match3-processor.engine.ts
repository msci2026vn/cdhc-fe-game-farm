// ═══════════════════════════════════════════════════════════════
// Campaign match processor — DEF → Egg → Shield → Boss → Reflect
// Supports special gems: striped, bomb, rainbow + chain reactions
// ═══════════════════════════════════════════════════════════════

import type { Dispatch, SetStateAction, MutableRefObject } from 'react';
import type { GemType, Gem } from '@/shared/match3/board.utils';
import { findMatches, findMatchGroups, applyGravity, collectTriggeredCells } from '@/shared/match3/board.utils';
import { getComboInfo, getComboTier, bossDEFReduction, ANIM_TIMING } from '@/shared/match3/combat.config';
import type { BossState, CombatStats, CombatNotifType, ActiveDebuff, ActiveBossBuff, EggState } from '@/shared/match3/combat.types';
import type { ActiveMilestones } from '@/shared/utils/combat-formulas';
import { OT_HIEM_CONFIG } from '@/shared/match3/combat.config';
import type { PlayerSkillLevels } from '../types/skill.types';
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
  // Player skill refs
  otHiemActiveRef: MutableRefObject<boolean>;
  skillLevelsRef: MutableRefObject<PlayerSkillLevels>;
  // Optional animation deps
  setSpawningGems?: Dispatch<SetStateAction<Set<number>>>;
  setScreenShake?: Dispatch<SetStateAction<boolean>>;
  mountedRef: MutableRefObject<boolean>;
  addBlastVfx?: (type: 'row' | 'col', index: number) => void;
  addParticleBurst?: (index: number, color: string, type?: 'burst' | 'fire' | 'heal') => void;
  addFloatingText?: (text: string, x: number, y: number, color: string) => void;
  addChainLightning?: (path: number[], color?: string) => void;
}

export function processCampaignMatchesImpl(
  deps: CampaignProcessorDeps,
  currentGrid: Gem[],
  currentCombo: number,
  recurse: (grid: Gem[], combo: number, cascadeDepth: number) => void,
  swapPair?: [number, number],
  cascadeDepth: number = 0,
): void {
  const {
    setBoss, setMatchedCells, setCombo, setShowCombo, comboRef, maxComboRef,
    setAnimating, setGrid, setTotalDmgDealt, setCombatStatsTracker,
    addPopup, addCombatNotif,
    dmgPerGem, hpHealPerGem, shieldGainPerGem, manaRegen, milestones,
    activeBossStats, eggRef, setEgg, activeBossBuffsRef, activeDebuffsRef,
    otHiemActiveRef, skillLevelsRef,
  } = deps;

  // Safety cap: prevent infinite cascade loops
  if (cascadeDepth >= ANIM_TIMING.MAX_CASCADE) {
    setAnimating(false);
    return;
  }

  // Use basic findMatches for quick empty check
  const basicMatched = findMatches(currentGrid);
  if (basicMatched.size === 0) {
    if (currentCombo > 1) setTimeout(() => { if (!deps.mountedRef.current) return; setShowCombo(false); }, 1500);
    else setShowCombo(false);
    comboRef.current = 0;
    setAnimating(false);
    return;
  }

  // Advanced match detection with pattern classification
  const swapPos = swapPair?.[1];
  const groups = findMatchGroups(currentGrid, swapPos);
  const newCombo = currentCombo + 1;
  comboRef.current = newCombo;
  if (newCombo > maxComboRef.current) maxComboRef.current = newCombo;
  setCombo(newCombo);
  if (newCombo >= 2) setShowCombo(true);
  const comboInfo = getComboInfo(newCombo);

  // Tier-up screen shake: when combo crosses into a new tier with shake=true
  if (deps.setScreenShake && currentCombo > 0) {
    const prevTier = getComboTier(currentCombo);
    const newTier = getComboTier(newCombo);
    if (newTier.min > prevTier.min && newTier.shake) {
      deps.setScreenShake(true);
      setTimeout(() => { if (!deps.mountedRef.current) return; deps.setScreenShake!(false); }, 300);
    }
  }

  // Audio
  const comboSfx = AudioManager.comboSound(newCombo);
  if (comboSfx) playSound(comboSfx);
  else playSound('gem_match');

  // Collect all matched positions from groups
  const matchedPositions = new Set<number>();
  for (const g of groups) {
    for (const p of g.positions) matchedPositions.add(p);

    // Spawn Chain Lightning for Star matches
    if (g.type === 'star' && deps.addChainLightning && g.positions.length >= 2) {
      deps.addChainLightning(g.positions, '#eab308');
    }
  }

  // Compute swap context for rainbow targeting (clear swapped gem's type, not most common)
  let swapContext: { pos: number; targetType: GemType } | undefined;
  if (swapPair) {
    const [posA, posB] = swapPair;
    if (currentGrid[posA]?.special === 'rainbow' && currentGrid[posB])
      swapContext = { pos: posA, targetType: currentGrid[posB].type };
    else if (currentGrid[posB]?.special === 'rainbow' && currentGrid[posA])
      swapContext = { pos: posB, targetType: currentGrid[posA].type };
  }

  // Collect triggered cells from special gems (chain reactions)
  const allRemove = collectTriggeredCells(currentGrid, matchedPositions, swapContext);

  // Determine spawn positions (special gems to CREATE — excluded from removal)
  const spawnEntries: { pos: number; special: NonNullable<Gem['special']>; type: GemType }[] = [];
  for (const g of groups) {
    if (g.specialSpawn) {
      spawnEntries.push({ pos: g.specialSpawn.pos, special: g.specialSpawn.special, type: g.type });
    }
  }
  // Remove spawn positions from the removal set (they'll become special gems)
  for (const entry of spawnEntries) allRemove.delete(entry.pos);

  // Tally ALL gems that will be removed (matched + triggered, excluding spawn positions)
  const tally: Partial<Record<GemType, number>> = {};
  allRemove.forEach(idx => {
    const g = currentGrid[idx];
    if (g) {
      tally[g.type] = (tally[g.type] || 0) + 1;

      // Trigger Candy Blast VFX if a striped gem explodes
      if (deps.addBlastVfx) {
        if (g.special === 'striped_h') deps.addBlastVfx('row', Math.floor(idx / 8));
        else if (g.special === 'striped_v') deps.addBlastVfx('col', idx % 8);
      }

      // Particle Burst disabled — canvas rAF loop quá nặng trên mobile
      // CSS gem-match-burst::before ring animation đủ feedback cho người chơi
    }
  });

  // Show special gem trigger popups
  const triggeredCount = allRemove.size - matchedPositions.size;
  if (triggeredCount > 0) {
    addPopup(`+${triggeredCount} triggered!`, '#e056fd');
    playSound('gem_match');
  }

  // Show all removed cells as matched (for animation)
  setMatchedCells(new Set(allRemove));

  setTimeout(() => {
    if (!deps.mountedRef.current) return;
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

      // ═══ Ớt Hiểm damage boost ═══
      if (otHiemActiveRef.current && totalDmg > 0) {
        const ohLv = skillLevelsRef.current.ot_hiem;
        if (ohLv >= 1) {
          const bonus = OT_HIEM_CONFIG.damageBonus[ohLv - 1];
          totalDmg = Math.round(totalDmg * (1 + bonus));
          const extraCrit = OT_HIEM_CONFIG.critBonus[ohLv - 1];
          if (extraCrit > 0 && !isCrit && Math.random() < extraCrit) {
            totalDmg = Math.round(totalDmg * 1.5);
            isCrit = true;
            playSound('damage_crit');
            setCombatStatsTracker(s => ({ ...s, critCount: s.critCount + 1 }));
            addCombatNotif('crit', '🌶️ CRIT!', '#e74c3c');
          }
        }
      }

      // ═══ DAMAGE PIPELINE: DEF → Egg → Shield → Boss → Reflect ═══
      let effectiveDef = activeBossStats.current.def;
      if (otHiemActiveRef.current && totalDmg > 0) {
        const ohLv = skillLevelsRef.current.ot_hiem;
        if (ohLv >= 1) {
          const bypass = OT_HIEM_CONFIG.defBypass[ohLv - 1];
          if (bypass > 0) effectiveDef = Math.round(effectiveDef * (1 - bypass));
        }
      }
      const currentDef = effectiveDef;
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

      // Pre-scan boss buffs once (avoid multiple .some()/.find() O(n) scans)
      const buffs = activeBossBuffsRef.current;
      let hasShield = false;
      let hasReflect = false;
      for (let bi = 0; bi < buffs.length; bi++) {
        if (buffs[bi].type === 'shield') hasShield = true;
        else if (buffs[bi].type === 'reflect') hasReflect = true;
      }

      // 2. Boss shield: 80% damage reduction
      if (hasShield && actualDmg > 0) {
        actualDmg = Math.floor(actualDmg * 0.2);
        addPopup('🛡️ Giảm 80%!', '#74b9ff');
      }

      // 3. Apply damage to boss
      bossHp = Math.max(0, bossHp - actualDmg);

      // 4. Reflect
      if (hasReflect && dmgAfterDef > 0) {
        const reflectDmg = Math.round(dmgAfterDef * 0.3);
        if (reflectDmg > 0) {
          playerHp = Math.max(0, playerHp - reflectDmg);
          addPopup(`🔄 Phản -${reflectDmg}`, '#e056fd');
        }
      }

      // Heal & shield — pre-scan debuffs once instead of 2x .some()
      const debuffs = activeDebuffsRef.current;
      let isHealBlocked = false;
      let isArmorBrokenMatch = false;
      for (let di = 0; di < debuffs.length; di++) {
        if (debuffs[di].type === 'heal_block') isHealBlocked = true;
        else if (debuffs[di].type === 'armor_break') isArmorBrokenMatch = true;
      }
      const healAmt = isHealBlocked ? 0 : Math.round(hpCount * hpHealPerGem * comboInfo.mult);
      playerHp = Math.min(prev.playerMaxHp, playerHp + healAmt);
      const shieldAmt = isArmorBrokenMatch ? 0 : Math.round(defCount * shieldGainPerGem * comboInfo.mult);
      shield = Math.min(shield + shieldAmt, prev.playerMaxHp);

      if (healAmt > 0) setCombatStatsTracker(s => ({ ...s, totalHealed: s.totalHealed + healAmt }));
      if (shieldAmt > 0) setCombatStatsTracker(s => ({ ...s, totalShieldGained: s.totalShieldGained + shieldAmt }));

      mana = Math.min(prev.maxMana, mana + manaRegen);
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

    // Build new grid: remove matched+triggered cells, place special gems at spawn positions
    // Pre-build spawn position map for O(1) lookup instead of O(n) find() per cell
    const spawnMap = new Map<number, typeof spawnEntries[0]>();
    for (const entry of spawnEntries) spawnMap.set(entry.pos, entry);

    const newGrid = currentGrid.map((g, i) => {
      // Spawn special gem at this position
      const spawn = spawnMap.get(i);
      if (spawn) return { ...g, special: spawn.special } as Gem;
      // Remove if in allRemove
      if (allRemove.has(i)) return null;
      return g;
    }) as (Gem | null)[];

    const fallen = applyGravity(newGrid as Gem[]);
    setGrid(fallen);
    setMatchedCells(new Set());

    // Spawn animation for newly created special gems
    if (spawnEntries.length > 0 && deps.setSpawningGems) {
      const spawnedIds = new Set(spawnEntries.map(e => currentGrid[e.pos]?.id).filter((id): id is number => id != null));
      deps.setSpawningGems(spawnedIds);
      setTimeout(() => { if (!deps.mountedRef.current) return; deps.setSpawningGems!(new Set()); }, ANIM_TIMING.SPAWN_ANIM_MS);
    }

    // Screen shake for bomb/rainbow triggers
    if (deps.setScreenShake) {
      const triggeredSpecials = [...matchedPositions].filter(i => currentGrid[i]?.special).map(i => currentGrid[i]!.special);
      if (triggeredSpecials.includes('rainbow') || triggeredSpecials.includes('bomb')) {
        deps.setScreenShake(true);
        const dur = triggeredSpecials.includes('rainbow') ? ANIM_TIMING.SHAKE_RAINBOW_MS : ANIM_TIMING.SHAKE_BOMB_MS;
        setTimeout(() => { if (!deps.mountedRef.current) return; deps.setScreenShake!(false); }, dur);
      }
    }

    // Dynamic cascade acceleration: each step gets 10% faster (floor 150ms)
    const cascadeDelay = Math.max(ANIM_TIMING.CASCADE_MIN_MS,
      Math.round(ANIM_TIMING.CASCADE_BASE_MS * Math.pow(ANIM_TIMING.CASCADE_DECAY, cascadeDepth)));
    setTimeout(() => { if (!deps.mountedRef.current) return; recurse(fallen, newCombo, cascadeDepth + 1); }, cascadeDelay);
  }, ANIM_TIMING.MATCH_RESOLVE_MS);
}
