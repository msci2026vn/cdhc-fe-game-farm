// ═══════════════════════════════════════════════════════════════
// BattleResult — Victory/Defeat screen (campaign-enhanced)
// Shows stars, rewards, combat stats, tips on defeat
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import type { CombatStats } from '../../hooks/useMatch3';
import type { BossCompleteResult } from '@/shared/types/game-api.types';
import { playSound } from '@/shared/audio';
import { useTranslation } from 'react-i18next';

interface BattleResultProps {
  won: boolean;
  bossName: string;
  bossEmoji: string;
  totalDmgDealt: number;
  serverData: BossCompleteResult | undefined;
  combatStats: CombatStats;
  playerLevel: number;
  // Campaign-specific
  isCampaign: boolean;
  playerHpPct?: number;
  turnUsed?: number;
  turnMax?: number;
  archetype?: string;
  archetypeTip?: string;
  onBack: () => void;
  onRetry?: () => void;
  /** Level up overlay */
  leveledUp?: boolean;
  newLevel?: number;
  /** Time-based stars from combat (Prompt 12) */
  combatStars?: number;
  durationSeconds?: number;
  maxCombo?: number;
}

function StarDisplay({ stars }: { stars: number }) {
  return (
    <div className="flex items-center justify-center gap-1 my-2">
      {[1, 2, 3].map(i => (
        <span key={i} className={`text-3xl transition-all duration-300 ${i <= stars ? 'animate-scale-in' : 'opacity-20 grayscale'}`}
          style={{ animationDelay: `${i * 0.15}s` }}>
          ⭐
        </span>
      ))}
    </div>
  );
}

export default function BattleResult({
  won, bossName, bossEmoji, totalDmgDealt, serverData, combatStats,
  playerLevel, isCampaign, playerHpPct = 0, turnUsed = 0, turnMax = 0,
  archetype, archetypeTip, onBack, onRetry,
  leveledUp, newLevel,
  combatStars = 0, durationSeconds = 0, maxCombo = 0,
}: BattleResultProps) {
  const { t } = useTranslation();
  const [showLevelUp, setShowLevelUp] = useState(false);
  // Use server-validated stars if available, else use FE combat stars
  const stars = won ? (serverData?.stars ?? combatStars) : 0;

  // Play victory/defeat sound on mount
  useEffect(() => {
    playSound(won ? 'victory' : 'defeat');
    if (won && stars > 0) {
      setTimeout(() => playSound('star_earn'), 400);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (leveledUp) {
      const t = setTimeout(() => setShowLevelUp(true), 500);
      return () => clearTimeout(t);
    }
  }, [leveledUp]);

  return (
    <div className="h-[100dvh] max-w-[430px] mx-auto boss-gradient flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Level up overlay */}
      {showLevelUp && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="animate-scale-in text-center">
            <div className="text-6xl mb-2">🎉</div>
            <div className="px-8 py-4 rounded-2xl font-heading text-xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)', boxShadow: '0 0 60px rgba(108,92,231,0.8)' }}>
              LEVEL UP! ⭐ Lv.{newLevel ?? playerLevel}
            </div>
          </div>
        </div>
      )}

      <div className="animate-scale-in text-center w-full max-w-[360px]">
        {/* Result icon */}
        <div className="text-[72px] mb-3">{won ? '🏆' : '💀'}</div>
        <h2 className="font-heading text-2xl font-bold text-white mb-1">
          {won ? t('victory') : t('defeat')}
        </h2>
        <p className="text-white/60 text-sm mb-1">
          {won ? t('you_defeated_boss', { bossName }) : t('boss_defeated_you', { bossName })}
        </p>

        {/* Stars (all victories) */}
        {won && stars > 0 && (
          <>
            <StarDisplay stars={stars} />
            <p className="text-[11px] text-white/50 mb-2">
              {durationSeconds > 0 ? `${durationSeconds}s` : ''}{durationSeconds > 0 && playerHpPct > 0 ? ' · ' : ''}{playerHpPct > 0 ? `HP ${Math.round(playerHpPct)}%` : ''}
            </p>
          </>
        )}

        {/* Campaign zone progress */}
        {isCampaign && serverData?.zoneProgress && (
          <div className="rounded-xl p-2.5 mb-2"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-[10px] text-white/40 mb-1">{t('zone_progress')}</div>
            <div className="flex items-center justify-between text-xs text-white font-bold">
              <span>{t('boss_count_progress', { cleared: serverData.zoneProgress.bossesCleared, total: serverData.zoneProgress.totalBosses })}</span>
              <span>⭐ {serverData.zoneProgress.totalStars}/{serverData.zoneProgress.maxStars}</span>
            </div>
            {serverData.isFirstClear && (
              <div className="text-[10px] text-yellow-300 mt-1 font-bold">{t('first_clear_bonus')}</div>
            )}
          </div>
        )}

        {/* Campaign bonus rewards */}
        {isCampaign && serverData?.campaignRewards && (serverData.campaignRewards.starBonus > 0 || serverData.campaignRewards.firstClearBonus > 0) && (
          <div className="rounded-xl p-2.5 mb-2"
            style={{ background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.15)' }}>
            <div className="text-[10px] text-yellow-300/60 mb-1">Bonus Campaign</div>
            <div className="flex items-center gap-3 text-xs font-bold">
              {serverData.campaignRewards.starBonus > 0 && (
                <span style={{ color: '#fdcb6e' }}>⭐ +{serverData.campaignRewards.starBonus} OGN</span>
              )}
              {serverData.campaignRewards.firstClearBonus > 0 && (
                <span style={{ color: '#55efc4' }}>🎉 +{serverData.campaignRewards.firstClearBonus} OGN</span>
              )}
            </div>
          </div>
        )}

        {/* Reduced reward warning */}
        {isCampaign && serverData?.isReducedReward && (
          <div className="rounded-xl p-2.5 mb-2"
            style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.2)' }}>
            <div className="text-[10px] text-red-300/80 font-bold mb-0.5">
              ⚡ {t('out_of_full_reward_turns', { used: serverData.dailyFightsUsed ?? '?', max: serverData.dailyFightsMax ?? serverData.dailyBattlesMax ?? 20 })}
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-white/60">XP ×{Math.round((serverData.xpMultiplier ?? 0.5) * 100)}%</span>
              <span className="text-white/60">OGN ×{Math.round((serverData.ognMultiplier ?? 0) * 100)}%</span>
            </div>
          </div>
        )}

        {/* Remaining battles indicator */}
        {isCampaign && !serverData?.isReducedReward && serverData?.remainingBattles !== undefined && (
          <div className="text-center text-[10px] text-white/40 mb-1">
            {t('remaining_full_reward_battles', { remaining: serverData.remainingBattles, max: serverData.dailyFightsMax ?? serverData.dailyBattlesMax ?? 20 })}
          </div>
        )}

        {/* Server adjusted result */}
        {serverData?.wasAdjusted && (
          <p className="text-center text-[10px] text-orange-400/60 mb-1">
            {t('server_confirmed_result')}
          </p>
        )}

        {/* DMG row */}
        <div className="flex items-center justify-center gap-4 my-3 text-sm font-bold flex-wrap">
          <span style={{ color: '#ff6b6b' }}>⚔️ {totalDmgDealt.toLocaleString()} {t('dmg')}</span>
        </div>

        {/* Combat stats summary */}
        <div className="grid grid-cols-3 gap-2 mb-3 px-1">
          {combatStats.critCount > 0 && (
            <StatChip emoji="💥" label={`${combatStats.critCount} ${t('stat_crit')}`} color="#ff6b6b" />
          )}
          {combatStats.dodgeCount > 0 && (
            <StatChip emoji="🏃" label={`${combatStats.dodgeCount} ${t('stat_dodge')}`} color="#55efc4" />
          )}
          {combatStats.ultCount > 0 && (
            <StatChip emoji="⚡" label={`${combatStats.ultCount} ${t('stat_ult')}`} color="#a29bfe" />
          )}
          {combatStats.reflectTotal > 0 && (
            <StatChip emoji="🛡️" label={`${combatStats.reflectTotal} ${t('stat_reflect')}`} color="#74b9ff" />
          )}
          {combatStats.totalHealed > 0 && (
            <StatChip emoji="💚" label={`${combatStats.totalHealed} ${t('stat_heal')}`} color="#55efc4" />
          )}
          {combatStats.turnsPlayed > 0 && (
            <StatChip emoji="🔄" label={`${combatStats.turnsPlayed} ${t('stat_turn')}`} color="#fdcb6e" />
          )}
        </div>

        {/* Campaign battle details */}
        {isCampaign && turnMax > 0 && (
          <div className="rounded-xl p-3 mb-3"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="text-left">
                <span className="text-white/40">{t('stat_turn')}:</span>{' '}
                <span className="font-bold text-white">{turnUsed}/{turnMax}</span>
              </div>
              <div className="text-right">
                <span className="text-white/40">{t('max_combo')}</span>{' '}
                <span className="font-bold text-white">×{maxCombo || 1}</span>
              </div>
            </div>
          </div>
        )}

        {/* Reward cards */}
        {serverData?.won && (
          <div className="flex gap-3 mb-4">
            <div className="flex-1 px-4 py-3 rounded-xl animate-fade-in"
              style={{ background: 'rgba(240,180,41,0.15)', border: '1px solid rgba(240,180,41,0.3)' }}>
              <span className="text-xl">🪙</span>
              <span className="font-heading text-lg font-bold ml-1" style={{ color: '#d49a1a' }}>+{serverData.ognReward}</span>
            </div>
            <div className="flex-1 px-4 py-3 rounded-xl animate-fade-in"
              style={{ background: 'rgba(108,92,231,0.15)', border: '1px solid rgba(108,92,231,0.3)' }}>
              <span className="text-xl">⭐</span>
              <span className="font-heading text-lg font-bold ml-1" style={{ color: '#a29bfe' }}>+{serverData.xpGained} XP</span>
            </div>
          </div>
        )}

        {/* Defeat tip */}
        {!won && archetypeTip && (
          <div className="rounded-xl p-3 mb-4 text-left"
            style={{ background: 'rgba(253,203,110,0.1)', border: '1px solid rgba(253,203,110,0.2)' }}>
            <div className="text-[10px] font-bold text-yellow-300/80 uppercase tracking-wider mb-1">💡 {t('tip_label')}</div>
            <p className="text-[11px] text-white/70">{archetypeTip}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button onClick={() => { playSound('ui_click'); onBack(); }}
            className="flex-1 py-3.5 rounded-xl font-heading text-sm font-bold text-white active:scale-[0.97] transition-transform"
            style={{
              background: isCampaign
                ? 'rgba(255,255,255,0.1)'
                : 'linear-gradient(135deg, hsl(145,50%,36%), hsl(145,60%,48%))',
              border: isCampaign ? '1px solid rgba(255,255,255,0.2)' : 'none',
              boxShadow: isCampaign ? 'none' : '0 6px 20px rgba(45,138,78,0.3)',
            }}>
            {isCampaign ? `📋 ${t('back_to_map')}` : t('go_back')}
          </button>
          {onRetry && (
            <button onClick={() => { playSound('ui_click'); onRetry(); }}
              className="flex-1 py-3.5 rounded-xl font-heading text-sm font-bold text-white active:scale-[0.97] transition-transform btn-green">
              🔄 {won ? t('retry_battle') : t('try_again')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatChip({ emoji, label, color }: { emoji: string; label: string; color: string }) {
  return (
    <div className="text-center px-2 py-1.5 rounded-lg"
      style={{ background: `${color}15`, border: `1px solid ${color}20` }}>
      <div className="text-sm">{emoji}</div>
      <div className="text-[10px] font-bold" style={{ color }}>{label}</div>
    </div>
  );
}
