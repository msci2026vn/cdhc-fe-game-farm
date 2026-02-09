export interface BossInfo {
  id: string;
  name: string;
  emoji: string;
  hp: number;
  attack: number;
  reward: number;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  unlockLevel: number;
}

export const BOSSES: BossInfo[] = [
  { id: 'repy', name: 'Rệp Xanh', emoji: '🦠', hp: 500, attack: 20, reward: 5, description: 'Rệp hút nhựa cây non', difficulty: 'easy', unlockLevel: 1 },
  { id: 'sau_to', name: 'Sâu Tơ', emoji: '🐛', hp: 800, attack: 30, reward: 8, description: 'Sâu cuốn lá phá hoại rau', difficulty: 'easy', unlockLevel: 1 },
  { id: 'bo_rua', name: 'Bọ Rùa Hại', emoji: '🐞', hp: 1200, attack: 40, reward: 12, description: 'Bọ rùa 28 chấm ăn lá', difficulty: 'medium', unlockLevel: 3 },
  { id: 'chau_chau', name: 'Châu Chấu', emoji: '🦗', hp: 2000, attack: 55, reward: 18, description: 'Đàn châu chấu phá hoại mùa màng', difficulty: 'medium', unlockLevel: 5 },
  { id: 'bo_xit', name: 'Bọ Xít Hôi', emoji: '🪲', hp: 3000, attack: 70, reward: 25, description: 'Bọ xít tiết mùi phá vườn', difficulty: 'hard', unlockLevel: 8 },
  { id: 'oc_sen', name: 'Ốc Sên Khổng Lồ', emoji: '🐌', hp: 4000, attack: 50, reward: 30, description: 'Ốc sên ăn sạch rau mầm', difficulty: 'hard', unlockLevel: 10 },
  { id: 'chuot', name: 'Chuột Đồng', emoji: '🐀', hp: 5000, attack: 80, reward: 40, description: 'Chuột gặm nhấm rễ cây', difficulty: 'hard', unlockLevel: 12 },
  { id: 'rong_lua', name: 'Rồng Lửa Đại Hạn', emoji: '🐲', hp: 10000, attack: 100, reward: 80, description: 'Boss huyền thoại gây hạn hán', difficulty: 'legendary', unlockLevel: 15 },
];

export const DIFFICULTY_STYLES: Record<string, { border: string; bg: string; text: string; label: string }> = {
  easy: { border: 'rgba(85,239,196,0.5)', bg: 'rgba(85,239,196,0.15)', text: '#55efc4', label: 'Dễ' },
  medium: { border: 'rgba(253,203,110,0.5)', bg: 'rgba(253,203,110,0.15)', text: '#fdcb6e', label: 'Trung bình' },
  hard: { border: 'rgba(255,107,107,0.5)', bg: 'rgba(255,107,107,0.15)', text: '#ff6b6b', label: 'Khó' },
  legendary: { border: 'rgba(162,155,254,0.5)', bg: 'rgba(162,155,254,0.15)', text: '#a29bfe', label: 'Huyền thoại' },
};
