import { BOSSES, BossInfo, DIFFICULTY_STYLES } from '../data/bosses';

interface Props {
  onSelect: (boss: BossInfo) => void;
}

export default function BossList({ onSelect }: Props) {
  return (
    <div className="min-h-screen max-w-[430px] mx-auto boss-gradient flex flex-col pb-[90px]">
      <div className="px-5 pt-safe pb-3">
        <h1 className="font-heading text-xl font-bold text-white flex items-center gap-2 mb-1">
          ⚔️ Chọn Boss để chiến đấu
        </h1>
        <p className="text-xs text-white/50">Trả lời câu hỏi hữu cơ để gây sát thương!</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-3">
        {BOSSES.map((boss) => {
          const style = DIFFICULTY_STYLES[boss.difficulty];
          return (
            <button key={boss.id} onClick={() => onSelect(boss)}
              className="w-full rounded-xl p-4 flex items-center gap-4 active:scale-[0.97] transition-transform"
              style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${style.border}` }}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                style={{ background: style.bg }}>
                {boss.emoji}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-heading text-sm font-bold text-white">{boss.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                    style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}>
                    {style.label}
                  </span>
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
