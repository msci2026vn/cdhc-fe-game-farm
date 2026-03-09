# FARMVERSE — Phân Tích Hệ Thống XP / Level

**Ngày scan:** 2026-02-15
**Phương pháp:** Scan code FE + BE production server + Database trực tiếp
**Trạng thái:** KHÔNG SỬA CODE — CHỈ PHÂN TÍCH

---

## 1. Bảng Cấp Bậc (Level Progression)

### 1.1 Công thức (Backend — Production)

**File:** `/home/cdhc/apps/cdhc-be/src/modules/game/services/reward.service.ts:17`

```typescript
const XP_PER_LEVEL = 100;  // ⚠️ VẪN = 100, CHƯA TĂNG LÊN 300
const MAX_LEVEL = 50;
const newLevel = Math.min(Math.floor(newXP / XP_PER_LEVEL) + 1, MAX_LEVEL);
```

**Công thức:** `level = min(floor(xp / 100) + 1, 50)`

### 1.2 Bảng Level đầy đủ

| Level | XP bắt đầu | XP kết thúc | XP cần cho level | Danh hiệu | Unlocks |
|-------|------------|------------|-------------------|------------|---------|
| 1 | 0 | 99 | 100 | Nông dân Tập sự | — |
| 2 | 100 | 199 | 100 | Nông dân Tập sự | — |
| 3 | 200 | 299 | 100 | Nông dân Đồng | Bọ Rùa (Boss) |
| 4 | 300 | 399 | 100 | Nông dân Đồng | — |
| 5 | 400 | 499 | 100 | Nông dân Bạc | Châu Chấu (Boss) |
| 6 | 500 | 599 | 100 | Nông dân Bạc | — |
| 7 | 600 | 699 | 100 | Nông dân Bạc | — |
| 8 | 700 | 799 | 100 | Nông dân Bạc | Bọ Xít (Boss) |
| 9 | 800 | 899 | 100 | Nông dân Bạc | — |
| 10 | 900 | 999 | 100 | Nông dân Vàng | Ốc Sên (Boss) |
| 11-14 | 1000-1399 | — | 100 each | Nông dân Vàng | Chuột Đồng (Lv.12) |
| 15-49 | 1400-4899 | — | 100 each | Nông dân Kim Cương | Rồng Lửa (Lv.15) |
| 50 | 4900 | ∞ | MAX | Nông dân Kim Cương | — |

### 1.3 Danh hiệu (Frontend — playerStore.ts:34-40)

| Level | Danh hiệu | Code |
|-------|-----------|------|
| 1-2 | Nông dân Tập sự | `level < 3` |
| 3-4 | Nông dân Đồng | `level >= 3` |
| 5-9 | Nông dân Bạc | `level >= 5` |
| 10-14 | Nông dân Vàng | `level >= 10` |
| 15+ | Nông dân Kim Cương | `level >= 15` |

---

## 2. Nguồn XP — TẤT CẢ cách kiếm XP

### 2.1 Farm Actions (Backend xác nhận)

| Hành động | XP | OGN | Cooldown | File backend |
|-----------|-----|-----|----------|-------------|
| **Tưới nước** | 2 | 0 | 1h/plot (Redis) | `farm.service.ts:10` WATER_XP_REWARD=2 |
| **Thu hoạch Lúa Mì** | 5 | 100 | 30s grow | `plant_types.reward_xp=5` |
| **Thu hoạch Cà Chua** | 25 | 400 | 2m grow | `plant_types.reward_xp=25` |
| **Thu hoạch Cà Rốt** | 25 | 560 | 2m30 grow | `plant_types.reward_xp=25` |
| **Thu hoạch Ớt** | 25 | 800 | 3m20 grow | `plant_types.reward_xp=25` |
| **Trồng cây** | 0 | -price | — | Không cho XP |

### 2.2 Boss Actions (Backend xác nhận)

| Boss | Unlock Lv | XP thắng | OGN thắng | Difficulty |
|------|-----------|----------|-----------|------------|
| Rệp Xanh | 1 | 15 | 5 | Easy |
| Sâu Tơ | 1 | 25 | 8 | Easy |
| Bọ Rùa | 3 | 40 | 12 | Medium |
| Châu Chấu | 5 | 60 | 20 | Medium |
| Bọ Xít | 8 | 80 | 30 | Hard |
| Ốc Sên | 10 | 120 | 40 | Hard |
| Chuột Đồng | 12 | 150 | 50 | Hard |
| Rồng Lửa | 15 | 250 | 80 | Legendary |

**Source:** `bosses.ts` (FE) + `boss.service.ts` reads from `BOSSES` data (hardcoded, not DB).

### 2.3 Quiz Actions (Backend xác nhận)

| Kết quả | XP | OGN | File |
|---------|-----|-----|------|
| Trả lời đúng | 5 | 2 | `quiz.service.ts:22-23` |
| Trả lời sai | 1 | 0 | `quiz.service.ts:24` (participation) |

### 2.4 Social Actions (Backend xác nhận)

| Hành động | XP | OGN | Giới hạn | File |
|-----------|-----|-----|----------|------|
| Tương tác bạn (water/like/comment/gift) | 3 | 5 | 10 lần/ngày | `social.service.ts:34-35` |
| **Max XP/ngày từ social** | **30** | **50** | — | — |

### 2.5 Sync Actions (Backend xác nhận)

| Action type | XP | OGN | Max/60s | File |
|-------------|-----|-----|---------|------|
| `bug_catch` | **8** | 2 | **30** | `sync.config.ts` |
| `xp_pickup` | 5 | 0 | 10 | `sync.config.ts` |
| `daily_check` | 5 | 5 | 1 | `sync.config.ts` |
| `water` (via sync) | 2 | 1 | 20 | `sync.config.ts` |

### 2.6 Tổng hợp XP/giờ theo nguồn

| Nguồn | XP/giờ (max) | Ghi chú |
|-------|-------------|---------|
| **Bug catch** | **14,400** | 30×8 XP/min = EXPLOIT |
| xp_pickup | 3,000 | 10×5 XP/min |
| Farming (Ớt) | ~450 | 6 plots × 25 XP/3.3min |
| Boss grinding | ~200 | 2-3 min/fight |
| Quiz | ~60 | 5 XP/5 min |
| Social | 30/ngày | 10 friends max |
| Water | ~12 | 6 plots × 1h cooldown |

---

## 3. Công Thức Level Up

### Backend (Production — reward.service.ts)
```
XP_PER_LEVEL = 100
MAX_LEVEL = 50
level = min(floor(xp / 100) + 1, 50)
```

### Frontend (playerStore.ts)
```
LEVEL_CONFIG.XP_PER_LEVEL = 100     // ✅ MATCHES BACKEND
LEVEL_CONFIG.getLevel(xp) = min(floor(xp / 100) + 1, 50)  // ✅ MATCHES
LEVEL_CONFIG.getXpInLevel(xp) = xp % 100                    // ✅ CORRECT
LEVEL_CONFIG.getXpForLevel() = 100                           // ✅ CORRECT (linear)
```

### Level-Up Trigger Flow
1. **Backend:** `rewardService.addXP()` → row lock → update `player_stats.xp` + `player_stats.level` → if leveledUp: insert `game_actions(type='level_up')`
2. **API Response:** Returns `{ xp, level, leveledUp }` to FE
3. **Frontend Hook:** `useHarvestPlot/useWaterPlot` → optimistic update `PLAYER_PROFILE_KEY` cache → invalidate query
4. **Level Detector:** `useLevelUpDetector.ts` watches `profile.level` via `usePlayerProfile` → compares with `prevLevelRef` → dispatches `farmverse:levelup` event
5. **Animation:** `LevelUpOverlay.tsx` listens for event → shows 3s fullscreen animation

---

## 4. Data Hiện Tại (Database — 2026-02-15)

### 4.1 Tất cả Users

| User | Level | XP | OGN | Harvests | Level đúng? | Ghi chú |
|------|-------|----|-----|----------|-------------|---------|
| **Sin. Club** | 20 | 1988 | 1,530 | 18 | ✅ floor(1988/100)+1=20 | Active player |
| **Msci Backend** | 5 | 413 | 98 | 7 | ✅ floor(413/100)+1=5 | Active |
| Nguyễn Đức Thuận | 1 | 40 | 1,263 | 0 | ✅ | Ít chơi |
| Gin Orange | 1 | 32 | 2,230 | 2 | ✅ | Ít chơi |
| tuyen huan | 1 | 27 | 1,550 | 1 | ✅ | Ít chơi |
| Super Admin | 1 | 0 | 1,250 | 0 | ✅ | Chưa chơi |
| 7 users khác | 1 | 0 | 1,250 | 0 | ✅ | Chưa chơi |

**Tổng:** 13 users, 2 active, 11 inactive

### 4.2 Kiểm tra XP Accounting — Sin. Club

| Nguồn | Logged? | Số lần | XP ước tính |
|-------|---------|--------|------------|
| Water (game_actions) | ✅ | 16 lần | 32 XP |
| Harvest | ❌ KHÔNG LOG | 18 lần (player_stats) | ~90-450 XP est. |
| Boss | ❌ KHÔNG LOG | ? | ? |
| Quiz | ❌ KHÔNG LOG | ? | ? |
| Social | ❌ KHÔNG LOG | ? | ? |
| Sync (bug_catch, xp_pickup) | ❌ KHÔNG LOG | ? | ? |
| **TOTAL tracked** | — | — | **32 XP** |
| **TOTAL actual** | — | — | **1,988 XP** |
| **UNACCOUNTED** | — | — | **1,956 XP (98.4%)** |

### 4.3 Plant Types trong Database

| ID | Name | XP | OGN | Price | Grow Time |
|----|------|----|-----|-------|-----------|
| wheat | Lúa mì 🌾 | 5 | 100 | 50 | 30s |
| tomato | Cà Chua 🍅 | 25 | 400 | 200 | 2m |
| carrot | Cà Rốt 🥕 | 25 | 560 | 280 | 2m30 |
| chili | Ớt 🌶️ | 25 | 800 | 400 | 3m20 |

---

## 5. Lỗi Phát Hiện

### 🔴 CRITICAL

| # | Lỗi | Chi tiết | File |
|---|------|---------|------|
| 1 | **Harvest KHÔNG log vào game_actions** | Production `harvestPlot()` gọi `rewardService.addXP()` nhưng KHÔNG insert `gameActions` với type='harvest'. Hậu quả: không thể audit XP từ harvest. | `farm.service.ts:175-245` |
| 2 | **Bug catch exploit VẪN CÒN** | `sync.config.ts`: 30 bugs/60s × 8 XP = **240 XP/min = 14,400 XP/hour**. Chưa fix dù đã có plan. Level 50 trong ~20 phút. | `sync.config.ts:28` |
| 3 | **XP_PER_LEVEL chưa tăng** | Docs recommend 300, backend vẫn = **100**. Level 50 chỉ cần 4,900 XP (~20 min exploit). | `reward.service.ts:17` |
| 4 | **Không có Daily XP Cap** | Không giới hạn XP/ngày. Player farm vô hạn. | Thiếu hoàn toàn |
| 5 | **98.4% XP không trace được** | Sin.Club: 1,988 XP nhưng chỉ 32 XP tracked trong game_actions. Không thể audit nguồn XP. | game_actions table |

### 🟡 HIGH

| # | Lỗi | Chi tiết | File |
|---|------|---------|------|
| 6 | **FE XP_REWARDS sai vs Backend** | FE `playerStore.ts:43-49` nói water=5, plantSeed=10. Backend thực tế: water=**2**, plantSeed=**0**. Chỉ dùng display, nhưng misleading. | `playerStore.ts:43-49` |
| 7 | **Ghost plant types** | game_actions có `corn`, `sunflower`, `lettuce` nhưng plant_types DB chỉ có 4 loại. Đã trồng cây không còn tồn tại. | game_actions data |
| 8 | **FE plants.ts thiếu XP data** | `plants.ts` chỉ có id/name/emoji/price/growthTime. KHÔNG có rewardXP/rewardOGN. Lấy từ `useFarmPlots.ts` hardcode riêng → duplicate source of truth. | `plants.ts` vs `useFarmPlots.ts:13-17` |
| 9 | **useFarmPlots.ts hardcode không khớp DB** | FE: wheat rewardXP=5, tomato/carrot/chili=25 → Khớp DB ✅. Nhưng FE dùng hardcode thay vì lấy từ API → sẽ lỗi khi BE thay đổi. | `useFarmPlots.ts:14-17` |

### 🟢 LOW

| # | Lỗi | Chi tiết |
|---|------|---------|
| 10 | **Level title chỉ có 5 tier** | Level 15+ đều là "Kim Cương". Max level 50 nhưng chỉ 5 rank tiers. Thiếu engagement 15→50. |
| 11 | **Boss data hardcoded** | `BOSSES` array in FE + BE data file, not from DB. Add/change boss requires code deploy. |
| 12 | **XP bar hiện "XP 88/100" format** | Correct calculation, nhưng user không biết tổng XP cần cho level tiếp. |

---

## 6. Frontend vs Backend Consistency Check

| Thông tin | Backend (Source of Truth) | Frontend (Display) | Khớp? |
|-----------|--------------------------|-------------------|-------|
| XP_PER_LEVEL | 100 (`reward.service.ts:17`) | 100 (`playerStore.ts:11`) | ✅ |
| MAX_LEVEL | 50 (`reward.service.ts:16`) | 50 (`playerStore.ts:10`) | ✅ |
| Level formula | `floor(xp/100)+1` | `floor(xp/100)+1` | ✅ |
| XP in level | `xp % 100` (implicit) | `xp % 100` | ✅ |
| Water XP | **2** (`farm.service.ts:10`) | **5** (`playerStore.ts:45`) | ❌ **MISMATCH** |
| Plant XP | **0** (không cho XP khi trồng) | **10** (`playerStore.ts:46`) | ❌ **MISMATCH** |
| Harvest XP (wheat) | **5** (DB plant_types) | **5** (`useFarmPlots.ts:14`) | ✅ |
| Harvest XP (tomato) | **25** (DB) | **25** (`useFarmPlots.ts:15`) | ✅ |
| Bug catch XP | **8** (`sync.config.ts`) | **8** (`playerStore.ts:48`) | ✅ |
| Boss XP | varies (BOSSES data) | varies (bosses.ts) | ✅ |
| Quiz XP correct | **5** (`quiz.service.ts:23`) | **—** (not displayed as config) | N/A |
| Social XP | **3** (`social.service.ts:35`) | **—** (not displayed as config) | N/A |
| Level titles | **—** (not in BE) | 5 tiers (`playerStore.ts:34-40`) | N/A (FE only) |
| Level-up detection | Returns `leveledUp: boolean` | Watches `profile.level` changes | ✅ Works |
| Profile API | Returns `{ xp, level, ogn, ... }` | Uses TanStack Query cache | ✅ |

---

## 7. Kiến Trúc Hệ Thống XP/Level

### 7.1 File Map

```
BACKEND (Production Server: /home/cdhc/apps/cdhc-be/)
├── src/modules/game/services/
│   ├── reward.service.ts      ← XP_PER_LEVEL=100, addXP(), addOGN()
│   ├── farm.service.ts        ← water(+2 XP), harvest(+plant.rewardXP)
│   ├── boss.service.ts        ← boss complete(+bossConfig.rewardXP)
│   ├── quiz.service.ts        ← correct(+5 XP), wrong(+1 XP)
│   ├── social.service.ts      ← interact(+3 XP)
│   └── sync.service.ts        ← bug_catch(+8), xp_pickup(+5), daily(+5)
├── src/modules/game/config/
│   └── sync.ts                ← ACTION_REWARDS, MAX_PER_WINDOW
└── src/modules/game/data/
    └── bosses.ts              ← BOSSES array (hardcoded)

FRONTEND (src/)
├── shared/stores/playerStore.ts   ← LEVEL_CONFIG, getLevelTitle(), XP_REWARDS
├── shared/hooks/
│   ├── usePlayerProfile.ts        ← TanStack Query: profile data
│   ├── useLevelUpDetector.ts      ← Watch level changes → dispatch event
│   ├── useHarvestPlot.ts          ← Mutation → update profile cache
│   ├── useWaterPlot.ts            ← Mutation → update profile cache
│   ├── usePlantSeed.ts            ← Mutation → update OGN cache
│   ├── useBossComplete.ts         ← Mutation → invalidate profile
│   ├── useQuizAnswer.ts           ← Mutation → invalidate profile
│   ├── useSocial.ts               ← Mutation → invalidate profile
│   └── useGameSync.ts             ← Batch sync queue (60s interval)
├── shared/components/
│   └── LevelUpOverlay.tsx         ← Fullscreen animation on levelup
├── modules/farming/components/
│   └── FarmHeader.tsx             ← XP bar + level display
├── modules/profile/screens/
│   └── ProfileScreen.tsx          ← XP bar + level + title
└── modules/boss/components/
    └── BossList.tsx               ← XP bar + boss unlock display
```

### 7.2 Database Schema — player_stats

| Column | Type | Default | Nullable |
|--------|------|---------|----------|
| user_id | uuid | — | NO (PK) |
| xp | integer | 0 | NO |
| level | integer | 1 | NO |
| ogn | integer | 1250 | NO |
| total_harvests | integer | 0 | NO |
| total_boss_kills | integer | 0 | NO |
| total_damage | integer | 0 | NO |
| likes_count | integer | 0 | NO |
| comments_count | integer | 0 | NO |
| gifts_count | integer | 0 | NO |
| referral_code | varchar | — | YES |
| referred_by | uuid | — | YES |
| created_at | timestamptz | now() | NO |
| updated_at | timestamptz | now() | NO |
| last_played_at | timestamptz | — | YES |

**Không có bảng riêng cho levels/level_thresholds/xp_logs.** Level tính trực tiếp bằng formula.

### 7.3 game_action_type Enum

```
plant | water | harvest | boss_complete | quiz_complete |
shop_buy | social_interact | level_up | market_predict
```

**Thực tế chỉ có 3 types được log:** plant (35), water (21), level_up (17)
**5 types KHÔNG BAO GIỜ được log:** harvest, boss_complete, quiz_complete, shop_buy, social_interact

---

## 8. Đề Xuất Sửa — Theo Priority

### 🔴 P0 — CRITICAL (Sửa ngay)

| # | Việc cần làm | File | Effort |
|---|-------------|------|--------|
| 1 | **Fix harvest logging** — Thêm `gameActions.insert({type:'harvest'})` vào `harvestPlot()` | `farm.service.ts` | 5 min |
| 2 | **Nerf bug catch** — Giảm từ 8→2 XP, cap từ 30→5/60s | `sync.config.ts` | 2 min |
| 3 | **Tăng XP_PER_LEVEL** — 100→300 (hoặc 500) | `reward.service.ts` + `playerStore.ts` | 5 min + migration |
| 4 | **DB migration** — Recalculate all levels: `UPDATE player_stats SET level = LEAST(FLOOR(xp/300)+1, 50)` | SQL script | 10 min |

### 🟡 P1 — HIGH (Sửa trong tuần)

| # | Việc cần làm | File | Effort |
|---|-------------|------|--------|
| 5 | **Add Daily XP Cap** — 500 XP/day total, per-source caps | `sync.service.ts` + Redis | 4h |
| 6 | **Fix FE XP_REWARDS** — water: 5→2, plantSeed: 10→0 | `playerStore.ts:43-49` | 2 min |
| 7 | **Log ALL action types** — boss, quiz, social, shop | All services | 2h |
| 8 | **Clean ghost plant data** — Xóa game_actions với plantTypeId không tồn tại | SQL script | 10 min |

### 🟢 P2 — MEDIUM (Cải thiện)

| # | Việc cần làm | Effort |
|---|-------------|--------|
| 9 | Thêm level titles (15-50: Kim Cương I, II, III...) | 30 min |
| 10 | Đồng bộ plant XP data: FE lấy từ API, không hardcode | 2h |
| 11 | Thêm milestone rewards (level 5/10/20/30/50) | 1 day |
| 12 | XP audit endpoint: `/api/game/player/xp-breakdown` | 2h |

---

## 9. Tóm Tắt Executive

### Trạng thái hiện tại: 🔴 CẦN SỬA GẤP

1. **Bug catch exploit** cho phép lên level 50 trong 20 phút — CHƯA FIX
2. **98.4% XP không audit được** — harvest/boss/quiz/social KHÔNG log
3. **XP_PER_LEVEL = 100** quá thấp — đã có plan tăng lên 300 nhưng CHƯA THỰC HIỆN
4. **Không có daily cap** — grind vô hạn
5. FE và BE **KHỚP** về formula level — đây là điểm tốt

### Ưu tiên hành động:
1. **NGAY:** Fix harvest logging + nerf bug catch (30 min)
2. **HÔM NAY:** Tăng XP_PER_LEVEL + migration (1h)
3. **TUẦN NÀY:** Daily XP cap + audit logging (1 day)
4. **THÁNG NÀY:** Milestone system + title expansion (1 week)

---

**Document generated by:** Claude Code Analysis
**Scan date:** 2026-02-15
**Files scanned:** 25+ (FE) + 10 (BE production) + 3 DB tables
**KHÔNG SỬA CODE — CHỈ BÁO CÁO**
