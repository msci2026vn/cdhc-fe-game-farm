import { useState, useEffect, useMemo } from 'react';
import { BOSSES, BossInfo, DIFFICULTY_STYLES } from '../data/bosses';
import { useBossProgress } from '@/shared/hooks/useBossProgress';
import { useBossStatus } from '@/shared/hooks/useBossStatus';
import { useLevel, useXp } from '@/shared/hooks/usePlayerProfile';
import { LEVEL_CONFIG } from '@/shared/stores/playerStore';
import { formatTime } from '@/shared/utils/format';
import { useWeeklyBoss } from '@/shared/hooks/useWeeklyBoss';
import { usePlayerStats } from '@/shared/hooks/usePlayerStats';
import { atkGemDamage, starGemDamage } from '@/shared/utils/combat-formulas';
import { STAT_CONFIG } from '@/shared/utils/stat-constants';
import { playSound } from '@/shared/audio';

interface Props {
  onSelect: (boss: BossInfo) => void;
}

const WEAKNESS_LABELS: Record<string, { label: string; emoji: string }> = {
  atk: { label: 'ATK', emoji: '⚔️' },
  hp: { label: 'HP', emoji: '❤️' },
  def: { label: 'DEF', emoji: '🛡️' },
  mana: { label: 'Mana', emoji: '✨' },
};

export default function BossList({ onSelect }: Props) {
  const { data: bossProgress } = useBossProgress();
  const { data: bossStatus } = useBossStatus();
  const { data: weeklyBoss } = useWeeklyBoss();
  const { data: statInfo } = usePlayerStats();
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

  // Weekly boss countdown
  const [weeklyCountdown, setWeeklyCountdown] = useState('');
  useEffect(() => {
    if (!weeklyBoss) return;
    const update = () => {
      const end = new Date(weeklyBoss.endsAt).getTime();
      const diff = Math.max(0, end - Date.now());
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setWeeklyCountdown(d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`);
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, [weeklyBoss]);

  // Estimated turns to kill (stat preview)
  const estimateTurns = useMemo(() => {
    const effectiveAtk = statInfo?.effectiveStats.atk ?? STAT_CONFIG.BASE.ATK;
    const dmgPerTurn = atkGemDamage(effectiveAtk) * 2 + starGemDamage(effectiveAtk); // ~avg 3 gems per turn
    return (bossHp: number) => dmgPerTurn > 0 ? Math.ceil(bossHp / dmgPerTurn) : 999;
  }, [statInfo]);

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
            {fightsUsed}/{fightsMax} trận
          </span>
        </div>

        {/* Cooldown banner */}
        {onCooldown && !noFightsLeft && (
          <div className="mt-2 px-3 py-2 rounded-xl text-center"
            style={{ background: 'rgba(108,92,231,0.15)', border: '1px solid rgba(108,92,231,0.3)' }}>
            <span className="text-[11px] font-bold text-white/60">
              Nghỉ ngơi: <span className="text-white font-mono">{formatTime(cooldown)}</span>
            </span>
          </div>
        )}

        {/* No fights left banner */}
        {noFightsLeft && (
          <div className="mt-2 px-3 py-2 rounded-xl text-center"
            style={{ background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.3)' }}>
            <span className="text-[11px] font-bold text-red-400">
              Hết {fightsMax} lượt hôm nay. Quay lại ngày mai!
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-24 space-y-3">
        {/* Weekly Boss Banner */}
        {weeklyBoss && (
          <div className="rounded-xl p-3 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(162,155,254,0.2), rgba(108,92,231,0.3))', border: '1px solid rgba(162,155,254,0.4)' }}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-lg">{weeklyBoss.bossEmoji}</span>
                <div>
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Boss tuần này</div>
                  <div className="font-heading text-sm font-bold text-white">{weeklyBoss.bossName}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-white/40">Kết thúc</div>
                <div className="font-mono text-xs font-bold text-white/80">{weeklyCountdown}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span style={{ color: '#fdcb6e' }}>x{weeklyBoss.rewardMultiplier} thưởng</span>
              <span style={{ color: '#a29bfe' }}>
                Điểm yếu: {WEAKNESS_LABELS[weeklyBoss.weakness]?.emoji} {WEAKNESS_LABELS[weeklyBoss.weakness]?.label}
              </span>
            </div>
          </div>
        )}

        {/* First-time stat banner */}
        {statInfo && statInfo.freePoints > 0 && (
          <div className="rounded-xl p-3"
            style={{ background: 'rgba(253,203,110,0.15)', border: '1px solid rgba(253,203,110,0.3)' }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <div className="flex-1">
                <p className="text-[11px] font-bold text-yellow-300">
                  Bạn có {statInfo.freePoints} điểm chỉ số chưa phân bổ!
                </p>
                <p className="text-[10px] text-white/50">Vào Profile &rarr; Chỉ số để tăng sức mạnh.</p>
              </div>
            </div>
          </div>
        )}

        {BOSSES.map((boss) => {
          const style = DIFFICULTY_STYLES[boss.difficulty];
          const kills = getKills(boss.id);
          const locked = level < boss.unlockLevel;
          const disabled = locked || !canFight;
          const isWeekly = weeklyBoss?.bossId === boss.id;
          const turns = estimateTurns(boss.hp);

          return (
            <button key={boss.id}
              onClick={() => { if (!disabled) { playSound('boss_select'); onSelect(boss); } }}
              disabled={disabled}
              className={`w-full rounded-xl p-4 flex items-center gap-4 transition-transform ${disabled ? 'opacity-50 grayscale' : 'active:scale-[0.97]'
                }`}
              style={{
                background: isWeekly ? 'rgba(162,155,254,0.12)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${disabled ? 'rgba(255,255,255,0.1)' : isWeekly ? 'rgba(162,155,254,0.5)' : style.border}`,
                boxShadow: isWeekly ? '0 0 15px rgba(162,155,254,0.15)' : 'none',
              }}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden"
                style={{ background: locked ? 'rgba(255,255,255,0.05)' : style.bg }}>
                {boss.image ? (
                  <img src={boss.image} alt={boss.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">{boss.emoji}</span>
                )}
                {locked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                    <span className="text-xl drop-shadow-md">🔒</span>
                  </div>
                )}
                {kills > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #e74c3c, #ff6b6b)' }}>
                    {kills}
                  </span>
                )}
                {isWeekly && !locked && (
                  <span className="absolute -bottom-1 -left-1 text-[9px] px-1 py-0.5 rounded font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)' }}>
                    TUẦN
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
                  {isWeekly && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(162,155,254,0.3)', color: '#a29bfe' }}>x{weeklyBoss.rewardMultiplier}</span>}
                  {kills > 0 && <span className="text-[10px]">✅</span>}
                </div>
                {locked ? (
                  <p className="text-[11px] text-white/40">Cần Level {boss.unlockLevel}</p>
                ) : (
                  <>
                    <p className="text-[11px] text-white/50 mb-1">{boss.description}</p>
                    <div className="flex items-center gap-3 text-[10px] font-bold">
                      <span style={{ color: '#ff6b6b' }}>HP {boss.hp.toLocaleString()}</span>
                      <span style={{ color: '#fdcb6e' }}>ATK {boss.attack}</span>
                      <span style={{ color: '#55efc4' }}>+{boss.reward} OGN</span>
                      <span style={{ color: '#a29bfe' }}>+{boss.xpReward} XP</span>
                    </div>
                    {/* Stat preview: estimated turns */}
                    <div className="mt-1 text-[9px] font-bold text-white/30">
                      ~{turns} lượt để hạ
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
