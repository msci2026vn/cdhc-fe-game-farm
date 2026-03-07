import { useNav } from '@/shared/hooks/useNav';
import { useOgn } from '@/shared/hooks/usePlayerProfile';
import { AnimatedNumber } from '@/shared/components/AnimatedNumber';
import { playSound } from '@/shared/audio';

export default function Header() {
  const navigate = useNav();
  const ogn = useOgn(); // TanStack Query single source of truth

  return (
    <header className="sticky top-0 z-40 bg-primary/95 backdrop-blur-sm text-primary-foreground">
      <div className="flex items-center justify-between h-14 px-4 max-w-[430px] mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-sm font-bold">
            🧑‍🌾
          </div>
          <span className="font-heading font-semibold text-sm">Nông dân</span>
        </div>

        <div className="flex items-center gap-1.5 bg-primary-foreground/15 rounded-full px-3 py-1.5">
          <span className="text-base">🪙</span>
          <span className="font-heading font-bold text-sm">
            <AnimatedNumber value={ogn} />
          </span>
          <span className="text-xs opacity-80">OGN</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { playSound('ui_click'); navigate('/camera'); }}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary-foreground/10 transition-colors"
          >
            📷
          </button>
          <button
            onClick={() => { playSound('ui_notification'); navigate('/points'); }}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary-foreground/10 transition-colors"
          >
            🔔
          </button>
        </div>
      </div>
    </header>
  );
}
