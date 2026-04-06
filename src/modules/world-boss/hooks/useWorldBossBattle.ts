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
  isSyncing?: boolean;
  syncError?: boolean;
  isServerError?: boolean;
}

type BattleState = 'idle' | 'fighting' | 'ended';

const DEFAULT_SKILL_LEVELS: PlayerSkillLevels = { sam_dong: 1, ot_hiem: 0, rom_boc: 0 };
// BATCH_INTERVAL_MS phải > BE rate limit 2500ms — dùng 3000ms cho an toàn
const BATCH_INTERVAL_MS = 3000;
// BATCH_INTERVAL_URGENT_MS khi boss ≤ 10% HP — phải > BE endgame limit 800ms
const BATCH_INTERVAL_URGENT_MS = 1200;
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
  username?: string,
  userId?: string,
) {
  const [battleState, setBattleState] = useState<BattleState>('idle');
  const [sessionStats, setSessionStats] = useState({
    totalDamage: 0,
    maxCombo: 0,
    rank: null as number | null,
    hpPercent: worldBoss.hpPercent ?? 1,
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Refs for delta tracking
  const lastSentDamageRef = useRef(0);
  const hitCountRef = useRef(0);
  const prevTotalDmgRef = useRef(0);
  const battleStartRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sendingRef = useRef(false);
  const battleStateRef = useRef<BattleState>('idle');
  const usernameRef = useRef(username);

  // Keep refs in sync
  battleStateRef.current = battleState;
  usernameRef.current = username;

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

  const lastSendTimeRef = useRef(0);
  const engineTotalDmgRef = useRef(0);
  const engineMaxComboRef = useRef(0);

  useEffect(() => {
    engineTotalDmgRef.current = engine.totalDmgDealt ?? 0;
    engineMaxComboRef.current = engine.maxCombo ?? 0;
  }, [engine.totalDmgDealt, engine.maxCombo]);

  // Send a batch to the server
  const sendBatch = useCallback(async (isFinal: boolean) => {
    if (sendingRef.current) return;

    // Explicitly enforce a minimum gap between requests (2500ms) to avoid 429
    const now = Date.now();
    const timeSinceLastSend = now - lastSendTimeRef.current;
    if (timeSinceLastSend < 2500 && !isFinal) {
      return;
    }

    const currentDamage = Math.floor(engineTotalDmgRef.current);
    const damageDelta = currentDamage - lastSentDamageRef.current;
    
    // Skip if no actual damage and no hits to report
    if (damageDelta <= 0 && hitCountRef.current <= 0 && !isFinal) return;

    // Safety: ensure hits/damage consistent
    let hits = Math.floor(hitCountRef.current);
    if (damageDelta > 0 && hits <= 0) hits = 1;
    if (damageDelta <= 0 && hits > 0 && !isFinal) {
      // If no damage, but we have hits, but not final... better wait for more damage to group them
      return; 
    }
    
    // If it's final but still no damage and no hits... skip totally
    if (isFinal && damageDelta <= 0 && hits <= 0) return;

    sendingRef.current = true;
    lastSendTimeRef.current = now;

    try {
      const res: WorldBossAttackResult = await worldBossApi.attack({
        eventId,
        damageDelta: Math.floor(Math.max(0, damageDelta)),
        hits: Math.floor(hits),
        maxCombo: Math.floor(engineMaxComboRef.current),
        final: isFinal,
        username: usernameRef.current,
      });

      if (res && 'ok' in res && res.ok) {
        lastSentDamageRef.current = currentDamage;
        hitCountRef.current = 0;

        setSessionStats(prev => ({
          totalDamage: res.totalDamage ?? prev.totalDamage,
          maxCombo: engineMaxComboRef.current,
          hpPercent: res.hpPercent,
          rank: res.rank,
        }));

        // Boss died server-side
        if (res.hpPercent <= 0 && battleStateRef.current === 'fighting') {
          setBattleState('ended');
        }
      } else {
        const errorMsg = (res && !res.ok && 'error' in res) ? res.error : 'Unknown error';
        if (errorMsg !== 'on_cooldown') {
          console.warn(`[WorldBossBattle] attack rejected: ${errorMsg}`, { damageDelta, hits, res });
        }
      }

      return res;
    } catch (err: any) {
      console.warn('[WorldBossBattle] batch failed:', err);
      return { ok: false as const, error: err.message, isServerError: err.isServerError === true };
    } finally {
      sendingRef.current = false;
    }
  }, [eventId]);

  const startBattle = useCallback(() => {
    if (battleState !== 'idle') return;
    setBattleState('fighting');
    lastSentDamageRef.current = 0;
    hitCountRef.current = 0;
    prevTotalDmgRef.current = 0;
    battleStartRef.current = Date.now();
  }, [battleState]);

  const sendFinalBatchWithRetry = useCallback(async (retriesLeft = 3): Promise<WorldBossAttackResult | null> => {
    setIsSyncing(true);
    const res = await sendBatch(true);
    if (res?.ok) {
      setIsSyncing(false);
      return res;
    }
    if (retriesLeft > 0) {
      // Exponential backoff or simple delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return sendFinalBatchWithRetry(retriesLeft - 1);
    }
    setIsSyncing(false);
    return res;
  }, [sendBatch]);

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
      const res = await sendFinalBatchWithRetry(3);
      const hasUnsentDamage = engineTotalDmgRef.current > lastSentDamageRef.current;
      const userIdx = userId ? worldBoss.leaderboard.findIndex(e => e.userId === userId) : -1;
      const fallbackRank = userIdx >= 0 ? userIdx + 1 : null;
      const sessionResult: WorldBossSessionResult = {
        totalDamage: (res && res.ok && 'totalDamage' in res) ? (res.totalDamage as number) : (engineTotalDmgRef.current),
        maxCombo: engineMaxComboRef.current,
        rank: (res && res.ok && 'rank' in res) ? (res.rank as number) : fallbackRank,
        duration,
        isSyncing: false,
        syncError: !res?.ok && hasUnsentDamage,
        isServerError: (res && !res.ok && (res as any).isServerError && hasUnsentDamage),
      };
      setBattleState('ended');
      onSessionEnd?.(sessionResult);
    };

    flush();
  }, [engine.result, sendFinalBatchWithRetry, onSessionEnd]);

  // Cleanup: flush pending on unmount
  useEffect(() => {
    return () => {
      if (battleStateRef.current === 'fighting') {
        const currentDamage = engineTotalDmgRef.current;
        const delta = currentDamage - lastSentDamageRef.current;
        if (delta > 0 || hitCountRef.current > 0) {
          // Fire-and-forget flush (final)
          sendBatch(true).catch(() => {});
        }
      }
    };
  }, [eventId, sendBatch]);

  // External signal: boss died/expired from lite polling
  const notifyBossDeadFromServer = useCallback(() => {
    if (battleStateRef.current !== 'fighting') return;
    if (intervalRef.current) clearInterval(intervalRef.current);

    const duration = Math.floor((Date.now() - battleStartRef.current) / 1000);

    const flush = async () => {
      const res = await sendFinalBatchWithRetry(3);
      const hasUnsentDamage = engineTotalDmgRef.current > lastSentDamageRef.current;
      const userIdx = userId ? worldBoss.leaderboard.findIndex(e => e.userId === userId) : -1;
      const fallbackRank = userIdx >= 0 ? userIdx + 1 : null;
      const sessionResult: WorldBossSessionResult = {
        totalDamage: (res && res.ok && 'totalDamage' in res) ? (res.totalDamage as number) : (engineTotalDmgRef.current),
        maxCombo: engineMaxComboRef.current,
        rank: (res && res.ok && 'rank' in res) ? (res.rank as number) : fallbackRank,
        duration,
        isSyncing: false,
        syncError: !res?.ok && hasUnsentDamage,
        isServerError: (res && !res.ok && (res as any).isServerError && hasUnsentDamage),
      };
      setBattleState('ended');
      onSessionEnd?.(sessionResult);
    };

    flush();
  }, [sendFinalBatchWithRetry, onSessionEnd]);

  return {
    engine,
    battleState,
    sessionStats,
    isSyncing,
    startBattle,
    notifyBossDeadFromServer,
  };
}
