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
  { id: 'rep-xanh', name: 'Rệp Xanh', emoji: '🐛', hp: 500, attack: 20, reward: 5, xpReward: 15, description: 'Sâu béo bự chuyên ăn lá non. Đánh bay nó thôi!', difficulty: 'easy', unlockLevel: 1 },
  { id: 'sau-to', name: 'Sâu Tơ', emoji: '🐛', hp: 800, attack: 25, reward: 8, xpReward: 25, description: 'Sâu tơ dệt kén làm héo cây. Đừng để nó lộng hành!', difficulty: 'easy', unlockLevel: 1 },
  { id: 'bo-rua', name: 'Bọ Rùa', emoji: '🐞', hp: 1200, attack: 35, reward: 12, xpReward: 40, description: 'Bọ rùa đỏ tham ăn. Trông dễ thương nhưng phá hoại kinh!', difficulty: 'medium', unlockLevel: 3 },
  { id: 'chau-chau', name: 'Châu Chấu', emoji: '🦗', hp: 2000, attack: 45, reward: 20, xpReward: 60, description: 'Châu chấu dua nhảy khắp vườn. Nó ăn siêu nhanh!', difficulty: 'medium', unlockLevel: 5 },
  { id: 'bo-xit', name: 'Bọ Xít', emoji: '🪲', hp: 3000, attack: 55, reward: 30, xpReward: 80, description: 'Bọ xít hôi thối nhưng nguy hiểm. Cẩn thận chiêu xịt hơi!', difficulty: 'hard', unlockLevel: 8 },
  { id: 'oc-sen', name: 'Ốc Sên', emoji: '🐌', hp: 4000, attack: 65, reward: 40, xpReward: 120, description: 'Ốc sên trườn bò chậm nhưng không less. Dính là chết!', difficulty: 'hard', unlockLevel: 10 },
  { id: 'chuot-dong', name: 'Chuột Đồng', emoji: '🐭', hp: 5000, attack: 80, reward: 50, xpReward: 150, description: 'Chuột đồng tinh ran. Nó ăn cả rễ cây đấy!', difficulty: 'hard', unlockLevel: 12 },
  { id: 'rong-lua', name: 'Rồng Lửa', emoji: '🐉', hp: 10000, attack: 100, reward: 80, xpReward: 250, description: 'Huyền thoại Rồng Lửa canh vườn cổ. Đánh thắng mới vào club!', difficulty: 'legendary', unlockLevel: 15 },
];

export const DIFFICULTY_STYLES: Record<string, { border: string; bg: string; text: string; label: string }> = {
  easy: { border: 'rgba(85,239,196,0.5)', bg: 'rgba(85,239,196,0.15)', text: '#55efc4', label: 'Dễ' },
  medium: { border: 'rgba(253,203,110,0.5)', bg: 'rgba(253,203,110,0.15)', text: '#fdcb6e', label: 'Trung bình' },
  hard: { border: 'rgba(255,107,107,0.5)', bg: 'rgba(255,107,107,0.15)', text: '#ff6b6b', label: 'Khó' },
  legendary: { border: 'rgba(162,155,254,0.5)', bg: 'rgba(162,155,254,0.15)', text: '#a29bfe', label: 'Huyền thoại' },
};
