import { cn } from '@/lib/utils';
import type { CampaignZone } from '../types/campaign.types';
import { ZONE_META } from '../data/zones';
import { playSound } from '@/shared/audio';

interface ZoneNodeProps {
  zone: CampaignZone;
  onClick: () => void;
}

/**
 * ZoneNode — represents a single zone on the campaign map.
 * 3 states: cleared (green), open (blue + GO! badge), locked (gray)
 */
export default function ZoneNode({ zone, onClick }: ZoneNodeProps) {
  const meta = ZONE_META[zone.zoneNumber];
  const isCleared = zone.isZoneCleared;
  const isOpen = zone.isUnlocked && !zone.isZoneCleared;
  const isLocked = !zone.isUnlocked;

  // Stars display
  const starsFilled = zone.totalStars;
  const starsMax = zone.maxStars;

  return (
    <button
      onClick={() => { if (!isLocked) playSound('ui_click'); onClick(); }}
      disabled={isLocked}
      className={cn(
        'relative flex flex-col items-center gap-1.5 group transition-transform',
        isLocked ? 'opacity-70 cursor-not-allowed' : 'active:scale-95 cursor-pointer',
      )}
    >
      {/* Zone circle/square */}
      {isCleared ? (
        // ✅ CLEARED: Green circle
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-green-500 border-4 border-white shadow-[0_4px_0_#1B5E20] flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              check
            </span>
          </div>
          {/* Zone emoji overlapping top-right */}
          <span className="absolute -top-1 -right-1 text-lg drop-shadow-md">{meta?.icon}</span>
          {zone.isPerfect && (
            <span className="absolute -top-2 -left-1 text-lg">✨</span>
          )}
        </div>
      ) : isOpen ? (
        // ⚔️ OPEN: Blue rounded square with ping animation
        <div className="relative">
          {/* Ping animation behind */}
          <div className="absolute inset-0 w-20 h-20 rounded-2xl bg-yellow-400/40 campaign-ping" />
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-blue-400 to-blue-600 border-4 border-white shadow-[0_6px_0_#0D47A1] flex items-center justify-center">
            <span className="text-3xl drop-shadow-lg">{meta?.icon}</span>
          </div>
          {/* GO! badge */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full border-2 border-white shadow-md animate-bounce">
            GO!
          </div>
        </div>
      ) : (
        // 🔒 LOCKED: Gray circle
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-gray-400 border-4 border-gray-300 shadow-[0_4px_0_#616161] flex items-center justify-center grayscale">
            <span className="material-symbols-outlined text-white text-xl">lock</span>
          </div>
          <span className="absolute -top-1 -right-1 text-sm opacity-50">{meta?.icon}</span>
        </div>
      )}

      {/* Zone label */}
      <div className="text-center mt-1">
        <p className={cn(
          'font-heading font-bold text-xs leading-tight',
          isCleared ? 'text-green-100' : isOpen ? 'text-white' : 'text-white/50',
        )}>
          V{zone.zoneNumber} {meta?.name || zone.name}
        </p>
        {/* Stars or progress */}
        {(isCleared || isOpen) && (
          <div className="flex items-center justify-center gap-0.5 mt-0.5">
            <span className="text-yellow-400 text-xs">⭐</span>
            <span className={cn(
              'text-[10px] font-bold',
              isCleared ? 'text-green-200' : 'text-white/70',
            )}>
              {starsFilled}/{starsMax}
            </span>
          </div>
        )}
        {isLocked && (
          <p className="text-[9px] text-white/40 font-bold">Lv.{zone.unlockLevel}</p>
        )}
      </div>
    </button>
  );
}
