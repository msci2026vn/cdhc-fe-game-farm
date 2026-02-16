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
  1:  { atk: 50,  def: 0,   freq: 1, healPercent: 0,   turnLimit: 100, recommendedLevel: 2,  specialVi: 'Không có' },
  2:  { atk: 70,  def: 0,   freq: 1, healPercent: 0,   turnLimit: 100, recommendedLevel: 3,  specialVi: 'Không có' },
  3:  { atk: 100, def: 0,   freq: 1, healPercent: 0,   turnLimit: 100, recommendedLevel: 4,  specialVi: 'Khi HP<50% ATK tăng 50%' },
  4:  { atk: 110, def: 0,   freq: 1, healPercent: 0,   turnLimit: 100, recommendedLevel: 5,  specialVi: 'Đẻ trứng mỗi 5 lượt: không phá → hồi 15% HP' },

  // ═══ V2 — Vườn Cà Chua (Lv 5-10) ═══
  5:  { atk: 80,  def: 0,   freq: 2, healPercent: 0,   turnLimit: 100, recommendedLevel: 6,  specialVi: 'Không có' },
  6:  { atk: 90,  def: 0,   freq: 2, healPercent: 0,   turnLimit: 100, recommendedLevel: 7,  specialVi: 'Kén: giảm 50% dame 1 turn mỗi 5 lượt' },
  7:  { atk: 100, def: 0,   freq: 2, healPercent: 0,   turnLimit: 100, recommendedLevel: 8,  specialVi: 'Poison: 2% MaxHP/turn × 2 turn khi trúng đòn' },
  8:  { atk: 120, def: 0,   freq: 2, healPercent: 0,   turnLimit: 100, recommendedLevel: 8,  specialVi: '20% né + Phấn: giảm ATK 15% × 2 turn mỗi 4 lượt' },

  // ═══ V3 — Vườn Ớt (Lv 10-15) ═══
  9:  { atk: 70,  def: 150, freq: 1, healPercent: 0,   turnLimit: 125, recommendedLevel: 11, specialVi: 'Turn đầu DEF ×2' },
  10: { atk: 80,  def: 200, freq: 1, healPercent: 0,   turnLimit: 125, recommendedLevel: 12, specialVi: 'Không có' },
  11: { atk: 100, def: 250, freq: 1, healPercent: 0,   turnLimit: 125, recommendedLevel: 13, specialVi: 'Mỗi 4 lượt lao đầu: ATK ×3' },
  12: { atk: 100, def: 350, freq: 1, healPercent: 0,   turnLimit: 125, recommendedLevel: 13, specialVi: 'HP>50%: DEF +150. Rage <25%: DEF=0, ATK ×3' },

  // ═══ V4 — Rẫy Cà Rốt (Lv 15-20) ═══
  13: { atk: 160, def: 0,   freq: 1, healPercent: 0,   turnLimit: 125, recommendedLevel: 16, specialVi: 'Xáo 1 hàng board mỗi 3 lượt' },
  14: { atk: 180, def: 0,   freq: 1, healPercent: 0,   turnLimit: 125, recommendedLevel: 17, specialVi: 'Xáo 2 hàng + drain 10% Mana mỗi 4 lượt' },
  15: { atk: 200, def: 0,   freq: 1, healPercent: 0,   turnLimit: 125, recommendedLevel: 18, specialVi: 'Stun 1 turn mỗi 4 lượt + drain 15% Mana' },
  16: { atk: 230, def: 0,   freq: 1, healPercent: 0,   turnLimit: 125, recommendedLevel: 18, specialVi: 'Stun/4t + Xáo board/6t + Drain 20% Mana/3t' },

  // ═══ V5 — Nhà Kho (Lv 20-30) ═══
  17: { atk: 180, def: 0,   freq: 1, healPercent: 1.5, turnLimit: 125, recommendedLevel: 22, specialVi: 'Không có' },
  18: { atk: 200, def: 0,   freq: 1, healPercent: 2,   turnLimit: 125, recommendedLevel: 24, specialVi: 'Debuff: -15% ATK 2 turn mỗi 5 lượt' },
  19: { atk: 220, def: 100, freq: 1, healPercent: 2,   turnLimit: 125, recommendedLevel: 26, specialVi: 'Phản 10% dame nhận' },
  20: { atk: 250, def: 100, freq: 1, healPercent: 2,   turnLimit: 125, recommendedLevel: 25, specialVi: 'Rút vỏ: miễn dame 2t/6t. Nhớt <30%: -20% ATK vĩnh viễn' },

  // ═══ V6 — Đồng Hoang (Lv 30-40) ═══
  21: { atk: 250, def: 0,   freq: 2, healPercent: 0,   turnLimit: 150, recommendedLevel: 32, specialVi: 'Không có' },
  22: { atk: 280, def: 0,   freq: 2, healPercent: 0,   turnLimit: 150, recommendedLevel: 34, specialVi: 'DOT: 20% chance 2% MaxHP ×3 turn' },
  23: { atk: 320, def: 0,   freq: 1, healPercent: 0,   turnLimit: 150, recommendedLevel: 36, specialVi: 'Đào hang: biến mất 1t/4t, quay lại đánh ×4' },
  24: { atk: 350, def: 0,   freq: 2, healPercent: 0,   turnLimit: 150, recommendedLevel: 38, specialVi: 'Rage <40%: ATK ×1.5, Freq 3. Drain 10% Mana/4t' },

  // ═══ V7 — Rừng Tre (Lv 40-50) ═══
  25: { atk: 400, def: 0,   freq: 1, healPercent: 0,   turnLimit: 150, recommendedLevel: 42, specialVi: 'DOT cháy: 2% MaxHP/turn ×2 turn' },
  26: { atk: 480, def: 0,   freq: 1, healPercent: 0,   turnLimit: 150, recommendedLevel: 44, specialVi: '25% stun 1 turn' },
  27: { atk: 550, def: 0,   freq: 1, healPercent: 0,   turnLimit: 150, recommendedLevel: 46, specialVi: 'True damage 10% MaxHP mỗi 5 lượt' },
  28: { atk: 600, def: 0,   freq: 1, healPercent: 0,   turnLimit: 150, recommendedLevel: 45, specialVi: 'True dame 10% MaxHP/3t. Khóa 2 tile 2t. Rage <20%: ATK ×2' },

  // ═══ V8 — Đầm Lầy (Lv 50-65) ═══
  29: { atk: 200, def: 300, freq: 1, healPercent: 0,   turnLimit: 150, recommendedLevel: 52, specialVi: 'Lifesteal: hồi 30% dame gây ra' },
  30: { atk: 250, def: 350, freq: 1, healPercent: 0,   turnLimit: 150, recommendedLevel: 55, specialVi: 'DOT 2% MaxHP ×2t + drain 10% Mana' },
  31: { atk: 300, def: 300, freq: 1, healPercent: 0,   turnLimit: 150, recommendedLevel: 58, specialVi: '20% crit ×3. Lột xác <50%: hồi 15% HP + ATK +20%' },
  32: { atk: 300, def: 450, freq: 1, healPercent: 0,   turnLimit: 175, recommendedLevel: 55, specialVi: 'HP>60%: DEF+200. Sóng 8% MaxHP/4t. Ngập 1t/8t. <30%: DEF=0 ATK ×2' },

  // ═══ V9 — Núi Lửa (Lv 65-80) ═══
  33: { atk: 500, def: 0,   freq: 1, healPercent: 0,   turnLimit: 175, recommendedLevel: 68, specialVi: 'Tự sát <10%: nổ = 25% MaxHP' },
  34: { atk: 350, def: 400, freq: 1, healPercent: 1.5, turnLimit: 175, recommendedLevel: 72, specialVi: 'DEF giảm 30/turn (400→370→...)' },
  35: { atk: 500, def: 0,   freq: 1, healPercent: 0,   turnLimit: 175, recommendedLevel: 75, specialVi: 'Hồi sinh 1 lần 25% HP. Đốt 2 tile/3t' },
  36: { atk: 650, def: 150, freq: 1, healPercent: 1.5, turnLimit: 175, recommendedLevel: 72, specialVi: 'True dame 10% MaxHP/3t. Tile cháy 2/4t. <15%: ATK ×2.5, tự mất 3% HP/t' },

  // ═══ V10 — Thế Giới Ngầm (Lv 80-100) ═══
  37: { atk: 400, def: 0,   freq: 1, healPercent: 0,   turnLimit: 175, recommendedLevel: 82, specialVi: 'Bào tử khi chết: 4 tile nấm (match = 4% MaxHP)' },
  38: { atk: 350, def: 200, freq: 1, healPercent: 1.5, turnLimit: 175, recommendedLevel: 85, specialVi: 'Triệu hồi mối/4t (3,000 HP, ATK 200)' },
  39: { atk: 700, def: 0,   freq: 2, healPercent: 0,   turnLimit: 175, recommendedLevel: 88, specialVi: 'Tàng hình 1t/4t. Xử tử: player <20% → dame ×5' },
  40: { atk: 250, def: 500, freq: 1, healPercent: 0,   turnLimit: 200, recommendedLevel: 85, specialVi: '4 PHASE: P1 Tank → P2 Assassin → P3 Healer → P4 Glass Cannon' },
};
