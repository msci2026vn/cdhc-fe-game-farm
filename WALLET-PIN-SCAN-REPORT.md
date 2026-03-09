# BÁO CÁO: PHƯƠNG ÁN MÃ PIN 6 SỐ CHO VÍ CUSTODIAL

**Ngày scan:** 2026-02-22
**Trạng thái:** CHỈ SCAN — KHÔNG SỬA CODE

---

## 1. HIỆN TRẠNG

### 1.1 Custodial Wallet Schema
**File:** `src/db/schema/custodial-wallets.ts` (29 dòng)

| Cột | Type | Mặc định | Ghi chú |
|-----|------|----------|---------|
| `id` | UUID | `defaultRandom()` | PK |
| `user_id` | UUID | — | UNIQUE, FK → users(id), CASCADE |
| `address` | VARCHAR(42) | — | UNIQUE |
| `chain_id` | INTEGER | `43114` | Avalanche mainnet |
| `encrypted_private_key` | VARCHAR(500) | — | AES-256-GCM ciphertext |
| `iv` | VARCHAR(32) | — | AES IV (hex) |
| `auth_tag` | VARCHAR(32) | — | GCM auth tag (hex) |
| `is_active` | BOOLEAN | `true` | Soft-delete |
| `created_at` | TIMESTAMPTZ | `now()` | |
| `updated_at` | TIMESTAMPTZ | `now()` | |

**Chưa có cột PIN** — cần thêm `pin_hash` + `pin_set_at`.

### 1.2 Service Functions
**File:** `src/modules/custodial-wallet/custodial-wallet.service.ts` (242 dòng)

| Function | Params | Return | Line |
|----------|--------|--------|------|
| `createWalletForUser(userId)` | `userId: string` | `{ address, isNew }` | :62 |
| `getWalletStatus(userId)` | `userId: string` | `WalletInfo \| null` | :100 |
| `sendTransaction(userId, to, amountAvax)` | `userId, to, amountAvax: string` | `{ txHash, from, to, amount }` | :140 |
| `exportPrivateKey(userId)` | `userId: string` | `string` (privateKey) | :207 |
| `getWalletAddress(userId)` | `userId: string` | `string \| null` | :234 |

**Quan trọng:**
- `sendTransaction()` — dòng 140: nhận `(userId, to, amountAvax)`, **KHÔNG có PIN**
- `exportPrivateKey()` — dòng 207: nhận `(userId)`, **KHÔNG có PIN**
- Cả hai đều decrypt private key trực tiếp, không xác thực thêm

### 1.3 Routes (Endpoints)
**File:** `src/modules/custodial-wallet/custodial-wallet.routes.ts` (141 dòng)

| Method | Path | Handler | Line | Rate limit |
|--------|------|---------|------|-----------|
| GET | `/status` | getWalletStatus + auto-create | :30 | Không |
| POST | `/create` | createWalletForUser | :58 | Không |
| POST | `/send` | sendTransaction | :80 | Max 10 AVAX/tx (:102) |
| POST | `/export` | exportPrivateKey | :126 | Không |

**Tất cả routes dùng `authMiddleware()`** — chỉ cần login là OK, **KHÔNG có rate limit cho /send và /export**.

### 1.4 Encryption Module
**File:** `src/modules/custodial-wallet/encryption.ts` (63 dòng)

- Algorithm: **AES-256-GCM** (authenticated encryption)
- IV: 16 bytes random
- Auth tag: 16 bytes
- Key: `WALLET_ENCRYPTION_KEY` env (32 bytes hex)
- Functions: `encryptPrivateKey(key, masterKey)`, `decryptPrivateKey(cipher, iv, tag, masterKey)`

### 1.5 Password Hashing
- Package: `argon2` v0.44.0 **đã cài** nhưng **KHÔNG import/sử dụng** ở bất kỳ file `.ts` nào
- **Bun.password** hoạt động tốt trên VPS:
  ```
  Bun.password.hash('123456', {algorithm: 'argon2id'})
  → $argon2id$v=19$m=65536,t=2,p=1$... (118 chars)
  Bun.password.verify('123456', hash) → true
  ```
- **Khuyến nghị:** Dùng `Bun.password` (built-in, không cần import) — đã test OK

### 1.6 Rate Limiter
**3 hệ thống rate limit có sẵn:**

| System | File | Pattern | Dùng cho |
|--------|------|---------|----------|
| Auth rate limiter (Redis) | `src/modules/auth/rate-limiter/` | Progressive lockout: 5→10→15→20 attempts, block 1min→5min→15min→1hr | Login |
| Boss anti-cheat (Redis) | `src/modules/game/utils/boss-anti-cheat.ts` | `redis.incr(key) + expire` sliding window | Boss fights |
| Admin rate limit (hono-rate-limiter) | `src/modules/admin-v2/middleware/rate-limit.ts` | `rateLimiter({ windowMs, limit })` in-memory | Admin panel |

**Auth rate limiter chi tiết** (`src/modules/auth/rate-limiter/`):
- `config.ts:7-17` — Thresholds: WARNING=3, BLOCK_1MIN=5, BLOCK_5MIN=10, BLOCK_15MIN=15, BLOCK_1HOUR=20
- `store.ts:41` — `recordFailedAttempt(identifier)` → Redis INCR + EXPIRE 3600s
- `store.ts:84` — `isBlocked(identifier)` → check block status
- `store.ts:74` — `resetAttempts(identifier)` → clear on success
- **Pattern rất phù hợp để copy cho PIN** — chỉ đổi prefix key

### 1.7 Redis
**File:** `src/db/redis.ts` (16 dòng)
- Library: `ioredis` v5.8.2
- Export: `export const redis = new Redis({...})`
- Import path: `import { redis } from '@/db/redis'`
- Đang dùng cho: WebAuthn challenges, auth rate limit, boss anti-cheat, conversion cooldown
- **Thêm PIN attempts → OK**, không vấn đề

### 1.8 WebAuthn / Passkey
**File:** `src/modules/auth/webauthn-routes.ts` (337 dòng)
- Library: `@simplewebauthn/server`
- Endpoints: register/options, register/verify, login/options, login/verify, list, delete
- Challenge: Redis `webauthn:challenge:{key}` TTL 5 min
- `userVerification: 'preferred'` — sẽ yêu cầu biometric nếu device hỗ trợ
- **CÓ THỂ tái sử dụng** cho xác nhận giao dịch (tạo challenge → verify assertion)
- Flow passkey login đã có auto-create custodial wallet (dòng 269-278)

### 1.9 Frontend CustodialWalletCard
**File:** `src/modules/profile/components/CustodialWalletCard.tsx` (424 dòng)

| Action | Handler | Line | Hiện tại |
|--------|---------|------|----------|
| Rút tiền | `handleWithdraw()` | :37-48 | Gọi `sendTransaction()` trực tiếp, KHÔNG verify PIN |
| Export key | `handleExport()` | :50-57 | Gọi `exportKey()` trực tiếp, KHÔNG verify PIN |

- **Dialog component:** `@/components/ui/dialog` (Radix UI) — có sẵn
- **Toast:** `sonner` — có sẵn
- **PinInput component:** KHÔNG CÓ — cần tạo mới
- **Hook:** `useCustodialWallet` tại `src/shared/hooks/useCustodialWallet.ts` (84 dòng)

---

## 2. CẦN THÊM — BACKEND

### 2.1 DB: Thêm cột vào `custodial_wallets`
```
pin_hash       VARCHAR(200)  NULL     -- argon2id hash của PIN 6 số
pin_set_at     TIMESTAMPTZ   NULL     -- thời điểm đặt PIN
```
**Không cần bảng mới** — 1 user = 1 wallet = 1 PIN.

### 2.2 Service Functions Mới
**File:** `src/modules/custodial-wallet/custodial-wallet.service.ts`

```typescript
// Kiểm tra user đã đặt PIN chưa
hasPin(userId: string): Promise<boolean>

// Đặt PIN lần đầu
setPin(userId: string, pin: string): Promise<void>
// → Bun.password.hash(pin, {algorithm: 'argon2id'})
// → UPDATE custodial_wallets SET pin_hash, pin_set_at WHERE user_id

// Verify PIN
verifyPin(userId: string, pin: string): Promise<boolean>
// → Bun.password.verify(pin, storedHash)

// Đổi PIN
changePin(userId: string, oldPin: string, newPin: string): Promise<boolean>
// → verifyPin(oldPin) → setPin(newPin)
```

### 2.3 Rate Limit cho PIN (Redis)
**Copy pattern từ:** `src/modules/auth/rate-limiter/store.ts`

```
Redis key: pin_attempts:{userId}
Max: 5 lần sai / giờ
Khi exceed: lock 1 giờ (setex block key)
Reset khi nhập đúng
```

### 2.4 Routes Mới
**File:** `src/modules/custodial-wallet/custodial-wallet.routes.ts`

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/pin-status` | — | `{ hasPin: boolean }` |
| POST | `/set-pin` | `{ pin: "123456" }` | `{ success: true }` |
| POST | `/verify-pin` | `{ pin: "123456" }` | `{ valid: boolean, attemptsRemaining: number }` |
| POST | `/change-pin` | `{ oldPin, newPin }` | `{ success: true }` |

### 2.5 Sửa Routes Cũ

**POST /send** (dòng 80):
```diff
  const body = await c.req.json();
- const { to, amount } = body;
+ const { to, amount, pin } = body;
+ // Verify PIN trước khi gửi
+ if (await hasPin(user.id)) {
+   if (!pin) return c.json({ error: 'PIN required' }, 400);
+   const pinOk = await verifyPinWithRateLimit(user.id, pin);
+   if (!pinOk) return c.json({ error: 'Invalid PIN' }, 403);
+ }
```

**POST /export** (dòng 126):
```diff
+ const body = await c.req.json();
+ const { pin } = body;
+ if (await hasPin(user.id)) {
+   if (!pin) return c.json({ error: 'PIN required' }, 400);
+   const pinOk = await verifyPinWithRateLimit(user.id, pin);
+   if (!pinOk) return c.json({ error: 'Invalid PIN' }, 403);
+ }
```

---

## 3. CẦN THÊM — FRONTEND

### 3.1 Components Mới

**PinInputModal** — nhập PIN 6 số
```
Props: { open, onClose, onSubmit(pin), title, isLoading, error, attemptsRemaining }
UI: 6 ô input, mỗi ô 1 số, auto-focus next, submit khi đủ 6 số
```

**PinSetupModal** — tạo PIN lần đầu
```
Props: { open, onClose, onSubmit(pin) }
UI: Step 1: nhập PIN → Step 2: nhập lại confirm → submit
```

### 3.2 Sửa useCustodialWallet Hook
**File:** `src/shared/hooks/useCustodialWallet.ts`

Thêm:
```typescript
// Query PIN status
pinStatus: { hasPin: boolean }

// Mutations
setPin: (pin: string) => Promise<void>
verifyPin: (pin: string) => Promise<{ valid, attemptsRemaining }>
changePin: (oldPin: string, newPin: string) => Promise<void>
```

Sửa mutations hiện tại:
```typescript
// sendTransaction: thêm param pin
sendTransaction: ({ to, amount, pin }) => ...

// exportKey: thêm param pin
exportKey: ({ pin }) => ...
```

### 3.3 Sửa CustodialWalletCard
**File:** `src/modules/profile/components/CustodialWalletCard.tsx`

**handleWithdraw (dòng 37):**
```
Bấm "Xác nhận rút tiền"
  → hasPin = false? → PinSetupModal → tạo PIN → tiếp tục rút
  → hasPin = true?  → PinInputModal → nhập PIN
     → Đúng → sendTransaction({to, amount, pin})
     → Sai → "Mã PIN không đúng (còn X lần)"
     → Quá 5 lần → "Thử lại sau 1 giờ"
```

**handleExport (dòng 50):**
```
Bấm "Hiện Private Key"
  → hasPin = false? → PinSetupModal → tạo PIN → tiếp tục export
  → hasPin = true?  → PinInputModal → nhập PIN
     → Đúng → exportKey({pin})
     → Sai → "Mã PIN không đúng (còn X lần)"
```

### 3.4 Flow UI Tổng Quát
```
User bấm Rút tiền / Export
  │
  ├── hasPin === false
  │     └── PinSetupModal
  │           ├── Nhập PIN 6 số
  │           ├── Nhập lại confirm
  │           ├── POST /set-pin → thành công
  │           └── Tiếp tục action (với PIN vừa tạo)
  │
  └── hasPin === true
        └── PinInputModal
              ├── Nhập PIN 6 số
              ├── POST /verify-pin (hoặc gửi kèm /send, /export)
              ├── Đúng → thực hiện action
              ├── Sai → toast "Mã PIN không đúng (còn X lần)"
              └── Quá 5 lần → toast "Thử lại sau 1 giờ", disable input
```

---

## 4. PHƯƠNG ÁN BỔ SUNG (TÙY CHỌN)

### 4.1 Kết hợp PIN + Vân tay (WebAuthn)

Backend đã có WebAuthn hoạt động. Có thể tái sử dụng cho xác nhận giao dịch:

```
Flow:
1. FE kiểm tra: user có passkey + device hỗ trợ WebAuthn?
2. Nếu CÓ → show lựa chọn: "Vân tay" hoặc "Nhập PIN"
3. Vân tay: POST /passkey/tx-verify → generateAuthenticationOptions → verifyAuthenticationResponse
4. PIN: POST /verify-pin → Bun.password.verify
```

**WebAuthn verify hiện tại** (`webauthn-routes.ts:193-243`):
- `generateAuthenticationOptions({ rpID, userVerification: 'preferred' })`
- Lưu challenge: Redis `webauthn:challenge:auth:{visitorId}` TTL 5 min
- `verifyAuthenticationResponse({ response, expectedChallenge, expectedOrigin, expectedRPID, credential })`
- **CÓ THỂ tạo endpoint riêng `/passkey/tx-verify`** cho confirm giao dịch

### 4.2 Tham khảo Pattern
- Rate limit: Copy `src/modules/auth/rate-limiter/store.ts` → đổi prefix `auth_attempts:` thành `pin_attempts:`
- Redis: Import `redis` từ `@/db/redis` (đã test hoạt động)
- Hash: `Bun.password.hash(pin, {algorithm: 'argon2id'})` → 118 chars → cột VARCHAR(200) đủ

---

## 5. THỨ TỰ IMPLEMENT

| Step | Việc | Files | Chi tiết |
|------|------|-------|----------|
| 1 | Thêm cột DB | `src/db/schema/custodial-wallets.ts` | `pin_hash VARCHAR(200)`, `pin_set_at TIMESTAMPTZ` |
| 2 | Push migration | Terminal | `bun run db:generate && bun run db:push` |
| 3 | Service functions | `custodial-wallet.service.ts` | `hasPin`, `setPin`, `verifyPin`, `changePin`, `verifyPinWithRateLimit` |
| 4 | Routes mới + sửa cũ | `custodial-wallet.routes.ts` | GET /pin-status, POST /set-pin, /verify-pin, /change-pin; sửa /send + /export |
| 5 | Restart BE | Terminal | `pm2 restart cdhc-api` |
| 6 | FE: PinInputModal | `src/modules/profile/components/PinInputModal.tsx` | 6 ô input, auto-focus, error display |
| 7 | FE: PinSetupModal | `src/modules/profile/components/PinSetupModal.tsx` | 2 bước: nhập + confirm |
| 8 | FE: Hook update | `src/shared/hooks/useCustodialWallet.ts` | Thêm pinStatus query + mutations |
| 9 | FE: Sửa Card | `CustodialWalletCard.tsx` | Intercept handleWithdraw + handleExport |
| 10 | Test E2E | — | Tạo PIN → rút tiền → export → đổi PIN → brute-force test |

---

## 6. CÂU HỎI CHO GIN

1. **PIN áp dụng cho action nào?** Chỉ Export + Rút tiền? Hay cả Mua VIP bằng ví custodial?
2. **Quên PIN → reset bằng gì?** Đăng nhập lại Google? Email OTP? Hay cần admin reset?
3. **Có muốn option vân tay thay PIN** trên device hỗ trợ WebAuthn? (Backend đã có passkey sẵn)
4. **PIN tối thiểu** — có cần blacklist PIN yếu (000000, 123456, 111111)?
5. **Khoá ví khi quá 5 lần** — chỉ khoá PIN hay khoá cả ví (disable is_active)?

---

## 7. TÓM TẮT KỸ THUẬT

| Thành phần | Hiện trạng | Cần thêm |
|------------|-----------|----------|
| DB Schema | 10 cột, KHÔNG có PIN | +2 cột: `pin_hash`, `pin_set_at` |
| Service | 5 functions, KHÔNG verify PIN | +4 functions: hasPin, setPin, verifyPin, changePin |
| Routes | 4 endpoints, KHÔNG rate limit | +4 endpoints + sửa 2 cũ (/send, /export) |
| Hash | argon2 installed, Bun.password hoạt động | Dùng `Bun.password.hash/verify` (argon2id) |
| Rate limit | Auth rate limiter (Redis) có sẵn | Copy pattern → `pin_attempts:{userId}` |
| Redis | ioredis, `import { redis } from '@/db/redis'` | Thêm key `pin_attempts:*` + `pin_blocked:*` |
| WebAuthn | Đầy đủ register/login | Tùy chọn: thêm `/passkey/tx-verify` |
| FE Dialog | Radix UI Dialog có sẵn | Dùng cho PinInputModal, PinSetupModal |
| FE Toast | sonner có sẵn | Dùng cho thông báo PIN |
| FE PinInput | KHÔNG CÓ | Tạo mới (6 ô input) |
