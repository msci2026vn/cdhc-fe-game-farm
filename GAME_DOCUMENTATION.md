# Organic Kingdom - Game Documentation

> **Version:** 1.0.0
> **Last Updated:** 2026-02-09
> **Tech Stack:** React 18.3 + TypeScript + Vite 5.4 + Zustand 5 + Tailwind CSS 3.4

---

## Mục Lục

1. [Tổng Quan Dự Án](#1-tổng-quan-dự-án)
2. [Kiến Trúc & Cấu Trúc Thư Mục](#2-kiến-trúc--cấu-trúc-thư-mục)
3. [Hệ Thống Routing](#3-hệ-thống-routing)
4. [State Management (Zustand)](#4-state-management-zustand)
5. [Game Mechanics](#5-game-mechanics)
6. [Data Models & Types](#6-data-models--types)
7. [Shared Components](#7-shared-components)
8. [API Client & Backend Integration](#8-api-client--backend-integration)
9. [Performance Audit & Tối Ưu](#9-performance-audit--tối-ưu)
10. [Kết Nối Backend Bun.js](#10-kết-nối-backend-bunjs---các-trường-cần-thiết)

---

## 1. Tổng Quan Dự Án

### Mô tả
**Organic Kingdom** là game nông trại hữu cơ giáo dục trên mobile web, hoàn toàn bằng tiếng Việt. Người chơi trồng cây, chăm sóc vườn, chiến đấu boss (puzzle match-3), trả lời quiz nông nghiệp, và tương tác xã hội.

### Thống kê
| Hạng mục | Số lượng |
|----------|----------|
| Tổng file TypeScript/React | 111 |
| Routes | 7 |
| Zustand Stores | 6 |
| Custom Hooks | 5 |
| Screen Components | 7 |
| UI Components (shadcn) | 51 |
| Farming Components | 11 |
| Boss Components | 3 |
| Friends Components | 4 |
| Shared Components | 8 |
| Loại cây trồng | 5 |
| Boss | 8 |
| Câu hỏi Boss | 20 |
| Câu hỏi Quiz | 12 |
| Level XP | 21 |
| Loại thời tiết | 8 |

### Tech Stack
| Technology | Version | Mục đích |
|-----------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.8.3 | Type safety |
| Vite | 5.4.19 | Build tool (SWC) |
| React Router | 6.30.1 | Client-side routing |
| Zustand | 5.0.11 | State management |
| TanStack React Query | 5.83.0 | Server state (configured, chưa sử dụng) |
| Tailwind CSS | 3.4.17 | Styling |
| shadcn/ui + Radix UI | Latest | UI components |
| Lucide React | 0.462.0 | Icons |
| Vitest | 3.2.4 | Testing |

### Đặc điểm chính
- **Mobile-first**: Max width 430px, touch-optimized (44px+ tap targets)
- **100% Client-side**: Tất cả dữ liệu hardcoded, chưa kết nối API
- **Không persistence**: Game reset khi refresh trang
- **Không audio**: Hoàn toàn im lặng
- **CSS-only animations**: Không dùng Canvas/WebGL, tất cả hiệu ứng bằng CSS

---

## 2. Kiến Trúc & Cấu Trúc Thư Mục

```
src/
├── main.tsx                          # React entry point
├── App.tsx                           # Router & QueryClientProvider
├── App.css                           # ⚠️ Dead code (Vite template)
├── index.css                         # Global styles (253 dòng)
│
├── components/ui/                    # shadcn/ui (51 files) ⚠️ KHÔNG ĐƯỢC SỬ DỤNG
│
├── hooks/
│   ├── use-mobile.tsx                # Mobile detection
│   └── use-toast.ts                  # Toast hook
│
├── lib/
│   └── utils.ts                      # cn() utility (clsx + tailwind-merge)
│
├── pages/
│   └── NotFound.tsx                  # 404 page
│
├── shared/
│   ├── api/client.ts                 # API fetch client
│   ├── components/                   # Shared UI components (8 files)
│   │   ├── BottomNav.tsx             # Tab navigation bar
│   │   ├── CooldownTimer.tsx         # Countdown component
│   │   ├── EmptyState.tsx            # Empty state display
│   │   ├── Header.tsx                # Page header
│   │   ├── LoadingSpinner.tsx        # Loading animation
│   │   ├── PointsFlyUp.tsx           # Flying points animation
│   │   ├── ScreenShell.tsx           # Screen wrapper
│   │   └── Toast.tsx                 # Toast notification
│   ├── hooks/useCooldown.ts          # Cooldown timer hook
│   ├── stores/                       # Global Zustand stores
│   │   ├── playerStore.ts            # XP, Level
│   │   ├── activityStore.ts          # Activities, Inventory
│   │   └── uiStore.ts               # Toasts, FlyUp text
│   ├── types/common.ts              # ApiResponse, User, etc.
│   └── utils/
│       ├── constants.ts              # API_BASE_URL, cooldowns, stale times
│       └── format.ts                 # formatOGN, formatTime, formatDate
│
└── modules/
    ├── auth/screens/LoginScreen.tsx           # Login (stub)
    ├── splash/screens/SplashScreen.tsx        # Splash/Landing
    ├── farming/
    │   ├── components/                        # 11 farming components
    │   ├── hooks/useActionButtons.ts
    │   ├── screens/FarmingScreen.tsx           # Main farm (313 dòng)
    │   ├── stores/farmStore.ts                # Farm state
    │   ├── stores/weatherStore.ts             # Weather state
    │   ├── types/farm.types.ts
    │   └── utils/growth.ts                    # Growth calculations
    ├── boss/
    │   ├── components/                        # BossFight, BossFightM3, BossList
    │   ├── data/bosses.ts                     # 8 bosses data
    │   ├── data/bossQuestions.ts              # 20 T/F questions
    │   ├── hooks/useBossFight.ts              # Quiz boss (deprecated)
    │   ├── hooks/useMatch3.ts                 # Match-3 boss (active)
    │   ├── screens/BossScreen.tsx
    │   └── stores/bossProgressStore.ts
    ├── quiz/
    │   ├── data/questions.ts                  # 12 MC questions
    │   └── screens/QuizScreen.tsx
    ├── shop/screens/ShopScreen.tsx
    ├── profile/screens/ProfileScreen.tsx
    └── friends/
        ├── components/                        # FriendGarden, FriendsList, etc.
        └── data/friends.ts                    # Mock friends data
```

---

## 3. Hệ Thống Routing

**Framework:** React Router v6 (BrowserRouter)

| Route | Component | Lazy Load | Mô tả |
|-------|-----------|-----------|--------|
| `/` | SplashScreen | ✅ | Splash → auto-redirect `/farm` sau 2.8s |
| `/login` | LoginScreen | ✅ | Stub (Google login → redirect `/farm`) |
| `/farm` | FarmingScreen | ✅ | Main farming game |
| `/boss` | BossScreen | ✅ | Boss selection & match-3 fights |
| `/quiz` | QuizScreen | ✅ | Educational quiz |
| `/shop` | ShopScreen | ✅ | Item shop (4 tabs) |
| `/profile` | ProfileScreen | ✅ | User profile (4 tabs) |
| `*` | → `/` | - | 404 redirect |

**Bottom Navigation:** Farm, Boss, Shop, Profile (hiển thị trên mọi screen)

---

## 4. State Management (Zustand)

### 4.1 playerStore
```typescript
// src/shared/stores/playerStore.ts
interface PlayerState {
  xp: number;        // Kinh nghiệm tích lũy
  level: number;     // Level hiện tại (1-20)
  addXp(amount: number): { leveledUp: boolean; newLevel: number };
}
```

**Bảng XP (tích lũy):**
```
Level:  1    2    3     4     5     6     7     8      9     10
XP:     0    50   120   220   360   550   800   1100   1500  2000

Level:  11    12    13    14    15    16     17     18     19     20
XP:     2600  3400  4400  5600  7000  9000   11500  14500  18000  22000
```

**Danh hiệu:**
| Level | Danh hiệu |
|-------|-----------|
| 1-2 | Nông dân Tập sự |
| 3-4 | Nông dân Đồng |
| 5-9 | Nông dân Bạc |
| 10-14 | Nông dân Vàng |
| 15+ | Nông dân Kim Cương |

**XP Rewards:**
| Hành động | XP |
|-----------|-----|
| Trồng cây | 10 |
| Tưới nước | 5 |
| Thu hoạch | 25 |
| Bắt sâu | 8 |
| Thắng boss | 15-250 (tùy boss) |
| Quiz đúng | 8 |

### 4.2 farmStore
```typescript
// src/modules/farming/stores/farmStore.ts
interface FarmState {
  plots: FarmPlot[];
  ogn: number;                          // Tiền tệ (bắt đầu: 1250)
  waterCooldowns: Record<string, number>;
  plantSeed(plantType, slotIndex): void;
  waterPlot(plotId): boolean;           // Cooldown 15s, +15 happiness
  harvestPlot(plotId): number;          // Trả OGN reward
  tickHappiness(): void;               // Decay mỗi 10s
  addOgn(amount): void;
}
```

**5 loại cây:**
| Cây | ID | Emoji | Thời gian | OGN Reward | Giá mua |
|-----|----|-------|-----------|------------|---------|
| Cà Chua | tomato | 🍅 | 120s | 100 | 200 |
| Rau Muống | lettuce | 🥬 | 90s | 60 | 150 |
| Dưa Leo | cucumber | 🥒 | 180s | 150 | 350 |
| Cà Rốt | carrot | 🥕 | 150s | 120 | 280 |
| Ớt | chili | 🌶️ | 200s | 180 | 400 |

### 4.3 weatherStore
```typescript
// src/modules/farming/stores/weatherStore.ts
interface WeatherState {
  weather: WeatherType;     // 8 loại
  timeOfDay: TimeOfDay;     // dawn, day, dusk, night
  setWeather(w): void;
  cycleWeather(): void;
  autoTimeOfDay(): void;    // Sync với giờ thực
}
```

**Ảnh hưởng thời tiết:**
| Thời tiết | Growth Multiplier | Happiness Decay |
|-----------|-------------------|-----------------|
| Rain 🌧️ | 1.5x (nhanh nhất) | 0.5x (chậm nhất) |
| Storm ⛈️ | 1.2x | 1.8x |
| Sunny ☀️ | 1.0x | 1.0x |
| Cloudy ⛅ | 0.9x | 0.8x |
| Wind 💨 | 0.85x | 1.2x |
| Hot 🔥 | 0.7x | 2.0x (nhanh nhất) |
| Cold 🥶 | 0.6x | 1.5x |
| Snow 🌨️ | 0.5x (chậm nhất) | 1.3x |

### 4.4 activityStore
```typescript
// src/shared/stores/activityStore.ts
interface ActivityState {
  likes: number; comments: number; gifts: number; harvests: number;
  activities: ActivityEntry[];
  inventory: InventoryItem[];
  addLike(); addComment(); addGift(); addWater(); addHarvest();
  addPurchase(item): void;   // Upsert inventory by ID
}
```

### 4.5 uiStore
```typescript
// src/shared/stores/uiStore.ts
interface UIState {
  toasts: ToastItem[];
  flyUpText: string | null;
  addToast(message, type?): void;  // Auto-dismiss 3s
  showFlyUp(text): void;           // Auto-clear 1.2s
}
```

### 4.6 bossProgressStore
```typescript
// src/modules/boss/stores/bossProgressStore.ts
interface BossProgress {
  killedBosses: Record<string, number>;
  totalDmgDealt: number;
  addKill(bossId): void;
  addDmg(amount): void;
  getKills(bossId): number;
}
```

---

## 5. Game Mechanics

### 5.1 Farming System
- **5 giai đoạn**: seed(0-15%) → sprout(15-40%) → seedling(40-75%) → mature(75-100%) → dead
- **Growth**: `(elapsed * weather_multiplier) / growthDuration * 100`
- **Happiness**: 0-100, decay 2/tick (mỗi 10s), modified by weather
- **Thu hoạch**: growth ≥ 100% → OGN reward + 25 XP
- **Tưới nước**: cooldown 15s (demo) / 1h (production), +15 happiness, +5 XP

### 5.2 Bug Catch Mini-Game
- 15 giây, bắt sâu bọ (6 loại emoji)
- Spawn mỗi 1.2s, despawn sau 2.8s
- Mỗi con bắt được = 2 OGN

### 5.3 Boss Battle (Match-3 - Active)
- Lưới 6x6, 4 loại gem: ATK(45dmg), HP(+30), DEF(+25 shield), STAR(25dmg + 8 ult)
- Combo multiplier: 1x → 5x (COMBO, SUPER, MEGA, ULTRA, LEGENDARY, GODLIKE)
- Boss auto-attack mỗi 4s, 20% chance skill đặc biệt
- Dodge mechanic: 1.5s warning → 0.8s dodge window
- Ultimate: 15% boss max HP khi charge 100%
- Player: 1000 HP, 200 shield

**8 Boss:**
| Boss | HP | ATK | Reward | XP | Level | Difficulty |
|------|-----|-----|--------|-----|-------|-----------|
| Rệp Xanh | 500 | 20 | 5 | 15 | 1 | Easy |
| Sâu Tơ | 800 | 25 | 8 | 25 | 1 | Easy |
| Bọ Rùa | 1200 | 35 | 12 | 40 | 3 | Medium |
| Châu Chấu | 2000 | 45 | 20 | 60 | 5 | Medium |
| Bọ Xít | 3000 | 55 | 30 | 80 | 8 | Hard |
| Ốc Sên | 4000 | 65 | 40 | 120 | 10 | Hard |
| Chuột Đồng | 5000 | 80 | 50 | 150 | 12 | Hard |
| Rồng Lửa | 10000 | 100 | 80 | 250 | 15 | Legendary |

### 5.4 Quiz System
- 5 câu random/session từ pool 12 câu (A, B, C, D)
- Đúng: +1 OGN, +8 XP
- Badge: 🏆 (≥80%), ⭐ (≥50%), 📚 (<50%)

### 5.5 Shop
- 22 items, 4 tab (Seeds, Tools, Cards, NFT)
- Giá: 150-5000 OGN
- Rarity: common, rare (xanh), epic (tím), legendary (vàng)

### 5.6 Social Features
- 5 mock friends
- Tương tác: tưới (+5 OGN), like (+2 OGN), comment (+1 OGN), gift (5-30 OGN)
- Invite: referral code, share Telegram/Facebook, 50 OGN/friend
- Leaderboard: sort by OGN hoặc harvest count

### 5.7 OGN Economy
| Nguồn thu | OGN |
|-----------|-----|
| Thu hoạch | 60-180 |
| Bắt sâu | 2/con |
| Quiz đúng | 1 |
| Boss thắng | 5-80 |
| Tưới bạn bè | 5 |
| Like bạn bè | 2 |
| Comment | 1 |
| Invite referral | 50/người |

---

## 6. Data Models & Types

### FarmPlot
```typescript
interface FarmPlot {
  id: string;
  slotIndex: number;
  plantType: PlantType;
  plantedAt: number;       // timestamp ms
  happiness: number;       // 0-100
  lastWateredAt: number;
  isDead: boolean;
  mood: 'happy' | 'sad' | 'unknown';
}
```

### PlantType
```typescript
interface PlantType {
  id: string;
  name: string;            // Vietnamese name
  emoji: string;
  growthDurationMs: number;
  rewardOGN: number;
  shopPrice: number;
}
```

### BossInfo
```typescript
interface BossInfo {
  id: string;
  name: string;
  emoji: string;
  hp: number;
  attack: number;
  reward: number;
  xpReward: number;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  unlockLevel: number;
}
```

### API Types
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: string;
}
```

---

## 7. Shared Components

| Component | File | Mô tả |
|-----------|------|--------|
| BottomNav | `shared/components/BottomNav.tsx` | Tab navigation (Farm, Boss, Shop, Profile) |
| CooldownTimer | `shared/components/CooldownTimer.tsx` | Countdown hiển thị |
| EmptyState | `shared/components/EmptyState.tsx` | Empty state UI |
| Header | `shared/components/Header.tsx` | Page header với back button |
| LoadingSpinner | `shared/components/LoadingSpinner.tsx` | Loading animation |
| PointsFlyUp | `shared/components/PointsFlyUp.tsx` | Floating +points animation |
| ScreenShell | `shared/components/ScreenShell.tsx` | Screen wrapper/layout |
| Toast | `shared/components/Toast.tsx` | Toast notification |

---

## 8. API Client & Backend Integration

### Hiện trạng
```typescript
// src/shared/api/client.ts
const API_BASE_URL = 'https://sta.cdhc.vn/api';

api.get<T>(endpoint, options?)   // GET with credentials: 'include'
api.post<T>(endpoint, body?, options?)  // POST with JSON body
// 401 → redirect /login
```

**⚠️ API client đã định nghĩa nhưng CHƯA được gọi từ bất kỳ component nào. Tất cả dữ liệu hiện tại là hardcoded.**

### Stale Time Constants (đã cấu hình, chưa sử dụng)
```typescript
STALE_TIME = {
  PLOTS: 60_000,        // 1 phút
  SENSOR: 30_000,       // 30 giây
  LEADERBOARD: 300_000, // 5 phút
  CAMERA: 120_000,      // 2 phút
  WEATHER: 300_000,     // 5 phút
}
```

---

## 9. Performance Audit & Tối Ưu

### 🔴 CRITICAL Issues (Phải sửa ngay)

#### 9.1 FarmingScreen Force Re-render (MỨC ĐỘ: CRITICAL)
**File:** `src/modules/farming/screens/FarmingScreen.tsx`, line 44, 52-54
```typescript
const [, forceUpdate] = useState(0);
setInterval(() => forceUpdate((n) => n + 1), 2000);
```
- Re-render toàn bộ FarmingScreen + 11+ child components mỗi 2 giây
- Không component nào được wrap React.memo → cascade re-render
- **Fix:** Dùng Zustand selector cụ thể + React.memo cho children

#### 9.2 BossFight.tsx Infinite Reward Bug (MỨC ĐỘ: CRITICAL)
**File:** `src/modules/boss/components/BossFight.tsx`, line 25
```typescript
if (won) addOgn(boss.reward); // TRONG RENDER BODY → gọi mỗi re-render!
```
- Store mutation trong render path → vô hạn OGN khi victory
- **Fix:** Chuyển vào useEffect với guard ref

#### 9.3 49 shadcn/ui Components KHÔNG ĐƯỢC SỬ DỤNG (MỨC ĐỘ: CRITICAL)
- 51 file trong `src/components/ui/` → KHÔNG file nào được import bởi app code
- Kéo theo ~15 packages dead weight (~340KB gzip): recharts, date-fns, react-day-picker, cmdk, vaul, sonner, 28 @radix-ui packages
- **Fix:** Xóa toàn bộ thư mục và remove dependencies

#### 9.4 Font Loading Waterfall (MỨC ĐỘ: CRITICAL)
**File:** `src/index.css`, line 5
```css
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;500;600;700;800&display=swap');
```
- CSS @import tạo 3-hop waterfall (CSS → Google CSS → font files)
- 9 font weight variants
- Không preconnect
- **Fix:** Chuyển sang `<link>` tags trong index.html + preconnect

#### 9.5 Không có Code Splitting / Compression (MỨC ĐỘ: CRITICAL)
**File:** `vite.config.ts` — chỉ 19 dòng, thiếu hoàn toàn:
- `build.rollupOptions.output.manualChunks` (vendor chunking)
- Compression plugin (gzip/brotli)
- `build.target` configuration
- `build.cssMinify: 'lightningcss'`

---

### 🟠 HIGH Issues

#### 9.6 Zero Error Boundaries
- Không có ErrorBoundary nào → runtime error crash toàn app
- Match-3 game logic (330 dòng) có thể crash
- **Fix:** Thêm ErrorBoundary cho mỗi route và game components

#### 9.7 47 instances `transition-all` (MỨC ĐỘ: HIGH)
- Browser transition MỌI CSS property khi chỉ cần transition 1-2
- Đặc biệt nghiêm trọng trên HP/XP bars dùng `width` + `transition-all`
- **Fix:** Đổi sang `transition-transform` hoặc specific properties

#### 9.8 BottomNav backdrop-filter: blur(20px) (MỨC ĐỘ: HIGH)
**File:** `src/shared/components/BottomNav.tsx`, line 16
- Hiển thị trên MỌI screen → GPU re-sample mỗi frame khi scroll
- **Fix:** Dùng opaque background trên budget devices

#### 9.9 Missing `touch-action: manipulation` (MỨC ĐỘ: HIGH)
- Zero usage trong cả project → 300ms tap delay trên mobile
- Đặc biệt ảnh hưởng: Match-3 gem grid, bug catch, quiz buttons
- **Fix:** Thêm `* { touch-action: manipulation; }` vào global CSS

#### 9.10 TypeScript Strict Mode OFF (MỨC ĐỘ: HIGH)
**File:** `tsconfig.app.json`
- `strict: false`, `strictNullChecks: false`, `noImplicitAny: false`
- Không bắt dead code, null references, type errors
- **Fix:** Enable `strict: true`

#### 9.11 Resource Hints Thiếu Hoàn Toàn (MỨC ĐỘ: HIGH)
**File:** `index.html` — zero preconnect, preload, prefetch, dns-prefetch
- **Fix:** Thêm preconnect cho fonts, preload critical resources

---

### 🟡 MEDIUM Issues

#### 9.12 Không có PWA/Service Worker
- Có meta tags PWA nhưng không có manifest.json, service worker
- Không cache offline, không installable
- **Fix:** Thêm vite-plugin-pwa + workbox

#### 9.13 8 Animations dùng Layout/Paint Properties
| Keyframe | Bad Property | Type |
|----------|-------------|------|
| splash-progress | width | Layout |
| accordion-down/up | height | Layout |
| event-pulse | boxShadow | Paint |
| ult-glow | boxShadow | Paint |
| dodge-pulse | boxShadow | Paint |
| boss-atk-flash | background | Paint |
| ult-flash | background | Paint |

**Fix:** Dùng `transform: scaleX()` cho width, `opacity` cho box-shadow/background

#### 9.14 Zero `content-visibility: auto`
- Các list components (FriendsList, Leaderboard, ShopScreen) không có
- **Fix:** Thêm `content-visibility: auto; contain-intrinsic-size: auto 80px;`

#### 9.15 Zero CSS Containment
- Match-3 gem grid (36 cells), WeatherOverlay (40-70 particles) không có contain
- **Fix:** Thêm `contain: layout style paint` cho gem cells, weather particles

#### 9.16 Zero `useTransition` / `useDeferredValue`
- Shop tab switching, Profile activity filter → immediate full re-render
- **Fix:** Wrap tab/filter changes trong `startTransition()`

#### 9.17 Progress Bars dùng `width` thay vì `transform: scaleX()`
- ~12 HP/XP/progress bars animate width → layout recalc mỗi frame
- **Fix:** Dùng `transform: scaleX()` + `transform-origin: left`

#### 9.18 16 instances `min-h-screen` (100vh)
- Trên mobile Safari, 100vh bao gồm address bar → content bị clip
- **Fix:** Dùng `min-h-[100svh]`

#### 9.19 Missing `overscroll-behavior: contain` trên Modals
- 10 scrollable modals/drawers thiếu → scroll chain to background
- **Fix:** Thêm `overscroll-behavior: contain`

#### 9.20 Inline Functions trong JSX (40+ instances)
- Đặc biệt trong `.map()` loops: Match-3 (36 closures/render), BugCatch, Shop, Quiz
- **Fix:** useCallback hoặc React Compiler

#### 9.21 Zustand Over-subscription
- Components destructure nhiều fields → re-render khi bất kỳ field nào thay đổi
- ProfileScreen subscribes 6 fields cùng lúc
- **Fix:** Dùng individual selectors: `usePlayerStore(s => s.level)`

#### 9.22 setTimeout/setInterval không cleanup
- `useBossFight.ts`, `useMatch3.ts` — nhiều setTimeout không clear khi unmount
- `useMatch3.ts` — 3 nested setTimeout trong boss auto-attack
- **Fix:** Track timeouts với ref, clear trong cleanup function

#### 9.23 Large Components (cần split)
| File | Lines | Nên tách thành |
|------|-------|----------------|
| BossFightM3.tsx | 383 | BossArena, GemGrid, PlayerStats, VictoryScreen |
| useMatch3.ts | 330 | useGemGrid, useBossAI, usePlayerStats |
| FriendGarden.tsx | 317 | GardenView, CommentsModal, GiftsModal |
| FarmingScreen.tsx | 313 | FarmView, FarmModals, FarmActionBar |

#### 9.24 Dead Code
- `src/App.css` (43 dòng) — Vite template, không sử dụng
- `src/modules/boss/components/BossFight.tsx` — Deprecated quiz boss mode
- `src/modules/boss/hooks/useBossFight.ts` — Deprecated quiz boss hook

#### 9.25 Global CSS nên tách theo module
**File:** `src/index.css` (253 dòng) — chứa styles cho TẤT CẢ screens
- Boss gem styles, weather styles, screen gradients đều load ngay cả khi không cần
- **Fix:** Co-locate styles với components hoặc dùng CSS modules

---

### 📊 Priority Implementation Checklist

#### Tuần 1 (Impact cao nhất)
- [ ] Fix BossFight.tsx infinite reward bug
- [ ] Xóa 49 unused shadcn/ui files + unused dependencies
- [ ] Thêm `touch-action: manipulation` globally
- [ ] Chuyển font loading từ CSS @import sang `<link>` + preconnect
- [ ] Thêm vite.config.ts: manualChunks, compression, build target
- [ ] Thêm ErrorBoundary cho routes và game components

#### Tuần 2 (Impact cao)
- [ ] Fix FarmingScreen forceUpdate → targeted state subscriptions
- [ ] Wrap child components với React.memo
- [ ] Đổi `transition-all` → specific transition properties
- [ ] Đổi progress bars từ `width` → `transform: scaleX()`
- [ ] Replace BottomNav blur với opaque background (budget devices)
- [ ] Thêm preconnect, preload resource hints

#### Tuần 3 (Impact trung bình)
- [ ] Thêm `content-visibility: auto` cho list components
- [ ] Thêm CSS containment cho gem grid, weather particles
- [ ] Fix 8 animations dùng layout/paint properties
- [ ] Thêm useTransition cho tab/filter switching
- [ ] Fix viewport units: `min-h-screen` → `min-h-[100svh]`
- [ ] Thêm overscroll-behavior cho modals
- [ ] Setup PWA (manifest + service worker + workbox caching)

#### Tuần 4 (Polish)
- [ ] Xóa dead code (App.css, deprecated BossFight quiz)
- [ ] Tách large components
- [ ] Tách global CSS theo module
- [ ] Enable TypeScript strict mode
- [ ] Thêm Core Web Vitals monitoring
- [ ] Cleanup setTimeout/setInterval refs
- [ ] Thêm device capability detection cho adaptive loading
- [ ] Test trên budget Android devices

---

## 10. Kết Nối Backend Bun.js - Các Trường Cần Thiết

### 10.1 Authentication APIs

#### `POST /api/auth/login`
```typescript
// Request
{ provider: 'google', token: string }

// Response
{
  success: boolean,
  data: {
    user: {
      id: string,
      name: string,
      email: string,
      avatarUrl: string,
      role: string
    },
    accessToken: string,
    refreshToken: string
  }
}
```

#### `POST /api/auth/refresh`
```typescript
// Request
{ refreshToken: string }

// Response
{ success: boolean, data: { accessToken: string, refreshToken: string } }
```

#### `GET /api/auth/me`
```typescript
// Response
{
  success: boolean,
  data: {
    user: User,
    profile: {
      id: string,
      userId: string,
      farmLevel: number,
      farmPoints: number,
      xp: number,
      level: number,
      ogn: number,
      totalHarvests: number,
      totalBossKills: number,
      referralCode: string,
      createdAt: string,
      updatedAt: string
    }
  }
}
```

### 10.2 Farm APIs

#### `GET /api/farm/plots`
```typescript
// Response
{
  success: boolean,
  data: {
    plots: Array<{
      id: string,
      slotIndex: number,
      plantType: {
        id: string,        // 'tomato', 'lettuce', 'cucumber', 'carrot', 'chili'
        name: string,
        emoji: string,
        growthDurationMs: number,
        rewardOGN: number,
        shopPrice: number
      },
      plantedAt: number,   // timestamp ms
      happiness: number,   // 0-100
      lastWateredAt: number,
      isDead: boolean,
      mood: 'happy' | 'sad' | 'unknown'
    }>,
    ogn: number             // Current OGN balance
  }
}
```

#### `POST /api/farm/plant`
```typescript
// Request
{
  plantTypeId: string,     // 'tomato' | 'lettuce' | 'cucumber' | 'carrot' | 'chili'
  slotIndex: number        // 0-based grid position
}

// Response
{
  success: boolean,
  data: {
    plot: FarmPlot,
    ognRemaining: number,
    xpGained: number       // 10 XP
  }
}
```

#### `POST /api/farm/water`
```typescript
// Request
{ plotId: string }

// Response
{
  success: boolean,
  data: {
    cooldownRemaining: number,  // seconds
    happinessGain: number,      // +15
    xpGained: number,           // 5 XP
    newHappiness: number
  },
  message?: string              // "Đang cooldown" if on cooldown
}
```

#### `POST /api/farm/harvest`
```typescript
// Request
{ plotId: string }

// Response
{
  success: boolean,
  data: {
    ognReward: number,
    xpGained: number,           // 25 XP
    ognTotal: number,
    leveledUp: boolean,
    newLevel?: number
  }
}
```

#### `GET /api/farm/weather`
```typescript
// Response
{
  success: boolean,
  data: {
    weather: 'sunny' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'wind' | 'cold' | 'hot',
    timeOfDay: 'dawn' | 'day' | 'dusk' | 'night',
    growthMultiplier: number,   // 0.5 - 1.5
    happinessModifier: number   // 0.5 - 2.0
  }
}
```

### 10.3 Boss APIs

#### `GET /api/boss/list`
```typescript
// Response
{
  success: boolean,
  data: {
    bosses: Array<{
      id: string,
      name: string,
      emoji: string,
      hp: number,
      attack: number,
      reward: number,        // OGN
      xpReward: number,
      description: string,
      difficulty: 'easy' | 'medium' | 'hard' | 'legendary',
      unlockLevel: number
    }>,
    playerProgress: {
      killedBosses: Record<string, number>,  // bossId → kill count
      totalDmgDealt: number
    }
  }
}
```

#### `POST /api/boss/fight/start`
```typescript
// Request
{ bossId: string }

// Response
{
  success: boolean,
  data: {
    fightId: string,         // Session ID
    boss: BossInfo,
    grid: GemType[][],       // 6x6 initial gem grid
    playerStats: {
      hp: number,            // 1000
      maxHp: number,
      shield: number,        // 200
      ultCharge: number      // 0
    }
  }
}
```

#### `POST /api/boss/fight/action`
```typescript
// Request
{
  fightId: string,
  action: 'tap_gem' | 'dodge' | 'ultimate',
  data?: {
    gemIndex?: number,       // For tap_gem (0-35)
    timestamp?: number       // For dodge timing validation
  }
}

// Response
{
  success: boolean,
  data: {
    grid: GemType[][],       // Updated grid after matches
    matches: Array<{ gems: number[], type: GemType }>,
    bossHp: number,
    playerHp: number,
    shield: number,
    ultCharge: number,
    combo: number,
    damage: number,
    bossAttack?: {
      skill: string,
      damage: number,
      dodged: boolean
    },
    victory?: boolean,
    defeat?: boolean,
    rewards?: {
      ogn: number,
      xp: number,
      leveledUp: boolean,
      newLevel?: number
    }
  }
}
```

### 10.4 Quiz APIs

#### `GET /api/quiz/start`
```typescript
// Response
{
  success: boolean,
  data: {
    sessionId: string,
    questions: Array<{
      id: string,
      question: string,
      image: string,         // Emoji
      options: Array<{
        letter: string,      // A, B, C, D
        text: string
      }>
    }>,
    totalQuestions: number    // 5
  }
}
// NOTE: Correct answers NOT included (server-side validation)
```

#### `POST /api/quiz/answer`
```typescript
// Request
{
  sessionId: string,
  questionId: string,
  answer: string             // 'A' | 'B' | 'C' | 'D'
}

// Response
{
  success: boolean,
  data: {
    correct: boolean,
    correctAnswer: string,   // Reveal after answer
    ognGained: number,       // 1 if correct, 0 if wrong
    xpGained: number,        // 8 if correct, 0 if wrong
    currentScore: number,
    questionIndex: number
  }
}
```

#### `POST /api/quiz/complete`
```typescript
// Request
{ sessionId: string }

// Response
{
  success: boolean,
  data: {
    score: number,
    totalQuestions: number,
    ognTotal: number,
    xpTotal: number,
    badge: 'trophy' | 'star' | 'book'
  }
}
```

### 10.5 Shop APIs

#### `GET /api/shop/items`
```typescript
// Response
{
  success: boolean,
  data: {
    items: Array<{
      id: string,
      name: string,
      emoji: string,
      desc: string,
      price: number,         // OGN
      category: 'seed' | 'tool' | 'card' | 'nft',
      rarity: 'common' | 'rare' | 'epic' | 'legendary',
      owned?: number         // Quantity already owned
    }>
  }
}
```

#### `POST /api/shop/buy`
```typescript
// Request
{ itemId: string, quantity?: number }

// Response
{
  success: boolean,
  data: {
    item: { id: string, name: string, emoji: string, quantity: number },
    ognRemaining: number
  },
  message?: string           // "Không đủ OGN" if insufficient
}
```

### 10.6 Social APIs

#### `GET /api/friends/list`
```typescript
// Response
{
  success: boolean,
  data: {
    friends: Array<{
      id: string,
      name: string,
      avatar: string,
      level: number,
      title: string,
      online: boolean,
      plantCount: number,
      totalHarvest: number,
      ogn: number
    }>
  }
}
```

#### `GET /api/friends/:friendId/garden`
```typescript
// Response
{
  success: boolean,
  data: {
    friend: Friend,
    plots: FarmPlot[],
    interactions: {
      canWater: boolean,
      canLike: boolean,
      canComment: boolean,
      giftsSent: string[]    // Gift IDs already sent today
    }
  }
}
```

#### `POST /api/friends/:friendId/interact`
```typescript
// Request
{
  action: 'water' | 'like' | 'comment' | 'gift',
  data?: {
    comment?: string,
    giftId?: string
  }
}

// Response
{
  success: boolean,
  data: {
    ognGained: number,       // 1-5 depending on action
    ognSpent?: number,       // For gifts
    cooldown?: number        // Seconds until next interaction
  }
}
```

#### `GET /api/leaderboard`
```typescript
// Request query params: ?sort=ogn|harvests&page=1&limit=20

// Response
{
  success: boolean,
  data: {
    items: Array<{
      rank: number,
      userId: string,
      name: string,
      avatar: string,
      level: number,
      ogn: number,
      harvests: number,
      isMe: boolean
    }>,
    total: number,
    myRank: number
  }
}
```

#### `POST /api/friends/invite`
```typescript
// Request
{ referralCode: string }

// Response
{
  success: boolean,
  data: {
    referralCode: string,
    inviteLink: string,
    totalInvited: number,
    ognEarned: number,       // 50 per friend
    invitedFriends: Array<{
      name: string,
      avatar: string,
      joinedAt: string,
      claimed: boolean
    }>
  }
}
```

### 10.7 Profile APIs

#### `GET /api/profile`
```typescript
// Response
{
  success: boolean,
  data: {
    user: User,
    stats: {
      level: number,
      xp: number,
      xpForNextLevel: number,
      ogn: number,
      totalHarvests: number,
      totalBossKills: number,
      totalDamage: number,
      likes: number,
      comments: number,
      gifts: number
    },
    inventory: Array<{
      id: string,
      name: string,
      emoji: string,
      desc: string,
      quantity: number,
      rarity: string
    }>,
    achievements: Array<{
      id: string,
      name: string,
      description: string,
      progress: number,
      target: number,
      completed: boolean,
      emoji: string
    }>,
    activities: Array<{
      type: string,
      text: string,
      emoji: string,
      timestamp: number
    }>
  }
}
```

### 10.8 Player Sync API

#### `POST /api/player/sync`
```typescript
// Batch sync endpoint — gửi state changes tích lũy
// Request
{
  xpGained: number,
  ognChanged: number,        // Can be negative
  actions: Array<{
    type: 'plant' | 'water' | 'harvest' | 'boss_kill' | 'quiz' | 'shop_buy' | 'social',
    data: Record<string, any>,
    timestamp: number
  }>
}

// Response
{
  success: boolean,
  data: {
    serverXp: number,        // Canonical XP
    serverOgn: number,       // Canonical OGN
    serverLevel: number,
    syncedAt: number
  }
}
```

### 10.9 WebSocket Events (Real-time)

```typescript
// Server → Client events
interface WSEvents {
  'weather:update': {
    weather: WeatherType,
    timeOfDay: TimeOfDay
  };
  'friend:online': {
    friendId: string,
    online: boolean
  };
  'friend:interaction': {
    fromName: string,
    action: 'water' | 'like' | 'gift',
    ognGained: number
  };
  'leaderboard:update': {
    myRank: number,
    topPlayers: LeaderboardEntry[]
  };
  'plant:status': {
    plotId: string,
    happiness: number,
    growth: number,
    isDead: boolean
  };
}
```

### 10.10 Database Schema (Bun.js Backend)

```sql
-- Users
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'player',
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Player Stats
CREATE TABLE player_stats (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  ogn INTEGER DEFAULT 1250,
  total_harvests INTEGER DEFAULT 0,
  total_boss_kills INTEGER DEFAULT 0,
  total_damage INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  gifts_count INTEGER DEFAULT 0
);

-- Farm Plots
CREATE TABLE farm_plots (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  slot_index INTEGER NOT NULL,
  plant_type_id TEXT NOT NULL,
  planted_at BIGINT NOT NULL,
  happiness INTEGER DEFAULT 100,
  last_watered_at BIGINT,
  is_dead BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, slot_index)
);

-- Water Cooldowns
CREATE TABLE water_cooldowns (
  user_id TEXT REFERENCES users(id),
  plot_id TEXT REFERENCES farm_plots(id),
  cooldown_until BIGINT NOT NULL,
  PRIMARY KEY(user_id, plot_id)
);

-- Boss Progress
CREATE TABLE boss_progress (
  user_id TEXT REFERENCES users(id),
  boss_id TEXT NOT NULL,
  kills INTEGER DEFAULT 0,
  total_damage INTEGER DEFAULT 0,
  PRIMARY KEY(user_id, boss_id)
);

-- Inventory
CREATE TABLE inventory (
  user_id TEXT REFERENCES users(id),
  item_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  PRIMARY KEY(user_id, item_id)
);

-- Activities
CREATE TABLE activities (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  type TEXT NOT NULL,        -- 'like','comment','gift','water','harvest','buy'
  text TEXT NOT NULL,
  emoji TEXT,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Friends
CREATE TABLE friendships (
  user_id TEXT REFERENCES users(id),
  friend_id TEXT REFERENCES users(id),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY(user_id, friend_id)
);

-- Daily Interactions (reset mỗi ngày)
CREATE TABLE daily_interactions (
  user_id TEXT REFERENCES users(id),
  friend_id TEXT REFERENCES users(id),
  interaction_type TEXT NOT NULL,  -- 'water','like','gift:type_id'
  interaction_date DATE DEFAULT CURRENT_DATE,
  PRIMARY KEY(user_id, friend_id, interaction_type, interaction_date)
);

-- Quiz Sessions
CREATE TABLE quiz_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  questions JSONB NOT NULL,       -- Array of question IDs
  answers JSONB DEFAULT '{}',     -- questionId → answer
  score INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Achievements
CREATE TABLE achievements (
  user_id TEXT REFERENCES users(id),
  achievement_id TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  PRIMARY KEY(user_id, achievement_id)
);
```

### 10.11 Bun.js Server Setup Example

```typescript
// server.ts (Bun.js)
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';

const app = new Hono();

// CORS for frontend
app.use('/*', cors({
  origin: ['http://localhost:8080', 'https://your-domain.com'],
  credentials: true,
}));

// JWT middleware
app.use('/api/*', jwt({ secret: process.env.JWT_SECRET! }));

// Routes
app.route('/api/auth', authRoutes);
app.route('/api/farm', farmRoutes);
app.route('/api/boss', bossRoutes);
app.route('/api/quiz', quizRoutes);
app.route('/api/shop', shopRoutes);
app.route('/api/friends', friendRoutes);
app.route('/api/profile', profileRoutes);
app.route('/api/player', playerRoutes);
app.route('/api/leaderboard', leaderboardRoutes);

// WebSocket for real-time
const server = Bun.serve({
  port: 3000,
  fetch: app.fetch,
  websocket: {
    open(ws) { /* handle connection */ },
    message(ws, msg) { /* handle messages */ },
    close(ws) { /* handle disconnect */ },
  },
});

// Environment Variables needed:
// JWT_SECRET=your-jwt-secret
// DATABASE_URL=postgres://...
// GOOGLE_CLIENT_ID=google-oauth-client-id
// GOOGLE_CLIENT_SECRET=google-oauth-secret
// CORS_ORIGIN=http://localhost:8080
// PORT=3000
```

---

## Kết Luận

Organic Kingdom là một game mobile web có kiến trúc tốt với module separation rõ ràng. Tuy nhiên, cần tối ưu đáng kể để chạy mượt trên điện thoại yếu:

1. **Critical bugs** cần fix ngay (infinite reward, forceUpdate cascade)
2. **~340KB dead weight** từ unused shadcn/ui components
3. **CSS performance** cần overhaul (transition-all, blur, layout animations)
4. **React performance** cần memoization strategy
5. **Build optimization** hoàn toàn thiếu (no chunks, no compression)
6. **Backend integration** đã được thiết kế nhưng chưa kết nối

Sau khi áp dụng các tối ưu theo priority checklist, game có thể đạt **90-95% native smoothness** trên budget Android devices (2-3GB RAM).
