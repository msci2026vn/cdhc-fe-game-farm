import { useUIStore } from '../stores/uiStore';

export default function PointsFlyUp() {
  const flyUpText = useUIStore((s) => s.flyUpText);

  if (!flyUpText) return null;

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 z-[110] pointer-events-none">
      <span className="animate-float-up font-heading font-bold text-2xl text-secondary drop-shadow-lg">
        {flyUpText}
      </span>
    </div>
  );
}
