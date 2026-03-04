import { useState } from 'react';
import type { WorldBossInfo } from '../types/world-boss.types';
import { StoryDrawer } from './StoryDrawer';
import { BossInfoPanel } from './BossInfoPanel';

const SPRITE_MAP: Record<string, string> = {
  ray_nau: '/assets/bosses/ray-nau.svg',
  nhen_do: '/assets/bosses/nhen-do.svg',
  dao_on: '/assets/bosses/dao-on.svg',
  oc_buou: '/assets/bosses/oc-buou.svg',
  oc_sen: '/assets/bosses/oc-sen.svg',
  nam_re: '/assets/bosses/nam-re.svg',
  chau_chau: '/assets/bosses/chau-chau.svg',
  bo_xit: '/assets/bosses/bo-xit.svg',
  bo_rua: '/assets/bosses/bo-rua.svg',
  sau_duc_than: '/assets/bosses/sau-duc-than.svg',
  sau_cuon_la: '/assets/bosses/sau-cuon-la.svg',
  sau_to: '/assets/bosses/sau-to.svg',
  kho_van: '/assets/bosses/kho-van.svg',
  rep: '/assets/bosses/rep-xanh.svg',
  bac_la: '/assets/bosses/bac-la.svg',
  dom_nau: '/assets/bosses/dom-nau.svg',
  chuot_dong: '/assets/bosses/chuot-dong.svg',
  rong_lua: '/assets/bosses/rong-lua.svg',
};

const ELEMENT_CONFIG: Record<string, { label: string; icon: string; color: string; auraColor: string }> = {
  fire: { label: 'Lửa', icon: '🔥', color: 'text-orange-400', auraColor: 'rgba(255,107,53,0.4)' },
  ice: { label: 'Băng', icon: '❄️', color: 'text-blue-300', auraColor: 'rgba(79,195,247,0.4)' },
  water: { label: 'Nước', icon: '💧', color: 'text-blue-500', auraColor: 'rgba(25,118,210,0.4)' },
  wind: { label: 'Gió', icon: '🌀', color: 'text-green-400', auraColor: 'rgba(102,187,106,0.4)' },
  poison: { label: 'Độc', icon: '☠️', color: 'text-purple-400', auraColor: 'rgba(171,71,188,0.4)' },
  chaos: { label: 'Hỗn loạn', icon: '💥', color: 'text-red-400', auraColor: 'rgba(244,67,54,0.4)' },
};

const DIFFICULTY_CONFIG: Record<string, { label: string; bg: string }> = {
  normal: { label: 'BÌNH THƯỜNG', bg: 'bg-gray-600' },
  hard: { label: 'KHÓ', bg: 'bg-yellow-600' },
  extreme: { label: 'CỰC KHÓ', bg: 'bg-orange-600' },
  catastrophic: { label: 'THẢM HỌA', bg: 'bg-red-700' },
};

interface BossDisplayProps {
  boss: WorldBossInfo;
  onRanking?: () => void;
  onBattle?: () => void;
}

export function BossDisplay({ boss, onRanking, onBattle }: BossDisplayProps) {
  const [showStory, setShowStory] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const element = ELEMENT_CONFIG[boss.element] ?? ELEMENT_CONFIG.chaos;
  const difficulty = DIFFICULTY_CONFIG[boss.difficulty] ?? DIFFICULTY_CONFIG.normal;
  const spriteSrc = SPRITE_MAP[boss.baseSprite];

  return (
    <div className="flex flex-col items-center px-4 pt-4 pb-2 gap-2">
      {/* Element + weakness */}
      <div className="flex gap-3">
        <span className={`text-sm font-bold ${element.color}`}>
          {element.icon} {element.label}
        </span>
        <span className="text-sm text-gray-400">
          💧 Yếu: {boss.weakness}
        </span>
      </div>

      {/* Avatar row: [Xep hang] [Boss sprite] [Tran chien] */}
      <div className="flex items-center justify-center gap-3 w-full">

        {/* Nút Xếp hạng bên trái */}
        {onRanking && (
          <button
            onClick={onRanking}
            className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-2xl active:scale-95 transition-transform"
            style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.3)', minWidth: 64 }}
          >
            <span className="text-xl">🏆</span>
            <span className="text-[10px] font-bold text-yellow-400 leading-tight text-center">Xếp{"\n"}hạng</span>
          </button>
        )}

        {/* Sprite — tap to show boss info */}
        <button
          onClick={() => setShowInfo(true)}
          className="w-44 h-44 flex items-center justify-center rounded-full relative flex-shrink-0"
          style={{
            boxShadow: `0 0 40px ${element.auraColor}, 0 0 80px ${element.auraColor}`,
            animation: 'worldBossAura 2s ease-in-out infinite alternate',
          }}
        >
          {spriteSrc ? (
            <img
              src={spriteSrc}
              alt={boss.bossName}
              className="w-36 h-36 object-contain"
              style={{ transform: `scale(${boss.visualVariant?.scale ?? 1})` }}
            />
          ) : (
            <div
              className="w-36 h-36 rounded-full flex items-center justify-center text-6xl"
              style={{ background: `radial-gradient(circle, ${element.auraColor} 0%, transparent 70%)` }}
            >
              🐛
            </div>
          )}
          {/* Info hint */}
          <span className="absolute bottom-1 right-1 text-xs bg-black/50 rounded-full px-1.5 py-0.5 text-gray-300">
            ℹ️
          </span>
        </button>

        {/* Nút Trận chiến bên phải */}
        {onBattle && (
          <button
            onClick={onBattle}
            className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-2xl active:scale-95 transition-transform"
            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', minWidth: 64 }}
          >
            <span className="text-xl">⚔️</span>
            <span className="text-[10px] font-bold text-blue-400 leading-tight text-center">Trận{"\n"}chiến</span>
          </button>
        )}
      </div>

      {/* Name + title */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">{boss.bossName}</h2>
        <p className="text-sm text-gray-400 italic">{boss.bossTitle}</p>
      </div>

      {/* Difficulty badge */}
      <span className={`text-xs font-bold px-3 py-1 rounded-full text-white ${difficulty.bg}`}>
        ⭐ {difficulty.label}
      </span>

      {/* Story preview — tap to read full */}
      {boss.storyPreview && (
        <button
          onClick={() => setShowStory(true)}
          className="text-center max-w-xs"
        >
          <p className="text-xs text-gray-400 leading-relaxed italic">
            "{boss.storyPreview}"
          </p>
          <span className="text-xs text-blue-400 mt-1 block">📖 Đọc tiếp</span>
        </button>
      )}

      {/* Drawers */}
      <StoryDrawer
        isOpen={showStory}
        onClose={() => setShowStory(false)}
        storyFull={boss.storyFull}
        bossName={boss.bossName}
      />
      <BossInfoPanel
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        boss={boss}
      />

      <style>{`
        @keyframes worldBossAura {
          from { box-shadow: 0 0 30px ${element.auraColor}, 0 0 60px ${element.auraColor}; }
          to   { box-shadow: 0 0 50px ${element.auraColor}, 0 0 100px ${element.auraColor}; }
        }
      `}</style>
    </div>
  );
}
