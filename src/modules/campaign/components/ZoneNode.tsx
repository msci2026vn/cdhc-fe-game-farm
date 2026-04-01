import { cn } from '@/lib/utils';
import type { CampaignZone } from '../types/campaign.types';
import { ZONE_META } from '../data/zones';
import { playSound } from '@/shared/audio';
import { useTranslation } from 'react-i18next';

interface ZoneNodeProps {
  zone: CampaignZone;
  isCurrentZone?: boolean;
  onClick: () => void;
}

/**
 * ZoneNode — represents a single zone on the campaign map.
 * Adapted to perfectly match the new map UI based on the reference image.
 */
export default function ZoneNode({ zone, isCurrentZone, onClick }: ZoneNodeProps) {
  const { t } = useTranslation();
  const meta = ZONE_META[zone.zoneNumber];

  // States
  const isCleared = zone.isZoneCleared;
  const isLocked = !zone.isUnlocked;

  // Stars display
  const starsFilled = zone.totalStars;
  const starsMax = zone.maxStars;

  return (
    <button
      onClick={() => { if (!isLocked) playSound('ui_click'); onClick(); }}
      disabled={isLocked}
      className={cn(
        'relative flex flex-col items-center gap-1 group transition-transform',
        isLocked ? 'cursor-not-allowed opacity-80' : 'active:scale-95 cursor-pointer',
      )}
    >
      {/* ─── ACTIVE/CURRENT ZONE: Huge Featured Banner ─── */}
      {isCurrentZone ? (
        <div className="relative flex flex-col items-center">
          {/* Main glowing banner container with frame_map.png */}
          <div className="relative mb-6 flex items-center justify-center animate-glow-breathe z-10"
            style={{
              width: '110px',
              height: '100px',
              backgroundImage: "url('/assets/campaign/frame_map.png')",
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {/* The zone icon */}
            {meta?.icon.startsWith('/assets/') ? (
              <img src={meta.icon} alt={meta.name} className="w-14 h-14 object-contain drop-shadow-2xl z-20 translate-y-[-14px]" />
            ) : (
              <span className="text-2xl drop-shadow-xl z-20 translate-y-[-14px]">{meta?.icon}</span>
            )}

            {/* Zone Name - Positioned inside the wooden banner part */}
            <div className="absolute w-full text-center bottom-[15px] left-0 px-2 z-30">
              <span className="font-game text-[#3E1E0F] text-[8px] uppercase leading-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.3)]">
                V{zone.zoneNumber} {meta?.name || zone.name}
              </span>
            </div>

            {/* Stars Count - Positioned inside the lower dark wood area */}
            <div className="absolute w-full text-center bottom-[8px] left-0 flex items-center justify-center gap-1 z-30">
              <span className="text-yellow-400 text-[8px] drop-shadow-md">⭐</span>
              <span className="font-game text-[#FFE4B5] text-[10px] leading-none drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">
                {starsFilled}/{starsMax}
              </span>
            </div>
          </div>

          {/* "GO!" Prompt Image */}
          <div className="absolute -right-4 top-[35%] translate-y-[-50%] z-40 w-12 h-12 animate-bounce pointer-events-none">
            <img
              src="/assets/campaign/GO!.png"
              alt="GO"
              className="w-full h-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
            />
          </div>
        </div>
      ) : (

        /* ─── INACTIVE/LOCKED/CLEARED ZONE: Small compact tokens ─── */
        <div className="flex flex-col items-center">
          {/* Node Icon Container */}

          <div className={cn(
            "relative w-16 h-12 flex items-center justify-center mb-0.5",
            isLocked && "opacity-90"
          )}>
            {/* The icon itself */}
            <div className="relative z-10 flex items-center justify-center drop-shadow-2xl">
              {meta?.icon.startsWith('/assets/') ? (
                <div className="relative">
                  <img
                    src={meta.icon}
                    alt={meta.name}
                    className={cn(
                      "w-10 h-10 object-contain transition-all duration-300",
                      isLocked ? "brightness-[0.35] grayscale contrast-125" : "brightness-100"
                    )}
                  />
                  {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">🔒</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <span className={cn("text-2xl", isLocked ? "opacity-40 grayscale" : "opacity-100")}>
                    {meta?.icon}
                  </span>
                  {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm">🔒</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* If cleared, add a tiny checkmark */}
            {isCleared && (
              <div className="absolute top-0 right-1 bg-green-500 rounded-full w-4 h-4 flex items-center justify-center shadow-lg border border-white z-20">
                <span className="material-symbols-outlined text-white text-[12px] font-bold">check</span>
              </div>
            )}
          </div>



          {/* Text Labels below node */}
          <div className="text-center drop-shadow-md">
            <p className={cn(
              "font-game text-[8px] leading-none mb-0.5 tracking-wide",
              isLocked ? "text-[#d1d5db]" : "text-white"
            )}>
              V{zone.zoneNumber} {meta?.name || zone.name}
            </p>
            {isLocked ? (
              <p className="font-game text-[7px] text-gray-300">Lv.{zone.unlockLevel}</p>
            ) : (
              <div className="flex items-center justify-center gap-0.5">
                <span className="text-yellow-400 text-[6px]">⭐</span>
                <span className="font-game text-white text-[7px]">{starsFilled}/{starsMax}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </button>
  );
}
