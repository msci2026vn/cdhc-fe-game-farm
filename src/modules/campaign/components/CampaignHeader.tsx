import { useNav } from '@/shared/hooks/useNav';
import { playSound } from '@/shared/audio';

interface CampaignHeaderProps {
  title: string;
  stars: number;
  maxStars: number;
  backTo?: string;
}

export default function CampaignHeader({ title, stars, maxStars, backTo = '/farm' }: CampaignHeaderProps) {
  const navigate = useNav();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 safe-top">
      <div className="max-w-[430px] mx-auto px-4 pt-4 pb-2">
        <div className="relative bg-[#DEB887] rounded-xl border-b-4 border-[#8B4513] shadow-lg px-4 py-3 flex items-center justify-between transform -rotate-[0.5deg]">
          {/* Nail dots */}
          <div className="absolute top-2 left-3 w-2 h-2 bg-[#8B4513] rounded-full shadow-inner" />
          <div className="absolute top-2 right-3 w-2 h-2 bg-[#8B4513] rounded-full shadow-inner" />

          {/* Back button */}
          <button
            onClick={() => { playSound('ui_back'); navigate(backTo); }}
            className="w-10 h-10 rounded-full bg-[#DEB887] border-2 border-[#8B4513] shadow-[0_4px_0_#5D4037] flex items-center justify-center active:translate-y-1 active:shadow-[0_2px_0_#5D4037] transition-all"
          >
            <span className="material-symbols-outlined text-[#5D4037] text-xl">arrow_back</span>
          </button>

          {/* Title */}
          <h1 className="font-heading font-black text-[#5D4037] text-sm tracking-tight text-center flex-1 mx-2 truncate">
            {title}
          </h1>

          {/* Star counter */}
          <div className="bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20 flex items-center gap-1.5 flex-shrink-0">
            <span className="text-yellow-400 text-sm">⭐</span>
            <span className="text-white font-heading font-bold text-xs">{stars}/{maxStars}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
