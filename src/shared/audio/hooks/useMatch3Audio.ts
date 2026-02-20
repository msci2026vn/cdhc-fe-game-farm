/**
 * useMatch3Audio — Typed audio hook for Match-3 battle scenes
 * Auto-preloads battle sounds and provides semantic methods.
 * Includes combo escalation with chromatic pitch scaling.
 */
import { useCallback, useRef } from 'react';
import { useSound } from '../useSound';
import { audioManager, type SoundName } from '../AudioManager';

export function useMatch3Audio() {
  const { play } = useSound('battle');
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return {
    play,
    gemSelect: useCallback(() => audioManager.playVaried('gem_select', 0.06, 0.1), []),
    gemSwap: useCallback(() => play('gem_swap'), [play]),
    gemMatch: useCallback(() => audioManager.playVaried('gem_match', 0.08, 0.1), []),
    gemNoMatch: useCallback(() => play('gem_no_match'), [play]),

    /** Combo with pitch escalation — each level = 1 semitone up */
    combo: useCallback((count: number) => {
      // Reset combo timeout
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      comboTimerRef.current = setTimeout(() => { comboTimerRef.current = null; }, 2000);

      audioManager.playComboEscalated(count);
    }, []),

    // Combat sounds with variation for repeated hits
    damageDealt: useCallback(() => audioManager.playVaried('damage_dealt', 0.1, 0.1), []),
    damageCrit: useCallback(() => audioManager.playVaried('damage_crit', 0.08, 0.05), []),
    bossAttack: useCallback(() => audioManager.playVaried('boss_attack', 0.06, 0.1), []),
    bossSkill: useCallback(() => play('boss_skill'), [play]),
    dodge: useCallback(() => play('dodge_success'), [play]),
    shield: useCallback(() => play('shield_gain'), [play]),
    heal: useCallback(() => play('heal'), [play]),
    ultFire: useCallback(() => play('ult_fire'), [play]),
    bossEnrage: useCallback(() => play('boss_enrage'), [play]),
    victory: useCallback(() => play('victory'), [play]),
    defeat: useCallback(() => play('defeat'), [play]),
  };
}
