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
          {/* Main glowing banner container */}
          <div className="relative w-44 h-24 mb-6 rounded-2xl flex items-center justify-center shadow-xl animate-glow-breathe"
            style={{
              background: 'linear-gradient(180deg, rgba(230,200,100,0.9), rgba(150,100,30,0.9))',
              border: '4px solid #F5DEB3',
              boxShadow: '0 0 25px rgba(255, 215, 0, 0.7), inset 0 0 15px rgba(100, 50, 0, 0.5)'
            }}
          >
            {/* The zone icon (simulating the beautiful frog/turtle from reference) */}
            <span className="text-5xl drop-shadow-xl z-20">{meta?.icon}</span>
            <span className="absolute animate-bounce top-1 right-2 text-2xl z-10" style={{ animationDelay: '0.5s' }}>🦋</span>

            {/* Lower label plaque */}
            <div className="absolute -bottom-6 flex flex-col items-center justify-center w-36 h-10 bg-[#8B4513] border-2 border-[#DEB887] rounded-xl shadow-lg z-30">
              <span className="text-[#FFE4B5] font-bold text-[10px] uppercase leading-tight mt-0.5">
                V{zone.zoneNumber} {meta?.name || zone.name}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-yellow-400 text-[10px]">⭐</span>
                <span className="text-white font-bold text-[10px]">{starsFilled}/{starsMax}</span>
              </div>
            </div>
          </div>
          
          {/* "GO!" Prompt */}
          <div className="absolute -right-4 top-1/2 translate-y-2 z-40 text-4xl font-black text-yellow-300 animate-bounce"
            style={{
              WebkitTextStroke: '2px #b45309',
              textShadow: '2px 4px 0px #78350f, 0 0 15px rgba(253,224,71,0.8)'
            }}
          >
            GO!
          </div>
        </div>

      ) : (

        /* ─── INACTIVE/LOCKED/CLEARED ZONE: Small compact tokens ─── */
        <div className="flex flex-col items-center">
          {/* Base outer circle: translucent black/dark gray */}
          <div className={cn(
            "relative w-[4.5rem] h-[3.5rem] rounded-full flex items-center justify-center overflow-hidden mb-1 shadow-md border-2",
            isLocked ? "bg-black/40 border-gray-600/50 grayscale" : "bg-black/30 border-green-700/60"
          )}>
            {/* Inner ring platform */}
            <div className={cn(
              "w-12 h-6 absolute bottom-1.5 rounded-[50%] flex items-center justify-center shadow-inner",
              isLocked ? "bg-gray-700 border border-gray-500" : "bg-green-800/80 border border-green-500"
            )}>
               <span className="text-xl -mt-4 opacity-90 drop-shadow-md">
                 {isLocked ? '🔒' : meta?.icon}
               </span>
            </div>
            {/* If cleared, add a tiny checkmark */}
            {isCleared && (
              <div className="absolute top-1 right-2 bg-green-500 rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-white text-[12px] font-bold">check</span>
              </div>
            )}
          </div>
          
          {/* Text Labels below node */}
          <div className="text-center drop-shadow-md">
            <p className={cn(
              "font-heading font-black text-[10px] leading-none mb-0.5 tracking-wide",
              isLocked ? "text-[#d1d5db]" : "text-white"
            )}>
              V{zone.zoneNumber} {meta?.name || zone.name}
            </p>
            {isLocked ? (
              <p className="text-[9px] text-gray-300 font-bold">Lv.{zone.unlockLevel}</p>
            ) : (
               <div className="flex items-center justify-center gap-0.5">
                  <span className="text-yellow-400 text-[8px]">⭐</span>
                  <span className="text-white font-bold text-[9px]">{starsFilled}/{starsMax}</span>
               </div>
            )}
          </div>
        </div>
      )}
    </button>
  );
}
