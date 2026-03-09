// ═══════════════════════════════════════════════════════════════
// Static Boss Details — 40 campaign bosses (fallback if API lacks fields)
// Key = global bossNumber (1-40), 4 bosses per zone
// ═══════════════════════════════════════════════════════════════

export interface BossDetailStatic {
  atk: number;
  def: number;
  freq: number;
  healPercent: number;
  turnLimit: number;
  recommendedLevel: number;
  specialVi: string;
}

export const BOSS_DETAILS: Record<number, BossDetailStatic> = {
  // ═══ V1 — Ruộng Lúa (Lv 1-5) ═══
  1: { atk: 50, def: 0, freq: 1, healPercent: 0, turnLimit: 100, recommendedLevel: 2, specialVi: 'campaign.boss.special.none' },
  2: { atk: 70, def: 0, freq: 1, healPercent: 0, turnLimit: 100, recommendedLevel: 3, specialVi: 'campaign.boss.special.none' },
  3: { atk: 100, def: 0, freq: 1, healPercent: 0, turnLimit: 100, recommendedLevel: 4, specialVi: 'campaign.boss.special.3' },
  4: { atk: 110, def: 0, freq: 1, healPercent: 0, turnLimit: 100, recommendedLevel: 5, specialVi: 'campaign.boss.special.4' },

  // ═══ V2 — Vườn Cà Chua (Lv 5-10) ═══
  5: { atk: 80, def: 0, freq: 2, healPercent: 0, turnLimit: 100, recommendedLevel: 6, specialVi: 'campaign.boss.special.none' },
  6: { atk: 90, def: 0, freq: 2, healPercent: 0, turnLimit: 100, recommendedLevel: 7, specialVi: 'campaign.boss.special.6' },
  7: { atk: 100, def: 0, freq: 2, healPercent: 0, turnLimit: 100, recommendedLevel: 8, specialVi: 'campaign.boss.special.7' },
  8: { atk: 120, def: 0, freq: 2, healPercent: 0, turnLimit: 100, recommendedLevel: 8, specialVi: 'campaign.boss.special.8' },

  // ═══ V3 — Vườn Ớt (Lv 10-15) ═══
  9: { atk: 70, def: 150, freq: 1, healPercent: 0, turnLimit: 125, recommendedLevel: 11, specialVi: 'campaign.boss.special.9' },
  10: { atk: 80, def: 200, freq: 1, healPercent: 0, turnLimit: 125, recommendedLevel: 12, specialVi: 'campaign.boss.special.none' },
  11: { atk: 100, def: 250, freq: 1, healPercent: 0, turnLimit: 125, recommendedLevel: 13, specialVi: 'campaign.boss.special.11' },
  12: { atk: 100, def: 350, freq: 1, healPercent: 0, turnLimit: 125, recommendedLevel: 13, specialVi: 'campaign.boss.special.12' },

  // ═══ V4 — Rẫy Cà Rốt (Lv 15-20) ═══
  13: { atk: 160, def: 0, freq: 1, healPercent: 0, turnLimit: 125, recommendedLevel: 16, specialVi: 'campaign.boss.special.13' },
  14: { atk: 180, def: 0, freq: 1, healPercent: 0, turnLimit: 125, recommendedLevel: 17, specialVi: 'campaign.boss.special.14' },
  15: { atk: 200, def: 0, freq: 1, healPercent: 0, turnLimit: 125, recommendedLevel: 18, specialVi: 'campaign.boss.special.15' },
  16: { atk: 230, def: 0, freq: 1, healPercent: 0, turnLimit: 125, recommendedLevel: 18, specialVi: 'campaign.boss.special.16' },

  // ═══ V5 — Nhà Kho (Lv 20-30) ═══
  17: { atk: 180, def: 0, freq: 1, healPercent: 1.5, turnLimit: 125, recommendedLevel: 22, specialVi: 'campaign.boss.special.none' },
  18: { atk: 200, def: 0, freq: 1, healPercent: 2, turnLimit: 125, recommendedLevel: 24, specialVi: 'campaign.boss.special.18' },
  19: { atk: 220, def: 100, freq: 1, healPercent: 2, turnLimit: 125, recommendedLevel: 26, specialVi: 'campaign.boss.special.19' },
  20: { atk: 250, def: 100, freq: 1, healPercent: 2, turnLimit: 125, recommendedLevel: 25, specialVi: 'campaign.boss.special.20' },

  // ═══ V6 — Đồng Hoang (Lv 30-40) ═══
  21: { atk: 250, def: 0, freq: 2, healPercent: 0, turnLimit: 150, recommendedLevel: 32, specialVi: 'campaign.boss.special.none' },
  22: { atk: 280, def: 0, freq: 2, healPercent: 0, turnLimit: 150, recommendedLevel: 34, specialVi: 'campaign.boss.special.22' },
  23: { atk: 320, def: 0, freq: 1, healPercent: 0, turnLimit: 150, recommendedLevel: 36, specialVi: 'campaign.boss.special.23' },
  24: { atk: 350, def: 0, freq: 2, healPercent: 0, turnLimit: 150, recommendedLevel: 38, specialVi: 'campaign.boss.special.24' },

  // ═══ V7 — Rừng Tre (Lv 40-50) ═══
  25: { atk: 400, def: 0, freq: 1, healPercent: 0, turnLimit: 150, recommendedLevel: 42, specialVi: 'campaign.boss.special.25' },
  26: { atk: 480, def: 0, freq: 1, healPercent: 0, turnLimit: 150, recommendedLevel: 44, specialVi: 'campaign.boss.special.26' },
  27: { atk: 550, def: 0, freq: 1, healPercent: 0, turnLimit: 150, recommendedLevel: 46, specialVi: 'campaign.boss.special.27' },
  28: { atk: 600, def: 0, freq: 1, healPercent: 0, turnLimit: 150, recommendedLevel: 45, specialVi: 'campaign.boss.special.28' },

  // ═══ V8 — Đầm Lầy (Lv 50-65) ═══
  29: { atk: 200, def: 300, freq: 1, healPercent: 0, turnLimit: 150, recommendedLevel: 52, specialVi: 'campaign.boss.special.29' },
  30: { atk: 250, def: 350, freq: 1, healPercent: 0, turnLimit: 150, recommendedLevel: 55, specialVi: 'campaign.boss.special.30' },
  31: { atk: 300, def: 300, freq: 1, healPercent: 0, turnLimit: 150, recommendedLevel: 58, specialVi: 'campaign.boss.special.31' },
  32: { atk: 300, def: 450, freq: 1, healPercent: 0, turnLimit: 175, recommendedLevel: 55, specialVi: 'campaign.boss.special.32' },

  // ═══ V9 — Núi Lửa (Lv 65-80) ═══
  33: { atk: 500, def: 0, freq: 1, healPercent: 0, turnLimit: 175, recommendedLevel: 68, specialVi: 'campaign.boss.special.33' },
  34: { atk: 350, def: 400, freq: 1, healPercent: 1.5, turnLimit: 175, recommendedLevel: 72, specialVi: 'campaign.boss.special.34' },
  35: { atk: 500, def: 0, freq: 1, healPercent: 0, turnLimit: 175, recommendedLevel: 75, specialVi: 'campaign.boss.special.35' },
  36: { atk: 650, def: 150, freq: 1, healPercent: 1.5, turnLimit: 175, recommendedLevel: 72, specialVi: 'campaign.boss.special.36' },

  // ═══ V10 — Thế Giới Ngầm (Lv 80-100) ═══
  37: { atk: 400, def: 0, freq: 1, healPercent: 0, turnLimit: 175, recommendedLevel: 82, specialVi: 'campaign.boss.special.37' },
  38: { atk: 350, def: 200, freq: 1, healPercent: 1.5, turnLimit: 175, recommendedLevel: 85, specialVi: 'campaign.boss.special.38' },
  39: { atk: 700, def: 0, freq: 2, healPercent: 0, turnLimit: 175, recommendedLevel: 88, specialVi: 'campaign.boss.special.39' },
  40: { atk: 250, def: 500, freq: 1, healPercent: 0, turnLimit: 200, recommendedLevel: 85, specialVi: 'campaign.boss.special.40' },
};
