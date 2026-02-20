/**
 * useMatch3Audio — Typed audio hook for Match-3 battle scenes
 * Auto-preloads battle sounds and provides semantic methods.
 */
import { useCallback } from 'react';
import { useSound } from '../useSound';
import { AudioManager, type SoundName } from '../AudioManager';

export function useMatch3Audio() {
  const { play } = useSound('battle');

  return {
    play,
    gemSelect: useCallback(() => play('gem_select'), [play]),
    gemSwap: useCallback(() => play('gem_swap'), [play]),
    gemMatch: useCallback(() => play('gem_match'), [play]),
    gemNoMatch: useCallback(() => play('gem_no_match'), [play]),
    combo: useCallback((count: number) => {
      const name = AudioManager.comboSound(count);
      if (name) play(name);
    }, [play]),
    damageDealt: useCallback(() => play('damage_dealt'), [play]),
    damageCrit: useCallback(() => play('damage_crit'), [play]),
    bossAttack: useCallback(() => play('boss_attack'), [play]),
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
