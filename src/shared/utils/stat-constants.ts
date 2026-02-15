export const STAT_CONFIG = {
  BASE: { ATK: 100, HP: 500, DEF: 50, MANA: 100 },
  PER_POINT: { ATK: 20, HP: 100, DEF: 10, MANA: 15 },
} as const;

export function calcEffective(base: number, points: number, perPoint: number) {
  return base + points * perPoint;
}
