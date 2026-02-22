# BÁO CÁO SCAN BACKEND — CUSTODIAL WALLET

**Ngày:** 2026-02-22
**Mục tiêu:** Scan VPS backend + frontend để đưa phương án implement Custodial Wallet (kiểu Binance/Coinbase)
**Trạng thái:** CHỈ SCAN — KHÔNG SỬA CODE

---

## 1. AUTH SYSTEM

### Hiện trạng:
- **Loại:** JWT (HS256) via `jose` library
- **Token:** Access token (15m) + Refresh token (7d) — stored in **HTTP-only cookies** + fallback Bearer header
- **Google OAuth:** ĐÃ CÓ — Google ID Token verify via JWKS endpoint
- **Wallet Auth (SIWE):** ĐÃ CÓ — Login/Register bằng MetaMask/Core qua EIP-4361
- **Passkey/WebAuthn:** ĐÃ CÓ — Login bằng vân tay/FaceID via `@simplewebauthn/server`
- **Token blacklist:** Có (Redis-based)
- **Rate limiter:** Có (Redis-based, per IP + per identifier)

### JWT Payload:
```typescript
// Access token payload
{ sub: userId, email, role, status, iat, exp }
// Refresh token payload
{ sub: userId, type: 'refresh', iat, exp }
```

### User Creation:
- **Google register:** `src/modules/auth/routes/login.routes.ts:145` → `dbAdapter.createUserWithProfile()`
- **Wallet register:** `src/modules/auth/wallet-auth.service.ts:95` → `createWalletUser()`
- **Auth adapter:** `src/db/auth-adapter/extended.adapter.ts`

### Key Files:
| File | Mô tả |
|------|--------|
| `src/modules/auth/jwt.ts` | JWT generate/verify (jose) |
| `src/modules/auth/middleware.ts` | authMiddleware, requireRole, approvedMiddleware |
| `src/modules/auth/google-auth.ts` | Google ID Token verify |
| `src/modules/auth/wallet-auth.service.ts` | SIWE login/register/link |
| `src/modules/auth/routes/login.routes.ts` | POST /google, POST /google/register |
| `src/modules/auth/routes/wallet.routes.ts` | GET /wallet/nonce, POST /verify, POST /link |
| `src/modules/auth/webauthn-routes.ts` | Passkey register/login |
| `src/modules/auth/cookie.ts` | Cookie set/get helpers |
| `src/modules/auth/config.ts` | Auth config (JWT secret, expiry) |

---

## 2. DATABASE

### ORM: Drizzle ORM (`drizzle-orm` v0.45.1) + `postgres` driver
### Migration: `drizzle-kit` (generate/push/studio)
### Config: `drizzle.config.ts`

### Bảng `users`:
| Cột | Type | Ghi chú |
|-----|------|---------|
| id | uuid PK | defaultRandom |
| google_id | varchar(255) UNIQUE NOT NULL | `wallet:0x...` cho wallet-only users |
| email | varchar(255) NOT NULL | `xxxx@wallet.cdhc.vn` cho wallet users |
| email_verified | boolean | |
| name | varchar(255) | |
| picture | varchar(500) | |
| role | enum | super_admin, admin, editor, farmer, community, ... |
| status | enum | pending, approved, rejected, suspended |
| is_active | boolean | |
| phone, address | varchar, text | |
| wallet_address | varchar(42) UNIQUE | ← SIWE wallet address |
| auth_provider | varchar(10) DEFAULT 'google' | 'google', 'wallet', 'both' |
| org_type, pending_role | varchar(20) | |
| created_at, updated_at, last_login_at | timestamp tz | |
| approved_at/by, rejected_at/by, suspended_at/by, reactivated_at/by | timestamps | |

### Bảng `smart_wallets` (CẦN THAY THẾ):
| Cột | Type | Ghi chú |
|-----|------|---------|
| id | uuid PK | |
| user_id | uuid FK→users | |
| passkey_id | uuid NOT NULL | ← phụ thuộc passkey (SẼ BỎ) |
| address | varchar(42) UNIQUE | Coinbase Smart Wallet (counterfactual) |
| factory_address | varchar(42) | |
| salt | varchar(66) | |
| is_deployed | boolean | |
| chain_id | integer DEFAULT 43114 | |
| public_key_x, public_key_y | varchar(66) | P-256 coords (SẼ BỎ) |
| entry_point_version | varchar(10) | |

### Bảng `passkeys` (GIỮA LẠI cho WebAuthn login, NHƯNG TÁCH khỏi wallet):
| Cột | Type |
|-----|------|
| id | uuid PK |
| user_id | uuid FK→users |
| credential_id | text UNIQUE |
| public_key | bytea |
| counter, device_type, backed_up, transports, friendly_name | ... |

### VIP tables: `vip_orders`, `vip_subscriptions`, `payment_transactions`
→ Đã hoạt động tốt, chỉ cần thêm option pay bằng custodial wallet

---

## 3. SMART WALLET CŨ (CẦN THAY THẾ)

### Files:
| File | LOC | Vai trò |
|------|-----|---------|
| `src/modules/smart-wallet/smart-wallet.service.ts` | 862 | Core logic: Coinbase Smart Wallet via Passkey + Pimlico bundler |
| `src/modules/smart-wallet/smart-wallet.routes.ts` | 232 | API endpoints |
| `src/modules/smart-wallet/smart-wallet.config.ts` | 34 | Chain config + Pimlico keys |
| `src/modules/smart-wallet/utils/parse-cose-key.ts` | 56 | WebAuthn COSE key parser |
| **Tổng** | **1,184** | |

### API Endpoints hiện tại:
| Method | Path | Mô tả |
|--------|------|--------|
| POST | `/api/smart-wallet/create` | Tạo wallet từ passkey |
| GET | `/api/smart-wallet/status` | Xem trạng thái + balance |
| POST | `/api/smart-wallet/prepare-op` | Build unsigned UserOp |
| POST | `/api/smart-wallet/submit-op` | Submit signed UserOp (WebAuthn assertion) |
| GET | `/api/smart-wallet/receipt/:hash` | Poll bundler receipt |
| GET | `/api/smart-wallet/test-pimlico` | Dev: test connection |

### Architecture cũ:
```
User ──quét vân tay──→ Passkey (P-256) ──→ Coinbase Smart Wallet Factory
                                              ↓
                                        Counterfactual address
                                              ↓
                              Pimlico bundler + paymaster (ERC-4337)
                                              ↓
                                     On-chain transaction
```

**Vấn đề:**
1. **Passkey-dependent:** Wallet chỉ tạo được nếu user có passkey → friction rất cao
2. **Client-side signing:** User phải quét vân tay mỗi lần giao dịch
3. **Pimlico dependency:** Dùng bundler + paymaster bên thứ 3 ($$$)
4. **Complex debug:** DER signature, P-256 curve, low-S normalization, gas buffer → rất khó debug
5. **AA23 errors:** Nhiều lỗi OOG (Out of Gas) do P-256 FCL fallback trên Avalanche

### Dependencies:
| Package | Giữ/Bỏ | Lý do |
|---------|---------|-------|
| `viem` v2.46.2 | **GIỮ** | Dùng cho custodial wallet (createWalletClient, sendTransaction) |
| `@simplewebauthn/server` v13.2.2 | **GIỮ** | Dùng cho passkey LOGIN (không liên quan wallet) |
| `cbor-x` v1.6.0 | **XÉT BỎ** | Chỉ dùng cho parse COSE key (smart wallet cũ) |
| `@noble/curves` (p256) | **XÉT BỎ** | Chỉ dùng debug P-256 verification |

### Dependencies KHÔNG CÓ trong package.json nhưng dùng qua viem:
- `viem/account-abstraction` (bundler, paymaster, entryPoint) → **BỎ** (không cần ERC-4337)
- `viem/siwe` → **GIỮ** (dùng cho SIWE wallet auth)

---

## 4. VIP PURCHASE FLOW

### Flow hiện tại:
```
FE: Chọn plan → Tạo order (POST /api/vip/orders)
                     ↓
  Backend trả: orderId + receiverAddress + amountAvax
                     ↓
  FE: User chọn cách thanh toán:
    ├── MetaMask/Core: window.ethereum.request(eth_sendTransaction)
    └── Smart Wallet: prepare-op → quét vân tay → submit-op
                     ↓
  FE: Gửi txHash → POST /api/vip/orders/:id/verify
                     ↓
  Backend: Verify TX on-chain (receiver, amount, status) → Activate VIP
```

### Payment method:
- **AVAX native transfer** trên Avalanche C-Chain mainnet
- Plans: Standard (0.01 AVAX/30d), Premium (0.02 AVAX/30d)
- Receiver address: `0x43029a55621023911961296796AC2246a43D1257`
- Verify: `createPublicClient` → `getTransactionReceipt` + `getTransaction`

### Cần thay đổi cho Custodial Wallet:
- **KHÔNG cần thay flow verify** — backend verify TX on-chain vẫn y nguyên
- **THÊM option:** Backend ký transaction thay user (custodial) → user chỉ bấm nút
- FE: Thêm nút "Thanh toán bằng ví FARMVERSE" bên cạnh MetaMask/Core

---

## 5. CONFIG

### ENV Keys liên quan blockchain:
| Key | Status | Ghi chú |
|-----|--------|---------|
| `PIMLICO_API_KEY` | ĐÃ CÓ | Sẽ BỎ (không cần bundler) |
| `PIMLICO_SPONSORSHIP_POLICY_ID` | ĐÃ CÓ | Sẽ BỎ |
| `AVALANCHE_CHAIN_ID` | ĐÃ CÓ (43114) | **GIỮ** |
| `AVALANCHE_RPC_URL` | ĐÃ CÓ | **GIỮ** |
| `ENTRYPOINT_ADDRESS` | ĐÃ CÓ | Sẽ BỎ (không cần ERC-4337) |
| `SMART_WALLET_FACTORY_ADDRESS` | ĐÃ CÓ | Sẽ BỎ |
| `DEPLOYER_PRIVATE_KEY` | ĐÃ CÓ | **GIỮ** — dùng cho RWA blockchain log |
| `VIP_RECEIVER_WALLET` | ĐÃ CÓ | **GIỮ** |
| `MERKLE_RPC_URL` | ĐÃ CÓ | **GIỮ** — RWA module dùng |
| `MERKLE_CONTRACT_ADDRESS` | ĐÃ CÓ | **GIỮ** — RWA contract |
| **WALLET_ENCRYPTION_KEY** | **CHƯA CÓ** | ❗ CẦN THÊM — mã hóa private key trong DB |

### Redis: ĐÃ CÓ (ioredis)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_URL`
- Dùng cho: nonce management, token blacklist, rate limiter, legacy cache, WebAuthn challenges

### PM2: 2 instances, fork mode, max 400MB RAM

---

## 6. FRONTEND

### Wallet UI Files (cần thay đổi):
| File | Vai trò | Action |
|------|---------|--------|
| `src/shared/hooks/useSmartWallet.ts` | Hook: tạo passkey + smart wallet | **THAY THẾ** → `useCustodialWallet.ts` |
| `src/shared/hooks/useWalletAuth.ts` | Hook: SIWE login/link (MetaMask/Core) | **GIỮ** (optional external wallet) |
| `src/shared/hooks/useBlockchain.ts` | Hook: RWA blockchain stats/logs | **GIỮ** (không liên quan) |
| `src/shared/components/WalletSelectModal.tsx` | Modal: chọn MetaMask/Core/WalletConnect | **GIỮ** (optional external wallet) |
| `src/modules/profile/components/SmartWalletCard.tsx` | Card: hiện ví + QR nạp tiền | **THAY THẾ** → hiện custodial wallet |
| `src/modules/vip/utils/sendAvaxPayment.ts` | Utils: gửi AVAX qua MetaMask hoặc Smart Wallet | **SỬA** — thêm option custodial |
| `src/modules/vip/components/PurchaseFlow.tsx` | UI: flow mua VIP | **SỬA** — thêm "Pay bằng ví FARMVERSE" |
| `src/modules/profile/screens/ProfileScreen.tsx:327` | Render `<SmartWalletCard />` | **SỬA** — render component mới |
| `src/shared/api/game-api.ts:1463-1526` | API calls: smart-wallet create/status/prepare/submit/receipt | **THAY THẾ** |
| `src/shared/config/wagmi.ts` | Wagmi config: MetaMask, Core, WalletConnect | **GIỮ** (cho external wallet login) |
| `src/modules/auth/screens/LoginScreen.tsx` | Login screen | **GIỮ** — wallet login vẫn dùng SIWE |

### FE Dependencies liên quan:
| Package | Giữ/Bỏ |
|---------|---------|
| `wagmi` | **GIỮ** — SIWE wallet login |
| `viem` | **GIỮ** |
| `@simplewebauthn/browser` | **GIỮ** — passkey login |
| `qrcode.react` | **GIỮ** — QR deposit |
| `html2canvas` | **GIỮ** — download QR image |

---

## 7. KẾ HOẠCH IMPLEMENT

### Kiến trúc mới — Custodial Wallet:
```
User đăng nhập (Google/Wallet/Passkey)
             ↓
Backend TỰ ĐỘNG tạo ví Avalanche (privateKeyToAccount)
             ↓
Private key được MÃ HÓA (AES-256-GCM) → lưu DB
             ↓
User KHÔNG biết blockchain tồn tại
             ↓
Khi cần giao dịch: Backend GIẢI MÃ key → KÝ → GỬI on-chain
```

### Giữ lại:
- `src/modules/auth/*` — toàn bộ auth system (Google, SIWE, Passkey login)
- `src/modules/vip/vip.service.ts` — VIP status logic
- `src/modules/vip/payment.service.ts` — verify TX on-chain logic
- `src/modules/vip/payment.config.ts` — plans + receiver address
- `src/modules/rwa/*` — RWA blockchain log (dùng DEPLOYER_PRIVATE_KEY riêng)
- `src/db/schema/passkeys.ts` — passkey cho login (TÁCH khỏi wallet)
- FE: `useWalletAuth.ts`, `WalletSelectModal.tsx`, `wagmi.ts` — external wallet auth

### Thay thế:

| Cũ | Mới | Mô tả |
|----|-----|--------|
| `smart-wallet.service.ts` (862 LOC) | `custodial-wallet.service.ts` (~200 LOC) | generateWallet, getBalance, signAndSend, encrypt/decrypt key |
| `smart-wallet.routes.ts` (232 LOC) | `custodial-wallet.routes.ts` (~80 LOC) | GET /status, POST /send (internal), GET /balance |
| `smart-wallet.config.ts` (34 LOC) | Merge vào custodial service | Chỉ cần chain + RPC |
| `utils/parse-cose-key.ts` (56 LOC) | **XÓA** | Không cần parse COSE cho custodial |
| `src/db/schema/smart-wallets.ts` | `src/db/schema/custodial-wallets.ts` | Bỏ passkey_id, factory, public_key_x/y. Thêm encrypted_private_key |
| FE: `useSmartWallet.ts` | `useCustodialWallet.ts` | Đơn giản: chỉ GET /status |
| FE: `SmartWalletCard.tsx` | `CustodialWalletCard.tsx` | Hiện address + balance + QR deposit. Bỏ nút "Quét vân tay" |
| FE: `sendAvaxPayment.ts` | Sửa thêm option `sendViaCustodial()` | POST /api/custodial-wallet/send |
| FE: `game-api.ts:1463-1526` | Thay API calls | Bỏ prepare/submit, thêm custodial endpoints |

### Thêm mới:

| File | Mô tả |
|------|--------|
| **BE:** `src/modules/custodial-wallet/custodial-wallet.service.ts` | Core: tạo ví, encrypt/decrypt key, sign tx, send tx |
| **BE:** `src/modules/custodial-wallet/custodial-wallet.routes.ts` | Routes: GET /status, POST /send |
| **BE:** `src/modules/custodial-wallet/encryption.ts` | AES-256-GCM encrypt/decrypt private key |
| **BE:** `src/db/schema/custodial-wallets.ts` | Schema: id, user_id, address, encrypted_private_key, iv, chain_id |
| **BE:** Migration SQL | ALTER TABLE hoặc new table |
| **ENV:** `WALLET_ENCRYPTION_KEY` | 32-byte random key cho AES-256-GCM |

### Xóa:
| Item | Lý do |
|------|-------|
| `src/modules/smart-wallet/` (toàn bộ folder) | Thay bằng custodial-wallet |
| `src/modules/smart-wallet/utils/parse-cose-key.ts` | Không cần COSE parser |
| FE: `useSmartWallet.ts` | Thay bằng `useCustodialWallet.ts` |
| FE: `SmartWalletCard.tsx` | Thay bằng `CustodialWalletCard.tsx` |
| ENV: `PIMLICO_API_KEY`, `PIMLICO_SPONSORSHIP_POLICY_ID`, `PIMLICO_WEBHOOK_SECRET` | Không cần bundler |
| ENV: `SMART_WALLET_FACTORY_ADDRESS`, `ENTRYPOINT_ADDRESS` | Không cần ERC-4337 |
| Dependency: `cbor-x` (nếu không dùng chỗ khác) | Chỉ dùng cho COSE parse |

### DB Schema mới — `custodial_wallets`:
```sql
CREATE TABLE custodial_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  address VARCHAR(42) NOT NULL UNIQUE,
  encrypted_private_key TEXT NOT NULL,    -- AES-256-GCM ciphertext (base64)
  iv VARCHAR(32) NOT NULL,               -- Initialization vector (hex)
  auth_tag VARCHAR(32) NOT NULL,          -- GCM auth tag (hex)
  chain_id INTEGER NOT NULL DEFAULT 43114,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_custodial_wallets_user ON custodial_wallets(user_id);
CREATE UNIQUE INDEX idx_custodial_wallets_address ON custodial_wallets(address);
```

### Auto-create logic:
```
Trigger: User đăng nhập thành công (Google hoặc SIWE hoặc Passkey)
  IF user CHƯA CÓ custodial wallet:
    1. const account = privateKeyToAccount(generatePrivateKey())
    2. encrypt(privateKey, WALLET_ENCRYPTION_KEY)
    3. INSERT custodial_wallets (user_id, address, encrypted_private_key, iv, auth_tag)
    4. UPDATE users SET wallet_address = account.address (optional, for quick lookup)
```

### Thứ tự thực hiện:

| # | Bước | Mô tả |
|---|------|--------|
| 1 | **BE: Schema + Migration** | Tạo `custodial_wallets` table, migration |
| 2 | **BE: Encryption module** | AES-256-GCM encrypt/decrypt (`encryption.ts`) |
| 3 | **BE: Custodial service** | `generateWallet()`, `getWalletStatus()`, `sendTransaction()`, `getBalance()` |
| 4 | **BE: Routes** | GET /api/custodial-wallet/status, POST /api/custodial-wallet/send |
| 5 | **BE: Auto-create hook** | Tạo ví tự động khi login (sửa `login.routes.ts` + `wallet-auth.service.ts`) |
| 6 | **BE: Mount routes** | Sửa `src/index.ts` — thêm route, bỏ smart-wallet route |
| 7 | **BE: ENV** | Thêm `WALLET_ENCRYPTION_KEY` vào `.env` |
| 8 | **FE: API calls** | Sửa `game-api.ts` — thay smart-wallet endpoints bằng custodial |
| 9 | **FE: Hook + Card** | Tạo `useCustodialWallet.ts` + `CustodialWalletCard.tsx` |
| 10 | **FE: VIP flow** | Sửa `PurchaseFlow.tsx` + `sendAvaxPayment.ts` — thêm "Pay bằng ví FARMVERSE" |
| 11 | **Cleanup** | Xóa smart-wallet module, update imports |
| 12 | **Test** | Test login → auto-create → view balance → VIP purchase |

---

## 8. LƯU Ý BẢO MẬT

### Private Key Storage:
- **PHẢI** encrypt bằng AES-256-GCM (authenticated encryption)
- **PHẢI** dùng unique IV cho mỗi key
- `WALLET_ENCRYPTION_KEY` PHẢI là 32-byte random, KHÔNG commit vào git
- Cân nhắc dùng KMS (AWS KMS, GCP KMS) trong tương lai

### Transaction Security:
- Custodial send endpoint PHẢI có auth + rate limit + amount limit
- Log MỌI transaction vào `payment_transactions`
- Cân nhắc 2FA cho giao dịch lớn

### Migration Path:
- Smart Wallet cũ (nếu có user đang dùng): Migrate address sang custodial_wallets
- Passkey system: GIỮ NGUYÊN cho login — TÁCH hoàn toàn khỏi wallet
- SIWE auth: GIỮ NGUYÊN — đây là external wallet auth, không liên quan custodial

---

## 9. SO SÁNH TRƯỚC/SAU

| Tiêu chí | Smart Wallet (cũ) | Custodial Wallet (mới) |
|----------|-------------------|----------------------|
| User setup | Quét vân tay → tạo passkey → tạo wallet | **TỰ ĐỘNG** khi đăng nhập |
| Giao dịch | Quét vân tay mỗi lần | **1 click** — backend ký |
| User biết blockchain? | Có (thấy address, gas, deploy) | **KHÔNG** — backend xử lý hết |
| Dependency bên ngoài | Pimlico bundler + paymaster ($$$) | **KHÔNG** — chỉ cần RPC node |
| Code complexity | 1,184 LOC, P-256 crypto, DER parsing | **~300 LOC**, straightforward |
| Gas cost | Paymaster sponsor (tốn $$) | **User trả gas** (hoặc backend sponsor đơn giản) |
| Security model | User giữ key (passkey) | **Backend giữ key** (encrypted in DB) |
| Recovery | Mất passkey = mất wallet | **Backend** luôn có key → recovery dễ |
| ERC-4337 | Cần EntryPoint, Bundler, Factory | **KHÔNG CẦN** — EOA wallet đơn giản |
