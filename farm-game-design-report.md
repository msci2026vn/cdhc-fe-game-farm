# 🌾 FARMVERSE — Farm Feature Analysis Report

**Ngày scan:** 2026-02-12
**Source:** VPS cdhc-be qua MCP tool
**Scanner:** Claude (Sonnet 4.5)

---

## 📋 EXECUTIVE SUMMARY

Hệ thống FARM của FARMVERSE là một farming game mechanic đơn giản với 5 loại cây, 6 plot slots, và cơ chế happiness-based wither. Hệ thống được thiết kế để player:
- Mua seed từ shop bằng OGN
- Trồng vào slot chờ cây trưởng thành
- Tưới nước để duy trì happiness (tránh cây chết)
- Thu hoạch nhận OGN + XP
- Level up dựa trên XP accumulated

**⚠️ PHÁT HIỆN QUAN TRỌNG:** Mọi cây trồng đều có **lỗ vốn** (cost > reward) - điều này có thể là intentional design để player phải farm nhiều hoặc có cơ chế monetization khác.

---

## 1. 🌱 DANH SÁCH CÂY TRỒNG

| # | Tên cây | Seed ID | Emoji | Giá mua (OGN) | Thu hoạch (OGN) | Lợi nhuận | Thời gian trồng | EXP nhận | OGN/phút |
|---|---------|---------|-------|---------------|----------------|-----------|-----------------|----------|----------|
| 1 | Cà Chua | tomato | 🍅 | 200 | 100 | **-100** | 2 phút | 25 | -50 |
| 2 | Rau Muống | lettuce | 🥬 | 150 | 60 | **-90** | 1.5 phút | 25 | -60 |
| 3 | Dưa Leo | cucumber | 🥒 | 350 | 150 | **-200** | 3 phút | 25 | -66.7 |
| 4 | Cà Rốt | carrot | 🥕 | 280 | 120 | **-160** | 2.5 phút | 25 | -64 |
| 5 | Ớt | chili | 🌶️ | 400 | 180 | **-220** | 3.33 phút | 25 | -66 |

**📍 Source:** `src/modules/game/data/plants.ts:1-32`

### 📊 Phân Tích Kinh Tế

```
Chi phí trung bình: 276 OGN/seed
Thu hoạch trung bình: 122 OGN/harvest
Lỗ trung bình: -154 OGN/plant
XP trung bình: 25 XP/harvest
```

**💡 Gameplay Implications:**
- Player bắt đầu với 1250 OGN có thể trồng ~4-5 seed
- Mỗi cycle farm lỗ ~154 OGN nhưng nhận 25 XP
- Để profit, player phải phụ thuộc vào:
  1. Boss battles (OGN reward cao hơn?)
  2. Quiz rewards
  3. Social interactions
  4. Hoặc có cơ chế chặn vòng nào đó chưa thấy

---

## 2. 🏞️ HỆ THỐNG SLOT

### 2.1 Slot Configuration

| Thông số | Giá trị |
|----------|---------|
| **Tổng số slot** | 6 slots |
| **Slot index** | 0-5 |
| **Mở thêm slot** | KHÔNG CÓ trong code hiện tại |
| **Giới hạn max** | 6 (hardcoded) |

**📍 Source:** 
- `src/modules/game/services/farm.service.ts:7` → `const MAX_SLOTS = 6`
- `src/modules/game/schema/farm-plots.ts:11` → `slotIndex: integer`

### 2.2 Slot Validation

```typescript
// Validation trong route
slotIndex: z.number().int().min(0).max(5)
```

**📍 Source:** `src/modules/game/routes/farm.ts:10`

### 2.3 Opening Slots?

❌ **KHÔNG TÌM THẤY** cơ chế mở rộng slot trong code:
- Không có shop item "unlock slot"
- Không có NFT land bonus logic
- Không có level-based unlock
- `MAX_SLOTS = 6` là hardcoded constant

**📍 Note:** Shop items có `nft-land-small` và `nft-land-medium` nhưng KHÔNG có code sử dụng chúng.

---

## 3. 🔄 FLOW TRỒNG CÂY

### 3.1 Complete Game Loop

```
1. [SHOP] Player chọn seed → Mua bằng OGN
   ↓
2. [INVENTORY] Seed được cộng vào inventory
   ↓
3. [FARM] Player chọn slot trống + seed → Gọi POST /farm/plant
   ↓
4. [VALIDATION] 
   - Check slot có trống?
   - Check OGN có đủ?
   - Check plant type có valid?
   ↓
5. [PLANT]
   - Trừ OGN (shopPrice)
   - Tạo farmPlots record
   - Set happiness = 100
   - Set plantedAt = now
   ↓
6. [GROWTH] Cây phát triển qua thời gian
   - Growth % = (elapsed / growthDurationMs) * 100
   - Happiness decay = 0.2 points/giây
   ↓
7. [WATER] Player tưới nước (optional)
   - +10 happiness (max 100)
   - +2 XP
   - Cooldown: 3600s (1 tiếng)
   ↓
8. [WITHER CHECK] Cron every 5 minutes
   - Nếu happiness ≤ 0 → isDead = true
   - Dead plant KHÔNG thể harvest
   ↓
9. [HARVEST] Khi growth ≥ 100%
   - Nhận rewardOGN
   - Nhận rewardXP
   - Xóa plot khỏi DB
   ↓
10. [LEVEL UP] Nếu XP đủ → Level up
```

**📍 Sources:**
- Flow: `src/modules/game/services/farm.service.ts`
- Wither: `src/modules/game/services/wither.service.ts`
- Cron: `src/modules/game/cron/wither.cron.ts`

### 3.2 Growth Stages

| Growth % | Stage | Emoji |
|----------|-------|-------|
| 0-14% | seed | 🌱 |
| 15-39% | sprout | 🌱 |
| 40-74% | seedling | 🌱 |
| 75-99% | mature | 🌱 |
| 100% | harvestable | 🎯 |

**📍 Source:** `src/modules/game/utils/growth.ts:31-47`

---

## 4. ⭐ HỆ THỐNG EXP & LEVEL

### 4.1 XP Table

| Level | XP cần | Tổng XP | Cumulative |
|-------|---------|----------|-------------|
| 1 | 0 | 0 | 0 |
| 2 | 50 | 50 | 50 |
| 3 | 70 | 120 | 70 |
| 4 | 100 | 220 | 100 |
| 5 | 140 | 360 | 140 |
| 6 | 190 | 550 | 190 |
| 7 | 250 | 800 | 250 |
| 8 | 300 | 1100 | 300 |
| 9 | 400 | 1500 | 400 |
| 10 | 500 | 2000 | 500 |
| 11 | 600 | 2600 | 600 |
| 12 | 800 | 3400 | 800 |
| 13 | 1000 | 4400 | 1000 |
| 14 | 1200 | 5600 | 1200 |
| 15 | 1400 | 7000 | 1400 |
| 16 | 2000 | 9000 | 2000 |
| 17 | 2500 | 11500 | 2500 |
| 18 | 3500 | 14500 | 3500 |
| 19 | 4000 | 18000 | 4000 |
| 20 | 4000 | 22000 | 4000 |

**📍 Source:** `src/modules/game/types/game.types.ts:174-177`

### 4.2 Level Calculation

```typescript
// Formula từ reward.service.ts
XP_PER_LEVEL = 100;
level = floor(xp / 100) + 1;
MAX_LEVEL = 50;

// Formula từ growth.ts (SỰ KHÁC BIỆT!)
level = find highest level where xp >= XP_TABLE[level];
```

**⚠️ CONFLICT DETECTED:**
- `reward.service.ts:9` dùng **simple formula**: `level = floor(xp/100) + 1`
- `growth.ts:103` dùng **XP_TABLE lookup**
- **Cái nào đang được sử dụng?**

**📍 Sources:**
- `src/modules/game/services/reward.service.ts:9-10`
- `src/modules/game/utils/growth.ts:99-121`

### 4.3 XP Sources

| Action | XP Gain |
|--------|---------|
| Plant seed | 0 (trừ OGN thôi) |
| Water plant | +2 XP |
| Harvest plant | +25 XP (tùy plant) |
| Boss battle | (không rõ) |
| Quiz | (không rõ) |

---

## 5. 💖 HỆ THỐNG HAPPINESS & WITHER

### 5.1 Happiness Mechanics

| Parameter | Value |
|-----------|-------|
| **Happiness max** | 100 |
| **Happiness khởi đầu** | 100 (khi trồng) |
| **Decay rate** | 0.2 points/giây |
| **Water boost** | +10 happiness |
| **Water cooldown** | 3600s (1 tiếng) |
| **Wither threshold** | happiness ≤ 0 |

### 5.2 Time Calculation

```
Decay: 0.2/s = 12/min = 720/hour
Time to wither: 100 / 0.2 = 500 seconds = 8.33 minutes
```

**💡 Gameplay Implication:**
- Player **CÓ THỂ** tưới 2-3 lần trong mỗi growth cycle (vì max growth time = 3.33 phút)
- Water cooldown **LÂU HƠN** growth time → chỉ tưới được 1 lần
- Happiness sẽ decay về 0 nếu không harvest kịp
- **Cây sẽ chết sau ~8.33 phút nếu không tưới**

### 5.3 Wither Cron

```typescript
// Runs every 5 minutes
WITHER_INTERVAL_MINUTES = 5;

// Logic
if (happiness <= 0 && !isDead) {
  isDead = true;
  diedAt = now;
}
```

**📍 Sources:**
- `src/modules/game/services/wither.service.ts:1-64`
- `src/modules/game/cron/wither.cron.ts`
- `src/modules/game/utils/growth.ts:13` → `HAPPINESS_DECAY_RATE = 0.2`

---

## 6. 💰 HỆ THỐNG KINH TẾ (OGN)

### 6.1 Starting Balance

| Resource | Initial Value |
|----------|--------------|
| **OGN** | 1250 |
| **XP** | 0 |
| **Level** | 1 |

**📍 Source:** `src/modules/game/schema/player-stats.ts:12`

### 6.2 OGN Sources & Sinks

| Type | Action | OGN | Source |
|------|--------|------|--------|
| **Sink** | Plant tomato | -200 | plants.ts:8 |
| **Sink** | Plant lettuce | -150 | plants.ts:15 |
| **Sink** | Plant cucumber | -350 | plants.ts:22 |
| **Sink** | Plant carrot | -280 | plants.ts:29 |
| **Sink** | Plant chili | -400 | plants.ts:38 |
| **Source** | Harvest tomato | +100 | plants.ts:10 |
| **Source** | Harvest lettuce | +60 | plants.ts:17 |
| **Source** | Harvest cucumber | +150 | plants.ts:24 |
| **Source** | Harvest carrot | +120 | plants.ts:31 |
| **Source** | Harvest chili | +180 | plants.ts:38 |

### 6.3 Shop Items (Seed-only)

| Item | Price | Category | Lợi nhuận? |
|------|-------|----------|-----------|
| seed-organic | 250 | seed | - |
| seed-premium | 350 | seed | - |
| seed-hybrid | 500 | seed | - |
| seed-golden | 800 | seed | - |
| seed-super | 1000 | seed | - |
| seed-ancient | 1500 | seed | - |

**⚠️ NOTE:** Shop items này **KHÔNG** liên quan đến 5 plant types trong plants.ts. Chúng có thể là:
1. Future content (chưa implement logic)
2. Decorative items
3. Seeds với special effects (nhưng không có code sử dụng)

**📍 Source:** `src/modules/game/data/shop-items.ts:1-41`

---

## 7. 🌦️ CÁC YẾU TỐ ẢNH HƯỞNG

### 7.1 Weather System

**❌ KHÔNG CÓ** weather multiplier trong backend farm logic:
- `calculateGrowth()` function **KHÔNG** nhận weather parameter
- Growth calculation: `(elapsed / growthDurationMs) * 100`
- Comment trong code: "BE calculates WITHOUT weather multiplier. FE displays WITH weather multiplier (visual only)."

**📍 Source:** `src/modules/game/utils/growth.ts:25-27`

### 7.2 Boost Items

**❌ KHÔNG CÓ** code sử dụng boost items:
- Không có fertilizer logic
- Không có speed-up mechanic
- Không có happiness boost item
- Shop có "tool-fertilizer", "tool-speed" nhưng **KHÔNG có code sử dụng**

### 7.3 Seasonal/Event Crops

**❌ KHÔNG CÓ** seasonal system trong farm code:
- Không có season check
- Không có event-specific plants
- Không có limited-time crops

### 7.4 NFT Subscription Bonus

**❌ KHÔNG CÓ** NFT integration trong farm:
- Shop có `nft-pet-chicken`, `nft-land-small`, `nft-land-medium`, `nft-badge-og`
- **NHƯNG** không có code kiểm tra NFT ownership
- **KHÔNG CÓ** bonus growth/reward cho NFT holders

**💡 Conclusion:** NFT items trong shop hiện tại chỉ là **decorative/pending implementation**.

---

## 8. 🔌 API ENDPOINTS

### 8.1 Farm Routes

| Method | Endpoint | Request Body | Response | Description | File |
|--------|----------|--------------|----------|-------------|------|
| GET | `/farm/plots` | - | `{ plots, totalSlots }` | Lấy danh sách plots | `src/modules/game/routes/farm.ts:21` |
| POST | `/farm/plant` | `{ slotIndex, plantTypeId }` | Plot info | Trồng seed | `src/modules/game/routes/farm.ts:38` |
| POST | `/farm/water` | `{ plotId }` | `{ happiness, xpGained, cooldownSeconds }` | Tưới nước | `src/modules/game/routes/farm.ts:82` |
| POST | `/farm/harvest` | `{ plotId }` | `{ ognReward, xpGained, newOgn, newXp, newLevel, leveledUp }` | Thu hoạch | `src/modules/game/routes/farm.ts:109` |
| POST | `/farm/clear` | `{ plotId }` | `{ cleared, plotId, slotIndex }` | Xóa cây chết | `src/modules/game/routes/farm.ts:167` |

### 8.2 Shop Routes

| Method | Endpoint | Request Body | Response | Description | File |
|--------|----------|--------------|----------|-------------|------|
| GET | `/shop/items` | - | `{ items: [{ id, name, emoji, desc, price, category, rarity, owned }] }` | Lấy shop items | `src/modules/game/routes/shop.ts:26` |
| POST | `/shop/buy` | `{ itemId, quantity }` | `{ item, quantityBought, totalOwned, ognSpent, ognRemaining }` | Mua item | `src/modules/game/routes/shop.ts:63` |

### 8.3 Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (validation error, insufficient OGN, not ready) |
| 404 | Not found (plot/item not found) |
| 409 | Conflict (slot occupied) |
| 429 | Too many requests (water cooldown) |
| 500 | Internal error |

---

## 9. 📁 CODE FILES LIÊN QUAN

### 9.1 Core Farm Logic

| File | Lines | Chức năng |
|------|-------|-----------|
| `src/modules/game/data/plants.ts` | 32 | Plant type definitions |
| `src/modules/game/services/farm.service.ts` | 244 | Farm business logic (plant, water, harvest) |
| `src/modules/game/services/reward.service.ts` | 96 | OGN/XP management |
| `src/modules/game/services/wither.service.ts` | 64 | Dead plant detection + cleanup |
| `src/modules/game/services/shop.service.ts` | 177 | Shop purchasing logic |

### 9.2 Routes

| File | Lines | Chức năng |
|------|-------|-----------|
| `src/modules/game/routes/farm.ts` | 193 | Farm HTTP endpoints |
| `src/modules/game/routes/shop.ts` | 143 | Shop HTTP endpoints |

### 9.3 Schema

| File | Lines | Chức năng |
|------|-------|-----------|
| `src/modules/game/schema/farm-plots.ts` | 37 | farmPlots table definition |
| `src/modules/game/schema/plant-types.ts` | 22 | plantTypes table definition |
| `src/modules/game/schema/player-stats.ts` | 38 | playerStats table definition |
| `src/modules/game/schema/inventory.ts` | 22 | inventory table definition |
| `src/modules/game/schema/game-actions.ts` | 31 | gameActions log table |

### 9.4 Utils

| File | Lines | Chức năng |
|------|-------|-----------|
| `src/modules/game/utils/growth.ts` | 116 | Growth & happiness calculations |
| `src/modules/game/types/game.types.ts` | 177 | Type definitions (XP_TABLE, constants) |

### 9.5 Cron

| File | Lines | Chức năng |
|------|-------|-----------|
| `src/modules/game/cron/wither.cron.ts` | 40 | Wither check cron job |

---

## 10. ⚠️ VẤN ĐỀ & GỢI Ý

### 10.1 Issues Found

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 1 | **Cây trồng đều lỗ vốn** (cost > reward) | 🔴 HIGH | `src/modules/game/data/plants.ts` |
| 2 | **Conflict XP calculation** (formula vs XP_TABLE) | 🟡 MEDIUM | `reward.service.ts` vs `growth.ts` |
| 3 | **NFT/Shop items không có code sử dụng** | 🟡 MEDIUM | `shop-items.ts` vs không có logic |
| 4 | **Không có mở rộng slot** | 🟡 MEDIUM | MAX_SLOTS = 6 hardcoded |
| 5 | **Water cooldown > growth time** | 🟢 LOW | 3600s vs max 200s growth |
| 6 | **Decay rate = cây chết sau 8.3 phút** | 🔴 HIGH | 0.2/s * 500s = 0 happiness |

### 10.2 Questions for Product Owner

1. **Tại sao mọi cây đều lỗ?** Có cơ chế kiếm OGN nào khác không (boss, quiz, social)?
2. **XP calculation method nào đúng?** Simple formula hay XP_TABLE?
3. **NFT items có tác dụng gì không?** Hay chỉ là placeholder?
4. **Có định mở thêm slot không?** Hay player stuck với 6 plots forever?
5. **Water cooldown có ngắn lại không?** 1 tiếng cho 1 lần water khá restrict.
6. **Decay rate có điều chỉnh không?** 8.3 phút để chết khá nhanh.

### 10.3 Recommendations

1. **Balance crop economics:** Tăng rewardOGN hoặc giảm shopPrice để ít nhất hòa vốn
2. **Choose ONE XP method:** Decide giữa simple formula vs XP_TABLE
3. **Implement NFT bonuses:** Add logic check NFT ownership → bonus slots/rewards
4. **Tune water cooldown:** Reduce from 3600s → 300s (5 phút) để player tưới được nhiều hơn
5. **Add slot unlock:** Add shop item hoặc level-based unlock
6. **Decay rate adjustment:** Tăng thời gian wither từ 8.3 phút → 30+ phút

---

## 11. 🎮 GAME BALANCE MATH

### 11.1 Current Balance (Per Plant)

```
Average cost: 276 OGN
Average reward: 122 OGN
Net loss: -154 OGN
XP gained: +25 XP

Starting OGN: 1250
Max plants: 6
Max cycles: 1250/276 = 4.5 cycles
Total XP from 6 plants: 6 * 25 = 150 XP → Level 4 (need 220 XP)

After 4 cycles:
OGN: 1250 - (154 * 6) = 324 OGN remaining
Level: 4 (220 XP)
```

### 11.2 Time to Level Up

```
XP needed per level: 50 → 70 → 100 → 140 → 190 ...
XP per harvest: 25 XP

Level 1 → 2: 2 plants
Level 2 → 3: 2.8 plants
Level 3 → 4: 4 plants
Level 4 → 5: 5.6 plants
```

### 11.3 Happiness Decay Math

```
Decay: 0.2 happiness/s
Max: 100
Time to 0: 100 / 0.2 = 500 seconds = 8.33 minutes

Fastest crop (lettuce): 1.5 minutes
→ Can harvest 5-6 times before wither (nếu không water)

Slowest crop (chili): 3.33 minutes
→ Can harvest 2-3 times before wither (nếu không water)

Với water (+10 happiness, cooldown 3600s):
→ Chỉ tưới được 1 lần per cycle
→ +10 happiness = +50 seconds sống thêm
→ Không có ý nghĩa nhiều
```

---

## 12. 📊 SUMMARY STATISTICS

| Metric | Value |
|--------|-------|
| **Tổng số crop types** | 5 |
| **Tổng slots** | 6 |
| **Growth time range** | 1.5 - 3.33 phút |
| **OGN per plant range** | 150 - 400 OGN |
| **Reward OGN range** | 60 - 180 OGN |
| **XP per plant** | 25 (tất cả) |
| **Starting OGN** | 1250 |
| **Starting Level** | 1 |
| **Max Level** | 50 |
| **Water cooldown** | 3600s (1 tiếng) |
| **Water happiness boost** | +10 |
| **Water XP reward** | +2 XP |
| **Happiness decay** | 0.2/s |
| **Wither time** | ~8.33 phút |
| **Wither check interval** | 5 phút |

---

## 🏁 REPORT COMPLETED

**Generated by:** Claude Sonnet 4.5
**Date:** 2026-02-12
**Method:** MCP tool `cdhc-test` bash scan
**Files scanned:** 20+ files
**Lines of code analyzed:** ~1500+ lines

**Next Steps:**
1. Review với Product Owner về balance issues
2. Quyết định XP calculation method
3. Implement hoặc remove NFT/Shop items pending
4. Tune game parameters (decay rate, cooldown, rewards)

