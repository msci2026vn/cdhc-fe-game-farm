export interface Friend {
  id: string;
  name: string;
  avatar: string;
  level: number;
  title: string;
  online: boolean;
  plant: {
    emoji: string;
    name: string;
    growthPct: number;
    stage: string;
    happiness: number;
  };
  stats: {
    ogn: number;
    totalHarvest: number;
    daysActive: number;
  };
}

export const FRIENDS: Friend[] = [
  {
    id: 'f1', name: 'CryptoFarmer', avatar: '👨‍🌾', level: 12, title: 'Nông dân Vàng', online: true,
    plant: { emoji: '🍅', name: 'Cà Chua', growthPct: 82, stage: 'Giai đoạn 4/5', happiness: 90 },
    stats: { ogn: 5200, totalHarvest: 38, daysActive: 45 },
  },
  {
    id: 'f2', name: 'GreenHero92', avatar: '🧑‍🌾', level: 8, title: 'Nông dân Bạc', online: true,
    plant: { emoji: '🥬', name: 'Rau Muống', growthPct: 45, stage: 'Giai đoạn 2/5', happiness: 65 },
    stats: { ogn: 2800, totalHarvest: 21, daysActive: 30 },
  },
  {
    id: 'f3', name: 'PlantQueen', avatar: '👩‍🌾', level: 15, title: 'Nông dân Kim Cương', online: false,
    plant: { emoji: '🌶️', name: 'Ớt', growthPct: 100, stage: 'Thu hoạch!', happiness: 95 },
    stats: { ogn: 8900, totalHarvest: 67, daysActive: 90 },
  },
  {
    id: 'f4', name: 'FarmBoy_VN', avatar: '👦', level: 3, title: 'Nông dân Đồng', online: false,
    plant: { emoji: '🥕', name: 'Cà Rốt', growthPct: 20, stage: 'Giai đoạn 1/5', happiness: 50 },
    stats: { ogn: 680, totalHarvest: 5, daysActive: 7 },
  },
  {
    id: 'f5', name: 'OrganicMaster', avatar: '🧓', level: 20, title: 'Huyền Thoại', online: true,
    plant: { emoji: '🥒', name: 'Dưa Leo', growthPct: 60, stage: 'Giai đoạn 3/5', happiness: 80 },
    stats: { ogn: 15400, totalHarvest: 120, daysActive: 180 },
  },
];
