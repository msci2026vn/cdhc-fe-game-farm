// ═══════════════════════════════════════════════════════════════
// useCoopBossBattle — Fork của useWorldBossBattle.ts cho Co-op
//
// Khác biệt duy nhất so với useWorldBossBattle:
// - Thêm coopRoomCode vào attack payload
//   → BE tự nhân multiplier từ Redis — FE không tính, chống gian lận
// - BATCH_INTERVAL_MS giữ nguyên 2700ms (sync với CoopRoom batchSender BE)
//
// QUAN TRỌNG: KHÔNG sửa useWorldBossBattle.ts gốc — fork riêng tránh regression
// ═══════════════════════════════════════════════════════════════

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useMatch3Campaign } from '@/modules/campaign/hooks/useMatch3Campaign';
import { adaptWorldBossToCampaign } from '@/modules/world-boss/adapters/campaign-adapter';
import { coopApi } from '@/modules/coop/api/api-coop';
import type { WorldBossInfo, WorldBossAttackResult } from '@/modules/world-boss/types/world-boss.types';
import type { PlayerCombatStats } from '@/shared/utils/combat-formulas';
import type { PlayerSkillLevels } from '@/modules/campaign/types/skill.types';

export interface CoopBossSessionResult {
  totalDamage: number;
  maxCombo:    number;
  rank:        number | null;
  duration:    number;
}

type BattleState = 'idle' | 'fighting' | 'ended';

const DEFAULT_SKILL_LEVELS: PlayerSkillLevels = { sam_dong: 1, ot_hiem: 0, rom_boc: 0 };
// BATCH_INTERVAL_MS > BE rate limit 2500ms + 200ms buffer
const BATCH_INTERVAL_MS = 2700;
// Khi boss ≤ 10% HP: gửi nhanh hơn (sync với CoopRoom batchSender 3s — OK nếu hơi chậm hơn)
const BATCH_INTERVAL_URGENT_MS = 1000;
const HP_URGENT_THRESHOLD = 0.1;

export function useCoopBossBattle(
  worldBoss: WorldBossInfo,
  playerStats: PlayerCombatStats,
  eventId: string,
  coopRoomCode: string,
  onSessionEnd?: (result: CoopBossSessionResult) => void,
  username?: string,
) {
  const [battleState, setBattleState] = useState<BattleState>('idle');
  const [sessionStats, setSessionStats] = useState({
    totalDamage: 0,
    maxCombo:    0,
    rank:        null as number | null,
    hpPercent:   worldBoss.hpPercent ?? 1,
  });

  const lastSentDamageRef  = useRef(0);
  const hitCountRef        = useRef(0);
  const prevTotalDmgRef    = useRef(0);
  const battleStartRef     = useRef(0);
  const intervalRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const sendingRef         = useRef(false);
  const battleStateRef     = useRef<BattleState>('idle');
  const usernameRef        = useRef(username);
  const coopRoomCodeRef    = useRef(coopRoomCode);

  battleStateRef.current  = battleState;
  usernameRef.current     = username;
  coopRoomCodeRef.current = coopRoomCode;

  const campaignBossData = useMemo(
    () => adaptWorldBossToCampaign(worldBoss),
    [worldBoss],
  );

  const engine = useMatch3Campaign(campaignBossData, playerStats, DEFAULT_SKILL_LEVELS, 1);

  // Đếm hit: mỗi lần totalDmgDealt tăng = 1 hit
  useEffect(() => {
    const current = engine.totalDmgDealt ?? 0;
    if (current > prevTotalDmgRef.current && battleStateRef.current === 'fighting') {
      hitCountRef.current += 1;
    }
    prevTotalDmgRef.current = current;
  }, [engine.totalDmgDealt]);

  // Gửi batch damage lên server với coopRoomCode để BE nhân multiplier
  const sendBatch = useCallback(async (isFinal: boolean) => {
    if (sendingRef.current) return;

    const currentDamage = engine.totalDmgDealt ?? 0;
    const damageDelta   = currentDamage - lastSentDamageRef.current;
    if (damageDelta <= 0 && !isFinal) return;

    sendingRef.current = true;
    try {
      const res: WorldBossAttackResult = await coopApi.attack({
        eventId,
        damageDelta:  Math.max(0, damageDelta),
        hits:         hitCountRef.current,
        maxCombo:     engine.maxCombo ?? 0,
        final:        isFinal,
        username:     usernameRef.current,
        coopRoomCode: coopRoomCodeRef.current,
      });

      lastSentDamageRef.current = currentDamage;
      hitCountRef.current = 0;

      if (res.ok) {
        setSessionStats(prev => ({
          totalDamage: res.totalDamage ?? prev.totalDamage,
          maxCombo:    engine.maxCombo ?? prev.maxCombo,
          hpPercent:   res.hpPercent,
          rank:        res.rank,
        }));

        // Boss chết phía server — kết thúc session
        if (res.hpPercent <= 0 && battleStateRef.current === 'fighting') {
          setBattleState('ended');
        }
      }

      return res;
    } catch (err) {
      console.error('[CoopBossBattle] batch failed:', err);
      return null;
    } finally {
      sendingRef.current = false;
    }
  }, [eventId, engine.totalDmgDealt, engine.maxCombo]);

  const startBattle = useCallback(() => {
    if (battleState !== 'idle') return;
    setBattleState('fighting');
    lastSentDamageRef.current  = 0;
    hitCountRef.current        = 0;
    prevTotalDmgRef.current    = 0;
    battleStartRef.current     = Date.now();
  }, [battleState]);

  // Batch interval: 2.7s (urgent: 1s khi boss < 10% HP)
  useEffect(() => {
    if (battleState !== 'fighting') return;

    const ms = sessionStats.hpPercent < HP_URGENT_THRESHOLD
      ? BATCH_INTERVAL_URGENT_MS
      : BATCH_INTERVAL_MS;

    intervalRef.current = setInterval(() => sendBatch(false), ms);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [battleState, sendBatch, sessionStats.hpPercent]);

  // Player chết → flush batch cuối
  useEffect(() => {
    if (engine.result !== 'defeat' || battleStateRef.current !== 'fighting') return;

    if (intervalRef.current) clearInterval(intervalRef.current);
    const duration = Math.floor((Date.now() - battleStartRef.current) / 1000);

    const flush = async () => {
      const res = await sendBatch(true);
      const sessionResult: CoopBossSessionResult = {
        totalDamage: res?.totalDamage ?? (engine.totalDmgDealt ?? 0),
        maxCombo:    engine.maxCombo ?? 0,
        rank:        res?.rank ?? null,
        duration,
      };
      setBattleState('ended');
      onSessionEnd?.(sessionResult);
    };

    flush();
  }, [engine.result]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup: fire-and-forget flush pending damage khi unmount
  useEffect(() => {
    return () => {
      if (battleStateRef.current === 'fighting') {
        const currentDamage = engine.totalDmgDealt ?? 0;
        const delta = currentDamage - lastSentDamageRef.current;
        if (delta > 0) {
          coopApi.attack({
            eventId,
            damageDelta:  delta,
            hits:         hitCountRef.current,
            maxCombo:     engine.maxCombo ?? 0,
            final:        true,
            username:     usernameRef.current,
            coopRoomCode: coopRoomCodeRef.current,
          }).catch(() => {});
        }
      }
    };
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  // External signal: boss chết/hết hạn từ useCoopRoom polling
  const notifyBossDeadFromServer = useCallback(() => {
    if (battleStateRef.current !== 'fighting') return;
    if (intervalRef.current) clearInterval(intervalRef.current);

    const duration = Math.floor((Date.now() - battleStartRef.current) / 1000);

    const flush = async () => {
      const res = await sendBatch(true);
      const sessionResult: CoopBossSessionResult = {
        totalDamage: res?.totalDamage ?? (engine.totalDmgDealt ?? 0),
        maxCombo:    engine.maxCombo ?? 0,
        rank:        res?.rank ?? null,
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
