import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useMatch3Campaign } from '@/modules/campaign/hooks/useMatch3Campaign';
import { adaptWorldBossToCampaign } from '../adapters/campaign-adapter';
import { worldBossApi } from '@/shared/api/api-world-boss';
import type { WorldBossInfo, WorldBossAttackResult } from '../types/world-boss.types';
import type { PlayerCombatStats } from '@/shared/utils/combat-formulas';
import type { PlayerSkillLevels } from '@/modules/campaign/types/skill.types';

export interface WorldBossSessionResult {
  totalDamage: number;
  maxCombo: number;
  rank: number | null;
  duration: number;
}

type BattleState = 'idle' | 'fighting' | 'ended';

const DEFAULT_SKILL_LEVELS: PlayerSkillLevels = { sam_dong: 1, ot_hiem: 0, rom_boc: 0 };
const BATCH_INTERVAL_MS = 3000;
const BATCH_INTERVAL_URGENT_MS = 2000;
const HP_URGENT_THRESHOLD = 0.1;

/**
 * useWorldBossBattle — Wraps campaign engine for World Boss mode.
 *
 * - Adapts WorldBossInfo → CampaignBossData
 * - Runs useMatch3Campaign for full combat (grid, gems, skills, boss AI)
 * - Accumulates damage delta, sends POST /attack every 3s (2s when boss HP < 10%)
 * - Flushes final batch when player dies (result='defeat')
 * - Exposes session stats (totalDamage, rank, maxCombo, hpPercent)
 *
 * IMPORTANT: worldBoss must be non-null. Only mount the component using this hook
 * when worldBoss data is available (same pattern as BossFightCampaign).
 */
export function useWorldBossBattle(
  worldBoss: WorldBossInfo,
  playerStats: PlayerCombatStats,
  eventId: string,
  onSessionEnd?: (result: WorldBossSessionResult) => void,
) {
  const [battleState, setBattleState] = useState<BattleState>('idle');
  const [sessionStats, setSessionStats] = useState({
    totalDamage: 0,
    maxCombo: 0,
    rank: null as number | null,
    hpPercent: worldBoss.hpPercent ?? 1,
  });

  // Refs for delta tracking
  const lastSentDamageRef = useRef(0);
  const hitCountRef = useRef(0);
  const prevTotalDmgRef = useRef(0);
  const battleStartRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sendingRef = useRef(false);
  const battleStateRef = useRef<BattleState>('idle');

  // Keep ref in sync
  battleStateRef.current = battleState;

  // Adapt boss data (stable reference)
  const campaignBossData = useMemo(
    () => adaptWorldBossToCampaign(worldBoss),
    [worldBoss],
  );

  // Campaign engine — runs full combat
  const engine = useMatch3Campaign(campaignBossData, playerStats, DEFAULT_SKILL_LEVELS, 1);

  // Track hits: every time totalDmgDealt increases, count as 1 hit
  useEffect(() => {
    const current = engine.totalDmgDealt ?? 0;
    if (current > prevTotalDmgRef.current && battleStateRef.current === 'fighting') {
      hitCountRef.current += 1;
    }
    prevTotalDmgRef.current = current;
  }, [engine.totalDmgDealt]);

  // Send a batch to the server
  const sendBatch = useCallback(async (isFinal: boolean) => {
    if (sendingRef.current) return;

    const currentDamage = engine.totalDmgDealt ?? 0;
    const damageDelta = currentDamage - lastSentDamageRef.current;
    if (damageDelta <= 0 && !isFinal) return;

    sendingRef.current = true;
    try {
      const res: WorldBossAttackResult = await worldBossApi.attack({
        eventId,
        damageDelta: Math.max(0, damageDelta),
        hits: hitCountRef.current,
        maxCombo: engine.maxCombo ?? 0,
        final: isFinal,
      });

      lastSentDamageRef.current = currentDamage;
      hitCountRef.current = 0;

      if (res.ok) {
        setSessionStats(prev => ({
          totalDamage: res.totalDamage ?? prev.totalDamage,
          maxCombo: engine.maxCombo ?? prev.maxCombo,
          hpPercent: res.hpPercent,
          rank: res.rank,
        }));

        // Boss died server-side
        if (res.hpPercent <= 0 && battleStateRef.current === 'fighting') {
          setBattleState('ended');
        }
      }

      return res;
    } catch (err) {
      console.error('[WorldBossBattle] batch failed:', err);
      return null;
    } finally {
      sendingRef.current = false;
    }
  }, [eventId, engine.totalDmgDealt, engine.maxCombo]);

  // Start battle
  const startBattle = useCallback(() => {
    if (battleState !== 'idle') return;
    setBattleState('fighting');
    lastSentDamageRef.current = 0;
    hitCountRef.current = 0;
    prevTotalDmgRef.current = 0;
    battleStartRef.current = Date.now();
  }, [battleState]);

  // Batch interval — send every 3s (2s when boss HP < 10%)
  useEffect(() => {
    if (battleState !== 'fighting') return;

    const ms = sessionStats.hpPercent < HP_URGENT_THRESHOLD
      ? BATCH_INTERVAL_URGENT_MS
      : BATCH_INTERVAL_MS;

    intervalRef.current = setInterval(() => sendBatch(false), ms);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [battleState, sendBatch, sessionStats.hpPercent]);

  // Watch player death → flush final batch
  useEffect(() => {
    if (engine.result !== 'defeat' || battleStateRef.current !== 'fighting') return;

    // Clear interval
    if (intervalRef.current) clearInterval(intervalRef.current);

    const duration = Math.floor((Date.now() - battleStartRef.current) / 1000);

    const flush = async () => {
      const res = await sendBatch(true);
      const sessionResult: WorldBossSessionResult = {
        totalDamage: res?.totalDamage ?? (engine.totalDmgDealt ?? 0),
        maxCombo: engine.maxCombo ?? 0,
        rank: res?.rank ?? null,
        duration,
      };
      setBattleState('ended');
      onSessionEnd?.(sessionResult);
    };

    flush();
  }, [engine.result]);

  // Cleanup: flush pending on unmount
  useEffect(() => {
    return () => {
      if (battleStateRef.current === 'fighting') {
        const currentDamage = engine.totalDmgDealt ?? 0;
        const delta = currentDamage - lastSentDamageRef.current;
        if (delta > 0) {
          // Fire-and-forget flush
          worldBossApi.attack({
            eventId,
            damageDelta: delta,
            hits: hitCountRef.current,
            maxCombo: engine.maxCombo ?? 0,
            final: true,
          }).catch(() => {});
        }
      }
    };
  }, [eventId]);

  // External signal: boss died/expired from lite polling
  const notifyBossDeadFromServer = useCallback(() => {
    if (battleStateRef.current !== 'fighting') return;
    if (intervalRef.current) clearInterval(intervalRef.current);

    const duration = Math.floor((Date.now() - battleStartRef.current) / 1000);

    const flush = async () => {
      const res = await sendBatch(true);
      const sessionResult: WorldBossSessionResult = {
        totalDamage: res?.totalDamage ?? (engine.totalDmgDealt ?? 0),
        maxCombo: engine.maxCombo ?? 0,
        rank: res?.rank ?? null,
        duration,
      };
      setBattleState('ended');
      onSessionEnd?.(sessionResult);
    };

    flush();
  }, [sendBatch, engine.totalDmgDealt, engine.maxCombo, onSessionEnd]);

  return {
    engine,
    battleState,
    sessionStats,
    startBattle,
    notifyBossDeadFromServer,
  };
}
