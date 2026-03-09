# SCAN REPORT — Backend Boss Campaign
**Ngày:** 2026-02-28
**Trạng thái:** CHỈ SCAN — KHÔNG SỬA CODE
**VPS Path:** `/home/cdhc/apps/cdhc-be/`

---

## 1. TỔNG QUAN PROJECT STRUCTURE

- **Tổng files .ts:** 319
- **Framework:** Hono + Drizzle ORM + PostgreSQL + Redis + BullMQ
- **Boss/Combat files:** 20+ files chính

### 1.1 Files liên quan Boss/Combat (đầy đủ)

```
src/modules/game/combat/
├── battle-orchestrator.ts      # runBattle() — full battle loop
├── battle-session.ts           # Redis CRUD cho battle state
├── battle-turn.ts              # processSingleTurn() — API turn-by-turn
├── battle.routes.ts            # POST /start, /action, GET /state, POST /end
├── battle.service.ts           # DB operations: load, validate, save
├── combat-engine.ts            # Pure calc: damage, heal, stars, milestones
├── combat.constants.ts         # All constants + milestone config
├── combat.types.ts             # 26 mechanic types, BattleSession, API types
├── index.ts                    # Barrel export
├── mechanic-processor.ts       # 26 boss mechanic handlers
├── progress.routes.ts          # GET /zones, /bosses, /progress, /history
├── progress.service.ts         # Zone map, rewards, bonuses

src/modules/game/schema/
├── bosses.ts                   # bosses table (hp/atk/def/freq/heal/mechanics/phases)
├── boss-zones.ts               # boss_zones table (10 zones)
├── boss-battles.ts             # boss_battles + daily_battle_limits tables
├── boss-progress.ts            # boss_progress table (weekly boss)
├── campaign-progress.ts        # campaign_progress table

src/modules/game/routes/
├── boss.ts                     # POST /complete, GET /progress, /status, /weekly

src/modules/game/services/
├── boss.service.ts             # completeFight (weekly + campaign)
├── weekly-boss.service.ts      # Weekly boss rotation (4-week cycle)

src/modules/game/data/
├── bosses.ts                   # 8 weekly boss configs (static)
├── stat-config.ts              # Stat system: base + per_point + presets

src/modules/game/utils/
├── boss-anti-cheat.ts          # 6-layer anti-cheat system
```

### 1.2 Route Mounting

```
src/index.ts:151  →  app.route('/api/game', gameRoutes)
src/modules/game/routes/index.ts:54  →  game.route('/boss', bossRoutes)
src/modules/game/routes/boss.ts  →  boss.route('/battle', battleRouter)
                                 →  boss.route('/campaign', progressRouter)
```

**Base paths:**
- `/api/game/boss/complete` — Weekly + Campaign fight complete
- `/api/game/boss/battle/start|action|state|end` — Turn-by-turn API
- `/api/game/boss/campaign/zones|bosses|progress|history` — Campaign progress

---

## 2. DATABASE STATUS

### 2.1 Tables đã có (Boss-related)

| Table | Status | Rows | Purpose |
|-------|--------|------|---------|
| `bosses` | ✅ Active | 40 | 40 boss stats + mechanics + phases |
| `boss_zones` | ✅ Active | 10 | 10 zones with unlock levels |
| `boss_battles` | ✅ Active | — | Battle history records |
| `boss_progress` | ✅ Active | — | Weekly boss progress (string bossId) |
| `campaign_progress` | ✅ Active | — | Campaign progress + stars |
| `daily_battle_limits` | ✅ Active | — | Daily battle counter |
| `player_stats` | ✅ Active | — | Player stats (ATK/HP/DEF/MANA points) |
| `game_actions` | ✅ Active | — | Action logs (boss_complete logged) |

### 2.2 Tables KHÔNG TỒN TẠI (cần tạo mới theo GDD)

| Table cần | Purpose (GDD) | Priority |
|-----------|---------------|----------|
| `player_skills` | 3 skills (Sấm Đồng/Ớt Hiểm/Rơm Bọc) × 5 levels | 🔴 P0 |
| `fragments` / `boss_drops` | Mảnh Bí Kíp drop system + pity | 🔴 P0 |
| `recipes` | Công Thức Hữu Cơ crafting | 🔴 P0 |
| `daily_missions` | 5 daily missions + rewards | 🟠 P1 |
| `weekly_missions` | 5 weekly missions + rewards | 🟠 P1 |
| `achievements` | 16+ achievements | 🟡 P2 |
| `login_streaks` | Monthly login reward | 🟡 P2 |
| `combo_leaderboard` | Boss combo ranking | 🟡 P2 |

### 2.3 Bosses Table Schema (chi tiết)

```sql
bosses (
  id              SERIAL PRIMARY KEY,
  zone_id         INTEGER NOT NULL REFERENCES boss_zones(id),
  boss_number     INTEGER NOT NULL,        -- 1-4 per zone
  name            VARCHAR(100) NOT NULL,
  description     TEXT,
  tier            boss_tier NOT NULL,       -- minion | elite | boss
  archetype       boss_archetype NOT NULL,  -- glass_cannon | tank | healer | assassin | controller
  hp              INTEGER NOT NULL,
  atk             INTEGER NOT NULL,
  def             INTEGER NOT NULL DEFAULT 0,
  freq            INTEGER NOT NULL DEFAULT 1,
  heal_percent    VARCHAR(10) DEFAULT '0',
  turn_limit      INTEGER NOT NULL DEFAULT 20,
  mechanics       JSONB DEFAULT '[]',       -- BossMechanic[]
  phases          JSONB DEFAULT NULL,       -- BossPhase[] (Đế Vương only)
  reward_ogn      INTEGER NOT NULL DEFAULT 0,
  reward_xp       INTEGER NOT NULL DEFAULT 0,
  reward_items    JSONB DEFAULT '[]',
  emoji           VARCHAR(10),
  sprite_key      VARCHAR(100),
  is_active       BOOLEAN DEFAULT true,
  UNIQUE(zone_id, boss_number)
)
```

### 2.4 Player Stats Schema

```sql
player_stats (
  user_id                 UUID PRIMARY KEY,
  xp                      INTEGER DEFAULT 0,
  level                   INTEGER DEFAULT 1,
  ogn                     INTEGER DEFAULT 1250,
  stat_atk                INTEGER DEFAULT 0,     -- stat points allocated
  stat_hp                 INTEGER DEFAULT 0,
  stat_def                INTEGER DEFAULT 0,
  stat_mana               INTEGER DEFAULT 0,
  free_stat_points        INTEGER DEFAULT 0,
  total_stat_points_earned INTEGER DEFAULT 0,
  auto_preset             VARCHAR,               -- attack | defense | balance
  auto_enabled            BOOLEAN DEFAULT false,
  weekly_resets           INTEGER DEFAULT 0,
  reset_week_start        TIMESTAMPTZ,
  total_harvests          INTEGER DEFAULT 0,
  total_boss_kills        INTEGER DEFAULT 0,
  total_damage            INTEGER DEFAULT 0,
  -- social stats...
)
```

**Effective stats formula:** `base + (stat_points × per_point)`
- ATK: 100 + statAtk × 20
- HP: 500 + statHp × 100
- DEF: 50 + statDef × 10
- MANA: 100 + statMana × 15
- Points per level: 3

### 2.5 DB Enum Types (Boss-related)

| Enum | Values |
|------|--------|
| `boss_tier` | minion, elite, boss |
| `boss_archetype` | glass_cannon, tank, healer, assassin, controller |
| `battle_result` | win, lose, timeout, flee |
| `battle_status` | in_progress, completed, abandoned |

### 2.6 Boss Data Summary (40 bosses seeded)

| Zone# | Zone Name | Bosses | HP Range | ATK Range | DEF | Freq | Heal% | Turn Limit |
|-------|-----------|--------|----------|-----------|-----|------|-------|------------|
| 1 | Ruộng Lúa | 4 (Rệp Con→Rệp Chúa) | 4,500–27,000 | 50–110 | 0 | 1 | 0 | 20 |
| 2 | Vườn Cà Chua | 4 (Sâu Non→Bướm Đêm) | 10,500–42,000 | 80–120 | 0 | 2 | 0 | 20 |
| 3 | Vườn Ớt | 4 (Bọ Rùa Con→Bọ Ngựa) | 30,000–105,000 | 70–100 | 150–350 | 1 | 0 | 25 |
| 4 | Ruộng Cà Rốt | 4 (Châu Chấu Non→Vua Châu Chấu) | 52,500–150,000 | 160–230 | 0 | 1 | 0 | 25 |
| 5 | Nhà Kho | 4 (Bọ Xít Xanh→Ốc Sên Chúa) | 75,000–210,000 | 180–250 | 0–100 | 1 | 1.5–2% | 25 |
| 6 | Đồng Hoang | 4 (Chuột Con→Chuột Vương) | 120,000–330,000 | 250–350 | 0 | 1–2 | 0 | 30 |
| 7 | Rừng Tre | 4 (Sâu Róm Lửa→Rồng Đất) | 150,000–375,000 | 400–600 | 0 | 1 | 0 | 30 |
| 8 | Đầm Lầy | 4 (Đỉa Khổng Lồ→Rồng Nước) | 225,000–570,000 | 200–300 | 300–450 | 1 | 0 | 30–35 |
| 9 | Núi Lửa | 4 (Bọ Lửa→Rồng Lửa) | 300,000–720,000 | 350–650 | 0–400 | 1 | 0–1.5% | 35 |
| 10 | Thế Giới Ngầm | 4 (Nấm Độc→Đế Vương) | 375,000–1,050,000 | 350–700 | 0–500 | 1–2 | 0–1% | 35–40 |

**Mechanics coverage:** 33/40 bosses have mechanics (7 minions from V1-V2 have none — intended tutorial).
**Phase boss:** Only Đế Vương (id=82) has 4 phases.

---

## 3. COMBAT FORMULAS — CODE vs GDD

### 3.1 Bảng so sánh chi tiết

| Formula | Code (BE) | File:Line | Notes |
|---------|-----------|-----------|-------|
| **Player→Boss (match)** | `max(ATK × matchSize × combo - BossDEF, ATK × 1)` | `combat-engine.ts:18-25` | FLAT subtraction — no gem type differentiation |
| **Player→Boss (ULT)** | `ATK × 3 + MaxMana × 0.5 - BossDEF` (min ATK×1) | `combat-engine.ts:33-40` | Matches GDD Lv1 |
| **Boss→Player** | `max(BossATK - PlayerDEF, 1)` per hit, × freq | `combat-engine.ts:47-53` | FLAT subtraction |
| **Boss heal** | `healPercent% × MaxHP` per turn | `combat-engine.ts:71-74` | Matches GDD |
| **Mana regen** | `10 + MaxMana / 20` per turn | `combat-engine.ts:80-82` | Matches GDD |
| **Star rating** | 3★ >80%HP, 2★ >50%HP, 1★ win | `combat.constants.ts:40-41` | Matches GDD |
| **Dodge cost** | 30 mana | `combat.constants.ts:30` | Matches GDD |
| **ULT cost** | 80 mana | `combat.constants.ts:31` | Matches GDD |
| **MIN_DAMAGE_MULTIPLIER** | 1 (player min dmg = ATK × 1) | `combat.constants.ts:26` | Prevents zero damage |
| **MIN_BOSS_DAMAGE** | 1 | `combat.constants.ts:28` | Boss always deals at least 1 |

### 3.2 DEF Formula Analysis — CRITICAL FINDING

**BE Code (combat-engine.ts:18-25):**
```ts
// Player → Boss: max(ATK × matchSize × combo - BossDEF, ATK × 1)
// FLAT SUBTRACTION model
```

**BE Code (combat-engine.ts:47-49):**
```ts
// Boss → Player: max(BossATK - PlayerDEF, 1)
// FLAT SUBTRACTION model
```

**GDD v2.0 reference (from previous scan report):**
```
// DEF formula: dmg × (1 - DEF/(DEF+500))
// PERCENTAGE REDUCTION model
```

**Analysis:** The BE uses **flat subtraction** (`rawDmg - DEF`), NOT the GDD's percentage reduction (`DEF/(DEF+500)`). However, the flat model is **already implemented and balanced for 40 bosses**. The boss HP/ATK/DEF values in DB are tuned FOR the flat model. Changing to percentage model would require re-balancing all 40 bosses.

**FE (from previous scan):** Uses different formulas entirely (gem-type based: sword/star/heart/shield with different base + scaling coefficients). FE and BE combat systems are SEPARATE — FE runs real-time match-3, BE validates via `/boss/complete` endpoint.

### 3.3 Milestone Passives (combat.constants.ts:52-74)

| Stat | Threshold | Passive | Code |
|------|-----------|---------|------|
| ATK ≥ 300 | crit_1 | 10% crit, ×2 dmg | ✅ |
| ATK ≥ 800 | crit_2 | 15% crit, ×2 dmg | ✅ |
| ATK ≥ 2000 | destroy | Match-5 +50% ATK bonus | ✅ |
| HP ≥ 1500 | regen_1 | 5% HP regen / 5 turns | ✅ |
| HP ≥ 5000 | regen_2 | 8% HP regen / 5 turns | ✅ |
| HP ≥ 15000 | immortal | Revive once at 20% HP | ✅ |
| DEF ≥ 200 | reflect_1 | Reflect 10% boss dmg | ✅ |
| DEF ≥ 600 | reflect_2 | Reflect 20% boss dmg | ✅ |
| DEF ≥ 1500 | fortress | Immune every 10 turns | ✅ |
| MANA ≥ 250 | save_1 | Dodge cost -5 mana | ✅ |
| MANA ≥ 800 | save_2 | ULT cost -15 mana | ✅ |
| MANA ≥ 3000 | super | Free ULT every 8 turns | ✅ |

### 3.4 Reward System (combat.constants.ts:78-118)

| Feature | Value | Status |
|---------|-------|--------|
| Star reward: 0★ | ×0 (no reward) | ✅ |
| Star reward: 1★ | ×1.0 | ✅ |
| Star reward: 2★ | ×1.2 | ✅ |
| Star reward: 3★ | ×1.5 | ✅ |
| First clear bonus | ×2.0 | ✅ |
| Repeat diminish | 2nd ×1.0, 3rd ×0.8, 4th ×0.6, 5th+ ×0.5 | ✅ |
| Zone clear bonus | V1:50 → V10:8000 OGN | ✅ |
| Zone perfect bonus | V1:25 → V10:5000 OGN | ✅ |

---

## 4. FEATURE MATRIX

### 4.1 Đã implement ĐẦY ĐỦ (backend)

| # | Feature | Files | Status |
|---|---------|-------|--------|
| 1 | 40 Boss data (HP/ATK/DEF/freq/heal) | `schema/bosses.ts`, `seed-boss-data.ts` | ✅ 40 bosses seeded |
| 2 | 10 Zones + unlock progression | `schema/boss-zones.ts`, `progress.service.ts` | ✅ 10 zones |
| 3 | 5 Boss archetypes | `boss_archetype` enum | ✅ glass_cannon/tank/healer/assassin/controller |
| 4 | 3 Boss tiers | `boss_tier` enum | ✅ minion/elite/boss |
| 5 | 26 Boss mechanic types | `mechanic-processor.ts` | ✅ All 26 types handled |
| 6 | 4-Phase Đế Vương | `combat-engine.ts:224-279` | ✅ Phase transition + stat apply |
| 7 | Star rating (1-3★) | `combat-engine.ts:168-173` | ✅ HP%-based |
| 8 | Campaign progress tracking | `schema/campaign-progress.ts` | ✅ Per-user per-boss |
| 9 | Daily battle limits | `daily_battle_limits` table + Redis | ✅ 10/day (campaign), 5/day (weekly) |
| 10 | Battle cooldown | Redis TTL | ✅ 5min (campaign), 10min (weekly) |
| 11 | Reward multipliers (star/first/repeat) | `progress.service.ts:calculateReward` | ✅ |
| 12 | Zone clear/perfect bonuses | `progress.service.ts:claimZoneBonus` | ✅ |
| 13 | Turn-by-turn battle API | `battle.routes.ts` (4 endpoints) | ✅ Redis session |
| 14 | Full battle orchestrator | `battle-orchestrator.ts` | ✅ runBattle() loop |
| 15 | Weekly boss rotation | `weekly-boss.service.ts` | ✅ 4-week cycle |
| 16 | 12 Milestone passives | `combat.constants.ts:MILESTONES` | ✅ ATK/HP/DEF/MANA |
| 17 | Player stat system (4 stats) | `stat-config.ts`, `player-stats` schema | ✅ Points + presets |
| 18 | Anti-cheat (6 layers) | `boss-anti-cheat.ts` | ✅ Rate/lock/duration/damage/win/OGN cap |
| 19 | Battle history (paginated) | `progress.routes.ts:GET /history` | ✅ |
| 20 | Boss progression (sequential unlock) | `battle.service.ts:checkBossProgression` | ✅ Must clear prev boss |

### 4.2 KHÔNG tồn tại (cần viết mới)

| # | Feature (GDD) | DB Changes | API Endpoints | Priority | Est. Prompts |
|---|---------------|-----------|---------------|----------|--------------|
| 1 | **3 Player Skills** (Sấm Đồng/Ớt Hiểm/Rơm Bọc) | NEW `player_skills` table | POST /skills/upgrade, GET /skills | 🔴 P0 | 2-3 |
| 2 | **Skill levels** (1-5 + 3 tiers) | `player_skills.level`, `player_skills.tier` | Integrated in skill endpoints | 🔴 P0 | included |
| 3 | **Mảnh Bí Kíp** drop system | NEW `fragments` table, NEW `boss_drops` table | POST /boss/drops/roll, GET /fragments | 🔴 P0 | 2-3 |
| 4 | **Pity system** (20 trận) | `boss_drops.pity_counter` | Integrated in drop roll | 🟠 P1 | included |
| 5 | **Công Thức Hữu Cơ** crafting | NEW `recipes` table, NEW `player_recipes` table | POST /recipes/craft, GET /recipes | 🔴 P0 | 2-3 |
| 6 | **Recipe farm effects** | Integration with farm.service.ts | GET /farm/buffs | 🟠 P1 | 1 |
| 7 | **Daily missions** (5/day) | NEW `daily_missions`, `player_missions` tables | GET /missions/daily, POST /missions/claim | 🟠 P1 | 2 |
| 8 | **Weekly missions** (5/week) | Shared with daily missions schema | GET /missions/weekly | 🟠 P1 | 1 |
| 9 | **Achievements** (16+) | NEW `achievements`, `player_achievements` tables | GET /achievements, POST /achievements/claim | 🟡 P2 | 2 |
| 10 | **Monthly login streak** | NEW `login_streaks` table | GET /login-streak, POST /login-streak/claim | 🟡 P2 | 1 |
| 11 | **Seasonal events** | NEW `events` table | GET /events/current | 🟡 P2 | 2 |
| 12 | **World Boss** mode | NEW `world_boss`, `world_boss_contributions` | Multiple endpoints | 🟡 P2 | 3-4 |
| 13 | **PvP** (gián tiếp + trực tiếp) | NEW `pvp_matches`, `pvp_rankings` | Multiple endpoints | 🟡 P2 | 4-5 |
| 14 | **Wave Defense** mode | NEW game mode | Multiple endpoints | 🟡 P2 | 3-4 |
| 15 | **Combo leaderboard** (boss) | Extension of existing leaderboard | GET /leaderboard/combo | 🟡 P2 | 1 |
| 16 | **Tutorial/Onboarding flags** | `player_stats.tutorial_flags` JSONB | GET /tutorial/status | 🟡 P2 | 1 |

---

## 5. API ENDPOINTS

### 5.1 Endpoints hiện có

| Method | Path | Handler | Purpose |
|--------|------|---------|---------|
| POST | `/api/game/boss/complete` | `boss.service.completeFight` | Weekly + Campaign fight complete (FE-driven) |
| GET | `/api/game/boss/progress` | `boss.service.getProgress` | Weekly boss progress |
| GET | `/api/game/boss/status` | `boss.service.getStatus` | Daily fights + cooldown |
| GET | `/api/game/boss/weekly` | `weekly-boss.service.getWeeklyBoss` | Current weekly boss |
| POST | `/api/game/boss/battle/start` | `battle.routes` | Start turn-by-turn battle → Redis |
| POST | `/api/game/boss/battle/action` | `battle.routes` | Submit 1 action per turn |
| GET | `/api/game/boss/battle/state` | `battle.routes` | Reconnect / get current state |
| POST | `/api/game/boss/battle/end` | `battle.routes` | Surrender / force end |
| GET | `/api/game/boss/campaign/zones` | `progress.routes` | Zone map (10 zones + progress) |
| GET | `/api/game/boss/campaign/zones/:n/bosses` | `progress.routes` | Boss list in zone |
| GET | `/api/game/boss/campaign/progress` | `progress.routes` | Campaign overview stats |
| GET | `/api/game/boss/campaign/daily-limits` | `progress.routes` | Daily battle limits |
| GET | `/api/game/boss/campaign/history` | `progress.routes` | Battle history (paginated) |
| POST | `/api/game/boss/campaign/claim-zone-bonus` | `progress.routes` | Claim zone clear/perfect bonus |

### 5.2 Endpoints cần tạo mới

| Method | Path | Purpose | GDD Feature |
|--------|------|---------|-------------|
| GET | `/api/game/skills` | Player skill list + levels | 3 Skills |
| POST | `/api/game/skills/upgrade` | Upgrade skill (OGN + fragments) | Skill upgrade |
| GET | `/api/game/fragments` | Player fragment inventory | Mảnh Bí Kíp |
| POST | `/api/game/boss/battle/drop-roll` | Roll fragment drop after win | Drop system |
| GET | `/api/game/recipes` | Available + owned recipes | Công Thức |
| POST | `/api/game/recipes/craft` | Craft recipe from fragments | Crafting |
| GET | `/api/game/farm/buffs` | Active recipe buffs on farm | Farm integration |
| GET | `/api/game/missions/daily` | Today's 5 daily missions | Daily missions |
| GET | `/api/game/missions/weekly` | This week's 5 weekly missions | Weekly missions |
| POST | `/api/game/missions/claim` | Claim mission reward | Mission rewards |
| GET | `/api/game/achievements` | All achievements + progress | Achievements |
| POST | `/api/game/achievements/claim` | Claim achievement reward | Achievement rewards |

---

## 6. ARCHITECTURE ANALYSIS

### 6.1 Hai hệ thống combat song song

**Path 1: FE-Driven (Weekly Boss + Campaign via `/boss/complete`)**
- FE runs real-time match-3 game (gems, combos, animations)
- FE sends result to BE: `{ bossId, won, totalDamage, durationSeconds, stars, isCampaign }`
- BE validates (anti-cheat: duration, damage, daily limits)
- BE awards rewards
- **Used by:** Weekly boss fights + Campaign boss fights from FE

**Path 2: BE Turn-by-Turn API (`/boss/battle/*`)**
- Full server-side combat simulation
- Redis session stores complete battle state
- Player sends actions: `{ type: 'match', matchSize: 3, comboMultiplier: 1.5 }`
- BE processes turn, returns result
- **Used by:** Not currently used by FE (exists for future API-driven combat / anti-cheat)

**Analysis:** Both paths coexist. Path 1 is the ACTIVE path used by FE. Path 2 is a complete implementation ready for use but not connected to FE. The `/boss/complete` route handles both weekly (string bossId like 'rep-xanh') and campaign (numeric bossId) via the `isCampaign` flag.

**Recommendation:** Keep both paths. Path 1 allows rich FE experience. Path 2 can be used for:
- Server-authoritative mode (anti-cheat escalation)
- Headless/bot testing
- Future API-only clients

### 6.2 FE Static Data vs DB Dynamic

**Weekly bosses** — FE uses static `BOSSES[]` array (8 bosses in `data/bosses.ts`). BE also has this array for weekly validation. These are SEPARATE from the 40 campaign bosses in DB.

**Campaign bosses** — FE fetches from API (`/campaign/zones`, `/campaign/zones/:n/bosses`). Data is fully dynamic from DB.

**FE Combat Formulas** (from FE code scan) — The FE match-3 engine uses gem-type differentiated formulas:
- Sword: `(40 + ATK×0.6) × gems × combo`
- Star: `(25 + ATK×0.3) × gems × combo`
- Heart heal: `(25 + HP×0.04) × gems × combo`
- Shield: `(20 + DEF×0.02 + HP×0.01) × gems × combo`

These are COMPLETELY DIFFERENT from BE formulas. This is by design — FE does the real-time visual game, BE validates aggregate results.

### 6.3 Anti-Cheat System (boss-anti-cheat.ts)

| Layer | Protection | Config |
|-------|-----------|--------|
| 1 | Rate limit | 2 req/sec per user |
| 2 | Concurrent lock | 5s TTL, NX set |
| 3 | Min duration | Weekly: max(3s, HP/10000), Campaign: max(2s, HP/50000) |
| 4 | Damage range | Weekly: 0.8x-3x HP, Campaign: 0.8x-5x HP |
| 5 | Daily win limit | 50 wins/day |
| 6 | Daily OGN cap | 5000 OGN/day from boss |

### 6.4 Cron Jobs (No boss-specific crons)

Current crons: weather, wither, leaderboard warm, market, email change, conversion alerts, mock sensor, VIP, delivery, pricing. **No boss-related cron jobs exist** (daily reset is handled by Redis TTL expiry).

---

## 7. IMPLEMENTATION PLAN

### Phase 1: Player Skills System (2-3 prompts)

| # | Task | Files | DB Changes | Dependencies |
|---|------|-------|-----------|--------------|
| 1.1 | Create `player_skills` schema | NEW `schema/player-skills.ts` | NEW TABLE: userId, skillId, level (1-5), tier (1-3), unlockedAt | None |
| 1.2 | Skill definitions data | NEW `data/skills.ts` | None | Sấm Đồng (ATK×3+Mana×0.5), Ớt Hiểm (ATK×2 AoE), Rơm Bọc (Shield DEF×3) |
| 1.3 | Skill service + routes | NEW `services/skill.service.ts`, routes | None | Upgrade cost: OGN + fragments + boss clear requirement |
| 1.4 | Integrate skills into combat engine | Edit `combat-engine.ts`, `battle-orchestrator.ts` | None | Add skill action type, process skill effects |

### Phase 2: Fragment & Drop System (2-3 prompts)

| # | Task | Files | DB Changes | Dependencies |
|---|------|-------|-----------|--------------|
| 2.1 | Create `fragments` + `boss_drops` schemas | NEW schemas | NEW TABLES: fragment types (10×3 tier), drop logs with pity | None |
| 2.2 | Fragment data (10 types × 3 tiers) | NEW `data/fragments.ts` | None | Zone-specific drops |
| 2.3 | Drop service (roll after win) | NEW `services/drop.service.ts` | None | Pity system: guaranteed drop every 20 fights |
| 2.4 | Drop routes | NEW routes in boss.ts | None | Phase 1 not required |

### Phase 3: Recipe Crafting System (2-3 prompts)

| # | Task | Files | DB Changes | Dependencies |
|---|------|-------|-----------|--------------|
| 3.1 | Create `recipes` + `player_recipes` schemas | NEW schemas | NEW TABLES: recipe definitions, player owned recipes | Phase 2 (needs fragments) |
| 3.2 | Recipe data (10 types × 3 tiers) | NEW `data/recipes.ts` | None | Cross-zone fragment requirements |
| 3.3 | Craft service + routes | NEW services, routes | None | Consume fragments → mint recipe |
| 3.4 | Farm integration (recipe buffs) | Edit `farm.service.ts` | None | Apply productivity/growth/quality buffs |

### Phase 4: Mission System (2 prompts)

| # | Task | Files | DB Changes | Dependencies |
|---|------|-------|-----------|--------------|
| 4.1 | Create mission schemas | NEW schemas | NEW TABLES: mission definitions, player mission progress | None |
| 4.2 | Daily missions (5/day) + Weekly missions (5/week) | NEW services, routes, cron | None | Auto-track: harvest, boss win, recipe craft, etc. |

### Phase 5: Achievements & Meta (2 prompts)

| # | Task | Files | DB Changes | Dependencies |
|---|------|-------|-----------|--------------|
| 5.1 | Achievements system | NEW schemas, services, routes | NEW TABLES | Phase 1-4 provide tracking data |
| 5.2 | Login streak + Tutorial flags | NEW schemas, services | NEW TABLES | None |

### Phase 6: Advanced Modes (future)

| # | Task | Est. Prompts | Dependencies |
|---|------|-------------|--------------|
| 6.1 | World Boss (co-op damage) | 3-4 | Phase 1-3 core systems |
| 6.2 | PvP (indirect + direct) | 4-5 | Phase 1-3, matchmaking |
| 6.3 | Wave Defense | 3-4 | Phase 1-3 |
| 6.4 | Seasonal Events | 2-3 | Phase 4 (missions) |

---

## 8. DEPENDENCY GRAPH

```
[Phase 1: Skills] ──────────────────────────────────┐
                                                      │
[Phase 2: Fragments/Drops] ──→ [Phase 3: Recipes] ──→ [Phase 5: Achievements]
                                      │                        │
                                      ▼                        │
                               [Phase 3.4: Farm Buffs]         │
                                                               │
[Phase 4: Missions] ──────────────────────────────────────────→┘
                                                               │
                                                               ▼
                                                    [Phase 6: Advanced Modes]
```

**Critical path:** Phase 2 → Phase 3 (recipes need fragments)
**Parallel work:** Phase 1 (Skills) + Phase 2 (Fragments) can run in parallel
**Phase 4 (Missions)** is independent, can start anytime

---

## 9. RISK ASSESSMENT

| Risk | Impact | Mitigation |
|------|--------|------------|
| FE/BE formula mismatch (gem-based vs flat) | Medium — FE sends aggregate results, BE validates ranges | Current anti-cheat (0.8x-5x) handles this. NO action needed unless switching to server-authoritative. |
| Two combat paths maintenance burden | Low — Both share same engine files | Path 2 (turn-by-turn) is self-contained. Path 1 handles all current FE needs. |
| 40 bosses balanced for flat DEF model | High if changing DEF formula | DO NOT change DEF formula without re-balancing all 40 bosses. Current flat model works. |
| No fragment/recipe tables yet | Blocking for full GDD | Phase 2-3 are P0 priority. 4-6 prompt investment. |
| Weekly boss uses static data, campaign uses DB | Low — separate concerns | Weekly bosses (8) for casual play, campaign (40) for progression. Keep separate. |
| Daily OGN cap (5000) may be too restrictive for endgame | Medium | Review after Phase 3 — recipe crafting adds OGN sink, may need cap adjustment. |
| No server-authoritative combat for FE | Medium — FE can be manipulated | Path 2 exists as fallback. Anti-cheat Layer 3-4 (duration + damage range) provides adequate protection. |
| Boss mechanics data integrity | Low | All 33 boss mechanics validated in code — 26 handler types match DB JSONB data. |

---

## 10. SUMMARY

### What EXISTS (solid foundation):
- ✅ Complete 40-boss campaign with 10 zones
- ✅ Full combat engine (26 mechanics, 4-phase boss, 12 milestones)
- ✅ Turn-by-turn API (ready but unused by FE)
- ✅ FE-driven combat validation (anti-cheat)
- ✅ Star rating + reward multipliers + zone bonuses
- ✅ Player stat system (4 stats, points, presets, reset)
- ✅ Daily limits + cooldowns
- ✅ Battle history + campaign progress tracking

### What's MISSING (GDD v2.0 gaps):
- ❌ 3 Player Skills (Sấm Đồng/Ớt Hiểm/Rơm Bọc) — 0% done
- ❌ Mảnh Bí Kíp drop system — 0% done
- ❌ Công Thức Hữu Cơ crafting — 0% done
- ❌ Daily/Weekly missions — 0% done
- ❌ Achievements — 0% done
- ❌ Login streaks — 0% done
- ❌ World Boss / PvP / Wave Defense — 0% done

### Estimated total effort: 15-20 prompts for P0+P1 features
