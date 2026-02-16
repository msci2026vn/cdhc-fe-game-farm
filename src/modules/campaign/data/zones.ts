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
  1:  { icon: '🌾', name: 'Ruộng Lúa',     levelRange: '1-5',    bgClass: 'zone-bg-1',  bossEmoji: { 1: '🐛', 2: '🐛', 3: '🦟', 4: '🐛' } },
  2:  { icon: '🍅', name: 'Vườn Cà Chua',   levelRange: '5-10',   bgClass: 'zone-bg-2',  bossEmoji: { 1: '🐛', 2: '🕷️', 3: '🐛', 4: '🦋' } },
  3:  { icon: '🌶️', name: 'Vườn Ớt',        levelRange: '10-15',  bgClass: 'zone-bg-3',  bossEmoji: { 1: '🐞', 2: '🪲', 3: '🪲', 4: '🦗' } },
  4:  { icon: '🥕', name: 'Rẫy Cà Rốt',     levelRange: '15-20',  bgClass: 'zone-bg-4',  bossEmoji: { 1: '🦗', 2: '🦗', 3: '🦗', 4: '🦗' } },
  5:  { icon: '🏚️', name: 'Nhà Kho',         levelRange: '20-30',  bgClass: 'zone-bg-5',  bossEmoji: { 1: '🪲', 2: '🪲', 3: '🐌', 4: '🐌' } },
  6:  { icon: '🏜️', name: 'Đồng Hoang',      levelRange: '30-40',  bgClass: 'zone-bg-6',  bossEmoji: { 1: '🐭', 2: '🐀', 3: '🐀', 4: '🐀' } },
  7:  { icon: '🎋', name: 'Rừng Tre',        levelRange: '40-50',  bgClass: 'zone-bg-7',  bossEmoji: { 1: '🐛', 2: '🦂', 3: '🐛', 4: '🐉' } },
  8:  { icon: '🌊', name: 'Đầm Lầy',        levelRange: '50-65',  bgClass: 'zone-bg-8',  bossEmoji: { 1: '🪱', 2: '🐸', 3: '🐍', 4: '🐉' } },
  9:  { icon: '🌋', name: 'Núi Lửa',        levelRange: '65-80',  bgClass: 'zone-bg-9',  bossEmoji: { 1: '🪲', 2: '🦎', 3: '🦅', 4: '🐉' } },
  10: { icon: '🕳️', name: 'Thế Giới Ngầm',  levelRange: '80-100', bgClass: 'zone-bg-10', bossEmoji: { 1: '🍄', 2: '🐜', 3: '🦗', 4: '💀' } },
};

/** Zigzag positions for zone nodes on the map */
export const ZONE_POSITIONS: Record<number, string> = {
  1:  'self-center',
  2:  'self-end mr-8',
  3:  'self-start ml-8',
  4:  'self-end mr-8',
  5:  'self-start ml-8',
  6:  'self-end mr-8',
  7:  'self-start ml-8',
  8:  'self-end mr-8',
  9:  'self-start ml-8',
  10: 'self-center',
};
