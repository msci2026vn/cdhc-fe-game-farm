/**
 * useFarmAudio — Typed audio hook for farming scenes
 * Auto-preloads farming sounds and provides semantic methods.
 * Includes ambient weather layer support.
 */
import { useCallback, useRef } from 'react';
import { useSound } from '../useSound';
import { audioManager } from '../AudioManager';

export function useFarmAudio() {
  const { play } = useSound('farming');
  const ambientStopsRef = useRef<Array<() => void>>([]);

  return {
    play,
    plantSeed: useCallback(() => play('plant_seed'), [play]),
    waterPlant: useCallback(() => audioManager.playVaried('water_plant', 0.08, 0.1), []),
    harvest: useCallback(() => audioManager.playVaried('harvest', 0.06, 0.08), []),
    bugCatch: useCallback(() => audioManager.playVaried('bug_catch', 0.1, 0.1), []),
    plantDie: useCallback(() => play('plant_die'), [play]),
    shopBuy: useCallback(() => play('shop_buy'), [play]),
    shopConfirm: useCallback(() => play('shop_confirm'), [play]),

    /**
     * Start ambient weather layer based on current weather.
     * Call this when weather changes. Returns cleanup function.
     * Note: Requires ambient audio files to be registered in SoundRegistry.
     * Currently uses the FallbackSynth for ambient since no ambient MP3s exist yet.
     */
    stopAmbient: useCallback(() => {
      ambientStopsRef.current.forEach(stop => stop());
      ambientStopsRef.current = [];
      audioManager.stopAllAmbient();
    }, []),
  };
}
