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
    <div className="flex flex-col items-center px-4 pt-0 pb-2 gap-1 -mt-4">
      {/* Element + weakness */}
      {/* Element + weakness - Using frame_wood.png asset (compact version) */}
      <div 
        className="relative flex gap-3 px-6 py-1.5 mb-1 items-center justify-center"
        style={{
          backgroundImage: "url('/assets/lobby_world_boss/frame_wood.png')",
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          minWidth: '200px',
          height: '30px',
        }}
      >
        <div className={`flex items-center gap-1.5 text-[11px] font-black ${element.color} drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]`}>
          <span className="text-sm">{element.icon}</span>
          <span className="uppercase tracking-tighter">{element.label}</span>
        </div>
        <div className="w-[1px] h-3 bg-black/20 self-center" />
        <div className="flex items-center gap-1.5 text-[11px] font-black text-blue-100 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
          <span className="text-sm">💧</span>
          <span className="uppercase tracking-tighter">
            {t('world_boss.display.weakness')}: <span className="text-white">{boss.weakness}</span>
          </span>
        </div>
      </div>

      {/* Avatar row: [Xep hang] [Boss sprite] [Tran chien] */}
      <div className="flex items-center justify-center gap-3 w-full">

        {/* Nút Xếp hạng bên trái */}
        {onRanking && (
          <button
            onClick={onRanking}
            className="active:scale-95 transition-transform"
          >
            <img
              src="/assets/lobby_world_boss/btn_rank.png"
              alt={t('world_boss.display.ranking')}
              className="w-24 h-24 object-contain"
            />
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
          <div className="absolute bottom-1 right-1 z-10 hover:scale-110 transition-transform">
            <img
              src="/assets/lobby_world_boss/btn_detail.png"
              alt="Detail"
              className="w-6 h-6 object-contain"
            />
          </div>
        </button>

        {/* Nút Trận chiến bên phải */}
        {onBattle && (
          <button
            onClick={onBattle}
            className="active:scale-95 transition-transform"
          >
            <img
              src="/assets/lobby_world_boss/btn_battle.png"
              alt={t('world_boss.display.battle')}
              className="w-24 h-24 object-contain"
            />
          </button>
        )}
      </div>

      {/* Name + title in frame */}
      <div
        style={{
          backgroundImage: "url('/assets/lobby_world_boss/frame_name_boss.png')",
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          width: '280px',
          height: '70px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 20px',
          marginTop: '-22px',
        }}
      >
        <h2 className="text-lg font-bold text-white leading-tight drop-shadow-md">
          {boss.bossName}
        </h2>
        <p className="text-[10px] text-yellow-300 italic opacity-90 drop-shadow-sm">
          {boss.bossTitle}
        </p>
      </div>

      {/* Difficulty badge - Fixed height container to prevent pushing other elements down */}
      <div className="relative h-[16px] flex items-center justify-center mt-2 mb-4">
        <div className="relative group scale-95">
          <img 
            src="/assets/lobby_world_boss/frame_level.png" 
            alt="level frame" 
            className="w-[100px] h-auto object-contain pointer-events-none"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-black text-white drop-shadow-md uppercase tracking-wide leading-none flex items-center gap-1">
              <span>⭐</span>
              <span className="mb-[1px]">{difficulty.label}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Story preview in themed frame - Further height reduction */}
      {boss.storyPreview && (
        <button
          onClick={() => setShowStory(true)}
          className="relative w-[440px] h-[115px] flex flex-col items-center pt-6 pb-2 px-20 -mt-6 active:scale-[0.98] transition-transform"
        >
          <img 
            src="/assets/lobby_world_boss/frame_information.png" 
            alt="story frame" 
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />
          <div className="relative z-10 text-center flex flex-col items-center h-full">
            <p className="text-[9.5px] text-[#5d4037] leading-tight italic font-bold px-14 line-clamp-4 overflow-hidden mb-1">
              "{boss.storyPreview}"
            </p>
            <img 
              src="/assets/lobby_world_boss/btn_read_more.png" 
              alt="Read more" 
              className="w-20 h-auto object-contain mt-auto pointer-events-none"
            />
          </div>
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
