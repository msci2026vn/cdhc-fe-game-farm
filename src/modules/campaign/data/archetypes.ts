// ═══════════════════════════════════════════════════════════════
// Archetype Counter Data — 7 archetypes + 'none' fallback
// Used in BossDetailSheet to show counter/worst build suggestions
// ═══════════════════════════════════════════════════════════════

export interface ArchetypeInfo {
  icon: string;
  label: string;
  color: string;
  counterBuild: string;
  counterIcon: string;
  counterText: string;
  worstBuild: string;
  worstIcon: string;
  worstText: string;
  tipVi: string;
}

export const ARCHETYPE_INFO: Record<string, ArchetypeInfo> = {
  glass_cannon: {
    icon: '🗡️',
    label: 'Glass Cannon',
    color: 'bg-red-500',
    counterBuild: 'ATK',
    counterIcon: '⚔️',
    counterText: 'Tấn Công (rush kill)',
    worstBuild: '',
    worstIcon: '',
    worstText: '',
    tipVi: 'Giết nhanh, né khi boss rage',
  },
  tank: {
    icon: '🛡️',
    label: 'Tank',
    color: 'bg-blue-600',
    counterBuild: 'ATK',
    counterIcon: '⚔️',
    counterText: 'Tấn Công (phá giáp)',
    worstBuild: 'PT',
    worstIcon: '🛡️',
    worstText: 'Phòng Thủ (dame bị DEF chặn)',
    tipVi: 'ATK cao phá giáp. Kiên nhẫn phase 1, burst phase rage',
  },
  healer: {
    icon: '💚',
    label: 'Healer',
    color: 'bg-green-500',
    counterBuild: 'ATK',
    counterIcon: '⚔️',
    counterText: 'Tấn Công (vượt hồi)',
    worstBuild: 'PT',
    worstIcon: '🛡️',
    worstText: 'Phòng Thủ (DPS < hồi máu)',
    tipVi: 'DPS phải vượt heal/turn. Dồn burst khi boss mở guard',
  },
  assassin: {
    icon: '⚡',
    label: 'Assassin',
    color: 'bg-purple-600',
    counterBuild: 'PT',
    counterIcon: '🛡️',
    counterText: 'Phòng Thủ (tank burst)',
    worstBuild: 'TC',
    worstIcon: '⚔️',
    worstText: 'Tấn Công (DEF thấp, chết nhanh)',
    tipVi: 'DEF giảm MỖI đòn ×Freq. Né phase rage (Freq tăng)',
  },
  controller: {
    icon: '🌀',
    label: 'Controller',
    color: 'bg-amber-500',
    counterBuild: 'CB',
    counterIcon: '✨',
    counterText: 'Cân Bằng (Mana chống drain)',
    worstBuild: 'TC',
    worstIcon: '⚔️',
    worstText: 'Tấn Công (bị disrupt)',
    tipVi: 'Mana cao chịu drain tốt. Nhớ pattern stun',
  },
  hybrid: {
    icon: '💀',
    label: 'Hybrid',
    color: 'bg-rose-700',
    counterBuild: 'ATK',
    counterIcon: '⚔️',
    counterText: 'Tấn Công (burst vượt hồi)',
    worstBuild: 'CB',
    worstIcon: '✨',
    worstText: 'Cân Bằng (HP thấp vs true damage)',
    tipVi: 'Cuộc đua DPS. Né true damage. Boss tự hủy khi HP thấp',
  },
  all: {
    icon: '👑',
    label: 'Đế Vương',
    color: 'bg-yellow-600',
    counterBuild: 'PT',
    counterIcon: '🛡️',
    counterText: 'Phòng Thủ (an toàn nhất)',
    worstBuild: '',
    worstIcon: '',
    worstText: '',
    tipVi: '4 phase: Tank→Assassin→Healer→Glass. Tích Mana ở P1, Né ở P2, Burst ở P3, Sống sót P4',
  },
  none: {
    icon: '❓',
    label: 'Thường',
    color: 'bg-gray-400',
    counterBuild: '',
    counterIcon: '',
    counterText: 'Mọi build đều OK',
    worstBuild: '',
    worstIcon: '',
    worstText: '',
    tipVi: 'Quái thường, không có cơ chế đặc biệt',
  },
};
