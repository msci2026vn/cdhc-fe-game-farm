import { useUIStore } from '../stores/uiStore';

export default function Toast() {
  const toasts = useUIStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[90%] max-w-[400px]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-slide-up rounded-lg px-4 py-3 text-sm font-semibold shadow-lg ${
            t.type === 'success'
              ? 'bg-primary text-primary-foreground'
              : t.type === 'error'
              ? 'bg-destructive text-destructive-foreground'
              : 'bg-card text-card-foreground border border-border'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
