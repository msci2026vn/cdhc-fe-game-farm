// ═══════════════════════════════════════════════════════════════
// useBattleEnd — API call bossComplete when battle ends
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react';
import { useBossComplete } from '@/shared/hooks/useBossComplete';
import type { FightResult, BossState, CombatStats } from '@/shared/match3/combat.types';
import type { BattleLog } from '@/shared/types/gameplay.types';

interface BattleEndParams {
  result: FightResult;
  boss: BossState;
  campaignBossId: string;
  totalDmgDealt: number;
  durationSeconds: number;
  stars: number;
  maxCombo: number;
  combatStatsTracker: CombatStats;
  battleSessionId?: string;
  // Auto-play tracking (B4)
  autoAILevel?: number;
  isAutoPlayActive?: boolean;
  getBattleLog?: () => BattleLog;
}

export function useBattleEnd(params: BattleEndParams) {
  const {
    result, boss, campaignBossId,
    totalDmgDealt, durationSeconds, stars,
    maxCombo, combatStatsTracker, battleSessionId,
    autoAILevel, isAutoPlayActive, getBattleLog,
  } = params;

  const bossComplete = useBossComplete();
  const rewardedRef = useRef(false);

  useEffect(() => {
    if (result !== 'fighting' && !rewardedRef.current) {
      rewardedRef.current = true;
      const playerHpPct = Math.round((boss.playerHp / boss.playerMaxHp) * 100);
      bossComplete.mutate({
        bossId: campaignBossId,
        won: result === 'victory',
        totalDamage: totalDmgDealt,
        durationSeconds,
        stars: result === 'victory' ? stars : 0,
        playerHpPercent: playerHpPct,
        maxCombo,
        dodgeCount: combatStatsTracker.dodgeCount,
        isCampaign: true,
        battleSessionId,
        autoAILevel,
        battleLog: isAutoPlayActive && getBattleLog ? getBattleLog() : undefined,
      });
    }
  }, [result, campaignBossId, totalDmgDealt, durationSeconds, bossComplete, stars, maxCombo, combatStatsTracker.dodgeCount, boss.playerHp, boss.playerMaxHp, battleSessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  return bossComplete;
}
