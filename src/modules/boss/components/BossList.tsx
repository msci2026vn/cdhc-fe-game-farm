import { useState, useEffect } from 'react';
import { BOSSES, BossInfo, DIFFICULTY_STYLES } from '../data/bosses';
import { useBossProgress } from '@/shared/hooks/useBossProgress';
import { useBossStatus } from '@/shared/hooks/useBossStatus';
import { useLevel, useXp } from '@/shared/hooks/usePlayerProfile';
import { LEVEL_CONFIG } from '@/shared/stores/playerStore';
import { formatTime } from '@/shared/utils/format';

interface Props {
  onSelect: (boss: BossInfo) => void;
}

export default function BossList({ onSelect }: Props) {
  const { data: bossProgress } = useBossProgress();
  const { data: bossStatus } = useBossStatus();
  const level = useLevel();
  const xp = useXp();

  // Client-side cooldown countdown
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    const serverCd = bossStatus?.cooldownRemaining ?? 0;
    setCooldown(serverCd);
  }, [bossStatus?.cooldownRemaining]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // TIER-BASED: progressive XP per level
  const xpInLevel = LEVEL_CONFIG.getXpInLevel(xp);
  const xpForLevelUp = LEVEL_CONFIG.getXpForLevel(xp);
  const xpPct = Math.min(100, (xpInLevel / xpForLevelUp) * 100);
  const xpProgressText = `${xpInLevel}/${xpForLevelUp}`;

  // Calculate totals from server data
  const totalKills = bossProgress?.reduce((sum, p) => sum + p.kills, 0) ?? 0;
  const totalDmgDealt = bossProgress?.reduce((sum, p) => sum + p.totalDamage, 0) ?? 0;

  // Boss status
  const fightsUsed = bossStatus?.dailyFightsUsed ?? 0;
  const fightsMax = bossStatus?.dailyFightsMax ?? 5;
  const noFightsLeft = fightsUsed >= fightsMax;
  const onCooldown = cooldown > 0;
  const canFight = !noFightsLeft && !onCooldown;

  // Helper to get kills for a boss
  const getKills = (bossId: string) => {
    return bossProgress?.find(p => p.bossId === bossId)?.kills ?? 0;
  };

  return (
    <div className="h-[100dvh] max-w-[430px] mx-auto boss-gradient flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-5 pt-safe pb-3">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-heading text-xl font-bold text-white flex items-center gap-2">
            ⚔️ Chọn Boss
          </h1>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl font-heading text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)', boxShadow: '0 0 15px rgba(108,92,231,0.4)' }}>
              Lv.{level}
            </div>
          </div>
        </div>

        {/* XP bar */}
        <div className="mb-2">
          <div className="flex justify-between text-[10px] font-bold mb-1">
            <span style={{ color: '#a29bfe' }}>XP: {xpProgressText}</span>
            <span className="text-white/40">Level {level} &rarr; {level + 1}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${xpPct}%`, background: 'linear-gradient(90deg, #6c5ce7, #a29bfe)' }} />
          </div>
        </div>

        {/* Stats + daily fights */}
        <div className="flex items-center justify-between text-[11px] font-bold">
          <div className="flex items-center gap-3">
            <span style={{ color: '#ff6b6b' }}>⚔️ DMG: {totalDmgDealt.toLocaleString()}</span>
            <span style={{ color: '#55efc4' }}>💀 Ha: {totalKills}</span>
          </div>
          <span className={`px-2 py-0.5 rounded-lg ${noFightsLeft ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/70'}`}>
            {fightsUsed}/{fightsMax} tran
          </span>
        </div>

        {/* Cooldown banner */}
        {onCooldown && !noFightsLeft && (
          <div className="mt-2 px-3 py-2 rounded-xl text-center"
            style={{ background: 'rgba(108,92,231,0.15)', border: '1px solid rgba(108,92,231,0.3)' }}>
            <span className="text-[11px] font-bold text-white/60">
              Nghi ngoi: <span className="text-white font-mono">{formatTime(cooldown)}</span>
            </span>
          </div>
        )}

        {/* No fights left banner */}
        {noFightsLeft && (
          <div className="mt-2 px-3 py-2 rounded-xl text-center"
            style={{ background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.3)' }}>
            <span className="text-[11px] font-bold text-red-400">
              Het {fightsMax} luot hom nay. Quay lai ngay mai!
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-24 space-y-3">
        {BOSSES.map((boss) => {
          const style = DIFFICULTY_STYLES[boss.difficulty];
          const kills = getKills(boss.id);
          const locked = level < boss.unlockLevel;
          const disabled = locked || !canFight;

          return (
            <button key={boss.id}
              onClick={() => !disabled && onSelect(boss)}
              disabled={disabled}
              className={`w-full rounded-xl p-4 flex items-center gap-4 transition-transform ${
                disabled ? 'opacity-50 grayscale' : 'active:scale-[0.97]'
              }`}
              style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${disabled ? 'rgba(255,255,255,0.1)' : style.border}` }}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 relative"
                style={{ background: locked ? 'rgba(255,255,255,0.05)' : style.bg }}>
                {locked ? '🔒' : boss.emoji}
                {kills > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #e74c3c, #ff6b6b)' }}>
                    {kills}
                  </span>
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-heading text-sm font-bold text-white">{boss.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                    style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}>
                    {style.label}
                  </span>
                  {kills > 0 && <span className="text-[10px]">✅</span>}
                </div>
                {locked ? (
                  <p className="text-[11px] text-white/40">Can Level {boss.unlockLevel}</p>
                ) : (
                  <>
                    <p className="text-[11px] text-white/50 mb-1">{boss.description}</p>
                    <div className="flex items-center gap-3 text-[10px] font-bold">
                      <span style={{ color: '#ff6b6b' }}>HP {boss.hp.toLocaleString()}</span>
                      <span style={{ color: '#fdcb6e' }}>ATK {boss.attack}</span>
                      <span style={{ color: '#55efc4' }}>+{boss.reward} OGN</span>
                      <span style={{ color: '#a29bfe' }}>+{boss.xpReward} XP</span>
                    </div>
                  </>
                )}
              </div>
              <span className="text-white/30 text-lg">{disabled ? '' : '›'}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
