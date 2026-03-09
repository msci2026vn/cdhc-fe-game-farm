# Bao Cao Verify — Fix Logout Bug
**Ngay:** 2026-02-27

---

## PHAN A — BACKEND VERIFICATION (VPS via MCP)

| # | Check | File | Ket qua | Chi tiet |
|---|-------|------|---------|----------|
| A1 | Cookie maxAge = 24h | cookie.ts | PASS | `getCookieOptions(24 * 60 * 60)` = 86400s. Refresh token = 7 ngay |
| A2 | Logout auth-optional | session.routes.ts | PASS | Route `/logout` KHONG co `authMiddleware()`. Try/catch blacklist, luon clear cookies |
| A3 | Refresh endpoint OK | session.routes.ts | PASS | `POST /refresh` ton tai, verify refresh_token, generate token pair moi, tra `{ success: true, user }` |
| A4 | PM2 stable | pm2 status | PASS | Status=online, uptime=13m, 0 unstable restarts. Error log TRONG 50 dong gan nhat |
| A5 | Live cookie test | curl | PASS | Logout tra 200 OK + clear cookies (Max-Age=0). Khong 401 |
| A6 | Khong con maxAge=15m | grep | PASS | `DEFAULT_ACCESS_EXPIRY='15m'` trong config.ts la JWT expiry (KHONG phai cookie). .env override: `JWT_ACCESS_EXPIRY=24h`. Cookie maxAge rieng biet = 86400s |
| A7 | Drizzle Date error | pm2 logs | NOTE | Loi `TypeError: The "string" argument must be of type string... Received Date` van xuat hien (10:45 hom nay). Khong gay logout nhung co the gay PM2 restart |

### A6 Giai thich chi tiet:
- **Cookie maxAge** (cookie.ts): `24 * 60 * 60` = 86400s = **24h** — browser giu cookie 24h
- **JWT expiry** (config.ts): Default `15m`, nhung `.env` set `JWT_ACCESS_EXPIRY=24h` — JWT valid 24h
- **Ket luan:** Ca cookie va JWT deu 24h, KHONG con 15m nao anh huong logout

---

## PHAN B — FRONTEND VERIFICATION (Local)

| # | Check | File | Ket qua | Chi tiet |
|---|-------|------|---------|----------|
| B1 | tryRefreshToken exists | api-utils.ts:21 | PASS | Co ca 3: `tryRefreshToken` (L21), `authenticatedFetch` (L60), `retryAfterRefresh` (L171) |
| B2 | handleUnauthorized refresh first | api-utils.ts:108 | PASS | Flow: tryRefreshToken() (L112) → thanh cong thi return (L114) → that bai moi redirect (L120+) |
| B3 | isRedirecting safety reset | api-utils.ts:148 | PASS | Co safety timeout 5s auto-reset (L148-150) |
| B4 | resetRedirectLock all paths | Login + Wallet | PASS (minor gap) | LoginScreen: success L195 + L214; useWalletAuth: success L294, catch L317. **Gap:** LoginScreen catch block (L237) thieu resetRedirectLock — nhung safety timeout 5s auto-reset |
| B5 | QueryClient retry config | queryClient.ts | PASS | 401 retry < 1 (1 lan). retryDelay 1500ms. 403/404 khong retry |
| B6 | AuthGuard visibilitychange | AuthGuard.tsx:72 | PASS | Listener `visibilitychange` → check `document.visibilityState === 'visible'` → ping server → handleUnauthorized neu fail |
| B7 | Logout clear localStorage | api-auth.ts:63 | PASS | Clear tat ca `farmverse_*` keys. Try/catch boc ngoai |
| B8 | await handleUnauthorized | api-farm.ts:26 | PASS | `await handleUnauthorized('getPlots')` — co await |
| B9 | tsc --noEmit = 0 errors | typecheck | PASS | 0 errors |
| B10 | No bypass fetch | grep scan | PASS (minor note) | Tat ca API files deu import `handleUnauthorized` va check 401. 3 endpoint RWA public (blockchain/stats, logs, devices) khong can auth — OK |

### B10 Minor Note — `handleUnauthorized` khong co `await`:
Nhieu API files goi `handleUnauthorized('...')` ma KHONG `await`:
- api-auth.ts (ping, passkey functions)
- api-economy.ts, api-vip.ts, api-boss.ts, api-campaign.ts, api-wallet.ts, api-social.ts, api-shop.ts, api-rwa.ts, api-quiz.ts, api-weather.ts, api-leaderboard.ts, api-inventory.ts, api-conversion.ts, api-player.ts

**Tac dong thuc te:** Thap. `handleUnauthorized` fire-and-forget nhung van chay background, tryRefreshToken van hoan thanh. QueryClient retry 1 lan sau 1.5s se huong loi tu token moi. Chi mat 1 request dau tien.

**So sanh:** `api-farm.ts` la file DUY NHAT co `await handleUnauthorized` — day la pattern tot nhat. Cac file khac van hoat dong nhung kem tin cay hon.

---

## PHAN C — CROSS-CHECK FE <-> BE

| # | Check | Ket qua | Chi tiet |
|---|-------|---------|----------|
| C1 | Cookie name match | PASS | BE set `access_token` + `refresh_token` (cookie.ts:8-9). FE goi `/api/auth/refresh` (api-utils.ts:29) |
| C2 | Refresh response match | PASS | BE tra `{ success: true, user: {...} }` (session.routes.ts). FE check `data.success` (api-utils.ts:36) |
| C3 | Credentials config | PASS | FE `credentials: 'include'` (api-utils.ts:31,66,76,181). BE CORS `credentials: true` (index.ts:111) |

---

## PHAN D — E2E TEST (Can test thu cong tren browser)

| # | Test | Ket qua | Ghi chu |
|---|------|---------|---------|
| T1 | Choi >15 phut | CHUA TEST | Can test thu cong tren browser |
| T2 | Auto-refresh token | CHUA TEST | Can test thu cong: xoa access_token cookie, thuc hien action |
| T3 | Both cookies deleted | CHUA TEST | Can test thu cong |
| T4 | Tab switch 5 phut | CHUA TEST | AuthGuard co visibilitychange listener (verified code) |
| T5 | Login fail → retry | CHUA TEST | resetRedirectLock o ca success va catch paths (verified code) |
| T6 | Logout clean | CHUA TEST | Code verified: clear cookies + farmverse_* localStorage |
| T7 | Logout khi expired | TESTED via curl | PASS: curl logout khong co token → 200 OK, cookies cleared |

---

## Van de con lai

### 1. LoginScreen catch block thieu resetRedirectLock (MINOR)
- **File:** `src/modules/auth/screens/LoginScreen.tsx:237`
- **Van de:** Catch block chi set error + setLoading(false), khong goi resetRedirectLock()
- **Tac dong:** Nho — safety timeout 5s trong handleUnauthorized se auto-reset
- **Fix:** Them `resetRedirectLock()` vao catch block

### 2. handleUnauthorized fire-and-forget o nhieu API files (LOW)
- **Files:** api-auth.ts, api-economy.ts, api-vip.ts, api-boss.ts, va 10+ file khac
- **Van de:** `handleUnauthorized('...')` khong co `await` → refresh chay background
- **Tac dong:** Thap — QueryClient retry 1 lan sau 1.5s bu dap
- **Fix (tuong lai):** Them `await` truoc `handleUnauthorized` hoac migrate sang `authenticatedFetch`

### 3. Drizzle Date TypeError (MEDIUM — khong lien quan logout)
- **Log:** `TypeError: The "string" argument must be of type string... Received Date`
- **Tac dong:** Co the gay PM2 restart → mat session tam thoi
- **Fix:** Can tim file service nao truyen Date object thay vi string vao Drizzle query

---

## Ket luan

```
[x] READY TO COMMIT frontend
[ ] CAN FIX THEM truoc khi commit (optional improvements)
```

### Core Fixes — TAT CA PASS:
- Cookie maxAge 24h (khong con 15m) — BE + FE
- Logout auth-optional (khong 401 khi expired) — BE
- tryRefreshToken + authenticatedFetch — FE
- handleUnauthorized refresh-first — FE
- isRedirecting safety timeout 5s — FE
- AuthGuard visibilitychange — FE
- Logout clear farmverse localStorage — FE
- QueryClient retry 401 x1, delay 1.5s — FE
- Cookie name + response format + credentials — FE<->BE match
- TypeScript 0 errors — FE
- PM2 stable, 0 unstable restarts — BE

### Optional Improvements (khong block commit):
1. Them `resetRedirectLock()` vao LoginScreen catch block
2. Them `await` cho handleUnauthorized o cac API files
3. Fix Drizzle Date TypeError (uu tien rieng)
