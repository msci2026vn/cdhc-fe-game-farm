import { create } from 'zustand';

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface UIState {
  toasts: ToastItem[];
  addToast: (message: string, type?: ToastItem['type']) => void;
  removeToast: (id: string) => void;
  flyUpText: string | null;
  showFlyUp: (text: string) => void;
  clearFlyUp: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  addToast: (message, type = 'info') => {
    const id = Date.now().toString();
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  flyUpText: null,
  showFlyUp: (text) => {
    set({ flyUpText: text });
    setTimeout(() => set({ flyUpText: null }), 1200);
  },
  clearFlyUp: () => set({ flyUpText: null }),
}));
