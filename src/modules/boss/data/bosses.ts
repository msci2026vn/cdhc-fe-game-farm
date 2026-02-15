export interface BossInfo {
  id: string;
  name: string;
  emoji: string;
  hp: number;
  attack: number;
  reward: number;
  xpReward: number;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  unlockLevel: number;
}

export const BOSSES: BossInfo[] = [
  { id: 'rep-xanh', name: 'Rệp Xanh', emoji: '🐛', hp: 500, attack: 20, reward: 5, xpReward: 20, description: 'Sâu béo bự chuyên ăn lá non. Đánh bay nó thôi!', difficulty: 'easy', unlockLevel: 1 },
  { id: 'sau-to', name: 'Sâu Tơ', emoji: '🐛', hp: 800, attack: 25, reward: 10, xpReward: 35, description: 'Sâu tơ dệt kén làm héo cây. Đừng để nó lộng hành!', difficulty: 'easy', unlockLevel: 3 },
  { id: 'bo-rua', name: 'Bọ Rùa', emoji: '🐞', hp: 1200, attack: 35, reward: 15, xpReward: 50, description: 'Bọ rùa đỏ tham ăn. Trông dễ thương nhưng phá hoại kinh!', difficulty: 'medium', unlockLevel: 5 },
  { id: 'chau-chau', name: 'Châu Chấu', emoji: '🦗', hp: 2000, attack: 45, reward: 25, xpReward: 70, description: 'Châu chấu dua nhảy khắp vườn. Nó ăn siêu nhanh!', difficulty: 'medium', unlockLevel: 10 },
  { id: 'bo-xit', name: 'Bọ Xít', emoji: '🪲', hp: 3000, attack: 55, reward: 35, xpReward: 90, description: 'Bọ xít hôi thối nhưng nguy hiểm. Cẩn thận chiêu xịt hơi!', difficulty: 'hard', unlockLevel: 15 },
  { id: 'oc-sen', name: 'Ốc Sên', emoji: '🐌', hp: 4000, attack: 65, reward: 50, xpReward: 110, description: 'Ốc sên trườn bò chậm nhưng dai. Dính là chết!', difficulty: 'hard', unlockLevel: 20 },
  { id: 'chuot-dong', name: 'Chuột Đồng', emoji: '🐭', hp: 5000, attack: 80, reward: 70, xpReward: 140, description: 'Chuột đồng tinh ranh. Nó ăn cả rễ cây đấy!', difficulty: 'hard', unlockLevel: 30 },
  { id: 'rong-lua', name: 'Rồng Lửa', emoji: '🐉', hp: 10000, attack: 100, reward: 100, xpReward: 200, description: 'Huyền thoại Rồng Lửa canh vườn cổ. Đánh thắng mới vào club!', difficulty: 'legendary', unlockLevel: 50 },
];

export const DIFFICULTY_STYLES: Record<string, { border: string; bg: string; text: string; label: string }> = {
  easy: { border: 'rgba(85,239,196,0.5)', bg: 'rgba(85,239,196,0.15)', text: '#55efc4', label: 'Dễ' },
  medium: { border: 'rgba(253,203,110,0.5)', bg: 'rgba(253,203,110,0.15)', text: '#fdcb6e', label: 'Trung bình' },
  hard: { border: 'rgba(255,107,107,0.5)', bg: 'rgba(255,107,107,0.15)', text: '#ff6b6b', label: 'Khó' },
  legendary: { border: 'rgba(162,155,254,0.5)', bg: 'rgba(162,155,254,0.15)', text: '#a29bfe', label: 'Huyền thoại' },
};
