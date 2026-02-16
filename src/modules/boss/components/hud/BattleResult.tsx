// ═══════════════════════════════════════════════════════════════
// BattleResult — Victory/Defeat screen (campaign-enhanced)
// Shows stars, rewards, combat stats, tips on defeat
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import type { CombatStats } from '../../hooks/useMatch3';
import type { BossCompleteResult } from '@/shared/types/game-api.types';

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
  const [showLevelUp, setShowLevelUp] = useState(false);
  // Use server-validated stars if available, else use FE combat stars
  const stars = won ? (serverData?.stars ?? combatStars) : 0;

  useEffect(() => {
    if (leveledUp) {
      const t = setTimeout(() => setShowLevelUp(true), 500);
      return () => clearTimeout(t);
    }
  }, [leveledUp]);

  return (
    <div className="min-h-screen max-w-[430px] mx-auto boss-gradient flex flex-col items-center justify-center px-6 relative">
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
          {won ? 'Chiến thắng!' : 'Thất bại!'}
        </h2>
        <p className="text-white/60 text-sm mb-1">
          {won ? `Đã tiêu diệt ${bossName}!` : `${bossName} đã đánh bại bạn!`}
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
            <div className="text-[10px] text-white/40 mb-1">Tiến độ vùng</div>
            <div className="flex items-center justify-between text-xs text-white font-bold">
              <span>{serverData.zoneProgress.bossesCleared}/{serverData.zoneProgress.totalBosses} boss</span>
              <span>⭐ {serverData.zoneProgress.totalStars}/{serverData.zoneProgress.maxStars}</span>
            </div>
            {serverData.isFirstClear && (
              <div className="text-[10px] text-yellow-300 mt-1 font-bold">🎉 Lần đầu clear!</div>
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

        {/* Remaining battles indicator */}
        {isCampaign && serverData?.remainingBattles !== undefined && (
          <div className="text-center text-[10px] text-white/40 mb-1">
            Còn {serverData.remainingBattles}/20 trận hôm nay
          </div>
        )}

        {/* DMG row */}
        <div className="flex items-center justify-center gap-4 my-3 text-sm font-bold flex-wrap">
          <span style={{ color: '#ff6b6b' }}>⚔️ {totalDmgDealt.toLocaleString()} DMG</span>
        </div>

        {/* Combat stats summary */}
        <div className="grid grid-cols-3 gap-2 mb-3 px-1">
          {combatStats.critCount > 0 && (
            <StatChip emoji="💥" label={`${combatStats.critCount} Crit`} color="#ff6b6b" />
          )}
          {combatStats.dodgeCount > 0 && (
            <StatChip emoji="🏃" label={`${combatStats.dodgeCount} Né`} color="#55efc4" />
          )}
          {combatStats.ultCount > 0 && (
            <StatChip emoji="⚡" label={`${combatStats.ultCount} ULT`} color="#a29bfe" />
          )}
          {combatStats.reflectTotal > 0 && (
            <StatChip emoji="🛡️" label={`${combatStats.reflectTotal} Phản`} color="#74b9ff" />
          )}
          {combatStats.totalHealed > 0 && (
            <StatChip emoji="💚" label={`${combatStats.totalHealed} Hồi`} color="#55efc4" />
          )}
          {combatStats.turnsPlayed > 0 && (
            <StatChip emoji="🔄" label={`${combatStats.turnsPlayed} Lượt`} color="#fdcb6e" />
          )}
        </div>

        {/* Campaign battle details */}
        {isCampaign && turnMax > 0 && (
          <div className="rounded-xl p-3 mb-3"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="text-left">
                <span className="text-white/40">Lượt:</span>{' '}
                <span className="font-bold text-white">{turnUsed}/{turnMax}</span>
              </div>
              <div className="text-right">
                <span className="text-white/40">Max combo:</span>{' '}
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
            <div className="text-[10px] font-bold text-yellow-300/80 uppercase tracking-wider mb-1">💡 Mẹo</div>
            <p className="text-[11px] text-white/70">{archetypeTip}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button onClick={onBack}
            className="flex-1 py-3.5 rounded-xl font-heading text-sm font-bold text-white active:scale-[0.97] transition-transform"
            style={{
              background: isCampaign
                ? 'rgba(255,255,255,0.1)'
                : 'linear-gradient(135deg, hsl(145,50%,36%), hsl(145,60%,48%))',
              border: isCampaign ? '1px solid rgba(255,255,255,0.2)' : 'none',
              boxShadow: isCampaign ? 'none' : '0 6px 20px rgba(45,138,78,0.3)',
            }}>
            {isCampaign ? '📋 Về Map' : 'Quay lại'}
          </button>
          {onRetry && (
            <button onClick={onRetry}
              className="flex-1 py-3.5 rounded-xl font-heading text-sm font-bold text-white active:scale-[0.97] transition-transform btn-green">
              🔄 {won ? 'Đánh lại' : 'Thử lại'}
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
