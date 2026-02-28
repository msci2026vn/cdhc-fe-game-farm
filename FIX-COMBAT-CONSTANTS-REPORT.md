# Fix Report — Combat Constants
**Ngay:** 2026-02-28
**Commit:** `5a55be7` on branch `avalan` (push pending — no SSH key on VPS)

## Scan Results

| # | Constant | GDD Expected | Actual Code | Cần sửa? |
|---|----------|-------------|-------------|----------|
| 1 | Enrage rate (+0.10/30s) | +0.08/30s | **KHÔNG TỒN TẠI** — rage là per-boss mechanic (HP-threshold/periodic), ko có time-based global enrage | ❌ |
| 2 | Enrage cap | cap ×2.0 | **KHÔNG TỒN TẠI** — `atk_multiplier` đến từ boss data (DB), ko có global enrage | ❌ |
| 3 | Skill damage mult (×2.5) | ×2.0 | **KHÔNG TỒN TẠI** — ULT dùng `ATK×3 + Mana×0.5`, ko có constant 2.5 riêng | ❌ |
| 4 | Normal attack random (0.3) | 0.2 | **KHÔNG CÓ random** — Boss dmg = `max(ATK-DEF, 1)` (deterministic) | ❌ |
| 5 | Shield cap (player) | 100% maxHP | **Player KHÔNG CÓ shield** — chỉ boss có shield mechanic | ❌ |
| 6 | Boss Shield reduction | cap max 80% | `shieldReduction = mech.damage_reduction` (data-driven, 0-100%) | ✅ ĐÃ SỬA |
| 7 | Reflect cap | 10% maxHP/hit | Không có cap — `reflectDmg = playerDmg × reflectPct / 100` | ✅ ĐÃ SỬA |

## Thay đổi (2/7 — 5 items KHÔNG TỒN TẠI trong code)

| # | Constant | Trước | Sau | File:Line |
|---|----------|-------|-----|-----------|
| 1 | Boss Shield cap | `shieldReduction = mech.damage_reduction \|\| 0` (0-100%) | `Math.min(80, mech.damage_reduction \|\| 0)` — cap 80% max | mechanic-processor.ts:141 |
| 2 | Reflect cap (boss→player, match) | `Math.floor(playerDmg * reflectPercent / 100)` — no cap | `Math.min(..., Math.floor(playerStats.hp * 0.1))` — cap 10% maxHP | battle-orchestrator.ts:195 |
| 3 | Reflect cap (boss→player, ult) | Same — no cap | Same cap 10% maxHP | battle-orchestrator.ts:252 |
| 4 | Reflect cap (turn, match) | Same — no cap | Same cap 10% maxHP | battle-turn.ts:145 |
| 5 | Reflect cap (turn, ult) | Same — no cap | Same cap 10% maxHP | battle-turn.ts:199 |

## Giải thích: Tại sao 5/7 items KHÔNG CẦN SỬA

Hệ thống combat BE **hoàn toàn khác** so với GDD giả định:

1. **Rage**: Là per-boss mechanic (data trong DB `boss_mechanics`), ko có global time-based enrage rate
   - HP-threshold rage: `mech.atk_multiplier` (e.g. ×1.5, ×2.0) khi HP < threshold
   - Periodic burst rage: `every_n_turns` (e.g. Bọ Hung: mỗi 4 turn ATK×3)
   - Supernova: `atk_multiplier: 2.5` (Rồng Lửa boss data, ko phải constant)

2. **Boss damage**: Deterministic `max(BossATK - PlayerDEF, 1)` — ko có random variance

3. **Skill damage**: ULT dùng `ULT_ATK_MULTIPLIER = 3` + `ULT_MANA_MULTIPLIER = 0.5` — ko có "skill damage mult" riêng

4. **Player shield**: Player ko có shield mechanic. Chỉ boss có shield (giảm damage player gây ra cho boss)

## KHÔNG SỬA
- DEF formula (flat subtract) — đã balance cho 40 boss, giữ nguyên
- Gem damage formulas (BE dùng flat, FE dùng gem-type) — by design
- Boss HP/ATK/DEF data — đã tuned
- ULT_ATK_MULTIPLIER = 3 — đúng theo design
- Rage per-boss data — đúng, data-driven ko cần cap global

## Verify
- [x] tsc --noEmit = 0 errors MỚI (110 pre-existing ở rwa/vip/custodial-wallet)
- [x] Lint + Format = PASS
- [x] pm2 restart OK
- [ ] Git pushed (pending — no SSH key on VPS)
