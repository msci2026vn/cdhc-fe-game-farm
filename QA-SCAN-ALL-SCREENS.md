# FULL QA SCAN — All 25+ Routes
**Date:** 2026-02-28
**Scanned by:** Claude Opus 4.6 — 13-phase automated scan
**Total screens found:** 24 screens + 3 topup pages = 27 route components

---

## BUILD HEALTH

| Check | Status | Notes |
|-------|--------|-------|
| tsc 0 errors | TBD | Remote build slow — check with `bunx tsc --noEmit` |
| Build warnings | TBD | Build running on VPS |
| Bundle size | 1.46 MB JS total | Two 380KB chunks: MyGardenScreen + vendor |
| console.log count | 172 total | 34 in modules/ + 138 in shared/ |
| console.warn/error | 45 total | Across 30 files |
| Unused imports | TBD | Needs tsc check |
| Lazy loading | 27 routes ALL lazy | `lazyWithRetry()` with chunk-fail auto-reload |

### Console.log Hotspots (top offenders)
| File | Count | Notes |
|------|-------|-------|
| `shared/api/api-farm.ts` | 15 | `[FARM-DEBUG]` tags |
| `shared/api/api-social.ts` | 15 | Debug logs |
| `shared/api/api-inventory.ts` | 12 | Debug logs |
| `modules/farming/screens/FarmingScreen.tsx` | 11 | Debug state logs |
| `modules/auth/screens/LoginScreen.tsx` | 10 | Auth debug |
| `shared/utils/error-handler.ts` | 9 | `[FARM-DEBUG]` tags |
| `shared/hooks/usePlantSeed.ts` | 9 | Debug logs |
| `shared/api/api-boss.ts` | 7 | Cookie debug |
| `shared/hooks/useWaterPlot.ts` | 7+1 | Debug logs |
| `shared/hooks/useClearPlot.ts` | 7+1 | Debug logs |

**Total: 217 console.* statements** across `src/` — unprofessional for hackathon demo.

### Bundle Size Breakdown (largest chunks)
| Chunk | Size | Concern |
|-------|------|---------|
| `MyGardenScreen` | 380 KB | Likely heavy RWA/sensor libs |
| `index-vendor` | 379 KB | React + wagmi + viem |
| `ProfileScreen` | 75 KB | Wallet card + modals |
| `CampaignBattleScreen` | 54 KB | Match3 engine |
| `FarmingScreen` | 53 KB | Full farm with weather |
| `PrayerScreen` | 50 KB | Prayer feature |
| Total | **1,495 KB** | ~1.46 MB |

---

## LOADING STATES

| Screen | Has Query? | Has Loading? | Status |
|--------|-----------|-------------|--------|
| MainMenuScreen | YES (via hooks) | YES | OK |
| CampaignMapScreen | YES | YES (isLoading) | OK |
| CampaignZoneScreen | YES | YES (isLoading) | OK |
| CampaignBattleScreen | YES | YES (isLoading + error) | OK |
| SkillUpgradeScreen | YES | YES | OK |
| RecipeCraftScreen | YES | YES (LoadingSpinner) | OK |
| MissionScreen | YES | YES (isPending) | OK |
| AchievementsHubScreen | YES | YES (LoadingSpinner x3) | OK |
| FragmentInventoryScreen | YES | YES (isLoading) | OK |
| FarmingScreen | YES | YES (loading) | OK |
| BossScreen (weekly) | NO (wrapper) | N/A | OK (thin wrapper) |
| QuizScreen | YES | YES | OK |
| ShopScreen | YES | YES | OK |
| MarketScreen | YES | YES | OK |
| PrayerScreen | YES | YES (isPending) | OK |
| ProfileScreen | YES | YES | OK |
| InventoryScreen | YES | YES (isLoading) | OK |
| FriendsScreen | YES | YES | OK |
| OgnHistoryScreen | YES | YES | OK |
| MyGardenScreen | YES | YES (spinner) | OK |
| VipPurchaseScreen | YES | YES | OK |
| SettingsScreen | YES | YES | OK |
| LoginScreen | NO (auth) | YES (button) | OK |
| SplashScreen | N/A | N/A | OK |

**Result: ALL screens with queries have loading states.** No blank-screen-on-slow-network issues found.

---

## ERROR HANDLING

| Check | Status | Notes |
|-------|--------|-------|
| Global ErrorBoundary | **MISSING** | NO ErrorBoundary anywhere in src/ — React crash = white screen |
| API error interceptor (401) | OK | Per-function 401 check → `handleUnauthorized()` → refresh → redirect |
| Toast/notification system | DUAL | Both `<Toaster/>` (Sonner) AND `<Toast/>` (custom uiStore) mounted |
| `handleGameError()` | OK | Centralized Vietnamese error messages with code mapping |
| ConnectionLostOverlay | OK | Portal-rendered overlay with timer + reload button |
| QueryClient global error | **MISSING** | No `onError` callback — each screen handles errors individually |

### Per-Screen Error Handling
| Screen | Has Error Handling? | Status |
|--------|-------------------|--------|
| CampaignMapScreen | YES (error state) | OK |
| CampaignZoneScreen | YES (error state) | OK |
| CampaignBattleScreen | YES (error + fallback) | OK |
| BossFightCampaign | YES (isError + toast) | OK |
| RecipeCraftScreen | PARTIAL (bare catch{}) | WARN — swallows errors silently |
| MissionScreen | PARTIAL (bare catch{}) | WARN — swallows errors silently |
| AchievementsHubScreen | YES | OK |
| FarmingScreen | YES (27 error refs) | OK |
| MarketScreen | YES (19 error refs) | OK |
| ProfileScreen | YES (12 error refs) | OK |
| SettingsScreen | YES (17 error refs) | OK |
| LoginScreen | YES (setError) | OK |
| QuizScreen | YES | OK |
| **PrayerScreen** | **NO** | **BUG — zero error handling for prayer API failures** |
| **FragmentInventoryScreen** | **NO** | **BUG — zero error handling** |
| **FriendsScreen** | **NO** | **BUG — zero error handling** |
| MyGardenScreen | YES (null check) | OK |
| InventoryScreen | PARTIAL | OK |
| ShopScreen | PARTIAL | OK |
| OgnHistoryScreen | YES | OK |
| VipPurchaseScreen | PARTIAL | OK |

---

## EMPTY STATES

| Screen | Has Empty State? | Status |
|--------|-----------------|--------|
| Missions | YES ("Hoan thanh tat ca nhiem vu!") | OK |
| Achievements | YES ("Chua co thanh tuu") | OK |
| Fragments | YES (filtered.length === 0 message) | OK |
| Recipes | YES (3 tabs: "Kho trong", "Chua co buff") | OK |
| Leaderboard | YES ("Chua co du lieu") | OK |
| Inventory | YES ("Chua co nong san") | OK |
| Friends | YES ("Chua co ban be") | OK |
| OGN History | YES (length check) | OK |
| Shop | NO explicit empty state | MINOR |
| Quiz | N/A (always has questions) | OK |
| Market | PARTIAL | OK |

---

## UI CONSISTENCY

| Check | Status | Notes |
|-------|--------|-------|
| AppHeader on all sub-screens | **DEAD CODE** | `AppHeader.tsx` exists but ZERO screens use it |
| BottomNav consistent | **INCONSISTENT** | Only 6/27 screens use shared BottomNav |
| Brand color consistent | FRAGMENTED | 104 green refs mixing bg-green-500/600, bg-emerald-400/500, hex codes |
| Font sizes mobile-OK | CONCERN | 243 occurrences of `text-xs` (12px) — tiny on mobile |
| ScreenShell wrapper | EXISTS BUT UNUSED | `ScreenShell` auto-includes BottomNav, not adopted |

### BottomNav Presence
| Screen | BottomNav? | Notes |
|--------|-----------|-------|
| FarmingScreen | YES | Shared BottomNav |
| BossScreen | YES | Shared BottomNav |
| FriendsScreen | YES | Shared BottomNav |
| InventoryScreen | YES | Shared BottomNav |
| ShopScreen | YES | Shared BottomNav |
| CampaignMapScreen | YES | Custom CampaignBottomNav |
| CampaignZoneScreen | YES | Custom ZoneBottomNav |
| PrayerScreen | IMPORT ONLY | "Decorative bottom bar" instead |
| **MainMenuScreen** | NO | Hub screen — may be intentional |
| **QuizScreen** | NO | Full-screen quiz — may be intentional |
| **MarketScreen** | NO | Full-screen market |
| **ProfileScreen** | NO | No nav |
| **SettingsScreen** | NO | No nav |
| **All campaign sub-screens** | NO | Battle, Skills, Fragments, Recipes, Missions, Achievements |

---

## COMBAT FLOW

| Step | Status | Notes |
|------|--------|-------|
| Zone select -> Battle start | OK | CampaignZoneScreen -> BossDetailSheet -> navigate /campaign/battle/:bossId |
| startBattle API call | OK | `POST /api/game/boss/battle/start` (fire-and-forget anti-cheat session) |
| Match-3 gameplay | OK | `useMatch3Campaign.ts` orchestrates board + boss AI + damage |
| Special gems trigger | OK | Combo tiers 8 levels, ultimate charge system |
| Boss attack intervals | OK | Zone-based (5s->3s), enrage mechanics |
| Win condition -> result | OK | `bossHp <= 0` -> 'victory' + star calc (time-based 3/2/1) |
| Lose condition -> result | OK | `playerHp <= 0` -> 'defeat' + death animation |
| Turn limit enforcement | **MISSING** | `turnLimit` set in boss data but NOT checked in campaign hooks |
| Rewards display | OK | BattleResult shows OGN, XP, stars, fragments |
| completeBattle API call | OK | `POST /api/game/boss/complete` with isCampaign flag, ref-guarded |
| Navigate back to zone | OK | `onBack` -> `/campaign/{zoneNumber}`, `onRetry` -> remount |
| Fragment drop animation | OK | Campaign-only DropAnimation component |
| Multi-phase bosses | OK | Phase transitions via `checkPhaseTransition(hpPercent)` |

### Combat Issues
| # | Severity | Issue |
|---|----------|-------|
| 1 | MEDIUM | Turn limit not enforced — players fight indefinitely in campaign |
| 2 | LOW | Weekly boss shows BattleResult before API response (serverData undefined briefly) |
| 3 | LOW | Duplicate battle-end logic: campaign uses `useBattleEnd` hook, weekly boss has inline useEffect |
| 4 | INFO | `startCampaignBattle` is fire-and-forget — battle proceeds even if session start fails |

---

## MOBILE / RESPONSIVE

| Check | Status | Notes |
|-------|--------|-------|
| Viewport meta correct | OK | `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover` |
| Safe area padding | OK | All 4 inset directions in `index.css` with `env(safe-area-inset-*)` |
| No horizontal scroll | OK | Max-width constraints on root (1280px) + components |
| Max width container | OK | Root 1280px, modals/sheets use `max-w-lg` / `max-w-sm` |
| PWA manifest | OK | Full manifest.json: standalone, portrait, proper icons, green theme |

---

## SOUND SYSTEM

| Check | Status | Notes |
|-------|--------|-------|
| AudioManager | OK | `src/shared/audio/AudioManager.ts` — full system |
| SoundRegistry | OK | Centralized sound definitions |
| Audio hooks | OK | Per-module: `useFarmAudio`, `useMatch3Audio`, `usePrayerAudio`, `useQuizAudio` |
| Sound toggle | OK | `SoundToggle.tsx` + `AudioSettings.tsx` |
| BGM tracks | 9 | battle, boss, campaign-map, campaign, farm, prayer, quiz, shop, login |
| SFX files | 58 | combat(14), farming(5), match3(10), prayer(3), progression(4), quiz(6), shop(2), ui(7), campaign(3), nhac-nen(5) |
| Total audio assets | **67 MP3 files** | Comprehensive coverage |

---

## HACKATHON READINESS

| Check | Status | Notes |
|-------|--------|-------|
| Blockchain integration | OK | WagmiProvider at root, Avalanche C-Chain, cookie-based auth |
| Smart Wallet (ERC-4337) | OK | `SmartWalletCard.tsx` — account abstraction |
| Custodial Wallet | OK | `CustodialWalletCard.tsx` — PIN + passkey security |
| NFT references | STUB | Shop tab "NFT" exists but no minting/contract logic |
| IoT / DePIN | OK | Weather sensors (temp/humidity/wind) + RWA garden module |
| RWA module | OK | Sensor dashboard, camera live view, delivery system, blockchain proof |
| README | **WEAK** | Only 29 lines boilerplate — missing Web3/DePIN/architecture info |
| Demo-ready | MOSTLY | Functional but console.logs and missing ErrorBoundary need fixing |

---

## API CONNECTIVITY

| Check | Status | Notes |
|-------|--------|-------|
| Total endpoints | 88+ | Across 17 API module files |
| Base URL | OK | `VITE_API_URL` env var, fallback `https://sta.cdhc.vn` |
| Auth mechanism | OK | Cookie-based, httpOnly, 7-day refresh_token |
| 401 handling | OK | Per-function check + `tryRefreshToken()` + redirect `/login` |
| `authenticatedFetch()` | UNDERUSED | Exists but most API modules use raw fetch + manual 401 |
| Error parsing | OK | `handleApiError()` extracts status, code, cooldownRemaining |

---

## PRIORITY BUGS (to fix)

### P0 — CRITICAL (must fix for hackathon)
| # | Severity | Screen | Description | Fix Est. |
|---|----------|--------|-------------|----------|
| 1 | P0 | Global | **NO ErrorBoundary** — React crash = white screen for judge | 15 min |

### P1 — HIGH (should fix)
| # | Severity | Screen | Description | Fix Est. |
|---|----------|--------|-------------|----------|
| 2 | P1 | PrayerScreen | Zero error handling — API fail = no feedback | 10 min |
| 3 | P1 | FragmentInventoryScreen | Zero error handling | 5 min |
| 4 | P1 | FriendsScreen | Zero error handling | 5 min |
| 5 | P1 | Global | 217 console.* statements — unprofessional demo | 20 min |
| 6 | P1 | App.tsx | Dual toast systems (Sonner + custom) — inconsistent UX | 10 min |
| 7 | P1 | MissionScreen, RecipeCraftScreen | Bare `catch {}` swallows errors silently | 10 min |

### P2 — MEDIUM (nice to have)
| # | Severity | Screen | Description | Fix Est. |
|---|----------|--------|-------------|----------|
| 8 | P2 | Campaign combat | Turn limit not enforced — infinite fight possible | 15 min |
| 9 | P2 | UI | BottomNav inconsistent — 6/27 screens have it | 30 min |
| 10 | P2 | UI | AppHeader.tsx dead code — delete or integrate | 5 min |
| 11 | P2 | UI | Color palette fragmented (green-500, emerald-500, hex mix) | 20 min |
| 12 | P2 | README | Only 29 lines — needs hackathon-ready content | 15 min |
| 13 | P2 | QueryClient | No global `onError` — individual screens must handle | 10 min |

### P3 — LOW (skip for hackathon)
| # | Severity | Screen | Description | Fix Est. |
|---|----------|--------|-------------|----------|
| 14 | P3 | MyGardenScreen | 380KB chunk — huge for a wrapper screen | - |
| 15 | P3 | UI | 243 text-xs occurrences — small on mobile | - |
| 16 | P3 | Weekly Boss | BattleResult renders before API response | - |
| 17 | P3 | Combat | Duplicate battle-end logic (campaign vs weekly) | - |
| 18 | P3 | Audio | Shared LoadingSpinner shadowed by local copies | - |

---

## OVERALL: NEEDS WORK (but close to ready)

**Strengths:**
- All 27 routes lazy-loaded with chunk-fail retry
- Loading states on ALL query screens
- Comprehensive sound system (67 audio assets)
- Full combat flow working end-to-end
- Cookie-based auth with auto-refresh
- PWA manifest + safe area + mobile viewport
- RWA/IoT + Blockchain integration present

**Must fix before demo:**
1. Add ErrorBoundary (15 min)
2. Remove console.logs (20 min)
3. Add error handling to PrayerScreen, FragmentInventory, Friends (20 min)
4. Clean up silent catch blocks (10 min)

**Estimated total fix time: ~65 min for P0+P1**
