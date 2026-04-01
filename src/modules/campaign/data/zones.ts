// ═══════════════════════════════════════════════════════════════
// Static Zone Metadata — icons, gradients, boss emojis
// ═══════════════════════════════════════════════════════════════

export interface ZoneMeta {
  icon: string;
  name: string;
  levelRange: string;
  bgClass: string;
  bossEmoji: Record<number, string>;
}

export const ZONE_META: Record<number, ZoneMeta> = {
  1: { icon: '/assets/campaign/rice.png', name: 'Ruộng Lúa', levelRange: '1-5', bgClass: 'zone-bg-1', bossEmoji: { 1: '🐛', 2: '🐛', 3: '🦟', 4: '🐛' } },
  2: { icon: '/assets/campaign/tomato.png', name: 'Vườn Cà Chua', levelRange: '5-10', bgClass: 'zone-bg-2', bossEmoji: { 1: '🐛', 2: '🕷️', 3: '🐛', 4: '🦋' } },
  3: { icon: '/assets/campaign/chili.png', name: 'Vườn Ớt', levelRange: '10-15', bgClass: 'zone-bg-3', bossEmoji: { 1: '🐞', 2: '🪲', 3: '🪲', 4: '🦗' } },
  4: { icon: '/assets/campaign/carrot.png', name: 'Rẫy Cà Rốt', levelRange: '15-20', bgClass: 'zone-bg-4', bossEmoji: { 1: '🦗', 2: '🦗', 3: '🦗', 4: '🦗' } },
  5: { icon: '/assets/campaign/storehouse.png', name: 'Nhà Kho', levelRange: '20-30', bgClass: 'zone-bg-5', bossEmoji: { 1: '🪲', 2: '🪲', 3: '🐌', 4: '🐌' } },
  6: { icon: '/assets/campaign/moor.png', name: 'Đồng Hoang', levelRange: '30-40', bgClass: 'zone-bg-6', bossEmoji: { 1: '🐭', 2: '🐀', 3: '🐀', 4: '🐀' } },
  7: { icon: '/assets/campaign/bamboo_forest.png', name: 'Rừng Tre', levelRange: '40-50', bgClass: 'zone-bg-7', bossEmoji: { 1: '🐛', 2: '🦂', 3: '🐛', 4: '🐉' } },
  8: { icon: '/assets/campaign/swamp.png', name: 'Đầm Lầy', levelRange: '50-65', bgClass: 'zone-bg-8', bossEmoji: { 1: '🪱', 2: '🐸', 3: '🐍', 4: '🐉' } },
  9: { icon: '/assets/campaign/volcano.png', name: 'Núi Lửa', levelRange: '65-80', bgClass: 'zone-bg-9', bossEmoji: { 1: '🪲', 2: '🦎', 3: '🦅', 4: '🐉' } },
  10: { icon: '/assets/campaign/underworld.png', name: 'Thế Giới Ngầm', levelRange: '80-100', bgClass: 'zone-bg-10', bossEmoji: { 1: '🍄', 2: '🐜', 3: '🦗', 4: '💀' } },
};


/** Absolute coordinates (top/left) for nodes on the newly mapped campaign map */
export const ZONE_POSITIONS: Record<number, { top: string; left: string }> = {
  1: { top: '46%', left: '18%' },
  2: { top: '35%', left: '38%' },
  3: { top: '36%', left: '63%' },
  4: { top: '40%', left: '86%' },
  5: { top: '52%', left: '80%' },
  6: { top: '50%', left: '50%' },
  7: { top: '63%', left: '70%' },
  8: { top: '64%', left: '40%' },
  9: { top: '77%', left: '38%' },
  10: { top: '78%', left: '80%' },
};

