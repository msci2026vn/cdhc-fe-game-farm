import { useState } from 'react';
import type { WorldBossInfo } from '../types/world-boss.types';
import { StoryDrawer } from './StoryDrawer';
import { BossInfoPanel } from './BossInfoPanel';
import { useTranslation } from 'react-i18next';

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

const getElementConfig = (element: string, t: any) => {
  const configs: Record<string, { label: string; icon: string; color: string; auraColor: string }> = {
    fire: { label: t('world_boss.marquee.fire', 'Lửa'), icon: '🔥', color: 'text-orange-400', auraColor: 'rgba(255,107,53,0.4)' },
    ice: { label: t('world_boss.marquee.ice', 'Băng'), icon: '❄️', color: 'text-blue-300', auraColor: 'rgba(79,195,247,0.4)' },
    water: { label: t('world_boss.marquee.water', 'Nước'), icon: '💧', color: 'text-blue-500', auraColor: 'rgba(25,118,210,0.4)' },
    wind: { label: t('world_boss.marquee.wind', 'Gió'), icon: '🌀', color: 'text-green-400', auraColor: 'rgba(102,187,106,0.4)' },
    poison: { label: t('world_boss.marquee.poison', 'Độc'), icon: '☠️', color: 'text-purple-400', auraColor: 'rgba(171,71,188,0.4)' },
    chaos: { label: t('world_boss.marquee.chaos', 'Hỗn loạn'), icon: '💥', color: 'text-red-400', auraColor: 'rgba(244,67,54,0.4)' },
  };
  return configs[element] || configs.chaos;
};

const getDifficultyConfig = (diff: string, t: any) => {
  const configs: Record<string, { label: string; bg: string }> = {
    normal: { label: t('world_boss.info.diff_normal', 'Bình thường').toUpperCase(), bg: 'bg-gray-600' },
    hard: { label: t('world_boss.info.diff_hard', 'Khó').toUpperCase(), bg: 'bg-yellow-600' },
    extreme: { label: t('world_boss.info.diff_extreme', 'Cực khó').toUpperCase(), bg: 'bg-orange-600' },
    catastrophic: { label: t('world_boss.info.diff_catastrophic', 'Thảm họa').toUpperCase(), bg: 'bg-red-700' },
  };
  return configs[diff] || configs.normal;
};

interface BossDisplayProps {
  boss: WorldBossInfo;
  onRanking?: () => void;
  onBattle?: () => void;
}

export function BossDisplay({ boss, onRanking, onBattle }: BossDisplayProps) {
  const { t } = useTranslation();
  const [showStory, setShowStory] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const element = getElementConfig(boss.element, t);
  const difficulty = getDifficultyConfig(boss.difficulty, t);
  const spriteSrc = SPRITE_MAP[boss.baseSprite];

  return (
    <div className="flex flex-col items-center px-4 pt-4 pb-2 gap-2">
      {/* Element + weakness */}
      <div className="flex gap-3">
        <span className={`text-sm font-bold ${element.color}`}>
          {element.icon} {element.label}
        </span>
        <span className="text-sm text-gray-400">
          💧 {t('world_boss.display.weakness')}: {boss.weakness}
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
            <span className="text-[10px] font-bold text-yellow-400 leading-tight text-center whitespace-pre-line">{t('world_boss.display.ranking')}</span>
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
            <span className="text-[10px] font-bold text-blue-400 leading-tight text-center whitespace-pre-line">{t('world_boss.display.battle')}</span>
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
          <span className="text-xs text-blue-400 mt-1 block">📖 {t('world_boss.display.read_more')}</span>
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
