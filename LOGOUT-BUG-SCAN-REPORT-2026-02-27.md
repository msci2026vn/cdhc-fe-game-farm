# 🔍 Báo Cáo Scan — Lỗi Logout Giữa Chừng

**Ngày:** 2026-02-27
**Người scan:** Claude
**Phạm vi:** Frontend (local) + Backend (MCP/VPS)

---

## Tổng quan

| Mức độ | Số lỗi | Mô tả |
|--------|--------|-------|
| 🔴 Critical | 3 | Root cause chính gây logout |
| 🟠 High | 5 | Góp phần gây logout hoặc làm UX tệ hơn |
| 🟡 Medium | 6 | Vấn đề phụ, tiềm ẩn rủi ro |

---

## 🔴 ROOT CAUSE — Cookie hết hạn 15 phút nhưng JWT sống 24 giờ

```
FLOW GÂY LOGOUT:

1. User login → Backend tạo JWT (24h) + set cookie access_token (maxAge=900s = 15 phút)
2. User chơi game 15+ phút
3. Browser tự xóa cookie access_token (hết maxAge)
4. User thực hiện action → API gọi không có cookie → 401 MISSING_TOKEN
5. Frontend nhận 401 → handleUnauthorized() → redirect /login
6. User bị logout dù JWT vẫn còn hiệu lực 23h45m!
```

---

## Chi tiết phát hiện

### 🔴 CRIT-01: Cookie maxAge (15 phút) KHÔNG KHỚP JWT expiry (24 giờ)

- **File BE:** `/home/cdhc/apps/cdhc-be/src/modules/auth/cookie.ts:58-67`
- **File BE:** `/home/cdhc/apps/cdhc-be/.env` → `JWT_ACCESS_EXPIRY=24h`
- **File BE:** `/home/cdhc/apps/cdhc-be/src/modules/auth/config.ts:21` → `DEFAULT_ACCESS_EXPIRY = '15m'`

**Code hiện tại (cookie.ts):**
```typescript
// Access token: 15 minutes (900s)
setCookie(c, 'access_token', accessToken, getCookieOptions(15 * 60));
```

| Setting | Giá trị | Source |
|---------|---------|-------|
| JWT access token expiry | **24 giờ** (86400s) | `.env` JWT_ACCESS_EXPIRY=24h |
| Cookie `access_token` maxAge | **15 phút** (900s) | `cookie.ts` line 67 |
| Refresh token cookie maxAge | **7 ngày** | `cookie.ts` (riêng) |

**Vấn đề:** Cookie bị browser xóa sau 15 phút, nhưng JWT bên trong vẫn valid 24h. Sau 15 phút không hoạt động → cookie mất → mọi request trả 401 → user bị logout.

**PM2 logs xác nhận:** Burst 401 lúc 09:22-09:42 trên game endpoints, re-login lúc 09:41:48.

**Hướng fix:** Đồng bộ cookie maxAge với JWT expiry. Nếu muốn access token 15 phút → phải có auto-refresh.

---

### 🔴 CRIT-02: Frontend KHÔNG BAO GIỜ gọi refresh token

- **File FE:** `src/shared/api/api-utils.ts:22-54` — `handleUnauthorized()`
- **File FE:** `src/shared/api/api-auth.ts` — Không có hàm refreshToken
- **File BE:** `src/modules/auth/routes/session.routes.ts:10-43` — Endpoint refresh ĐANG CÓ SẴN

**Code hiện tại (api-utils.ts):**
```typescript
export function handleUnauthorized(context: string = 'API') {
  if (isRedirecting) return;
  isRedirecting = true;
  // ... clear query cache ...
  setTimeout(() => {
    window.location.href = '/login';  // ← Redirect thẳng, KHÔNG thử refresh!
  }, 800);
}
```

**Vấn đề:**
- Backend ĐÃ CÓ endpoint `POST /api/auth/refresh` hoạt động tốt
- Refresh token cookie sống **7 ngày**
- Nhưng frontend **không bao giờ gọi** refresh endpoint
- Khi nhận 401, frontend redirect thẳng về `/login` mà không thử refresh
- User có refresh token valid 7 ngày nhưng vẫn bị logout sau 15 phút!

**Hướng fix:** Thêm interceptor: khi nhận 401 → gọi `POST /api/auth/refresh` → nếu thành công thì retry request gốc → nếu refresh cũng 401 mới redirect login.

---

### 🔴 CRIT-03: Race condition trong `isRedirecting` lock — 401 bị nuốt mất

- **File FE:** `src/shared/api/api-utils.ts:12-54`
- **File FE:** `src/modules/auth/screens/LoginScreen.tsx:197,217`
- **File FE:** `src/shared/hooks/useWalletAuth.ts:294`

**Code hiện tại:**
```typescript
let isRedirecting = false;  // Module-level flag

export function handleUnauthorized(context: string = 'API') {
  if (isRedirecting) return;  // ← Nếu flag đã true → nuốt mọi 401!
  isRedirecting = true;
  // ...
  setTimeout(() => { window.location.href = '/login'; }, 800);
}

export function resetRedirectLock() {
  isRedirecting = false;  // ← CHỈ được gọi khi login SUCCESS
}
```

**Vấn đề:**
1. `isRedirecting = true` → redirect sau 800ms
2. Nếu network fail trong 800ms đó → redirect không xảy ra
3. `resetRedirectLock()` CHỈ được gọi trong success path của login
4. Nếu login fail → `isRedirecting` = `true` MÃMÃI
5. Mọi 401 sau đó bị `if (isRedirecting) return` nuốt mất
6. User kẹt trong app với auth state chết, UI hiện data rỗng

**LoginScreen.tsx:**
```typescript
// Line 197: resetRedirectLock() CHỈ ở success path
if (res.ok && data.success) {
  resetRedirectLock();  // ✅ Success
} else {
  setError('Đăng ký thất bại');  // ❌ Không gọi resetRedirectLock!
}
```

**Hướng fix:** Gọi `resetRedirectLock()` trong MỌI path của login (success + error), hoặc dùng mechanism khác thay vì module-level flag.

---

### 🟠 HIGH-01: Logout endpoint yêu cầu auth — Chicken-and-egg

- **File BE:** `src/modules/auth/routes/session.routes.ts:48`

**Code hiện tại:**
```typescript
session.post('/logout', authMiddleware(), async (c) => { ... });
```

**Vấn đề:** Khi access token cookie đã hết hạn (15 phút), user bấm Logout:
1. Frontend gọi `POST /api/auth/logout`
2. `authMiddleware()` check cookie → không có → 401
3. Server KHÔNG clear refresh token, KHÔNG blacklist tokens
4. Frontend catch error → redirect `/login` anyway
5. Refresh token vẫn valid 7 ngày → rủi ro bảo mật

**Hướng fix:** Logout endpoint nên auth-optional — luôn clear cookies dù có hay không có valid token.

---

### 🟠 HIGH-02: AuthGuard chỉ check auth MỘT LẦN khi mount

- **File FE:** `src/shared/components/AuthGuard.tsx:25-72`

**Code hiện tại:**
```typescript
useEffect(() => {
  if (hasCheckedAuth.current) {
    return;  // ← Không bao giờ check lại!
  }
  const checkAuth = async () => { /* ... */ };
  checkAuth();
}, []);  // ← Empty deps = chỉ khi mount
```

**Vấn đề:** AuthGuard check auth 1 lần duy nhất. Nếu session expire trong khi user đang chơi, AuthGuard KHÔNG phát hiện → user tiếp tục thấy UI nhưng mọi API call fail.

**Hướng fix:** Re-check khi `document.visibilitychange` (user quay lại tab) hoặc định kỳ.

---

### 🟠 HIGH-03: PM2 restart thường xuyên — 195+ restarts, mất in-memory state

- **Files BE:**
  - `src/modules/game/middleware/ensurePlayer.ts:10` → `const verifiedUsers = new Set<string>()`
  - `src/modules/auth/routes/wallet.routes.ts:40` → `const nonceRequestCounts = new Map<...>()`

**Vấn đề:** PM2 ghi nhận **195 restarts** (instance 0), **177 restarts** (instance 1). Mỗi restart:
- `verifiedUsers` Set bị reset → force extra DB lookups
- `nonceRequestCounts` Map bị reset → wallet rate limit reset
- Với 2 fork instances, in-memory state KHÔNG shared giữa instances

**Hướng fix:** Dùng Redis thay in-memory cho rate limiting. Investigate tại sao nhiều restart (memory leak?).

---

### 🟠 HIGH-04: Token blacklist dùng 16-char suffix — collision risk

- **File BE:** `src/modules/auth/token-blacklist.ts:13-14`

**Code hiện tại:**
```typescript
const key = `${BLACKLIST_PREFIX}${token.slice(-16)}`;
```

**Vấn đề:** Chỉ dùng 16 ký tự cuối của JWT làm blacklist key. Dù collision probability thấp, design này fragile. Hiện có 17 blacklisted tokens trong Redis.

**Hướng fix:** Dùng SHA-256 hash của full token.

---

### 🟠 HIGH-05: `getAuthStatus()` trả `isLoggedIn: false` thay vì trigger redirect

- **File FE:** `src/shared/api/api-auth.ts:78-81`

**Code hiện tại:**
```typescript
if (response.status === 401) {
  // Don't redirect here - this is used to check auth status initially
  return { isLoggedIn: false, user: null };
}
```

**Vấn đề:** Nếu component nào dùng `useAuth()` query mà KHÔNG nằm trong AuthGuard, 401 bị nuốt → UI hiện state "chưa login" nhưng không redirect.

---

### 🟡 MED-01: `refetchOnWindowFocus` + expired cookie = instant logout khi quay tab

- **File FE:** `src/shared/lib/queryClient.ts`
- **Behavior:** TanStack Query default `refetchOnWindowFocus: true`

**Scenario:**
1. User chuyển tab 15+ phút
2. Cookie hết hạn
3. User quay lại tab → TanStack Query refetch profile → 401 → logout ngay lập tức

---

### 🟡 MED-02: Offline sync queue KHÔNG bị clear khi logout

- **File FE:** `src/shared/hooks/useGameSync.ts:120-142`
- **Key:** `localStorage.getItem('farmverse_sync_queue')`

**Vấn đề:** Logout không clear offline queue → user khác login trên cùng device → nhận offline actions của user trước.

---

### 🟡 MED-03: Network error detection dùng `navigator.onLine` không đáng tin

- **File FE:** `src/shared/utils/error-handler.ts:81`

**Code:** `!navigator.onLine` — unreliable trong nhiều browser/network. Timeout có thể bị nhầm thành network error thay vì auth error.

---

### 🟡 MED-04: "Đăng nhập lại" button gọi `window.location.reload()` — potential loop

- **File FE:** `src/shared/components/ConnectionLostOverlay.tsx:109`

**Vấn đề:** Hard reload → AuthGuard mount lại → check auth → 401 → lại hiện overlay → loop.

---

### 🟡 MED-05: CORS origin callback trả `undefined` cho unknown origins

- **File BE:** `src/index.ts:84-97`

**Vấn đề:** Return `undefined` thay vì `null` cho rejected origins. Behavior phụ thuộc Hono implementation.

---

### 🟡 MED-06: Recurring Drizzle query error trong AlertService cron

- **Log:** `/home/cdhc/apps/cdhc-be/logs/cdhc-api-error.log`
- **Error:** `TypeError: The "string" argument must be of type string... Received an instance of Date`

**Vấn đề:** AlertService cron chạy mỗi 15 phút bị lỗi. Không trực tiếp gây logout nhưng gây instability → PM2 restart → Bug HIGH-03.

---

## Root Cause Analysis — Flow Diagram

```
                    ┌─────────────────────────────────────────┐
                    │         USER LOGIN THÀNH CÔNG           │
                    │  JWT access = 24h, cookie maxAge = 15m  │
                    │  JWT refresh = 7d, cookie maxAge = 7d   │
                    └──────────────────┬──────────────────────┘
                                       │
                                       ▼
                    ┌──────────────────────────────────────────┐
                    │       USER CHƠI GAME BÌNH THƯỜNG        │
                    │  (Mỗi API call gửi cookie tự động)      │
                    └──────────────────┬───────────────────────┘
                                       │
                              ⏱️ SAU 15 PHÚT
                                       │
                                       ▼
                    ┌──────────────────────────────────────────┐
                    │   BROWSER TỰ XÓA access_token COOKIE    │
                    │   (maxAge = 900s đã hết)                │
                    │   ⚠️ JWT bên trong vẫn valid 23h45m!    │
                    └──────────────────┬───────────────────────┘
                                       │
                          User thực hiện action bất kỳ
                                       │
                                       ▼
                    ┌──────────────────────────────────────────┐
                    │   API CALL KHÔNG CÓ COOKIE               │
                    │   → authMiddleware() → 401 MISSING_TOKEN │
                    └──────────────────┬───────────────────────┘
                                       │
                          ┌────────────┴────────────┐
                          │                         │
                    ĐÁNG LẼ NÊN               THỰC TẾ ĐANG LÀM
                          │                         │
                          ▼                         ▼
                ┌──────────────────┐     ┌───────────────────────┐
                │ Gọi POST         │     │ handleUnauthorized()  │
                │ /api/auth/refresh│     │ → isRedirecting=true  │
                │ (refresh cookie  │     │ → setTimeout 800ms    │
                │  vẫn còn valid!) │     │ → redirect /login     │
                │ → Nhận access    │     │                       │
                │   token mới      │     │ ❌ KHÔNG THỬ REFRESH! │
                │ → Retry request  │     └───────────────────────┘
                └──────────────────┘              │
                                                  ▼
                                        ┌──────────────────┐
                                        │ USER BỊ LOGOUT!  │
                                        │ 😡 "Sao bị out   │
                                        │  hoài vậy???"    │
                                        └──────────────────┘
```

---

## Khuyến nghị ưu tiên

### Ưu tiên 1 (Fix ngay — Giải quyết 90% logout)

| # | Hành động | File | Effort |
|---|-----------|------|--------|
| 1 | **Đồng bộ cookie maxAge = JWT expiry** | `cookie.ts:67` | 1 dòng |
| 2 | **Thêm auto-refresh interceptor trên FE** | `api-utils.ts` | ~50 dòng |
| 3 | **Gọi `resetRedirectLock()` ở error path** | `LoginScreen.tsx`, `useWalletAuth.ts` | 2 dòng |

**Option A — Quick fix (5 phút):**
Đổi cookie maxAge thành 24h để match JWT:
```
// cookie.ts:67
setCookie(c, 'access_token', accessToken, getCookieOptions(24 * 60 * 60));
```

**Option B — Proper fix (2-4 giờ):**
Giữ access token 15 phút + implement auto-refresh:
1. FE interceptor: 401 → try refresh → retry → fail thì mới logout
2. FE proactive refresh: refresh trước khi access token hết hạn (ở phút 13/15)

### Ưu tiên 2 (Fix sớm — Bảo mật + Stability)

| # | Hành động | File | Effort |
|---|-----------|------|--------|
| 4 | Logout endpoint auth-optional | `session.routes.ts:48` | 15 phút |
| 5 | AuthGuard re-check on visibilitychange | `AuthGuard.tsx` | 30 phút |
| 6 | Clear localStorage on logout | `api-auth.ts:53-64` | 10 phút |

### Ưu tiên 3 (Fix khi có thời gian)

| # | Hành động | File | Effort |
|---|-----------|------|--------|
| 7 | Token blacklist dùng SHA-256 | `token-blacklist.ts` | 30 phút |
| 8 | In-memory rate limit → Redis | `wallet.routes.ts` | 1 giờ |
| 9 | Fix Drizzle Date error trong cron | AlertService | 1 giờ |
| 10 | Investigate PM2 195 restarts | ecosystem.config | 2 giờ |

---

## Cross-Check Frontend ↔ Backend

| Kiểm tra | Frontend | Backend | Match? |
|----------|----------|---------|--------|
| Cookie name | `credentials: 'include'` (auto) | `access_token`, `refresh_token` | ✅ |
| `credentials` | `'include'` trong fetch wrapper | CORS `credentials: true` | ✅ |
| `Secure` flag | Chạy HTTPS (cdhc.vn) | `secure: true` (production) | ✅ |
| `SameSite` | Cross-origin (game→api) | `Lax` | ⚠️ Nên `None` nếu cross-origin |
| Token gửi qua | Cookie tự động | `getCookie('access_token')` | ✅ |
| Token lifetime | Không decode/check | JWT=24h, Cookie=15m | 🔴 MISMATCH! |
| Refresh mechanism | **KHÔNG CÓ** | Endpoint sẵn sàng | 🔴 KHÔNG DÙNG! |
| 401 handling | Redirect thẳng login | Trả 401 + message | 🔴 KHÔNG THỬ REFRESH |

---

*Báo cáo này CHỈ SCAN — KHÔNG có file nào bị sửa đổi.*
