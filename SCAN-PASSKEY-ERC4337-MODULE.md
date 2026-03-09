# SCAN REPORT: Passkey + ERC-4337 Module — FARMVERSE Backend

> **Ngày scan**: 2026-02-21
> **Backend path**: `/home/cdhc/apps/cdhc-be/`
> **Commit hiện tại trên VPS**: Đã deploy, có passkeys + SIWE wallet auth
> **Quy tắc**: CHỈ ĐỌC — KHÔNG SỬA BẤT KỲ FILE NÀO

---

## 1. Tổng quan codebase

### 1.1 Runtime & Framework
| Key | Value |
|-----|-------|
| Runtime | **Bun** (bun-types, `Bun.serve()`, `Bun.env`) |
| Framework | **Hono** v4.11.3 |
| ORM | **Drizzle ORM** v0.45.1 + drizzle-kit v0.31.8 |
| Database | **PostgreSQL** (via `postgres` v3.4.7 driver) |
| Cache | **Redis** (ioredis v5.8.2) |
| JWT | **jose** v6.1.3 (HS256) |
| Validation | **Zod** v4.3.4 + @hono/zod-validator |
| TypeScript | v5.9.3, target ES2022, module ESNext |

### 1.2 Cấu trúc thư mục (src/)
```
src/
├── index.ts                          ← Entry point, mount routes, start server
├── db/
│   ├── connection.ts                 ← PostgreSQL pool (postgres.js, max 10)
│   ├── redis.ts                      ← Redis singleton (ioredis)
│   ├── auth-adapter/                 ← DB adapter pattern cho auth
│   │   ├── base.adapter.ts           ← CRUD users cơ bản
│   │   ├── extended.adapter.ts       ← + passkeys + admin methods
│   │   ├── helpers.ts                ← toAuthenticatedUser(), profileTableMap
│   │   └── index.ts
│   └── schema/                       ← Drizzle schema definitions
│       ├── users.ts                  ← users table (UUID PK)
│       ├── passkeys.ts              ← ✅ PASSKEYS TABLE ĐÃ CÓ
│       ├── index.ts                  ← Barrel export all schemas
│       └── ... (30+ schema files)
├── middlewares/
│   ├── index.ts
│   └── trackActivity.ts
├── modules/
│   ├── auth/                         ← Auth module (Google + SIWE + WebAuthn)
│   │   ├── config.ts                 ← loadAuthConfig() từ env
│   │   ├── constants.ts              ← 13 roles, statuses, helpers
│   │   ├── cookie.ts                 ← setAuthCookies, clearAuthCookies
│   │   ├── google-auth.ts            ← verifyGoogleIdToken
│   │   ├── jwt.ts                    ← generateAccessToken, verify (jose HS256)
│   │   ├── middleware.ts             ← authMiddleware, adminMiddleware
│   │   ├── token-blacklist.ts        ← Redis-based blacklist
│   │   ├── types.ts                  ← AuthenticatedUser, JwtPayload, etc.
│   │   ├── schemas.ts                ← Zod schemas for auth requests
│   │   ├── webauthn-config.ts        ← ✅ getWebAuthnConfig()
│   │   ├── webauthn-routes.ts        ← ✅ createPasskeyRoutes()
│   │   ├── webauthn-types.ts         ← ✅ PasskeyDatabaseAdapter interface
│   │   ├── wallet-auth.service.ts    ← SIWE verify, user create/link
│   │   ├── wallet-auth.types.ts      ← WalletNonceData, SIWE constants
│   │   ├── rate-limiter/             ← Progressive lockout (Redis)
│   │   ├── routes/
│   │   │   ├── index.ts              ← createAuthRoutes() — mounts all sub-routes
│   │   │   ├── login.routes.ts       ← Google OAuth login/register
│   │   │   ├── wallet.routes.ts      ← SIWE nonce/verify/link/status
│   │   │   ├── session.routes.ts     ← refresh, logout
│   │   │   ├── profile.routes.ts     ← profile CRUD
│   │   │   └── upgrade-role.routes.ts
│   │   └── index.ts                  ← Barrel exports
│   ├── admin/                        ← Admin panel module
│   ├── admin-v2/                     ← Admin v2 module
│   ├── game/                         ← Game module (farm, quiz, boss, etc.)
│   ├── news/                         ← News CMS
│   ├── points/                       ← Points/loyalty
│   ├── weather/                      ← Weather data
│   ├── market/                       ← Commodity market
│   ├── prayer/                       ← Prayer feature
│   ├── conversion/                   ← Seed/OGN conversion
│   └── legacy/                       ← Legacy user migration
├── services/                         ← Shared services
│   ├── alert.service.ts
│   ├── email.service.ts
│   ├── r2.service.ts
│   ├── sanitize.service.ts
│   ├── server-metrics.service.ts
│   └── view-counter.service.ts
└── scripts/                          ← Utility scripts
```

### 1.3 Dependencies liên quan blockchain
```json
{
  "viem": "^2.46.2",                    // ✅ Đã có — Ethereum/EVM interactions
  "@simplewebauthn/server": "^13.2.2",  // ✅ Đã có — WebAuthn server-side
  "jose": "^6.1.3"                      // ✅ Đã có — JWT
}
```

### 1.4 Dependencies cần thêm cho ERC-4337
```json
{
  "permissionless": "^0.2.x",           // Pimlico's ERC-4337 SDK
  // HOẶC
  "@account-abstraction/sdk": "^0.7.x"  // Alternative AA SDK
}
```

### 1.5 Database — 64 tables trong production
Danh sách đầy đủ đã xác nhận, bao gồm **`passkeys`** table.

---

## 2. Auth system hiện tại

### 2.1 Auth Middleware (`src/modules/auth/middleware.ts`)

```
Request → cookie(access_token) OR Bearer token
  → isTokenBlacklisted(token) check
  → jose.jwtVerify(token, HS256 secret)
  → Extract: { sub, email, role, status }
  → DB query: orgType, pendingRole, walletAddress, authProvider
  → c.set('user', AuthenticatedUser)
```

**Token sources** (ưu tiên cookie):
1. Cookie `access_token` (httpOnly)
2. Header `Authorization: Bearer <token>`

### 2.2 JWT Configuration (`src/modules/auth/jwt.ts`)

| Config | Value |
|--------|-------|
| Algorithm | HS256 |
| Library | jose |
| Access Token TTL | 15 minutes |
| Refresh Token TTL | 7 days |
| Secret | `Bun.env.JWT_SECRET` |

**JWT Payload (access token)**:
```typescript
{
  sub: string;      // user.id (UUID)
  email: string;    // user.email
  role: UserRole;   // 13 possible roles
  status: UserStatus; // pending|approved|rejected|suspended
  iat: number;
  exp: number;
}
```

**Lưu ý**: JWT payload KHÔNG chứa `walletAddress` hay `authProvider`. Các trường này được query từ DB trong middleware.

### 2.3 Cookie Configuration (`src/modules/auth/cookie.ts`)

| Config | Development | Production |
|--------|-------------|------------|
| httpOnly | true | true |
| secure | false | true |
| sameSite | Lax | Lax |
| path | / | / |
| domain | undefined | .cdhc.vn |
| access_token maxAge | 900s (15m) | 900s (15m) |
| refresh_token maxAge | 604800s (7d) | 604800s (7d) |

### 2.4 Auth Provider Flow

```
3 phương thức đăng nhập hiện tại:
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Google OAuth  │   │ SIWE Wallet  │   │  Passkey     │
│ /api/auth/    │   │ /api/auth/   │   │ /api/auth/   │
│  google       │   │  wallet/     │   │  passkey/    │
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       │                  │                   │
       └──────────────────┴───────────────────┘
                          │
                  generateTokenPair()
                  setAuthCookies()
                          │
                   Same JWT format
```

### 2.5 AuthenticatedUser Type (`src/modules/auth/types.ts`)

```typescript
interface AuthenticatedUser {
  id: string;              // UUID
  googleId: string;        // Google sub OR "wallet:0x..."
  email: string;           // Real email OR "xxx@wallet.cdhc.vn"
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
  role: UserRole;          // 13 roles
  status: UserStatus;      // 4 statuses
  isActive: boolean;
  phone: string | null;
  address: string | null;
  walletAddress?: string | null;    // ← wallet_address từ DB
  authProvider?: 'google' | 'wallet' | 'both';
  // ... timestamps, approval fields, orgType, pendingRole
}
```

---

## 3. Database schema hiện tại

### 3.1 Users Table (`src/db/schema/users.ts`)

```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id       VARCHAR(255) NOT NULL UNIQUE,
  email           VARCHAR(255) NOT NULL,
  email_verified  BOOLEAN DEFAULT false,
  name            VARCHAR(255),
  picture         VARCHAR(500),
  role            user_role NOT NULL DEFAULT 'community',
  status          user_status NOT NULL DEFAULT 'pending',
  is_active       BOOLEAN DEFAULT true,
  phone           VARCHAR(20),
  address         TEXT,

  -- Timestamps
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  last_login_at   TIMESTAMPTZ,

  -- Approval/Rejection/Suspension fields...

  -- WALLET AUTH (v4)
  wallet_address  VARCHAR(42) UNIQUE,
  auth_provider   VARCHAR(10) NOT NULL DEFAULT 'google',

  -- ORG TYPE (v3)
  org_type        VARCHAR(20),
  pending_role    VARCHAR(20)
);

-- Indexes: email, status, role+status, created_at, last_active_at, wallet_address
```

### 3.2 Passkeys Table (`src/db/schema/passkeys.ts`) — ĐÃ TỒN TẠI

```sql
CREATE TABLE passkeys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id   TEXT NOT NULL UNIQUE,
  public_key      BYTEA NOT NULL,           -- ← WebAuthn public key
  webauthn_user_id TEXT NOT NULL,
  counter         BIGINT NOT NULL DEFAULT 0,
  device_type     TEXT NOT NULL,            -- 'singleDevice' | 'multiDevice'
  backed_up       BOOLEAN NOT NULL DEFAULT false,
  transports      TEXT,                     -- JSON array string
  friendly_name   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at    TIMESTAMPTZ
);

-- Indexes: user_id (btree), credential_id (unique btree)
```

**Migration**: Tạo trong `drizzle/0001_sudden_wolf_cub.sql`, đã deploy lên production.

### 3.3 Missing tables cho ERC-4337

Cần thêm:
```
smart_wallets       — Link user → smart account address
user_operations     — Log UserOps (optional, for debugging)
```

---

## 4. SIWE wallet auth hiện tại

### 4.1 Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/auth/wallet/nonce?address=0x...` | No | Request SIWE nonce |
| POST | `/api/auth/wallet/verify` | No | Verify SIWE signature → login/register |
| POST | `/api/auth/wallet/link` | Yes | Link wallet to existing account |
| GET | `/api/auth/wallet/status` | Yes | Check wallet link status |

### 4.2 SIWE Flow

```
1. Client: GET /wallet/nonce?address=0x1234
   → Redis SET wallet:nonce:0x1234 = {nonce, issuedAt} TTL 300s
   → Response: { nonce, issuedAt, expiresAt }

2. Client: Construct SIWE message, sign with wallet
3. Client: POST /wallet/verify { message, signature }

4. Server:
   a. parseSiweMessage(message) → extract address, nonce, chainId
   b. Validate chainId ∈ [43114, 43113] (Avalanche)
   c. verifySiweMessage(publicClient, { message, signature, domain: 'cdhc.vn' })
   d. consumeNonce(address, nonce) → Lua atomic GET+DEL
   e. findUserByWallet(address) || createWalletUser(address)
   f. generateTokenPair(user) → setAuthCookies()
```

### 4.3 Wallet User Creation

```typescript
// Wallet-only user (no Google):
{
  googleId: "wallet:0xAbCd...1234",          // Synthetic
  email: "abcd...1234@wallet.cdhc.vn",       // Synthetic (hex sans 0x)
  role: "community",
  status: "approved",                         // Auto-approved
  walletAddress: "0xAbCd...1234",             // Checksum
  authProvider: "wallet",
  orgType: "individual"
}
```

### 4.4 Key Config Constants

```typescript
SIWE_DOMAIN = 'cdhc.vn';
ALLOWED_CHAIN_IDS = [43114, 43113];  // Avalanche C-Chain + Fuji
NONCE_TTL_SECONDS = 300;             // 5 minutes
NONCE_REDIS_PREFIX = 'wallet:nonce:';
```

---

## 5. WebAuthn/Passkey hiện tại — ĐÃ IMPLEMENT ĐẦY ĐỦ

### 5.1 Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/passkey/register/options` | Yes | Get registration options |
| POST | `/api/auth/passkey/register/verify` | Yes | Verify & save passkey |
| POST | `/api/auth/passkey/login/options` | No | Get authentication options |
| POST | `/api/auth/passkey/login/verify` | No | Verify passkey → login |
| GET | `/api/auth/passkey/list` | Yes | List user's passkeys |
| DELETE | `/api/auth/passkey/:id` | Yes | Delete a passkey |

### 5.2 WebAuthn Config

```typescript
// Production:
{
  rpName: "Con Đường Hữu Cơ",   // WEBAUTHN_RP_NAME
  rpID: "cdhc.vn",               // WEBAUTHN_RP_ID
  origin: "https://cdhc.vn",     // WEBAUTHN_ORIGIN (supports comma-sep array)
  challengeTTL: 300               // 5 minutes
}
```

### 5.3 Redis Key Patterns

```
webauthn:challenge:reg:{userId}    — Registration challenge (TTL 300s)
webauthn:challenge:auth:{visitorId} — Authentication challenge (TTL 300s)
```

### 5.4 Supported Algorithms

```typescript
supportedAlgorithmIDs: [-7, -257]
// -7  = ES256 (P-256/secp256r1) ← PASSKEY DEFAULT, ACP-204 COMPATIBLE
// -257 = RS256 (RSA)
```

**QUAN TRỌNG**: Algorithm `-7` (ES256/P-256) chính là curve mà ACP-204 precompile verify! Passkeys mặc định sử dụng P-256, đây là lợi thế lớn cho tích hợp on-chain.

### 5.5 Library Version

```
@simplewebauthn/server: ^13.2.2
```

`verifyRegistrationResponse` trả về `credential.publicKey` dạng `Uint8Array` (raw COSE key). Để dùng on-chain cần extract x,y coordinates từ P-256 public key.

---

## 6. Shared Infrastructure

### 6.1 Redis (`src/db/redis.ts`)

```typescript
// Singleton export:
import Redis from 'ioredis';
export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});
```

**Import pattern**: `import { redis } from '@/db/redis';` hoặc `from '../../db/redis'`

**All Redis key patterns hiện tại**:
| Pattern | Purpose | TTL |
|---------|---------|-----|
| `wallet:nonce:{address}` | SIWE nonce | 300s |
| `webauthn:challenge:{type}:{id}` | WebAuthn challenge | 300s |
| `auth_attempts:{ip}` | Rate limit attempts | 3600s |
| `auth_blocked:{ip}` | Rate limit blocks | dynamic |
| `token:blacklist:{last16}` | Token blacklist | token remaining TTL |
| `legacy:user:{email}` | Legacy user cache | persistent |
| (game module keys) | Various game states | various |

### 6.2 Database Connection (`src/db/connection.ts`)

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
const client = postgres(process.env.DATABASE_URL!, { max: 10, idle_timeout: 20, connect_timeout: 10 });
export const db = drizzle(client);
```

**Import pattern**: `import { db } from '@/db/connection';` hoặc `from '../../db/connection'`

### 6.3 Rate Limiter (`src/modules/auth/rate-limiter/`)

- Redis-based progressive lockout: 5 fails → 1min, 10 → 5min, 15 → 15min, 20 → 1hr
- Hono middleware: `createAuthRateLimiter()`
- Helper functions: `handleFailedLogin()`, `handleSuccessfulLogin()`, `checkRateLimit()`
- Key prefix: `auth_attempts:`, `auth_blocked:`

### 6.4 Wallet routes in-memory rate limiter

File `wallet.routes.ts` có thêm simple in-memory rate limiter cho nonce endpoint:
```typescript
// 15 req/min/IP, Map-based, auto-cleanup >1000 entries
```

### 6.5 CORS

```typescript
// Production: /^https:\/\/.*\.cdhc\.vn$/  + https://cdhc.vn
// Dev: http://localhost:3000, http://127.0.0.1:3000
```

### 6.6 Zod Validation Pattern

```typescript
// Inline with route:
app.post('/endpoint', zValidator('json', schema), async (c) => { ... });

// Custom error hook:
const zodHook = (result, c) => {
  if (!result.success) return c.json({ success: false, error: { code: 'VALIDATION_ERROR', ... }}, 400);
};
app.post('/endpoint', zValidator('json', schema, zodHook), async (c) => { ... });
```

---

## 7. Phương án Module Mới — ERC-4337 Smart Wallet

### 7.1 PHÁT HIỆN QUAN TRỌNG

> **Passkeys đã được implement đầy đủ!** Module mới KHÔNG cần xây lại WebAuthn. Chỉ cần xây thêm **ERC-4337 Smart Wallet layer** dựa trên passkey credentials đã có.

### 7.2 Scope module mới (thu hẹp)

| Feature | Status | Thuộc module nào |
|---------|--------|------------------|
| WebAuthn Registration | ✅ Đã có | `auth/webauthn-routes.ts` |
| WebAuthn Authentication | ✅ Đã có | `auth/webauthn-routes.ts` |
| Passkey CRUD | ✅ Đã có | `auth/webauthn-routes.ts` |
| SIWE Wallet Login | ✅ Đã có | `auth/wallet-auth.service.ts` |
| **Smart Wallet Creation** | ❌ Cần xây | **Module mới** |
| **Bundler Integration** | ❌ Cần xây | **Module mới** |
| **Paymaster** | ❌ Cần xây | **Module mới** |
| **UserOp Signing** | ❌ Cần xây | **Module mới** |
| **ACP-204 P-256 Verify** | ❌ Smart contract | **On-chain** |

### 7.3 Đề xuất cấu trúc folder

```
src/modules/smart-wallet/
├── index.ts                          ← Barrel exports + route factory
├── smart-wallet.routes.ts            ← Hono routes
├── smart-wallet.service.ts           ← Business logic orchestrator
├── smart-wallet.types.ts             ← TypeScript types & interfaces
├── smart-wallet.schema.ts            ← Drizzle DB schema (smart_wallets table)
├── smart-wallet.validators.ts        ← Zod validation schemas
├── smart-wallet.config.ts            ← Module config (env-based)
├── erc4337/
│   ├── account-factory.ts            ← Smart account creation (SimpleAccount/Kernel)
│   ├── bundler.ts                    ← Bundler client (Pimlico Alto/Stackup)
│   ├── paymaster.ts                  ← Paymaster integration (Pimlico Verifying)
│   ├── user-operation.ts             ← UserOp construction & encoding
│   └── p256-utils.ts                 ← P-256 key extraction from WebAuthn credentials
├── contracts/
│   ├── abis/
│   │   ├── SimpleAccountFactory.json
│   │   ├── P256Verifier.json         ← ACP-204 precompile ABI
│   │   └── EntryPoint.json           ← ERC-4337 EntryPoint v0.7
│   └── addresses.ts                  ← Deployed contract addresses (Fuji + Mainnet)
└── __tests__/
    ├── smart-wallet.test.ts
    └── p256-utils.test.ts
```

### 7.4 Lý do đặt tên `smart-wallet` thay vì `passkey-wallet`

- Passkey đã có riêng module trong `auth/`
- Module mới tập trung vào **Smart Wallet (AA)**, không phải passkey
- Tránh nhầm lẫn naming
- Rõ ràng hơn khi tách SDK sau

---

## 8. Điểm tích hợp — CHÍNH XÁC

### 8.1 File duy nhất cần sửa: `src/index.ts`

Thêm **3 dòng** vào file hiện tại:

```typescript
// Line ~27 (imports section):
import { smartWalletRoutes } from '@/modules/smart-wallet';

// Line ~106 (route mounting section, sau app.route('/api/auth/passkey', ...)):
app.route('/api/smart-wallet', smartWalletRoutes);
```

### 8.2 File schema index cần update: `src/db/schema/index.ts`

Thêm **1 dòng**:

```typescript
// Thêm vào cuối file:
export * from '../../modules/smart-wallet/smart-wallet.schema';
```

### 8.3 Tổng cộng: 2 files cần touch, 4 dòng code thêm

Toàn bộ logic nằm trong `src/modules/smart-wallet/` — module tách biệt 100%.

---

## 9. DB Migration Plan

### 9.1 Bảng mới: `smart_wallets`

```typescript
// src/modules/smart-wallet/smart-wallet.schema.ts

import { boolean, index, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from '../../db/schema/users';

export const smartWallets = pgTable('smart_wallets', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Link to user
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Smart wallet address (counterfactual - có thể chưa deploy)
  address: varchar('address', { length: 42 }).notNull().unique(),

  // Factory used to create this wallet
  factoryAddress: varchar('factory_address', { length: 42 }).notNull(),

  // Passkey credential used as signer (FK to passkeys.credential_id)
  passkeyCredentialId: text('passkey_credential_id').notNull(),

  // P-256 public key coordinates (extracted from WebAuthn)
  publicKeyX: varchar('public_key_x', { length: 66 }).notNull(),  // hex 32 bytes
  publicKeyY: varchar('public_key_y', { length: 66 }).notNull(),  // hex 32 bytes

  // Chain ID
  chainId: integer('chain_id').notNull().default(43114),  // Avalanche

  // Status
  isDeployed: boolean('is_deployed').notNull().default(false),

  // Salt used for counterfactual address
  salt: varchar('salt', { length: 66 }),  // bytes32 hex

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deployedAt: timestamp('deployed_at', { withTimezone: true }),
}, (table) => ({
  userIdIdx: index('smart_wallets_user_id_idx').on(table.userId),
  addressIdx: index('smart_wallets_address_idx').on(table.address),
  chainIdIdx: index('smart_wallets_chain_id_idx').on(table.chainId),
}));

export type SmartWallet = typeof smartWallets.$inferSelect;
export type NewSmartWallet = typeof smartWallets.$inferInsert;
```

### 9.2 Migration Strategy

```bash
# Step 1: Tạo migration
cd /home/cdhc/apps/cdhc-be && bun run db:generate

# Step 2: Review SQL generated
cat drizzle/0014_*.sql

# Step 3: Push to DB
bun run db:push

# Hoặc manual SQL nếu cần kiểm soát:
# CREATE TABLE smart_wallets (...);
```

**Không ảnh hưởng data hiện tại** — chỉ ADD table mới, không ALTER tables cũ.

### 9.3 Relationship diagram

```
users (1) ──── (N) passkeys
  │                    │
  │                    │ passkey_credential_id
  │                    │
  └──── (N) smart_wallets
```

---

## 10. API Design

### 10.1 Endpoints đề xuất

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/smart-wallet/create` | Yes | Create smart wallet from passkey |
| GET | `/api/smart-wallet/status` | Yes | Get user's smart wallet(s) |
| POST | `/api/smart-wallet/send-op` | Yes | Submit UserOperation |
| GET | `/api/smart-wallet/op/:hash` | Yes | Get UserOp receipt |
| POST | `/api/smart-wallet/estimate` | Yes | Estimate gas for UserOp |

### 10.2 Chi tiết API

#### POST `/api/smart-wallet/create`

```typescript
// Request (cần đã login + có passkey)
{
  passkeyCredentialId: string,  // Credential ID của passkey đã đăng ký
  chainId?: number,              // Default 43114 (Avalanche)
  salt?: string                  // Optional custom salt
}

// Response
{
  success: true,
  data: {
    address: "0x...",           // Smart wallet address (counterfactual)
    factoryAddress: "0x...",
    chainId: 43114,
    isDeployed: false,
    publicKey: { x: "0x...", y: "0x..." }
  }
}
```

#### GET `/api/smart-wallet/status`

```typescript
// Response
{
  success: true,
  data: {
    wallets: [{
      id: "uuid",
      address: "0x...",
      chainId: 43114,
      isDeployed: true,
      passkeyName: "iPhone của tôi",
      createdAt: "..."
    }],
    hasPasskey: true,
    passkeyCount: 2
  }
}
```

#### POST `/api/smart-wallet/send-op`

```typescript
// Request
{
  walletId: string,             // Smart wallet UUID
  calls: [{                     // Batch calls
    to: "0x...",
    value: "0",
    data: "0x..."
  }],
  passkeyResponse: {            // WebAuthn assertion for signing
    authenticatorData: "...",
    clientDataJSON: "...",
    signature: "..."
  }
}

// Response
{
  success: true,
  data: {
    userOpHash: "0x...",
    status: "pending"           // pending | confirmed | failed
  }
}
```

### 10.3 So sánh với endpoints hiện tại — KHÔNG trùng

| Existing | New | Conflict? |
|----------|-----|-----------|
| `/api/auth/passkey/*` | `/api/smart-wallet/*` | ❌ No |
| `/api/auth/wallet/*` | `/api/smart-wallet/*` | ❌ No |
| `/api/game/*` | `/api/smart-wallet/*` | ❌ No |

---

## 11. Dependencies & Env Vars

### 11.1 Packages cần cài thêm

```bash
bun add permissionless viem
# permissionless: Pimlico's ERC-4337 TypeScript SDK
# viem: Đã có v2.46.2, tương thích
```

**Alternative packages**:
```bash
# Nếu dùng ZeroDev thay Pimlico:
bun add @zerodev/sdk @zerodev/passkey-validator

# Nếu dùng Alchemy AA:
bun add @alchemy/aa-core @alchemy/aa-accounts
```

**Lưu ý**: `@simplewebauthn/server` đã có, KHÔNG cần cài thêm cho WebAuthn.

### 11.2 Env vars mới

```env
# === ERC-4337 / SMART WALLET ===

# Bundler RPC (Pimlico)
BUNDLER_RPC_URL=https://api.pimlico.io/v2/43114/rpc?apikey=YOUR_KEY
BUNDLER_RPC_URL_TESTNET=https://api.pimlico.io/v2/43113/rpc?apikey=YOUR_KEY

# Paymaster (Pimlico sponsorship)
PAYMASTER_RPC_URL=https://api.pimlico.io/v2/43114/rpc?apikey=YOUR_KEY
PAYMASTER_POLICY_ID=sp_your_policy_id

# Smart Account Factory (deployed contract)
ACCOUNT_FACTORY_ADDRESS=0x...

# EntryPoint v0.7
ENTRYPOINT_ADDRESS=0x0000000071727De22E5E9d8BAf0edAc6f37da032

# ACP-204 P256 Verifier precompile address
P256_VERIFIER_ADDRESS=0x0100000000000000000000000000000000000002

# Avalanche RPC (already have viem, but need explicit)
AVALANCHE_RPC_URL=https://api.avax.network/ext/bc/C/rpc
AVALANCHE_FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
```

---

## 12. Redis Keys mới

| Pattern | Purpose | TTL |
|---------|---------|-----|
| `smart-wallet:create:{userId}` | Idempotency lock during creation | 30s |
| `smart-wallet:op:{userOpHash}` | Cache UserOp status | 300s |
| `smart-wallet:nonce:{address}` | Smart account nonce cache | 60s |

**Không conflict** với key patterns hiện tại.

---

## 13. Shared Services tái sử dụng

| Service | Import | Module mới dùng cho |
|---------|--------|---------------------|
| `redis` | `@/db/redis` | Challenge store, nonce cache, rate limit |
| `db` | `@/db/connection` | Smart wallet CRUD |
| `generateTokenPair` | `@/modules/auth/jwt` | KHÔNG cần (dùng auth hiện tại) |
| `authMiddleware` | `@/modules/auth/middleware` | Protect smart-wallet routes |
| Passkey adapter | `ExtendedPasskeyAdapter` | Read passkey public keys |
| `users` schema | `@/db/schema/users` | Join queries |
| `passkeys` schema | `@/db/schema/passkeys` | Read P-256 public key |

---

## 14. Rủi ro & Câu hỏi mở

### 14.1 ACP-204 trên Fuji Testnet

| Question | Status |
|----------|--------|
| ACP-204 đã active trên Fuji? | ⚠️ **CẦN XÁC NHẬN** — ACP-204 được propose cho Avalanche nhưng cần kiểm tra activation status trên Fuji |
| Precompile address? | Expected: `0x0100000000000000000000000000000000000002` |
| ERC-4337 EntryPoint deployed trên Avalanche? | ✅ EntryPoint v0.7 deployed trên major chains |

### 14.2 Browser Compatibility — WebAuthn

| Browser | Support |
|---------|---------|
| Chrome 67+ | ✅ |
| Safari 14+ | ✅ (iOS 14.5+) |
| Firefox 60+ | ✅ |
| Edge 18+ | ✅ |
| Samsung Internet 10+ | ✅ |
| Opera 54+ | ✅ |
| IE | ❌ |

**Platform support**: Windows Hello, macOS Touch ID, iOS Face ID/Touch ID, Android Biometrics — tất cả sử dụng P-256 curve.

### 14.3 Pimlico Free Tier

| Limit | Value |
|-------|-------|
| UserOps/month | 100 (free) → $0.10/op after |
| Sponsorship | Limited gas sponsoring |
| Bundler | Shared infra, latency ~2-5s |
| Rate limit | 10 req/s |

**Recommendation**: Pimlico có Avalanche support. Alternative: Stackup, Alchemy.

### 14.4 Smart Contracts cần deploy

| Contract | Purpose | Cần deploy? |
|----------|---------|-------------|
| EntryPoint v0.7 | ERC-4337 entry | ❌ Đã có trên major chains |
| SimpleAccountFactory | Create AA wallets | ✅ Hoặc dùng existing (Kernel, Safe) |
| P256Verifier | ACP-204 precompile | ❌ Native precompile |
| Custom Account | Account with P-256 validation | ✅ **CẦN DEPLOY** |

**Custom Account contract** cần validation logic:
```solidity
// Verify P-256 signature from WebAuthn passkey
// Call ACP-204 precompile at 0x0100...0002
// Format: (hash, r, s, x, y) → bool
```

### 14.5 P-256 Key Extraction

WebAuthn `credential.publicKey` là COSE-encoded. Cần extract raw x,y coordinates:

```typescript
// Từ passkeys table: public_key (bytea/Buffer)
// → Parse COSE key → Extract alg=-7 (ES256/P-256)
// → Get x (32 bytes) + y (32 bytes)
// → Store in smart_wallets table
```

`@simplewebauthn/server` v13 trả `credential.publicKey` dạng raw SPKI/COSE. Cần parse bằng `cbor` hoặc manual byte extraction.

### 14.6 Known Issues / Bugs phát hiện (GHI NHẬN, KHÔNG SỬA)

1. **`webauthn-routes.ts` line ~13**: `loginVerifySchema` requires `visitorId` as UUID but `login/options` generates it server-side — client phải pass back. Đây là design choice, không phải bug.

2. **`middleware.ts`**: Mỗi request đều query DB để lấy `orgType, pendingRole, walletAddress, authProvider` — potential N+1 nếu traffic cao. Consider caching in JWT payload.

3. **`wallet.routes.ts`**: In-memory rate limiter (Map-based) sẽ reset khi restart PM2. Nên dùng Redis cho consistency.

---

## 15. Implementation Order đề xuất

### Phase 1: Foundation (Backend)
1. Tạo folder `src/modules/smart-wallet/`
2. Viết schema `smart-wallet.schema.ts` → chạy migration
3. Viết `smart-wallet.config.ts` (env vars)
4. Viết `smart-wallet.types.ts` (TypeScript types)
5. Viết `erc4337/p256-utils.ts` (extract x,y from COSE key)
6. Unit test P-256 extraction

### Phase 2: Smart Account Creation
7. Viết `erc4337/account-factory.ts` (viem + permissionless)
8. Viết `erc4337/bundler.ts` (Pimlico client)
9. Viết `smart-wallet.service.ts` (create wallet flow)
10. Viết `smart-wallet.routes.ts` (POST /create, GET /status)
11. Mount routes trong `index.ts` (2 dòng)
12. Test trên Fuji testnet

### Phase 3: UserOp Submission
13. Deploy custom P-256 Account contract trên Fuji
14. Viết `erc4337/paymaster.ts` (Pimlico sponsorship)
15. Viết `erc4337/user-operation.ts` (construct & encode)
16. Add POST /send-op route
17. End-to-end test: passkey sign → UserOp → on-chain tx

### Phase 4: Frontend Integration
18. Frontend components for smart wallet creation
19. WebAuthn assertion flow for transaction signing
20. UserOp status tracking UI

### Phase 5: Polish & SDK Extraction
21. Error handling, retry logic
22. Monitoring (Sentry integration)
23. Extract to `@cdhc/smart-wallet-sdk` package
24. Documentation

---

## 16. SDK Extraction Plan

```
@cdhc/smart-wallet-sdk/
├── src/
│   ├── index.ts           ← Public API
│   ├── types.ts           ← Shared types
│   ├── erc4337/           ← Core AA logic (no DB deps)
│   │   ├── account-factory.ts
│   │   ├── bundler.ts
│   │   ├── paymaster.ts
│   │   ├── user-operation.ts
│   │   └── p256-utils.ts
│   └── contracts/
│       ├── abis/
│       └── addresses.ts
├── package.json
└── tsconfig.json
```

**Boundary**: Tất cả code trong `erc4337/` và `contracts/` không import từ `@/db/` hay `@/modules/auth/`. Chỉ nhận params thuần (addresses, keys, config). Service layer (`smart-wallet.service.ts`) là glue code, ở lại trong backend.

---

## 17. Tóm tắt quyết định

| Quyết định | Đã chốt |
|-----------|---------|
| WebAuthn? | ✅ Đã có, tái sử dụng |
| Module name? | `smart-wallet` |
| Mount point? | `/api/smart-wallet` |
| Files touch? | 2 (index.ts + schema/index.ts) |
| New DB table? | `smart_wallets` |
| New packages? | `permissionless` |
| New env vars? | 7-8 vars (bundler, paymaster, factory, RPC) |
| Smart contract? | Custom P-256 Account cần deploy |
| Testnet? | Fuji (cần verify ACP-204 status) |
| Passkey re-build? | ❌ KHÔNG — dùng existing |

---

> **Next step**: Xác nhận ACP-204 activation status trên Avalanche Fuji testnet, sau đó bắt đầu Phase 1.
