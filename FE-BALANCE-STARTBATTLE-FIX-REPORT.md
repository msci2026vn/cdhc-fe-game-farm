# Fix Report — FE Balance + startBattle (FE Prompt 2)
**Ngày:** 2026-02-28

## 4 Fixes
| # | Bug | Fix | Files | Lines |
|---|-----|-----|-------|-------|
| A | Enrage vô hạn (+10%/30s, NO CAP) | Cap ×2.0 `Math.min(mult, ENRAGE_CAP)` | `src/shared/match3/combat.config.ts` | 54-57 |
| B | Shield stack vô hạn | Cap 100% maxHP `Math.min(shield+gain, playerMaxHp)` | `src/modules/boss/hooks/match-processor.engine.ts:102`, `src/modules/campaign/hooks/match3-processor.engine.ts:149` | 2 files |
| C | Boss shield 100% block | 80% reduction `damage *= 0.2` | `src/modules/campaign/hooks/match3-processor.engine.ts:125-127` | 1 file (boss weekly không có boss shield mechanic) |
| D | startCampaignBattle tồn tại nhưng KHÔNG ĐƯỢC GỌI | Thêm useEffect gọi startBattle on mount | `src/modules/campaign/components/BossFightCampaign.tsx:117-124`, `src/modules/boss/components/BossFightM3.tsx:89-97` | 2 files |

## Balance Impact
| Metric | Trước | Sau |
|--------|-------|-----|
| Boss ATK max (10 phút) | ×3.0 (vô hạn) | ×2.0 (cap) |
| Player shield max | ∞ (vô hạn) | 100% maxHP |
| Damage vs boss shield | 0% (full block) | 20% (80% reduction) |
| Anti-cheat session | Không có (function tồn tại nhưng không gọi) | Redis 600s TTL |

## startBattle Flow
```
Player vào trận → [FE] POST /boss/battle/start → [BE] Redis session created
Player chơi match-3 → ... → Player thắng/thua
Player submit → [FE] POST /boss/battle/complete → [BE] Check session → Save rewards
```

## Chi tiết kỹ thuật

### Fix A: Enrage Cap
- `getEnrageMultiplier()` trả về `Math.min(1 + Math.floor(elapsed/30)*0.10, 2.0)`
- Export `ENRAGE_CAP = 2.0` constant cho reference
- Dùng chung 1 function cho cả campaign + weekly boss

### Fix B: Shield Cap
- Boss weekly: `match-processor.engine.ts:102` — `shield = Math.min(shield + shieldAmt, prev.playerMaxHp)`
- Campaign: `match3-processor.engine.ts:149` — `shield = Math.min(shield + shieldAmt, prev.playerMaxHp)`
- `prev.playerMaxHp` đã có sẵn trong setBoss callback scope

### Fix C: Boss Shield Reduction
- CHỈ campaign có boss shield mechanic (via `activeBossBuffsRef`)
- Trước: `actualDmg = 0` → Sau: `actualDmg = Math.floor(actualDmg * 0.2)`
- Boss weekly không có boss shield → không cần fix

### Fix D: startBattle API
- `campaignApi.startCampaignBattle()` đã tồn tại từ trước nhưng KHÔNG ĐƯỢC GỌI
- Thêm useEffect on mount ở cả 2 component: BossFightCampaign + BossFightM3
- Dùng `useRef(false)` để đảm bảo chỉ gọi 1 lần (StrictMode safe)
- Error handling: `.catch()` log warning, cho chơi tiếp (graceful degradation)

## Verify
- [x] Enrage cap ×2.0 — `ENRAGE_CAP = 2.0` + `Math.min()`
- [x] Shield cap — `Math.min(shield, playerMaxHp)` in 2 files
- [x] Boss shield — `actualDmg * 0.2` in campaign processor
- [x] startBattle API function exists — `api-campaign.ts:67`
- [x] startBattle called on mount — 2 components
- [x] Type check pass — `tsc --noEmit` clean
- [x] Build pass — `vite build` success

## Next: FE Prompt 3 — Skill Buttons (Ớt Hiểm + Rơm Bọc)
