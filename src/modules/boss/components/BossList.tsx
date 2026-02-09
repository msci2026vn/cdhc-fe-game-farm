import { BOSSES, BossInfo, DIFFICULTY_STYLES } from '../data/bosses';
import { useBossProgressStore } from '../stores/bossProgressStore';

interface Props {
  onSelect: (boss: BossInfo) => void;
}

export default function BossList({ onSelect }: Props) {
  const killedBosses = useBossProgressStore(s => s.killedBosses);
  const totalDmg = useBossProgressStore(s => s.totalDmgDealt);

  return (
    <div className="min-h-screen max-w-[430px] mx-auto boss-gradient flex flex-col pb-[90px]">
      <div className="px-5 pt-safe pb-3">
        <h1 className="font-heading text-xl font-bold text-white flex items-center gap-2 mb-1">
          ⚔️ Chọn Boss để chiến đấu
        </h1>
        <p className="text-xs text-white/50">Ghép gem để tấn công, né đòn boss và dùng Ultimate!</p>
        {totalDmg > 0 && (
          <div className="flex items-center gap-3 mt-2 text-[11px] font-bold">
            <span style={{ color: '#ff6b6b' }}>⚔️ Tổng DMG: {totalDmg.toLocaleString()}</span>
            <span style={{ color: '#55efc4' }}>💀 Đã hạ: {Object.values(killedBosses).reduce((a, b) => a + b, 0)}</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-3">
        {BOSSES.map((boss) => {
          const style = DIFFICULTY_STYLES[boss.difficulty];
          const kills = killedBosses[boss.id] || 0;
          return (
            <button key={boss.id} onClick={() => onSelect(boss)}
              className="w-full rounded-xl p-4 flex items-center gap-4 active:scale-[0.97] transition-transform"
              style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${style.border}` }}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 relative"
                style={{ background: style.bg }}>
                {boss.emoji}
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
                <p className="text-[11px] text-white/50 mb-1">{boss.description}</p>
                <div className="flex items-center gap-3 text-[10px] font-bold">
                  <span style={{ color: '#ff6b6b' }}>❤️ {boss.hp.toLocaleString()} HP</span>
                  <span style={{ color: '#fdcb6e' }}>⚔️ ATK {boss.attack}</span>
                  <span style={{ color: '#55efc4' }}>🪙 +{boss.reward} OGN</span>
                </div>
              </div>
              <span className="text-white/30 text-lg">›</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
