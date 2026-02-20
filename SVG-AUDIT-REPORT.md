# FARMVERSE SVG AUDIT REPORT
> Generated: 2026-02-20 | Codebase: `/mnt/d/du-an/cdhc/cdhc-game-vite/`

---

## EXECUTIVE SUMMARY

| Metric | Count |
|---|---|
| Total screens | 15 |
| Existing SVGs (animated, production) | 8 (Boss Rush) |
| Existing SVGs (animated, placeholder-grade) | 40 (Campaign) |
| Missing image files | 1 (`/default-avatar.png`) |
| Plant sprites (emoji-only, no image files) | 4 plants x 5 stages = 20 needed |
| Boss/Enemy characters total | 48 (8 weekly + 40 campaign) |
| Icon library | Material Symbols Outlined (primary), Material Icons Round (secondary) |
| Animation engine | Pure CSS `@keyframes` + React `useState` toggle (no Framer Motion / react-spring) |
| Zustand stores | 3 (none for battle) |
| Custom `@keyframes` registered | 28+ in Tailwind + 15+ in index.css |

---

## 1. BOSS / ENEMY SVGs

### 1A. WEEKLY BOSS RUSH — 8 Bosses (PRODUCTION READY)

Source: `src/modules/boss/data/bosses.ts`
Assets: `public/assets/bosses/*.svg`
Used by: `BossFightM3.tsx`, `BossList.tsx`

| # | Name (Vi) | Code | Type | HP | ATK | Unlock Lv | SVG File | Quality | Animations |
|---|-----------|------|------|-----|-----|-----------|----------|---------|------------|
| 1 | Rệp Xanh | `rep-xanh` | Normal | 500 | 20 | 1 | `rep-xanh.svg` (79 lines) | HIGH | bounce, wheelSpin, leafWobble, cloudMove |
| 2 | Sâu Tơ | `sau-to` | Normal | 800 | 25 | 3 | `sau-to.svg` (52 lines) | HIGH | bob, propSpin, cloudMove |
| 3 | Bọ Rùa | `bo-rua` | Normal | 1200 | 35 | 5 | `bo-rua.svg` (79 lines) | HIGH | bounce, wheelSpin, shake, cloudMove |
| 4 | Châu Chấu | `chau-chau` | Medium | 2000 | 45 | 10 | `chau-chau.svg` (66 lines) | HIGH | hop, wheelSpin, cloudMove |
| 5 | Bọ Xít | `bo-xit` | Hard | 3000 | 55 | 15 | `bo-xit.svg` (70 lines) | HIGH | trundle, wheelSpin, exhaust |
| 6 | Ốc Sên | `oc-sen` | Hard | 4000 | 65 | 20 | `oc-sen.svg` (65 lines) | HIGH | glide, wheelSpin, thrust, cloudMove |
| 7 | Chuột Đồng | `chuot-dong` | Hard | 5000 | 80 | 30 | `chuot-dong.svg` (83 lines) | HIGH | bump, wheelSpin, steering, cloudMove |
| 8 | Rồng Lửa | `rong-lua` | Legendary | 10000 | 100 | 50 | `rong-lua.svg` (69 lines) | HIGH | float, basketSway, cloudMove, fireFlicker |

**Status:** All 8 are hand-crafted, unique, animated SVGs. **No action needed.**

---

### 1B. CAMPAIGN BOSSES — 40 Bosses (LOW QUALITY / PLACEHOLDER GRADE)

Source: DB `bosses` table + `src/modules/campaign/data/bossDetails.ts`
Assets: `public/assets/campaign-bosses/boss-{1-40}.svg`
Used by: `CampaignBattleScreen.tsx`, `StageNode.tsx`, `BossNode.tsx`, `BossDetailSheet.tsx`

All 40 files share the **same 3-animation template** (`bob`, `wheelSpin`, `cloudMove`) with only minor color/body variation. They are **animated but placeholder-grade** — generic blob characters, NOT the unique creatures described in game data.

#### Zone 1 — Ruộng Lúa (Lv 1-5) | Archetype: glass_cannon

| # | Name | DB Code | Tier | HP | SVG | Needs |
|---|------|---------|------|-----|-----|-------|
| 1 | Rệp Con | `rep_con` | minion | 4,500 | `boss-1.svg` | Unique aphid larva design |
| 2 | Rệp Lính | `rep_linh` | minion | 7,500 | `boss-2.svg` | Soldier aphid design |
| 3 | Rệp Cánh | `rep_canh` | elite | 13,500 | `boss-3.svg` | Winged aphid + rage aura |
| 4 | Rệp Chúa | `rep_chua` | boss | 27,000 | `boss-4.svg` | Queen aphid + egg summon |

#### Zone 2 — Vườn Cà Chua (Lv 5-10) | Archetype: assassin

| # | Name | DB Code | Tier | HP | SVG | Needs |
|---|------|---------|------|-----|-----|-------|
| 5 | Sâu Non | `sau_non` | minion | 10,500 | `boss-5.svg` | Small caterpillar |
| 6 | Sâu Tơ | `sau_to` | minion | 16,500 | `boss-6.svg` | Silk worm + cocoon |
| 7 | Sâu Khoang | `sau_khoang` | elite | 27,000 | `boss-7.svg` | Beet armyworm + poison aura |
| 8 | Bướm Đêm | `buom_dem` | boss | 42,000 | `boss-8.svg` | Night moth + wing dust particles |

#### Zone 3 — Vườn Ớt (Lv 10-15) | Archetype: tank

| # | Name | DB Code | Tier | HP | SVG | Needs |
|---|------|---------|------|-----|-----|-------|
| 9 | Bọ Rùa Con | `bo_rua_con` | minion | 30,000 | `boss-9.svg` | Baby ladybug with shell |
| 10 | Bọ Cánh Cam | `bo_canh_cam` | minion | 45,000 | `boss-10.svg` | Orange beetle |
| 11 | Bọ Hung | `bo_hung` | elite | 67,500 | `boss-11.svg` | Dung beetle + rage indicator |
| 12 | Bọ Ngựa | `bo_ngua` | boss | 105,000 | `boss-12.svg` | Praying mantis + shield mode |

#### Zone 4 — Rẫy Cà Rốt (Lv 15-20) | Archetype: controller

| # | Name | DB Code | Tier | HP | SVG | Needs |
|---|------|---------|------|-----|-----|-------|
| 13 | Châu Chấu Non | `chau_chau_non` | minion | 52,500 | `boss-13.svg` | Young grasshopper |
| 14 | Châu Chấu Cánh | `chau_chau_canh` | minion | 75,000 | `boss-14.svg` | Winged grasshopper |
| 15 | Dế Mèn | `de_men` | elite | 112,500 | `boss-15.svg` | Cricket + stun aura |
| 16 | Vua Châu Chấu | `vua_chau_chau` | boss | 150,000 | `boss-16.svg` | Grasshopper King + crown |

#### Zone 5 — Nhà Kho (Lv 20-30) | Archetype: healer

| # | Name | DB Code | Tier | HP | SVG | Needs |
|---|------|---------|------|-----|-----|-------|
| 17 | Bọ Xít Xanh | `bo_xit_xanh` | minion | 75,000 | `boss-17.svg` | Green stink bug |
| 18 | Bọ Xít Nâu | `bo_xit_nau` | minion | 112,500 | `boss-18.svg` | Brown stink bug + stink cloud |
| 19 | Ốc Sên Gai | `oc_sen_gai` | elite | 150,000 | `boss-19.svg` | Spiny snail + reflect aura |
| 20 | Ốc Sên Chúa | `oc_sen_chua` | boss | 210,000 | `boss-20.svg` | Giant snail queen + shell shield |

#### Zone 6 — Đồng Hoang (Lv 30-40) | Archetype: assassin

| # | Name | DB Code | Tier | HP | SVG | Needs |
|---|------|---------|------|-----|-----|-------|
| 21 | Chuột Con | `chuot_con` | minion | 120,000 | `boss-21.svg` | Small field mouse |
| 22 | Chuột Cống | `chuot_cong` | minion | 180,000 | `boss-22.svg` | Sewer rat + poison |
| 23 | Chuột Chũi | `chuot_chui` | elite | 240,000 | `boss-23.svg` | Mole rat + burrow anim |
| 24 | Chuột Vương | `chuot_vuong` | boss | 330,000 | `boss-24.svg` | Rat King + crown + rage |

#### Zone 7 — Rừng Tre (Lv 40-50) | Archetype: glass_cannon

| # | Name | DB Code | Tier | HP | SVG | Needs |
|---|------|---------|------|-----|-----|-------|
| 25 | Sâu Róm Lửa | `sau_rom_lua` | minion | 150,000 | `boss-25.svg` | Fire caterpillar + burn aura |
| 26 | Bò Cạp | `bo_cap` | minion | 210,000 | `boss-26.svg` | Scorpion + stinger |
| 27 | Rết Khổng Lồ | `ret_khong_lo` | elite | 270,000 | `boss-27.svg` | Giant centipede |
| 28 | Rồng Đất | `rong_dat` | boss | 375,000 | `boss-28.svg` | Earth dragon + fire breath |

#### Zone 8 — Đầm Lầy (Lv 50-65) | Archetype: tank

| # | Name | DB Code | Tier | HP | SVG | Needs |
|---|------|---------|------|-----|-----|-------|
| 29 | Đỉa Khổng Lồ | `dia_khong_lo` | minion | 225,000 | `boss-29.svg` | Giant leech |
| 30 | Ếch Độc | `ech_doc` | minion | 300,000 | `boss-30.svg` | Poison frog |
| 31 | Rắn Hổ Mang | `ran_ho_mang` | elite | 420,000 | `boss-31.svg` | Cobra + hood spread |
| 32 | Rồng Nước | `rong_nuoc` | boss | 570,000 | `boss-32.svg` | Water dragon + flood wave |

#### Zone 9 — Núi Lửa (Lv 65-80) | Archetype: mixed

| # | Name | DB Code | Tier | HP | SVG | Needs |
|---|------|---------|------|-----|-----|-------|
| 33 | Bọ Lửa | `bo_lua` | minion | 300,000 | `boss-33.svg` | Fire beetle + self-destruct |
| 34 | Thằn Lằn Nham | `than_lan_nham` | minion | 420,000 | `boss-34.svg` | Lava lizard + magma armor |
| 35 | Phượng Hoàng Đen | `phuong_hoang_den` | elite | 480,000 | `boss-35.svg` | Dark phoenix + fire wings |
| 36 | Rồng Lửa | `rong_lua_campaign` | boss | 720,000 | `boss-36.svg` | Fire dragon + supernova |

#### Zone 10 — Thế Giới Ngầm (Lv 80-100) | Archetype: mixed

| # | Name | DB Code | Tier | HP | SVG | Needs |
|---|------|---------|------|-----|-----|-------|
| 37 | Nấm Độc | `nam_doc` | minion | 375,000 | `boss-37.svg` | Poison mushroom + spore cloud |
| 38 | Mối Chúa | `moi_chua` | minion | 525,000 | `boss-38.svg` | Termite queen + summon minions |
| 39 | Bọ Ngựa Đêm | `bo_ngua_dem` | elite | 630,000 | `boss-39.svg` | Night mantis + stealth |
| 40 | Đế Vương | `de_vuong` | FINAL BOSS | 1,050,000 | `boss-40.svg` | 4-phase final boss (see below) |

#### BOSS #40 — Đế Vương: 4-Phase Final Boss

| Phase | Name | HP Range | ATK | DEF | Special |
|-------|------|----------|-----|-----|---------|
| 1 — Giáp Đá | 100%-75% | 250 | 500 | "Giáp thần!" — Tank mode |
| 2 — Cuồng Sát | 75%-50% | 600 | 0 | "Tam liên kích!" — Assassin mode, DOT 2%/turn |
| 3 — Hồi Sinh | 50%-25% | 300 | 150 | "Hồi sinh!" — Healer, summons Lính Hộ Vệ |
| 4 — Hủy Diệt | 25%-0% | 900 | 0 | "Hủy diệt!" — Glass cannon, true damage 12%/2t |

---

## 2. BUTTON / UI SVGs

### 2A. Game Action Buttons — BOSS COMBAT (Priority: HIGH)

| # | Button | Screen | Current Icon | States | File |
|---|--------|--------|-------------|--------|------|
| 1 | Dodge (NÉ) | BattleScreen | `🏃` emoji | ready/active(red bounce)/cooldown/disabled | `SkillButton.tsx` |
| 2 | ULT (Chiêu) | BattleScreen | `⚡` emoji | locked/charging/ready(glow)/active/disabled | `SkillButton.tsx` |
| 3 | Retreat | BattleScreen | `✕` or `🏃` | normal/confirm-dialog | `BattleTopBar.tsx` |
| 4 | Retry | BattleResult | `🔄` emoji | normal/pressed | `BattleResult.tsx` |
| 5 | Back/Map | BattleResult | `📋` emoji | normal/pressed | `BattleResult.tsx` |
| 6 | FIGHT! | BossDetailSheet | `material: swords` | normal/pressed | `BossDetailSheet.tsx` |

### 2B. Farm Action Dock — FARMING SCREEN (Priority: HIGH)

| # | Button | Current Icon | Color | File |
|---|--------|-------------|-------|------|
| 1 | Water | `material: water_drop` | Blue #4FC3F7 | `FarmingScreen.tsx` |
| 2 | Prayer | `🙏` emoji | Purple #9575CD | `FarmingScreen.tsx` |
| 3 | Quiz | `material: menu_book` | Orange #FFB74D | `FarmingScreen.tsx` |
| 4 | Market | `material: monitoring` | Teal #26A69A | `FarmingScreen.tsx` |
| 5 | Campaign | `material: explore` | Amber gradient | `FarmingScreen.tsx` |
| 6 | Harvest FAB | `🌾` emoji | Green btn-green | `FarmingScreen.tsx` |
| 7 | Clear FAB | `🧹` emoji | Red bg-red-500 | `FarmingScreen.tsx` |

### 2C. Bottom Navigation (Priority: MEDIUM)

| # | Tab | Current Icon | File |
|---|-----|-------------|------|
| 1 | Farm | `material: spa` | `BottomNav.tsx` |
| 2 | Shop | `material: storefront` | `BottomNav.tsx` |
| 3 | Inventory | `material: inventory_2` | `BottomNav.tsx` |
| 4 | Friends | `material: group` | `BottomNav.tsx` |
| 5 | Campaign Map | `material: map` | `CampaignMapScreen.tsx` (inline) |
| 6 | Campaign Heroes | `material: sports_esports` | `CampaignMapScreen.tsx` (inline) |

### 2D. Quiz Buttons (Priority: MEDIUM)

| # | Button | Current Style | File |
|---|--------|--------------|------|
| 1 | Start Quiz | `material: play_circle` + green | `QuizScreen.tsx` |
| 2 | Answer A | Blue #4FC3F7, no icon | `QuizScreen.tsx` |
| 3 | Answer B | Green #AED581, no icon | `QuizScreen.tsx` |
| 4 | Answer C | Orange #FFB74D, no icon | `QuizScreen.tsx` |
| 5 | Answer D | Red #EF5350, no icon | `QuizScreen.tsx` |

### 2E. Other Screens (Priority: LOW)

| # | Button | Screen | Current Style | File |
|---|--------|--------|--------------|------|
| 1 | Sell item | Inventory | `💰` emoji | `InventoryScreen.tsx` |
| 2 | Invite friend | Friends | `💌` emoji | `FriendsScreen.tsx` |
| 3 | Leaderboard | Friends | `🏆` emoji | `FriendsScreen.tsx` |
| 4 | Allocate stats | Profile | Amber gradient text | `ProfileScreen.tsx` |
| 5 | Predict UP/DOWN | Market | `material: trending_up/down` | `MarketScreen.tsx` |
| 6 | PrayerButton | Prayer | `🙏` emoji + text | `PrayerButton.tsx` |
| 7 | LevelUpButton | FarmHeader | Text only | `LevelUpButton.tsx` |

---

## 3. SCREEN-BY-SCREEN SVG NEEDS

### CRITICAL PRIORITY

#### FarmingScreen (`/farm`) — Default screen, most time spent

| Element | Current | Needs |
|---------|---------|-------|
| Plant sprites (wheat/tomato/carrot/chili x 5 growth stages) | Unicode emoji (🌱🌿🌾🍅🥕🌶️) | 20 illustrated SVGs |
| Farmer avatar fallback | `🧑‍🌾` emoji | Illustrated farmer character SVG |
| Sun/Moon | CSS circle with glow | Illustrated SVG with animation |
| Soil mound/plot | CSS `.soil-mound-v2` | Illustrated farm plot SVG |
| Cloud decorations | `☁️` emoji | Cloud SVGs |

#### CampaignBattleScreen (`/campaign/battle/:bossId`)

| Element | Current | Needs |
|---------|---------|-------|
| 40 campaign boss sprites | Templated placeholder SVGs | 40 unique creature SVGs |
| Match-3 gem tiles (6 types) | CSS colored squares + emoji | 6 gem SVGs |
| Player character in combat | NO player sprite exists | Player character SVG |

### HIGH PRIORITY

#### LoginScreen (`/login`) — First impression

| Element | Current | Needs |
|---------|---------|-------|
| Animated bee | `🐝` emoji + CSS | SVG character |
| Animated worm | `🐛` emoji + CSS | SVG character |
| Sun/Moon scene | CSS circles | Illustrated SVG |
| Rolling hills | CSS shapes | Illustrated SVG |

#### BossScreen (`/boss`)

| Element | Current | Needs |
|---------|---------|-------|
| 8 weekly boss SVGs | Hand-crafted animated SVGs | DONE |
| Match-3 gem tiles | CSS + emoji | 6 gem SVGs (shared with campaign) |

#### CampaignMapScreen / CampaignZoneScreen

| Element | Current | Needs |
|---------|---------|-------|
| 10 zone icons | Emoji (🌾🍅🌶️🥕🏚️🏜️🎋🌊🌋🕳️) | 10 zone SVGs |
| Zone backgrounds | CSS gradient classes | 10 zone background SVGs |
| Stage/Boss node frames | CSS circles | Decorated node SVGs |

#### PrayerScreen (`/prayer`)

| Element | Current | Needs |
|---------|---------|-------|
| Temple/shrine scene | CSS gradient | Background SVG |
| Prayer hands icon | `🙏` emoji | Custom prayer SVG |
| Sparkle effects | CSS particles | Sparkle SVGs |

### MEDIUM PRIORITY

#### QuizScreen (`/quiz`)

| Element | Current | Needs |
|---------|---------|-------|
| Book mascot | Pure CSS (green face with eyes) | Illustrated book character SVG |
| Plant mascot | Pure CSS (stem + blob) | Illustrated plant character SVG |

#### ShopScreen, ProfileScreen, MarketScreen

| Element | Current | Needs |
|---------|---------|-------|
| Shop items | Emoji icons | Item illustration SVGs |
| Stat icons (ATK/HP/DEF/MANA) | Emoji (⚔️❤️🛡️✨) | Custom stat icon SVGs |
| Achievement badges | Emoji | Achievement SVGs |
| Market commodities | Material icons | Custom commodity SVGs |

---

## 4. EXISTING ASSET INVENTORY

### Categorized

| Status | Category | Count | Location |
|--------|----------|-------|----------|
| SVG animated (production) | Boss Rush bosses | 8 | `public/assets/bosses/` |
| SVG animated (placeholder) | Campaign bosses | 40 | `public/assets/campaign-bosses/` |
| PNG (static, acceptable) | App icons (PWA) | 4 | `public/icons/` |
| SVG (unused placeholder) | Vite default | 1 | `public/placeholder.svg` |
| Inline SVG (embedded) | Google logo | 1 | `LoginScreen.tsx` |
| Base64 data-URI SVG | Decorative pattern | 1 | `OgnHistoryScreen.tsx` |
| **MISSING FILE** | Default avatar | 1 | `/public/default-avatar.png` referenced in `InviteFriends.tsx:40` |

### No `src/assets/` directory exists — all assets in `public/`

---

## 5. ANIMATION STATE ARCHITECTURE

### How Boss Sprites Are Animated (NO SVG SWAP)

The system uses **CSS class-swapping only**. The same `<img src={boss.image}>` always renders. Only CSS changes:

```
idle:      class="animate-boss-idle"           → translateY(-8px) scale(1.02) loop
attacking: class="animate-boss-attack"         → translateY(-20px) scale(1.15) once
dead:      class="opacity-30 grayscale"        → fade + desaturate
enraged:   style="filter: drop-shadow(red)"    → increasing red glow
buffed:    style="filter: drop-shadow(blue)"   → blue/purple glow (shield/reflect)
```

### Battle States Tracked (React useState, NOT Zustand)

| State | Type | Drives |
|-------|------|--------|
| `animating` | boolean | Block input during gem swap |
| `combo` | number | ComboDisplay badge |
| `matchedCells` | Set | `animate-gem-pop` on matched gems |
| `screenShake` | boolean | `animate-screen-shake` |
| `bossAttackMsg` | object/null | Boss attack flash overlay |
| `ultActive` | boolean | ULT fullscreen flash |
| `skillWarning` | object/null | Boss skill warning + `animate-boss-attack` |
| `result` | enum | `'fighting'` / `'victory'` / `'defeat'` |
| `popups` | array | `animate-damage-float` numbers |
| `enrageMultiplier` | number | CSS filter intensity |
| `currentPhase` (campaign) | 1-4 | Phase markers on HP bar |
| `isStunned` (campaign) | boolean | Stun overlay with spin |
| `lockedGems` (campaign) | Set | `opacity-50` + lock icon on gems |
| `deathPhase` (campaign) | enum | `'none'` / `'dying'` / `'done'` |

### SVG Animation Requirements

SVGs need to support these CSS states via class/filter:
- **idle** — default loop animation (bob/float/bounce) inside the SVG itself
- **attack** — CSS applies `translate + scale` (handled externally)
- **hurt** — CSS applies `opacity + filter` (handled externally)
- **dead** — CSS applies `opacity-30 grayscale` (handled externally)
- **enrage** — CSS applies `filter: drop-shadow(red glow)` (handled externally)

SVGs should contain **idle animation only** internally. All other states are CSS-driven externally.

### All Custom @keyframes (28 in Tailwind + 15+ in CSS)

| Animation | Duration | Purpose |
|-----------|----------|---------|
| `boss-idle` | 2s loop | Boss float up/down |
| `boss-attack` | 0.6s once | Boss lunge forward |
| `boss-atk-flash` | 0.8s once | Red fullscreen flash |
| `ult-flash` | 1.5s once | Purple ULT flash |
| `screen-shake` | 0.5s once | Viewport shake |
| `damage-float` | 1.5s once | Floating damage numbers |
| `gem-pop` | 0.35s once | Gem disappear |
| `gem-swap` | 0.25s once | Gem selection pulse |
| `gem-land` | 0.3s once | Gem gravity fall |
| `grid-shake` | 0.35s once | Board shake on combo |
| `scale-in` | 0.3s once | Phase transition / results |
| `fade-in` | 0.3s once | Overlays |
| `dodge-pulse` | 0.4s loop | Dodge button glow |
| `ult-glow` | 1.5s loop | ULT ready glow |
| `plant-sway` | 4s loop | Farm plant sway |
| `rain-drop` | 1s loop | Weather rain |
| `snow-fall` | 5s loop | Weather snow |
| `prayer-glow` | 2s loop | Prayer button glow |
| `campaign-ping` | - | Map node pulse |
| `hp-hit-flash` | 0.4s once | HP bar shake/red |
| `hp-critical-pulse` | infinite | HP bar red glow |
| `combo-badge-pulse` | - | Combo badge effects |

---

## 6. MASTER ASSET LIST — SVGs TO CREATE

### BOSS / ENEMY SVGs

| # | Name | Code | Zone | Tier | Animations Needed | Priority | Est. Files |
|---|------|------|------|------|------------------|----------|------------|
| 1-4 | Rệp family (Con/Lính/Cánh/Chúa) | Z1 | Ruộng Lúa | minion-boss | idle (internal) | HIGH | 4 SVG |
| 5-8 | Sâu family + Bướm Đêm | Z2 | Vườn Cà Chua | minion-boss | idle (internal) | HIGH | 4 SVG |
| 9-12 | Bọ family + Bọ Ngựa | Z3 | Vườn Ớt | minion-boss | idle (internal) | HIGH | 4 SVG |
| 13-16 | Châu Chấu family + Dế Mèn | Z4 | Rẫy Cà Rốt | minion-boss | idle (internal) | HIGH | 4 SVG |
| 17-20 | Bọ Xít + Ốc Sên family | Z5 | Nhà Kho | minion-boss | idle (internal) | MEDIUM | 4 SVG |
| 21-24 | Chuột family | Z6 | Đồng Hoang | minion-boss | idle (internal) | MEDIUM | 4 SVG |
| 25-28 | Sâu Róm/Bò Cạp/Rết/Rồng Đất | Z7 | Rừng Tre | minion-boss | idle (internal) | MEDIUM | 4 SVG |
| 29-32 | Đỉa/Ếch/Rắn/Rồng Nước | Z8 | Đầm Lầy | minion-boss | idle (internal) | MEDIUM | 4 SVG |
| 33-36 | Bọ Lửa/Thằn Lằn/Phượng Hoàng/Rồng Lửa | Z9 | Núi Lửa | minion-boss | idle (internal) | LOW | 4 SVG |
| 37-40 | Nấm Độc/Mối Chúa/Bọ Ngựa Đêm/Đế Vương | Z10 | Thế Giới Ngầm | minion-boss | idle (internal) | LOW | 4 SVG |
| **SUBTOTAL** | | | | | | | **40 SVG** |

> Note: Each SVG only needs **idle animation** internally. Attack/hurt/dead states are handled by external CSS classes.

### PLANT SPRITE SVGs

| # | Plant | Growth Stages | SVG Names | Priority |
|---|-------|--------------|-----------|----------|
| 1 | Wheat (Lúa Mì) | seed, sprout, growing, ready, harvested | wheat-1..5.svg | HIGH |
| 2 | Tomato (Cà Chua) | seed, sprout, growing, ready, harvested | tomato-1..5.svg | HIGH |
| 3 | Carrot (Cà Rốt) | seed, sprout, growing, ready, harvested | carrot-1..5.svg | HIGH |
| 4 | Chili (Ớt) | seed, sprout, growing, ready, harvested | chili-1..5.svg | HIGH |
| **SUBTOTAL** | | | | **20 SVG** |

### MATCH-3 GEM SVGs

| # | Gem Type | Color | SVG Name | Priority |
|---|----------|-------|----------|----------|
| 1 | Gem type 1 | Red | gem-red.svg | HIGH |
| 2 | Gem type 2 | Blue | gem-blue.svg | HIGH |
| 3 | Gem type 3 | Green | gem-green.svg | HIGH |
| 4 | Gem type 4 | Yellow | gem-yellow.svg | HIGH |
| 5 | Gem type 5 | Purple | gem-purple.svg | HIGH |
| 6 | Gem type 6 | Orange | gem-orange.svg | HIGH |
| **SUBTOTAL** | | | | **6 SVG** |

### UI / BUTTON SVGs

| # | Name | Screen | Style | Priority |
|---|------|--------|-------|----------|
| 1 | Dodge skill icon | BattleScreen | Evasion/dash icon | HIGH |
| 2 | ULT skill icon | BattleScreen | Lightning/star burst | HIGH |
| 3 | Water action icon | FarmingScreen | Water droplet | MEDIUM |
| 4 | Quiz action icon | FarmingScreen | Open book | MEDIUM |
| 5 | Market action icon | FarmingScreen | Chart/coins | MEDIUM |
| 6 | Campaign action icon | FarmingScreen | Compass/map | MEDIUM |
| 7 | Harvest icon | FarmingScreen | Scythe/wheat | MEDIUM |
| 8 | Prayer icon | PrayerScreen | Praying hands | MEDIUM |
| **SUBTOTAL** | | | | **8 SVG** |

### SCENE / DECORATION SVGs

| # | Name | Screen | Style | Priority |
|---|------|--------|-------|----------|
| 1 | Illustrated Sun | Farm/Login | Warm sun with rays | MEDIUM |
| 2 | Illustrated Moon | Farm/Login | Crescent moon | MEDIUM |
| 3 | Farm soil plot | FarmingScreen | Dirt mound | MEDIUM |
| 4 | 10x Zone icons | CampaignMap | Zone-themed icons | MEDIUM |
| 5 | Book mascot | QuizScreen | Friendly book face | LOW |
| 6 | Animated bee | LoginScreen | Cute bee character | LOW |
| 7 | Player character | BattleScreen | Farmer hero | LOW |
| **SUBTOTAL** | | | | **17 SVG** |

---

## 7. GRAND SUMMARY

| Category | Files | Priority |
|----------|-------|----------|
| Campaign Boss SVGs (replace placeholder) | 40 | HIGH → LOW (by zone) |
| Plant Sprite SVGs | 20 | HIGH |
| Match-3 Gem SVGs | 6 | HIGH |
| UI / Button Icon SVGs | 8 | MEDIUM |
| Scene / Decoration SVGs | 17 | MEDIUM → LOW |
| **GRAND TOTAL** | **91 SVG files** | |

---

## 8. CREATION ORDER (by priority)

### Phase 1 — CRITICAL (blocks visual quality)
1. `boss-1.svg` through `boss-16.svg` — Zones 1-4 campaign bosses (16 SVGs)
2. Plant sprites: wheat, tomato, carrot, chili x 5 stages (20 SVGs)
3. Match-3 gem tiles x 6 (6 SVGs)

### Phase 2 — HIGH (improves core experience)
4. `boss-17.svg` through `boss-32.svg` — Zones 5-8 campaign bosses (16 SVGs)
5. Dodge + ULT skill button icons (2 SVGs)
6. Farm action dock icons x 5 (5 SVGs)

### Phase 3 — MEDIUM (polish)
7. `boss-33.svg` through `boss-40.svg` — Zones 9-10 campaign bosses (8 SVGs)
8. Zone map icons x 10 (10 SVGs)
9. Sun/Moon/Soil scene elements (3 SVGs)
10. Prayer icon (1 SVG)

### Phase 4 — LOW (nice to have)
11. Book/Plant mascots for Quiz (2 SVGs)
12. Bee/Worm for Login (2 SVGs)
13. Player character for Battle (1 SVG)

---

## 9. DESIGN SYSTEM CONSTRAINTS

```
FARMVERSE SVG DESIGN SYSTEM:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
ViewBox:
  - Characters (bosses/plants): 200×240
  - Icons/buttons: 48×48
  - Gems: 64×64
  - Scene elements: variable (respect aspect ratio)

Background: transparent (no background fill)

Color palette:
  Primary green:   #5a8a22 / #8ab840
  Enemy red:       #cc3020 / #ff6644
  UI gold:         #ffcc44 / #ff8800
  Dark BG:         #0f0f1e / #1a1a2e
  Glow effects:    SVG filter blur + flood-color
  Zone 1-2:        Green tones (fields)
  Zone 3-4:        Orange/red tones (chili/carrot)
  Zone 5-6:        Brown/gray tones (warehouse/wasteland)
  Zone 7-8:        Dark green/blue (forest/swamp)
  Zone 9-10:       Red/purple/black (volcano/underworld)

Animation style:
  - CSS @keyframes INSIDE SVG <style> tag
  - idle animation only (bob/float/bounce)
  - NO JavaScript, NO SMIL <animate>
  - External states (attack/hurt/dead) via CSS class on parent

File naming:
  - Campaign bosses: boss-{1-40}.svg
  - Weekly bosses: {slug}.svg (rep-xanh, sau-to, etc.)
  - Plants: {plant}-{stage}.svg (wheat-1.svg ... wheat-5.svg)
  - Gems: gem-{color}.svg
  - Icons: icon-{name}.svg

Performance:
  - Max 50 animated elements per SVG
  - Max 80 lines per file (match existing boss style)
  - Target: Android budget (Samsung A series)
  - Avoid filters/blurs on mobile (use solid shadows)
  - Prefer transform animations over path morphing

Tier visual progression (campaign bosses):
  - minion: simple, small body, 1 color
  - elite: medium, accessories, 2 colors + glow
  - boss: large, ornate, 3+ colors + aura + particles
```

---

## 10. BUGS FOUND DURING AUDIT

| # | Issue | File | Severity |
|---|-------|------|----------|
| 1 | **MISSING FILE:** `/public/default-avatar.png` referenced but doesn't exist | `InviteFriends.tsx:40` | LOW (fallback image 404) |
| 2 | Campaign bosses are all placeholder-grade with identical template | `public/assets/campaign-bosses/` | HIGH (visual quality) |
| 3 | Plant sprites are Unicode emoji only — no image files at all | `growth.ts`, `PlantSprite.tsx` | MEDIUM (core farming visual) |
| 4 | Duplicate BottomNav code in CampaignMapScreen + CampaignZoneScreen | Both files | LOW (code quality) |

---

*Report generated by SVG Audit Scan — FARMVERSE Frontend*
