# FARMVERSE — Huong Dan Quan Ly Cay Trong

> **Date:** 2026-02-15
> **Version:** 2.0 (Harvest = Ban luon, khong qua inventory)

---

## 1. Tong Quan He Thong

### Flow trong cay

```
Trong cay (-OGN) → Tuoi nuoc (+2 XP) → Thu hoach → Nhan OGN + XP ngay → Plot trong → Trong lai
```

### Cong thuc

```
reward_ogn = shop_price × 2       (loi 100%)
profit     = shop_price            (= reward_ogn - shop_price)
```

### Nguon du lieu

- **DB table `plant_types`** = source of truth tai runtime (farm.service.ts doc tu DB)
- **Backend `plants.ts`** = backup/reference constants (dung cho SEASONAL_DATA)
- **Frontend `plants.ts`** = hien thi UI (price, growthTime text)

> **QUAN TRONG:** Khi them/sua cay, PHAI sua CA 3 noi: DB + Backend code + Frontend code.

---

## 2. Du Lieu Hien Tai (4 cay)

| ID | Ten | Emoji | Gia trong | Thu hoach OGN | Loi | XP | Thoi gian | Mua vu | Vung |
|----|-----|-------|-----------|---------------|-----|----|-----------|--------|------|
| `wheat` | Lua Mi | 🌾 | 50 | 100 | +50 | 5 | 30s (30000ms) | T10-T3 | north |
| `tomato` | Ca Chua | 🍅 | 200 | 400 | +200 | 25 | 2m (120000ms) | T2-T4, T9-T11 | north |
| `carrot` | Ca Rot | 🥕 | 280 | 560 | +280 | 25 | 2m30s (150000ms) | T1-T3, T9-T12 | north |
| `chili` | Ot | 🌶️ | 400 | 800 | +400 | 25 | 3m20s (200000ms) | T3-T10 | all |

### Bang quy doi thoi gian (ms)

| Thoi gian | Milliseconds |
|-----------|-------------|
| 10 giay | 10000 |
| 30 giay | 30000 |
| 1 phut | 60000 |
| 2 phut | 120000 |
| 3 phut | 180000 |
| 5 phut | 300000 |
| 10 phut | 600000 |
| 30 phut | 1800000 |
| 1 gio | 3600000 |
| 2 gio | 7200000 |
| 6 gio | 21600000 |
| 12 gio | 43200000 |
| 24 gio | 86400000 |

---

## 3. Database Schema

### Table: `plant_types`

| Column | Type | Nullable | Default | Mo ta |
|--------|------|----------|---------|-------|
| `id` | varchar(20) | NOT NULL | — | Primary key, vd: `'tomato'` |
| `name` | varchar(50) | NOT NULL | — | Ten hien thi, vd: `'Ca Chua'` |
| `emoji` | varchar(10) | NOT NULL | — | Emoji, vd: `'🍅'` |
| `growth_duration_ms` | integer | NOT NULL | — | Thoi gian trong (milliseconds) |
| `reward_ogn` | integer | NOT NULL | 10 | OGN nhan khi thu hoach |
| `reward_xp` | integer | NOT NULL | 5 | XP nhan khi thu hoach |
| `shop_price` | integer | NOT NULL | 50 | Gia mua hat giong (OGN) |
| `created_at` | timestamptz | NOT NULL | now() | Ngay tao |

### Lien ket

- `farm_plots.plant_type_id` → `plant_types.id` (FK)

### Table: `farm_plots`

| Column | Type | Mo ta |
|--------|------|-------|
| `id` | uuid | PK, auto gen |
| `user_id` | uuid | FK → users.id |
| `slot_index` | integer | Vi tri plot (0-5) |
| `plant_type_id` | varchar(20) | FK → plant_types.id |
| `planted_at` | bigint | Timestamp ms khi trong |
| `happiness` | integer | 0-100, mac dinh 100 |
| `last_watered_at` | bigint | Timestamp ms khi tuoi |
| `is_dead` | boolean | Cay da chet? |
| `died_at` | timestamptz | Thoi diem chet |

---

## 4. Huong Dan THEM CAY MOI

### Vi du: Them cay "Dau Tay" (strawberry)

#### Buoc 1: Them vao Database

```sql
-- Ket noi DB:
-- docker exec -it cdhcbe_postgres psql -U cdhc -d cdhc

INSERT INTO plant_types (id, name, emoji, growth_duration_ms, reward_ogn, reward_xp, shop_price)
VALUES ('strawberry', 'Dau Tay', '🍓', 180000, 600, 20, 300);

-- Verify:
SELECT * FROM plant_types WHERE id = 'strawberry';
```

#### Buoc 2: Them vao Backend code

**File 1: `src/modules/game/data/plants.ts`**

Them vao mang `PLANTS`:
```typescript
  {
    id: 'strawberry',
    name: 'Dau Tay',
    emoji: '🍓',
    growthDurationMs: 180000,
    rewardOGN: 600,
    rewardXP: 20,
    shopPrice: 300,
  },
```

Them vao `SEASONAL_DATA`:
```typescript
  strawberry: { availableMonths: [1, 2, 3, 10, 11, 12], region: 'north' },
```

**File 2: `src/modules/game/routes/farm.ts`**

Them vao `VALID_PLANT_TYPES`:
```typescript
const VALID_PLANT_TYPES = ['carrot', 'chili', 'strawberry', 'tomato', 'wheat'] as const;
//                                              ^^^^^^^^^^^^ THEM
```

> **Luu y:** Giu thu tu alphabet.

**File 3: `src/modules/game/validators/game.validators.ts`**

Sua dong `plantTypeId`:
```typescript
plantTypeId: z.enum(['tomato', 'carrot', 'chili', 'wheat', 'strawberry']),
//                                                          ^^^^^^^^^^^^ THEM
```

#### Buoc 3: Them vao Frontend code

**File 1: `src/modules/farming/data/plants.ts`** (FE local)

```typescript
{ id: 'strawberry', name: 'Dau Tay', emoji: '🍓', price: 300, growthTime: '3m' },
```

**File 2: `src/shared/hooks/useFarmPlots.ts`**

Them vao `PLANT_TYPES` record:
```typescript
strawberry: { id: 'strawberry', name: 'Dau Tay', emoji: '🍓', growthDurationMs: 180000, rewardOGN: 600, rewardXP: 20, shopPrice: 300 },
```

**File 3: `src/modules/farming/stores/farmStore.ts`**

Them vao `PLANT_TYPES` array:
```typescript
{ id: 'strawberry', name: 'Dau Tay', emoji: '🍓', growthDurationMs: 180_000, rewardOGN: 600, shopPrice: 300 },
```

**File 4: `src/shared/types/game-api.types.ts`**

Sua `PlantTypeId`:
```typescript
export type PlantTypeId = 'tomato' | 'carrot' | 'chili' | 'wheat' | 'strawberry';
```

#### Buoc 4: Restart & Verify

```bash
# Backend (VPS qua MCP):
pm2 restart cdhc-api
pm2 logs cdhc-api --lines 10 --nostream

# Verify DB:
docker exec cdhcbe_postgres psql -U cdhc -d cdhc -c "SELECT id, name, shop_price, reward_ogn FROM plant_types ORDER BY shop_price;"

# Test API (can session cookie):
curl -s https://sta.cdhc.vn/api/game/shop/items -H 'Cookie: ...' | python3 -m json.tool | head -40
```

---

## 5. Huong Dan SUA DU LIEU

### 5.1 Doi gia trong (shop_price)

```sql
-- Doi gia tomato tu 200 → 250
UPDATE plant_types SET shop_price = 250 WHERE id = 'tomato';

-- Nho cap nhat reward_ogn theo cong thuc x2:
UPDATE plant_types SET reward_ogn = 250 * 2 WHERE id = 'tomato';

-- Hoac doi tat ca cung luc:
UPDATE plant_types SET shop_price = 250, reward_ogn = 500 WHERE id = 'tomato';
```

> **Sau khi doi DB**, cap nhat code backend `plants.ts` + frontend `plants.ts` + `useFarmPlots.ts` + `farmStore.ts` cho dong bo.

### 5.2 Doi OGN thu hoach (reward_ogn)

```sql
-- Doi reward cua wheat tu 100 → 150
UPDATE plant_types SET reward_ogn = 150 WHERE id = 'wheat';

-- Doi tat ca ve x2:
UPDATE plant_types SET reward_ogn = shop_price * 2;

-- Doi tat ca ve x3 (loi 200%):
UPDATE plant_types SET reward_ogn = shop_price * 3;
```

### 5.3 Doi XP thu hoach (reward_xp)

```sql
UPDATE plant_types SET reward_xp = 30 WHERE id = 'tomato';

-- Doi tat ca cung XP:
UPDATE plant_types SET reward_xp = 25;
```

### 5.4 Doi thoi gian trong (growth_duration_ms)

```sql
-- Doi tomato tu 2 phut (120000ms) → 5 phut (300000ms)
UPDATE plant_types SET growth_duration_ms = 300000 WHERE id = 'tomato';

-- Doi wheat tu 30s → 1 phut
UPDATE plant_types SET growth_duration_ms = 60000 WHERE id = 'wheat';
```

> **Xem bang quy doi thoi gian o muc 2.**

### 5.5 Doi mua vu (Seasonal Data)

Chi can sua file backend `src/modules/game/data/plants.ts`, phan `SEASONAL_DATA`:

```typescript
// Vi du: cho tomato trong duoc quanh nam
tomato: { availableMonths: [1,2,3,4,5,6,7,8,9,10,11,12], region: 'all' },
```

Region options: `'north'`, `'south'`, `'all'`

### 5.6 Doi nhieu cay cung luc

```sql
-- Tang gia tat ca cay 20%:
UPDATE plant_types SET shop_price = ROUND(shop_price * 1.2), reward_ogn = ROUND(shop_price * 1.2 * 2);

-- Reset tat ca ve default:
UPDATE plant_types SET
  shop_price = CASE id
    WHEN 'wheat' THEN 50
    WHEN 'tomato' THEN 200
    WHEN 'carrot' THEN 280
    WHEN 'chili' THEN 400
  END,
  reward_ogn = CASE id
    WHEN 'wheat' THEN 100
    WHEN 'tomato' THEN 400
    WHEN 'carrot' THEN 560
    WHEN 'chili' THEN 800
  END;
```

---

## 6. SQL Mau (Copy-Paste)

### Xem du lieu

```sql
-- Xem tat ca cay:
SELECT id, name, emoji, shop_price, reward_ogn, reward_xp, growth_duration_ms
FROM plant_types ORDER BY shop_price;

-- Xem cay va profit:
SELECT id, name, shop_price AS cost, reward_ogn AS reward,
       (reward_ogn - shop_price) AS profit,
       ROUND((reward_ogn::numeric / shop_price - 1) * 100) || '%' AS profit_pct,
       (growth_duration_ms / 1000) || 's' AS growth_time
FROM plant_types ORDER BY shop_price;

-- Dem so plot dang trong tung loai cay:
SELECT plant_type_id, COUNT(*) FROM farm_plots
WHERE is_dead = false GROUP BY plant_type_id;

-- Xem plots cua 1 user:
SELECT fp.slot_index, fp.plant_type_id, pt.name, fp.happiness, fp.is_dead,
       fp.planted_at, fp.last_watered_at
FROM farm_plots fp
JOIN plant_types pt ON pt.id = fp.plant_type_id
WHERE fp.user_id = 'USER_UUID_HERE'
ORDER BY fp.slot_index;
```

### Them cay moi

```sql
INSERT INTO plant_types (id, name, emoji, growth_duration_ms, reward_ogn, reward_xp, shop_price)
VALUES
  ('NEW_ID', 'TEN_CAY', 'EMOJI', GROWTH_MS, REWARD_OGN, REWARD_XP, SHOP_PRICE);

-- Vi du cu the:
INSERT INTO plant_types (id, name, emoji, growth_duration_ms, reward_ogn, reward_xp, shop_price)
VALUES ('strawberry', 'Dau Tay', '🍓', 180000, 600, 20, 300);
```

### Xoa cay

```sql
-- CANH BAO: Phai xoa farm_plots truoc (FK constraint)
DELETE FROM farm_plots WHERE plant_type_id = 'CAY_CAN_XOA';
DELETE FROM plant_types WHERE id = 'CAY_CAN_XOA';
```

### Cap nhat gia

```sql
-- Doi 1 cay:
UPDATE plant_types
SET shop_price = 300, reward_ogn = 600
WHERE id = 'tomato';

-- Dong bo tat ca reward = price × 2:
UPDATE plant_types SET reward_ogn = shop_price * 2;
```

---

## 7. Checklist Them Cay Moi

### Database
- [ ] `INSERT INTO plant_types` voi day du 7 fields
- [ ] Verify: `SELECT * FROM plant_types WHERE id = 'new_id'`

### Backend (VPS: /home/cdhc/apps/cdhc-be/)
- [ ] `src/modules/game/data/plants.ts` → them vao `PLANTS` array
- [ ] `src/modules/game/data/plants.ts` → them vao `SEASONAL_DATA`
- [ ] `src/modules/game/routes/farm.ts` → them vao `VALID_PLANT_TYPES` (giu alphabet)
- [ ] `src/modules/game/validators/game.validators.ts` → them vao `z.enum`

### Frontend (Local: cdhc-game-vite/)
- [ ] `src/modules/farming/data/plants.ts` → them vao `PLANT_TYPES` array
- [ ] `src/shared/hooks/useFarmPlots.ts` → them vao `PLANT_TYPES` record
- [ ] `src/modules/farming/stores/farmStore.ts` → them vao `PLANT_TYPES` array
- [ ] `src/shared/types/game-api.types.ts` → them vao `PlantTypeId` union type

### Verify
- [ ] Backend: `tsc --noEmit` = 0 errors
- [ ] Backend: `pm2 restart cdhc-api` = no crash
- [ ] DB: `SELECT * FROM plant_types` hien du cay moi
- [ ] Test: Trong cay moi → tuoi → thu hoach → nhan OGN dung
- [ ] Git: commit + push

---

## 8. Cau Truc File

### Backend (VPS)

```
src/modules/game/
├── data/
│   ├── plants.ts          ← PLANTS array + SEASONAL_DATA
│   └── shop-items.ts      ← SHOP_ITEMS (seeds, tools, cards, nft)
├── routes/
│   └── farm.ts            ← VALID_PLANT_TYPES + API endpoints
├── schema/
│   └── plant-types.ts     ← Drizzle ORM schema (plant_types table)
├── services/
│   ├── farm.service.ts    ← plantSeed, waterPlot, harvestPlot, getPlots
│   ├── reward.service.ts  ← addOGN, addXP
│   └── shop.service.ts    ← getItems, buyItem
├── types/
│   └── game.types.ts      ← PlantConfig interface
└── validators/
    └── game.validators.ts ← Zod plantSchema (z.enum)
```

### Frontend (Local)

```
src/
├── modules/farming/
│   ├── data/plants.ts              ← PLANT_TYPES (UI display)
│   └── stores/farmStore.ts         ← PLANT_TYPES (demo/fallback)
└── shared/
    ├── hooks/
    │   ├── useFarmPlots.ts         ← PLANT_TYPES lookup table
    │   └── useHarvestPlot.ts       ← Harvest mutation + toast
    ├── types/
    │   └── game-api.types.ts       ← PlantTypeId type union
    └── api/
        └── game-api.ts             ← API calls (plantSeed, harvestPlot)
```

---

## 9. Luu Y Quan Trong

1. **DB la source of truth** — `farm.service.ts` doc `plantTypes` tu DB, KHONG tu `plants.ts` constants.
2. **Cong thuc x2** — Luon giu `reward_ogn = shop_price * 2` de dam bao loi 100%.
3. **VALID_PLANT_TYPES** — Phai them ID vao CA 2 noi: `farm.ts` va `game.validators.ts`.
4. **Thu tu alphabet** — `VALID_PLANT_TYPES` trong `farm.ts` giu theo alphabet (carrot, chili, ...).
5. **Restart PM2** — Sau moi thay doi backend code, phai `pm2 restart cdhc-api`.
6. **Khong can sua shop-items.ts** — Shop items la seeds/tools/cards rieng, khong lien quan plant types.
7. **Max 6 slots** — Moi user co toi da 6 plot (`MAX_SLOTS = 6` trong farm.service.ts).
8. **Water cooldown** — 3600s (1 gio) per plot.
9. **Happiness** — Max 100, tuoi +10, cay chet khi happiness = 0.

---

## 10. Ket Noi Database

```bash
# Tu VPS (qua MCP bash tool):
docker exec -it cdhcbe_postgres psql -U cdhc -d cdhc

# Connection string:
# postgresql://cdhc:CdhcDb2026ProductionSecure99@localhost:5432/cdhc
```
