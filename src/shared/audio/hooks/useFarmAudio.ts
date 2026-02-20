/**
 * useFarmAudio — Typed audio hook for farming scenes
 * Auto-preloads farming sounds and provides semantic methods.
 */
import { useCallback } from 'react';
import { useSound } from '../useSound';

export function useFarmAudio() {
  const { play } = useSound('farming');

  return {
    play,
    plantSeed: useCallback(() => play('plant_seed'), [play]),
    waterPlant: useCallback(() => play('water_plant'), [play]),
    harvest: useCallback(() => play('harvest'), [play]),
    bugCatch: useCallback(() => play('bug_catch'), [play]),
    plantDie: useCallback(() => play('plant_die'), [play]),
    shopBuy: useCallback(() => play('shop_buy'), [play]),
    shopConfirm: useCallback(() => play('shop_confirm'), [play]),
  };
}
