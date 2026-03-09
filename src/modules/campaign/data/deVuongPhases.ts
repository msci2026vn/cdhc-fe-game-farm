// ═══════════════════════════════════════════════════════════════
// De Vuong (Boss #40) — 4 Phase Boss Data
// Phase transitions trigger at HP thresholds: 100%, 75%, 50%, 25%
// ═══════════════════════════════════════════════════════════════

export interface BossPhase {
  phaseNumber: number;       // 1-4
  name: string;              // "Tank", "Assassin", ...
  icon: string;              // emoji icon
  hpThreshold: number;       // HP% at which this phase STARTS (100, 75, 50, 25)
  atk: number;
  def: number;
  freq: number;
  healPercent: number;
  skillName: string;         // Skill name shown in warning
  description: string;       // Short phase description
}

export const DE_VUONG_PHASES: BossPhase[] = [
  {
    phaseNumber: 1,
    name: 'Tank',
    icon: '🛡️',
    hpThreshold: 100,        // HP 100% → 75%
    atk: 250,
    def: 500,
    freq: 1,
    healPercent: 0,
    skillName: 'Giáp thần!',
    description: 'DEF cực cao, đánh chậm. Tập trung phá giáp.',
  },
  {
    phaseNumber: 2,
    name: 'Assassin',
    icon: '⚡',
    hpThreshold: 75,         // HP 75% → 50%
    atk: 600,
    def: 0,
    freq: 3,
    healPercent: 0,
    skillName: 'Tam liên kích!',
    description: '3 đòn liên hoàn, ATK cực cao. NÉ hoặc chết!',
  },
  {
    phaseNumber: 3,
    name: 'Healer',
    icon: '💚',
    hpThreshold: 50,         // HP 50% → 25%
    atk: 350,
    def: 200,
    freq: 1,
    healPercent: 3,
    skillName: 'Hồi sinh!',
    description: 'Hồi 3% HP mỗi 5 giây. DPS race — burst nhanh!',
  },
  {
    phaseNumber: 4,
    name: 'Glass Cannon',
    icon: '💀',
    hpThreshold: 25,         // HP 25% → 0%
    atk: 800,
    def: 0,
    freq: 2,
    healPercent: 0,
    skillName: 'Hủy diệt!',
    description: 'ATK tối đa, tự mất 2% HP/5s. Sống sót = thắng!',
  },
];
