import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { worldBossApi } from '@/shared/api/api-world-boss';
import { WORLD_BOSS_KEY } from './useWorldBoss';
import type { WorldBossAttackResult } from '../types/world-boss.types';

export type AttackState = 'idle' | 'match3' | 'submitting' | 'result' | 'cooldown' | 'boss_dead' | 'error';

export interface Match3Result {
  gemsMatched: number;
  maxCombo: number;
  specialGems: number;
  score: number;
}

export function useWorldBossAttack(eventId: string | undefined) {
  const [state, setState] = useState<AttackState>('idle');
  const [lastResult, setLastResult] = useState<WorldBossAttackResult | null>(null);
  const [cooldownEnd, setCooldownEnd] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [cooldownTotal, setCooldownTotal] = useState(20);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const resultTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Cooldown tick
  useEffect(() => {
    if (state !== 'cooldown') {
      setCooldownRemaining(0);
      return;
    }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((cooldownEnd - Date.now()) / 1000));
      setCooldownRemaining(remaining);
      if (remaining <= 0) {
        setState('idle');
        clearInterval(timerRef.current);
      }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [state, cooldownEnd]);

  // Cleanup result timer on unmount
  useEffect(() => {
    return () => { clearTimeout(resultTimerRef.current); };
  }, []);

  const openMatch3 = useCallback(() => {
    if (state !== 'idle') return;
    setState('match3');
  }, [state]);

  const onMatch3Complete = useCallback(async (match3Result: Match3Result) => {
    if (!eventId) return;
    setState('submitting');

    try {
      const result = await worldBossApi.attack({
        eventId,
        gemsMatched: match3Result.gemsMatched,
        maxCombo: match3Result.maxCombo,
        specialGems: match3Result.specialGems,
        score: match3Result.score,
      });

      if (result.error === 'on_cooldown') {
        setCooldownEnd(Date.now() + (result.retryAfter || 20) * 1000);
        setState('cooldown');
        return;
      }
      if (result.error === 'boss_already_dead' || result.error === 'boss_not_active' || result.bossDefeated) {
        setLastResult(result);
        setState('boss_dead');
        queryClient.invalidateQueries({ queryKey: [...WORLD_BOSS_KEY] });
        return;
      }
      if (result.error) {
        setError(result.error);
        setState('error');
        return;
      }

      // Success
      setLastResult(result);
      setState('result');
      queryClient.invalidateQueries({ queryKey: [...WORLD_BOSS_KEY] });

      // After 1.5s showing damage → cooldown
      const cdSeconds = result.cooldownSeconds || 20;
      setCooldownTotal(cdSeconds);
      resultTimerRef.current = setTimeout(() => {
        setCooldownEnd(Date.now() + cdSeconds * 1000);
        setState('cooldown');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Loi ket noi');
      setState('error');
    }
  }, [eventId, queryClient]);

  const onMatch3Cancel = useCallback(() => {
    setState('idle');
  }, []);

  const dismissError = useCallback(() => {
    setError(null);
    setState('idle');
  }, []);

  return {
    state,
    lastResult,
    cooldownRemaining,
    cooldownTotal,
    error,
    openMatch3,
    onMatch3Complete,
    onMatch3Cancel,
    dismissError,
  };
}
