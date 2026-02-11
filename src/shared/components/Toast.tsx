import { useUIStore } from '../stores/uiStore';

const TOAST_STYLES = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  warning: 'bg-yellow-500 text-white',
  info: 'bg-blue-600 text-white',
};

const TOAST_ICONS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

export default function Toast() {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 z-[100] flex flex-col gap-2 max-w-sm w-[90%]">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => removeToast(t.id)}
          className={`
            px-4 py-3 rounded-lg shadow-lg cursor-pointer
            flex items-center gap-2 text-sm font-medium
            animate-slide-in
            ${TOAST_STYLES[t.type]}
          `}
        >
          <span className="text-lg">{t.icon || TOAST_ICONS[t.type]}</span>
          <span className="flex-1">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
