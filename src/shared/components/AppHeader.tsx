import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOgn } from '@/shared/hooks/usePlayerProfile';
import { AnimatedNumber } from '@/shared/components/AnimatedNumber';
import { playSound } from '@/shared/audio';

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  showCurrency?: boolean;
  rightAction?: ReactNode;
  onBack?: () => void;
  backTo?: string;
}

export default function AppHeader({
  title,
  showBack = true,
  showCurrency = true,
  rightAction,
  onBack,
  backTo,
}: AppHeaderProps) {
  const navigate = useNavigate();
  const ogn = useOgn();

  const handleBack = () => {
    playSound('ui_back');
    if (onBack) {
      onBack();
    } else if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b-2 border-[#d4c5a3]/50">
      <div className="flex items-center justify-between h-12 px-3 max-w-[430px] mx-auto">
        {/* Left: Back button */}
        <div className="w-10 flex justify-start">
          {showBack && (
            <button
              onClick={handleBack}
              className="w-9 h-9 rounded-xl bg-[#f4e4bc] border-2 border-[#8B4513]/30 flex items-center justify-center active:scale-90 transition-transform shadow-sm"
            >
              <span className="material-symbols-outlined text-[#5D4037] text-lg">arrow_back</span>
            </button>
          )}
        </div>

        {/* Center: Title */}
        <h1 className="font-heading font-bold text-[#5D4037] text-sm tracking-tight truncate flex-1 text-center mx-2">
          {title}
        </h1>

        {/* Right: OGN or custom action */}
        <div className="flex items-center gap-2 justify-end">
          {showCurrency && (
            <div className="flex items-center gap-1 bg-[#fff8dc] border border-[#e9c46a] rounded-full px-2.5 py-1 shadow-sm">
              <span className="text-xs">🪙</span>
              <span className="font-heading font-bold text-[10px] text-[#5D4037]">
                <AnimatedNumber value={ogn} />
              </span>
            </div>
          )}
          {rightAction}
        </div>
      </div>
    </header>
  );
}
