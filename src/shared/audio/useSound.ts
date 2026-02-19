/**
 * useSound — React hook for game audio
 *
 * Usage:
 *   const { play } = useSound();
 *   play('gem_match');
 *
 * Auto-initializes AudioContext on first user interaction.
 */
import { useCallback, useEffect } from 'react';
import { audioManager, type SoundName } from './AudioManager';

export function useSound() {
  // Initialize audio context on mount (will activate on first user gesture)
  useEffect(() => {
    const handleInteraction = () => {
      audioManager.init();
      // Remove after first interaction
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

  const play = useCallback((name: SoundName) => {
    audioManager.play(name);
  }, []);

  return { play };
}

export { type SoundName };
