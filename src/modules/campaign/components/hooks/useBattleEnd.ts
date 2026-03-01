// ═══════════════════════════════════════════════════════════════
// useBattleEnd — API call bossComplete when battle ends
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react';
import { useBossComplete } from '@/shared/hooks/useBossComplete';
import type { FightResult, BossState, CombatStats } from '@/shared/match3/combat.types';

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
}

export function useBattleEnd(params: BattleEndParams) {
  const {
    result, boss, campaignBossId,
    totalDmgDealt, durationSeconds, stars,
    maxCombo, combatStatsTracker, battleSessionId,
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
      });
    }
  }, [result, campaignBossId, totalDmgDealt, durationSeconds, bossComplete, stars, maxCombo, combatStatsTracker.dodgeCount, boss.playerHp, boss.playerMaxHp, battleSessionId]);

  return bossComplete;
}
