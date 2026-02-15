# FARMVERSE Plant Types Documentation

> **Date:** 2026-02-15
> **Status:** 4 loai cay active, 4 loai da xoa
> **Harvest flow:** Thu hoach = Ban luon (reward_ogn = shop_price * 2). Khong qua inventory.

---

## Harvest Flow (NEW)

```
Trong (-OGN) → Tuoi nuoc (+XP) → Thu hoach → Nhan OGN + XP ngay → Plot trong → Trong lai
```

**KHONG con:** inventory, kho do, ban hang, shelf life.

---

## Active Plant Types (4)

| # | ID | Name | Emoji | Shop Price | Reward OGN | Profit | Reward XP | Growth Time | Season | Region |
|---|------|---------|-------|------------|------------|--------|-----------|-------------|--------|--------|
| 1 | `wheat` | Lua Mi | 🌾 | 50 | 100 | +50 | 5 | 30s | T10-T3 | north |
| 2 | `tomato` | Ca Chua | 🍅 | 200 | 400 | +200 | 25 | 2m | T2-T4, T9-T11 | north |
| 3 | `carrot` | Ca Rot | 🥕 | 280 | 560 | +280 | 25 | 2m30s | T1-T3, T9-T12 | north |
| 4 | `chili` | Ot | 🌶️ | 400 | 800 | +400 | 25 | 3m20s | T3-T10 | all |

> **Formula:** reward_ogn = shop_price * 2 (profit = 100% cua gia trong)

---

## Database Values (plant_types table)

```sql
SELECT id, name, shop_price, reward_ogn, reward_xp, growth_duration_ms
FROM plant_types ORDER BY shop_price;

   id   |  name   | shop_price | reward_ogn | reward_xp | growth_duration_ms
--------+---------+------------+------------+-----------+--------------------
 wheat  | Lua mi  |         50 |        100 |         5 |              30000
 tomato | Ca Chua |        200 |        400 |        25 |             120000
 carrot | Ca Rot  |        280 |        560 |        25 |             150000
 chili  | Ot      |        400 |        800 |        25 |             200000
```

---

## Code Values (src/modules/game/data/plants.ts)

```typescript
{ id: 'wheat',  shopPrice: 50,  rewardOGN: 100, rewardXP: 5,  growthDurationMs: 240000 }
{ id: 'tomato', shopPrice: 200, rewardOGN: 400, rewardXP: 25, growthDurationMs: 120000 }
{ id: 'carrot', shopPrice: 280, rewardOGN: 560, rewardXP: 25, growthDurationMs: 150000 }
{ id: 'chili',  shopPrice: 400, rewardOGN: 800, rewardXP: 25, growthDurationMs: 200000 }
```

---

## Seasonal Data

| Plant | Available Months | Region |
|-------|-----------------|--------|
| tomato | T2, T3, T4, T9, T10, T11 | north |
| carrot | T1, T2, T3, T9, T10, T11, T12 | north |
| chili | T3, T4, T5, T6, T7, T8, T9, T10 | all |
| wheat | T10, T11, T12, T1, T2, T3 | north |

---

## Removed Plant Types (2026-02-15)

| ID | Name VN | Name EN |
|-----|---------|---------|
| `lettuce` | Rau Diep / Rau Muong | Lettuce |
| `cucumber` | Dua Leo | Cucumber |
| `corn` | Bap / Ngo | Corn |
| `sunflower` | Huong Duong | Sunflower |

---

## Commits

| Commit | Description |
|--------|-------------|
| `b2b50b2` | Remove 4 unused plant types |
| `4ba5aa5` | Harvest = sell directly, reward_ogn = shop_price * 2 |

---

## File Locations

### Backend (VPS: /home/cdhc/apps/cdhc-be/)
- `src/modules/game/data/plants.ts` — Plant configs (PLANTS array, SEASONAL_DATA)
- `src/modules/game/routes/farm.ts` — VALID_PLANT_TYPES Zod enum
- `src/modules/game/validators/game.validators.ts` — plantSchema z.enum
- `src/modules/game/services/farm.service.ts` — Plant/harvest/water logic
- `src/modules/game/schema/plant-types.ts` — DB schema

### Frontend (Local: cdhc-game-vite/)
- `src/modules/farming/data/plants.ts` — PLANT_TYPES array
- `src/shared/hooks/useFarmPlots.ts` — PLANT_TYPES lookup
- `src/shared/hooks/useHarvestPlot.ts` — Harvest mutation (shows OGN earned)
- `src/modules/farming/stores/farmStore.ts` — PLANT_TYPES (demo store)
- `src/shared/types/game-api.types.ts` — PlantTypeId, HarvestResult types
