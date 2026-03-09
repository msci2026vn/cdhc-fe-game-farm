/**
 * useQuizAudio — Typed audio hook for quiz scenes
 * Auto-preloads quiz sounds and provides semantic methods.
 */
import { useCallback } from 'react';
import { useSound } from '../useSound';

export function useQuizAudio() {
  const { play } = useSound('quiz');

  return {
    play,
    start: useCallback(() => play('quiz_start'), [play]),
    select: useCallback(() => play('quiz_select'), [play]),
    correct: useCallback(() => play('quiz_correct'), [play]),
    wrong: useCallback(() => play('quiz_wrong'), [play]),
    timerLow: useCallback(() => play('quiz_timer_low'), [play]),
    complete: useCallback(() => play('quiz_complete'), [play]),
  };
}
