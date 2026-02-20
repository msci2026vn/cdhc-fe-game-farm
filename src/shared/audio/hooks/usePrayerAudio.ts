/**
 * usePrayerAudio — Typed audio hook for prayer scenes
 * Auto-preloads prayer sounds and provides semantic methods.
 */
import { useCallback } from 'react';
import { useSound } from '../useSound';

export function usePrayerAudio() {
  const { play } = useSound('prayer');

  return {
    play,
    submit: useCallback(() => play('prayer_submit'), [play]),
    reward: useCallback(() => play('prayer_reward'), [play]),
    sparkle: useCallback(() => play('prayer_sparkle'), [play]),
  };
}
