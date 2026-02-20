/**
 * useSound — React hook for game audio
 *
 * Usage:
 *   const { play } = useSound();
 *   play('gem_match');
 *
 * With scene preloading:
 *   const { play } = useSound('battle');
 *   // Preloads all battle sounds on mount
 *
 * Auto-initializes AudioContext on first user interaction.
 */
import { useCallback, useEffect } from 'react';
import { audioManager, type SoundName } from './AudioManager';

export function useSound(scene?: string) {
  // Initialize audio context on mount (will activate on first user gesture)
  useEffect(() => {
    const handleInteraction = () => {
      audioManager.init();
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('click', handleInteraction);
    };
    window.addEventListener('touchstart', handleInteraction, { once: true });
    window.addEventListener('click', handleInteraction, { once: true });
    return () => {
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('click', handleInteraction);
    };
  }, []);

  // Preload scene sounds on mount
  useEffect(() => {
    if (scene) {
      audioManager.preloadScene(scene);
    }
  }, [scene]);

  const play = useCallback((name: SoundName) => {
    audioManager.play(name);
  }, []);

  return { play };
}

export { type SoundName };
