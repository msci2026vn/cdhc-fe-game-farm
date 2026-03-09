import { cn } from '@/lib/utils';
import { playSound } from '@/shared/audio';

interface PrayerCardProps {
  text: string;
  category: string;
  isSelected?: boolean;
  onClick?: () => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  peace: '🕊️',
  nature: '🌿',
  harvest: '🌾',
  health: '❤️',
  family: '👨‍👩‍👧‍👦',
  community: '🤝',
  earth: '🌍',
  spiritual: '🧘',
};

export function PrayerCard({ text, category, isSelected, onClick }: PrayerCardProps) {
  return (
    <div
      onClick={() => { playSound('ui_click'); onClick?.(); }}
      className={cn(
        'rounded-2xl p-5 min-h-[140px] flex flex-col justify-between cursor-pointer',
        'bg-white/10 backdrop-blur-sm border border-white/20',
        'transition-all duration-200 active:scale-[0.97]',
        isSelected && 'ring-2 ring-amber-400/70 bg-white/20 shadow-lg shadow-purple-500/20',
      )}
    >
      <p className="text-white text-base leading-relaxed font-body">
        &ldquo;{text}&rdquo;
      </p>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-white/40 capitalize">{category}</span>
        <span className="text-lg">{CATEGORY_EMOJI[category] || '🙏'}</span>
      </div>
    </div>
  );
}
