import { create } from 'zustand';

export interface ActivityEntry {
  type: 'like' | 'comment' | 'gift' | 'water' | 'harvest' | 'buy';
  text: string;
  emoji: string;
  timestamp: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  quantity: number;
  rarity?: string;
}

interface ActivityState {
  likes: number;
  comments: number;
  gifts: number;
  harvests: number;
  activities: ActivityEntry[];
  inventory: InventoryItem[];

  addLike: (target: string) => void;
  addComment: (target: string, text: string) => void;
  addGift: (target: string, giftName: string) => void;
  addWater: (target: string) => void;
  addHarvest: (plantName: string, ogn: number) => void;
  addPurchase: (item: { id: string; name: string; emoji: string; desc: string; rarity?: string }) => void;
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

export function formatActivityTime(ts: number): string {
  return timeAgo(ts);
}

export const useActivityStore = create<ActivityState>((set) => ({
  likes: 0,
  comments: 0,
  gifts: 0,
  harvests: 0,
  activities: [],
  inventory: [],

  addLike: (target) => set((s) => ({
    likes: s.likes + 1,
    activities: [{ type: 'like', text: `Đã thích vườn của ${target}`, emoji: '❤️', timestamp: Date.now() }, ...s.activities],
  })),

  addComment: (target, text) => set((s) => ({
    comments: s.comments + 1,
    activities: [{ type: 'comment', text: `Bình luận: "${text}" tại vườn ${target}`, emoji: '💬', timestamp: Date.now() }, ...s.activities],
  })),

  addGift: (target, giftName) => set((s) => ({
    gifts: s.gifts + 1,
    activities: [{ type: 'gift', text: `Tặng ${giftName} cho ${target}`, emoji: '🎁', timestamp: Date.now() }, ...s.activities],
  })),

  addWater: (target) => set((s) => ({
    activities: [{ type: 'water', text: `Tưới giúp vườn ${target}`, emoji: '💧', timestamp: Date.now() }, ...s.activities],
  })),

  addHarvest: (plantName, ogn) => set((s) => ({
    harvests: s.harvests + 1,
    activities: [{ type: 'harvest', text: `Thu hoạch ${plantName} +${ogn} OGN`, emoji: '🌾', timestamp: Date.now() }, ...s.activities],
  })),

  addPurchase: (item) => set((s) => {
    const existing = s.inventory.find((i) => i.id === item.id);
    const newInventory = existing
      ? s.inventory.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      : [...s.inventory, { ...item, quantity: 1 }];
    return {
      inventory: newInventory,
      activities: [{ type: 'buy', text: `Mua ${item.name} ${item.emoji}`, emoji: '🛒', timestamp: Date.now() }, ...s.activities],
    };
  }),
}));
