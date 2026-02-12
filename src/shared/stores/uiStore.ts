import { create } from 'zustand';

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  icon?: string;
  duration?: number;
}

interface UIState {
  toasts: ToastItem[];
  addToast: (message: string, type?: ToastItem['type'], icon?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  flyUpText: string | null;
  showFlyUp: (text: string) => void;
  clearFlyUp: () => void;
  isApiDisconnected: boolean;
  setApiDisconnected: (status: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  isApiDisconnected: false,
  setApiDisconnected: (status) => set({ isApiDisconnected: status }),
  addToast: (message, type = 'info', icon, duration) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const toastDuration = duration ?? (type === 'error' ? 4000 : type === 'warning' ? 3500 : 3000);

    set((s) => ({
      toasts: [...s.toasts.slice(-4), { id, message, type, icon, duration: toastDuration }], // max 5 toasts
    }));

    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, toastDuration);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  flyUpText: null,
  showFlyUp: (text) => {
    set({ flyUpText: text });
    setTimeout(() => set({ flyUpText: null }), 1200);
  },
  clearFlyUp: () => set({ flyUpText: null }),
}));
