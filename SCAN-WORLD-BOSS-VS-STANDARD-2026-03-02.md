# ✅ FINAL AUDIT: World Boss Backend — Post P1-P5

> Cập nhật: 2026-03-03 (audit sau P1-P5). Scan gốc ngày 2026-03-02 ở bên dưới.

---

## Checklist Quy Trình Chuẩn (Post P1-P5)

| # | Yêu cầu | Status | Ghi chú |
|---|---------|--------|---------|
| 1 | FE tính damage, BE clamp | ✅ | submitAttack nhận `damageDelta` từ FE |
| 2 | Clamp 15000 damage + 20 hits | ✅ | `MAX_DAMAGE_PER_BATCH=15000`, `MAX_HITS_PER_BATCH=20` |
| 3 | Rate limit 2.5s (không phải cooldown 20s) | ✅ | `RATE_LIMIT_MS=2500`, PX flag |
| 4 | Redis pipeline 1 round-trip | ✅ | `redis.pipeline()` 9 commands |
| 5 | Response minimal `{ok, hpPercent, rank}` | ✅ | submitAttack return |
| 6 | `final=true` → thêm `totalDamage` | ✅ | Branch trong submitAttack |
| 7 | GET /current/lite cho polling 3s | ✅ | Route + `getCurrentBossLite()` |
| 8 | Cron flush Redis→DB mỗi 5 phút | ✅ | `*/5 * * * *` + protect:true |
| 9 | endBoss flush trước reward | ✅ | `flushRedisToDb()` tại đầu endBoss |
| 10 | endBoss reward tính từ DB (không phải Redis) | ✅ | Query `worldBossParticipations` sau flush |

**GIỮ NGUYÊN (không bị sửa nhầm):**

| # | Yêu cầu | Status |
|---|---------|--------|
| 11 | AI generation GPT-4o-mini + fallback | ✅ |
| 12 | Sensor check + severity | ✅ |
| 13 | Cron spawn `*/30` + expire `*/1` | ✅ |
| 14 | Redis key patterns | ✅ |
| 15 | DB schema 3 tables | ✅ |
| 16 | Reward tier S/A/B/C/D + defeated ×1.5 + last hit +20% | ✅ |
| 17 | Distributed lock spawn + end | ✅ |
| 18 | Skill templates 12 mechanics | ✅ |
| 19 | Story 4 phần giáo dục | ✅ |

## API Test Results (2026-03-03)

| Endpoint | Status | Response |
|----------|--------|----------|
| GET /world-boss/current | ✅ 200 | `{"active":false}` (không có boss active) |
| GET /world-boss/current/lite | ✅ 200 | `{"active":false}` |
| GET /world-boss/history | ✅ 200 | Array bosses cũ, có data |

## Bugs Found (Post P1-P5)

### 🔴 Critical — Không có

### 🟡 Warning (nên fix — tạo prompt riêng)

**W1: Feed size inconsistency**
- `redis.ts`: `FEED_MAX_SIZE = 50` — pushFeed() trim to 50
- `service.ts` pipeline: `pipe.ltrim(feed, 0, 99)` — trim to 100 items
- submitAttack dùng pipeline (100 items), không dùng helper pushFeed(). Inconsistent.
- Fix: `pipe.ltrim(0, FEED_MAX_SIZE - 1)` và import constant.

**W2: Pipeline exec() failure — không fallback**
- Catch block chỉ có comment, không có fallback. Nếu Redis flaky → HP không giảm, rate limit không set → user spam được.
- Fix: Trong catch, fallback gọi `decrBossHP()` + `setRateLimit()` riêng lẻ.

**W3: acquireEndLock không có releaseEndLock**
- Lock tự expire 30s TTL. Nếu endBoss() >30s → lock expire → có thể acquire lại → endBoss chạy 2 lần.
- Được bảo vệ bởi DB status check nhưng race condition cực hiếm vẫn có thể xảy ra.
- Fix: Export `releaseEndLock` và gọi sau endBoss() hoàn thành.

**W4: Dual lock race (END_LOCK vs EXPIRY_LOCK)**
- submitAttack dùng `acquireEndLock(eventId)`, cron dùng `acquireExpiryLock()` (global).
- Nếu HP về 0 đúng lúc boss hết giờ → 2 lock khác key → cả 2 acquire thành công → 2 endBoss song song.
- Mitigated bởi DB status check, nhưng không hoàn toàn safe.
- Fix: Dùng chung 1 lock key cho cả killed và expired.

### 🟢 Info

- `console.log` intentional (cả 3 có `biome-ignore` comment).
- `addDamage`, `addParticipant`, `pushFeed` helpers trong redis.ts không dùng trong submitAttack (pipeline dùng hardcoded keys thay thế) → dead helpers.
- DB query username (1 round-trip) trong hot path attack. Có thể optimize bằng Redis cache.

## Kết luận

**Backend World Boss đã align với quy trình chuẩn: YES**
**Sẵn sàng cho FE tích hợp: YES**

10/10 yêu cầu P1-P5 implement đúng. 4 warnings minor, không blocking FE integration.
Priority fix: W1 (trivial) → W3 → W4 → W2.

---

# Scan Gốc (2026-03-02 — Trước P1-P5)

**Ngày:** 2026-03-02
**Module:** src/modules/world-boss/
**So sánh:** Code hiện tại vs Quy Trình Chuẩn (FE combat, BE clamp+Redis)

## Tổng quan

| Mức độ | Số lượng | Mô tả |
|--------|----------|-------|
| 🔴 PHẢI SỬA (Breaking) | 5 | Sai logic so với quy trình chuẩn |
| 🟠 CẦN THÊM (Missing) | 4 | Tính năng thiếu hoàn toàn |
| 🟡 CẦN CHỈNH (Adjust) | 1 | Có nhưng cần thay đổi |
| 🟢 GIỮ NGUYÊN (OK) | 10 | Đúng, không cần đổi |

## Files tồn tại

- [x] `world-boss.routes.ts` (16,455 bytes)
- [x] `world-boss.cron.ts` (3,537 bytes)
- [x] `services/world-boss.service.ts` (32,431 bytes)
- [x] `services/sensor-check.service.ts` (4,668 bytes)
- [x] `services/boss-generator.service.ts` (40,283 bytes)
- [x] `utils/world-boss.redis.ts` (17,871 bytes)
- [x] `schema/world-boss.schema.ts` (6,299 bytes)
- [x] `data/skill-templates.ts` (5,257 bytes)

---

## 🔴 PHẢI SỬA — Breaking Changes

### S1. POST /attack payload sai hoàn toàn
- **File:** `world-boss.routes.ts`, dòng 39-48
- **Hiện tại:** Nhận `{eventId, gemsMatched, maxCombo, specialGems, score}` — validate bằng typeof check thủ công
- **Chuẩn:** Nhận `{eventId, damageDelta, hits, maxCombo, final?}`
- **Hướng sửa:** Đổi Zod schema validation, đổi field names trong route handler + `AttackData` type

### S2. Server tính damage — cần bỏ
- **File:** `world-boss.service.ts`, dòng 109-128 (`calculateWorldBossDamage()`)
- **Hiện tại:** Pure function tính damage từ ATK × score × combo × specialGems × crit, rồi clamp [100, 50000]. `submitAttack()` query DB lấy player stats (dòng 153-164), gọi `getEffectiveStats()`, rồi gọi `calculateWorldBossDamage()`.
- **Chuẩn:** **BỎ HẲN.** FE tính 100%. BE chỉ nhận `damageDelta` và clamp
- **Impact:** Bỏ function + bỏ DB query `playerStats` trong submitAttack (tiết kiệm 1 DB round-trip/attack)
- **Hướng sửa:** Xóa `calculateWorldBossDamage()`, sửa `submitAttack()` chỉ clamp `damageDelta`

### S3. Cooldown 20s → Rate limit 2.5s
- **File:** `world-boss.service.ts` dòng 100 (`COOLDOWN_SECONDS = 20`)
- **File:** `world-boss.redis.ts` dòng cooldown key = `worldboss:cd:{eventId}:{userId}`, `setCooldown()` default 20s
- **Hiện tại:** 20 giây cooldown per user, key `worldboss:cd:*`
- **Chuẩn:** Rate limit 2.5s, key `worldboss:ratelimit:*`
- **Hướng sửa:** Đổi `COOLDOWN_SECONDS = 2.5` (hoặc dùng ms), đổi key name trong `KEYS.cooldown`

### S4. Clamp rules sai
- **File:** `world-boss.service.ts` dòng 101-102 (`MIN_DAMAGE = 100, MAX_DAMAGE = 50000`)
- **Hiện tại:** `Math.max(100, Math.min(50000, raw))` — clamp damage range [100, 50000]
- **Chuẩn:** `damageDelta > 15000 → clamp 15000`, `hits > 20 → clamp 20`
- **Hướng sửa:** Đổi clamp logic: `Math.min(damageDelta, 15000)` + `Math.min(hits, 20)`. Bỏ min 100 (FE tính, có thể thấp hợp lệ)

### S5. Response payload thừa
- **File:** `world-boss.service.ts` dòng 200-211 (return của `submitAttack()`)
- **Hiện tại:** Trả `{success, damage, isCrit, newBossHp, bossHpPercent, userTotalDamage, cooldownSeconds, bossDead, topPlayers}` — 9 fields + query thêm `getUserDamage` + `getDamageLeaderboard` = 2 Redis round-trips thừa
- **Chuẩn:** Trả `{ok, hpPercent, rank}` — 3 fields. Khi `final=true` thêm `{totalDamage, rank}`
- **Impact:** Giảm bandwidth + giảm Redis load đáng kể (bỏ getUserDamage + getDamageLeaderboard mỗi attack)
- **Hướng sửa:** Chỉ trả minimal response. Cần thêm `ZREVRANK` để lấy rank (1 Redis call thay vì 2)

---

## 🟠 CẦN THÊM — Missing Features

### M1. Cron flush Redis → DB mỗi 5 phút
- **Chuẩn yêu cầu:** setInterval/cron mỗi 5 phút: đọc Redis `ZRANGEBYSCORE` → batch upsert `world_boss_participations` + update `world_boss_events` totals, chunk 500 rows
- **Hiện tại:** **KHÔNG CÓ.** `world-boss.cron.ts` chỉ có 2 cron: spawn (*/30) và expiry (*/1). Data chỉ flush 1 lần duy nhất khi boss chết/hết giờ trong `endBoss()`
- **Rủi ro:** Nếu server crash khi boss active → mất TOÀN BỘ participation data (chỉ ở Redis)
- **Hướng sửa:** Thêm cron thứ 3 trong `world-boss.cron.ts`: `*/5 * * * *` flush incremental

### M2. GET /current/lite endpoint
- **Chuẩn yêu cầu:** Endpoint nhẹ trả `{hpPercent, participantCount, timeRemaining}` (~50 bytes) cho FE polling 3s
- **Hiện tại:** **KHÔNG CÓ.** Chỉ có `GET /current` trả full data (event + leaderboard top 10 + feed 20 items + stats + story = nặng). `getCurrentBoss()` chạy 5 Redis calls + 1 DB query + 1 batch user query mỗi lần
- **Hướng sửa:** Thêm route `GET /current/lite` chỉ cần 3 Redis calls: getBossHP + getParticipantCount + getMaxHP, không DB query

### M3. `final` flag trong attack
- **Chuẩn yêu cầu:** `final: true` khi player chết → flush batch cuối + trả `{totalDamage, rank}`
- **Hiện tại:** **KHÔNG CÓ** field `final` trong payload hay xử lý
- **Hướng sửa:** Thêm `final?: boolean` vào Zod schema + xử lý logic: khi final=true, query `getUserDamage` + `ZREVRANK` rồi trả thêm `totalDamage` + `rank`

### M4. endBoss() flush Redis → DB trước reward
- **Chuẩn yêu cầu:** Flush Redis → DB LẦN CUỐI trước khi tính reward, đảm bảo data mới nhất
- **Hiện tại:** `endBoss()` (dòng ~250-340) đọc trực tiếp từ Redis (`getAllDamageScores`, `getParticipantCount`, `getLastHit`) rồi insert vào DB trong cùng transaction. Reward tính từ Redis data, **KHÔNG** flush riêng trước
- **Phân tích:** Logic hiện tại GIÁN TIẾP đúng — nó đọc Redis rồi ghi DB trong 1 transaction. Nhưng nếu có cron flush 5 phút (M1), cần đảm bảo endBoss flush lần cuối đồng bộ trước khi reward tính từ DB
- **Hướng sửa:** Khi thêm M1, cần refactor endBoss: gọi flush function trước → tính reward từ DB data (thay vì Redis)

---

## 🟡 CẦN CHỈNH — Adjustments

### A1. Redis operations không dùng pipeline
- **File:** `world-boss.redis.ts` — mỗi function (addDamage, setCooldown, pushFeed...) gọi Redis riêng lẻ
- **File:** `world-boss.service.ts` dòng 172-177 — `submitAttack()` chạy `Promise.all([decrBossHP, addDamage, addParticipant, setCooldown])` = 4 Redis calls song song nhưng KHÔNG phải pipeline
- **Chuẩn:** 1 Redis pipeline 4 commands: `DECRBY + ZINCRBY + LPUSH/LTRIM + SET ratelimit`
- **Phân tích:** `Promise.all` vẫn tạo 4 connections riêng. Pipeline gửi 4 commands trong 1 TCP round-trip → nhanh hơn ~3x
- **Hướng sửa:** Dùng `redis.pipeline()` hoặc `redis.multi()` trong submitAttack

---

## 🟢 GIỮ NGUYÊN — Confirmed OK

| # | Feature | Trạng thái | Chi tiết |
|---|---------|-----------|----------|
| 1 | AI boss generation | ✅ OK | GPT-4o-mini + 8 fallback templates, file 40KB |
| 2 | Sensor check | ✅ OK | `getSensorDataForSpawn()`, `NORMAL_RANGES`, severity detection |
| 3 | Cron spawn */30 + expire */1 | ✅ OK | Croner library, `protect: true` |
| 4 | Redis DECRBY HP | ✅ OK | Atomic, key `worldboss:hp:{eventId}` |
| 5 | Redis ZINCRBY leaderboard | ✅ OK | Key `worldboss:damage:{eventId}` |
| 6 | Redis LPUSH + LTRIM feed | ✅ OK | Max 50 items, key `worldboss:feed:{eventId}` |
| 7 | Redis SADD participants | ✅ OK | Key `worldboss:participants:{eventId}` |
| 8 | DB schema 3 tables | ✅ OK | `world_boss_events`, `world_boss_participations`, `world_boss_rewards` |
| 9 | Reward system | ✅ OK | Tier S/A/B/C/D, defeated ×1.5, last hit +20%, batch 500 |
| 10 | Distributed locks | ✅ OK | Spawn lock (SET NX 30s), End lock, Expiry lock |
| 11 | Concurrency safety endBoss | ✅ OK | `acquireEndLock()` prevents duplicate |
| 12 | Skill templates | ✅ OK | File `skill-templates.ts` (5,257 bytes) |
| 13 | Story 4 phần | ✅ OK | `storyPreview` + `storyFull` in `visualVariant.story_full` |
| 14 | User stats tracking | ✅ OK | Lua script atomic: hits, bestHit, maxCombo per user |

---

## Kết luận

**Tổng:** 5 điểm sai, 4 điểm thiếu, 1 điểm cần chỉnh = **10 issues**

**Ưu tiên sửa:**
1. **S1** POST /attack payload → đổi field names (breaking FE+BE)
2. **S2** Bỏ `calculateWorldBossDamage()` + bỏ DB query playerStats
3. **S3** Cooldown 20s → Rate limit 2.5s
4. **S4** Clamp rules [100,50000] → [0,15000] + hits cap 20
5. **M1** Thêm cron flush Redis→DB mỗi 5 phút (data safety)
6. **M2** Thêm GET /current/lite (performance)
7. **S5** Response payload thừa → minimal {ok, hpPercent, rank}
8. **A1** Promise.all → Redis pipeline
9. **M3** Thêm final flag
10. **M4** Refactor endBoss flush (phụ thuộc M1)

**Ước lượng:** BE chiếm ~20% công việc tổng. Phần lớn là sửa/thêm logic, không viết mới từ đầu. Core infrastructure (Redis, DB, cron, locks) đã solid.
