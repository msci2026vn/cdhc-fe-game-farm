import { BOSSES, BossInfo, DIFFICULTY_STYLES } from '../data/bosses';
import { useBossProgress } from '@/shared/hooks/useBossProgress';
import { useLevel, useXp } from '@/shared/hooks/usePlayerProfile';
import { xpForNextLevel } from '@/shared/stores/playerStore';

interface Props {
  onSelect: (boss: BossInfo) => void;
}

export default function BossList({ onSelect }: Props) {
  const { data: bossProgress } = useBossProgress();
  const level = useLevel();
  const xp = useXp();
  const nextXp = xpForNextLevel(level);
  const xpPct = nextXp > 0 ? Math.min(100, Math.round((xp / nextXp) * 100)) : 100;

  // Calculate totals from server data
  const totalKills = bossProgress?.reduce((sum, p) => sum + p.kills, 0) ?? 0;
  const totalDmgDealt = bossProgress?.reduce((sum, p) => sum + p.totalDamage, 0) ?? 0;

  // Helper to get kills for a boss
  const getKills = (bossId: string) => {
    return bossProgress?.find(p => p.bossId === bossId)?.kills ?? 0;
  };

  return (
    <div className="min-h-screen max-w-[430px] mx-auto boss-gradient flex flex-col pb-[90px]">
      <div className="px-5 pt-safe pb-3">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-heading text-xl font-bold text-white flex items-center gap-2">
            ⚔️ Chọn Boss
          </h1>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl font-heading text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)', boxShadow: '0 0 15px rgba(108,92,231,0.4)' }}>
              ⭐ Lv.{level}
            </div>
          </div>
        </div>

        {/* XP bar */}
        <div className="mb-2">
          <div className="flex justify-between text-[10px] font-bold mb-1">
            <span style={{ color: '#a29bfe' }}>XP: {xp}/{nextXp}</span>
            <span className="text-white/40">Level {level} → {level + 1}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${xpPct}%`, background: 'linear-gradient(90deg, #6c5ce7, #a29bfe)' }} />
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-bold">
          <span style={{ color: '#ff6b6b' }}>⚔️ DMG: {totalDmgDealt.toLocaleString()}</span>
          <span style={{ color: '#55efc4' }}>💀 Hạ: {totalKills}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-3">
        {BOSSES.map((boss) => {
          const style = DIFFICULTY_STYLES[boss.difficulty];
          const kills = getKills(boss.id);
          const locked = level < boss.unlockLevel;

          return (
            <button key={boss.id}
              onClick={() => !locked && onSelect(boss)}
              disabled={locked}
              className={`w-full rounded-xl p-4 flex items-center gap-4 transition-transform ${
                locked ? 'opacity-50 grayscale' : 'active:scale-[0.97]'
              }`}
              style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${locked ? 'rgba(255,255,255,0.1)' : style.border}` }}>
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
                  <p className="text-[11px] text-white/40">🔒 Cần Level {boss.unlockLevel} để mở khóa</p>
                ) : (
                  <>
                    <p className="text-[11px] text-white/50 mb-1">{boss.description}</p>
                    <div className="flex items-center gap-3 text-[10px] font-bold">
                      <span style={{ color: '#ff6b6b' }}>❤️ {boss.hp.toLocaleString()}</span>
                      <span style={{ color: '#fdcb6e' }}>⚔️ {boss.attack}</span>
                      <span style={{ color: '#55efc4' }}>🪙 +{boss.reward}</span>
                      <span style={{ color: '#a29bfe' }}>⭐ +{boss.xpReward} XP</span>
                    </div>
                  </>
                )}
              </div>
              <span className="text-white/30 text-lg">{locked ? '' : '›'}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
