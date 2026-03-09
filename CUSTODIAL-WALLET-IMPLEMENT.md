# TÀI LIỆU IMPLEMENT: CUSTODIAL WALLET

**Ngày:** 2026-02-22
**Dựa trên:** Deep scan backend VPS + frontend codebase
**Mục tiêu:** User đăng nhập → tự có ví Avalanche. Backend giữ key, ký thay user.

---

## 1. TỔNG QUAN THAY ĐỔI

### Files mới cần tạo (Backend):
| File | Mô tả | LOC ước tính |
|------|--------|-------------|
| `src/modules/custodial-wallet/encryption.ts` | AES-256-GCM encrypt/decrypt private key | ~60 |
| `src/modules/custodial-wallet/custodial-wallet.service.ts` | Core service: tạo ví, balance, send, export | ~200 |
| `src/modules/custodial-wallet/custodial-wallet.routes.ts` | API routes | ~120 |
| `src/db/schema/custodial-wallets.ts` | Drizzle schema cho bảng `custodial_wallets` | ~30 |

### Files cần sửa (Backend):
| File | Dòng | Thay đổi |
|------|------|----------|
| `src/modules/auth/routes/login.routes.ts` | ~68, ~102, ~232 | Thêm `ensureCustodialWallet(user.id)` sau login/register thành công |
| `src/modules/auth/wallet-auth.service.ts` | ~130 | Thêm `ensureCustodialWallet(user.id)` sau `walletLoginOrRegister` |
| `src/modules/auth/webauthn-routes.ts` | ~160 | Thêm `ensureCustodialWallet(user.id)` sau passkey login |
| `src/modules/vip/vip.routes.ts` | ~45 | Thêm `POST /purchase-custodial` endpoint |
| `src/modules/vip/payment.service.ts` | cuối file | Thêm `purchaseVipCustodial()` function |
| `src/db/schema/index.ts` | ~54 | Thay `export * from './smart-wallets'` → `export * from './custodial-wallets'` |
| `src/index.ts` | ~38, ~166 | Thay `smartWalletRoutes` → `custodialWalletRoutes` |

### Files cần xóa (Backend):
| File | Lý do |
|------|-------|
| `src/modules/smart-wallet/smart-wallet.service.ts` | Thay bằng custodial-wallet |
| `src/modules/smart-wallet/smart-wallet.routes.ts` | Thay bằng custodial-wallet |
| `src/modules/smart-wallet/smart-wallet.config.ts` | Không cần Pimlico config |
| `src/modules/smart-wallet/utils/parse-cose-key.ts` | Không cần COSE parser |

### Files mới cần tạo (Frontend):
| File | Mô tả | LOC ước tính |
|------|--------|-------------|
| `src/shared/hooks/useCustodialWallet.ts` | Hook: GET /status, withdraw, export | ~80 |
| `src/modules/profile/components/CustodialWalletCard.tsx` | UI: address + balance + QR nạp + rút + export | ~250 |

### Files cần sửa (Frontend):
| File | Thay đổi |
|------|----------|
| `src/shared/api/game-api.ts:1460-1536` | Thay smart-wallet → custodial-wallet endpoints |
| `src/modules/vip/components/PurchaseFlow.tsx:6,13,44,379-406` | Thay Smart Wallet → Custodial Wallet payment |
| `src/modules/vip/utils/sendAvaxPayment.ts:83-154` | Thay smart wallet functions → custodial API call |
| `src/modules/profile/screens/ProfileScreen.tsx:19,327` | `SmartWalletCard` → `CustodialWalletCard` |

### Files cần xóa (Frontend):
| File | Lý do |
|------|-------|
| `src/shared/hooks/useSmartWallet.ts` | Thay bằng useCustodialWallet |
| `src/modules/profile/components/SmartWalletCard.tsx` | Thay bằng CustodialWalletCard |

### ENV cần thêm:
| Key | Mô tả | Cách generate |
|-----|--------|--------------|
| `WALLET_ENCRYPTION_KEY` | 32-byte key cho AES-256-GCM | `openssl rand -hex 32` |
| `GAS_SPONSOR_PRIVATE_KEY` | Private key ví sponsor gas (optional) | Dùng `DEPLOYER_PRIVATE_KEY` luôn nếu muốn |

### ENV có thể xóa (sau khi cleanup):
- `PIMLICO_API_KEY`, `PIMLICO_SPONSORSHIP_POLICY_ID`, `PIMLICO_WEBHOOK_SECRET`
- `SMART_WALLET_FACTORY_ADDRESS`, `ENTRYPOINT_ADDRESS`

---

## 2. DATABASE SCHEMA

### Bảng mới: `custodial_wallets`

#### Drizzle schema file: `src/db/schema/custodial-wallets.ts`
```typescript
import { boolean, index, integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';

export const custodialWallets = pgTable(
  'custodial_wallets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id),
    address: varchar('address', { length: 42 }).notNull().unique(),
    encryptedPrivateKey: text('encrypted_private_key').notNull(),
    iv: varchar('iv', { length: 32 }).notNull(),
    authTag: varchar('auth_tag', { length: 32 }).notNull(),
    chainId: integer('chain_id').notNull().default(43114),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('custodial_wallets_user_id_idx').on(table.userId),
    addressIdx: index('custodial_wallets_address_idx').on(table.address),
  }),
);

export type CustodialWallet = typeof custodialWallets.$inferSelect;
export type NewCustodialWallet = typeof custodialWallets.$inferInsert;
```

### Sửa `src/db/schema/index.ts` dòng 54:
```typescript
// Thay:
export * from './smart-wallets';
// Bằng:
export * from './custodial-wallets';
```

### KHÔNG cần sửa bảng `users`:
- `users.wallet_address` vẫn dùng cho SIWE external wallet (MetaMask/Core login)
- Custodial wallet address lưu riêng trong `custodial_wallets.address`
- Nếu muốn quick lookup, có thể UPDATE `users.wallet_address` = custodial address cho user chưa có external wallet

### KHÔNG cần sửa bảng `vip_orders`:
- `payment_method` enum đã có `'avax_native'` — custodial payment vẫn là AVAX native transfer
- Verify flow KHÔNG ĐỔI — vẫn verify txHash on-chain

### Migration:
```bash
# Trên VPS:
cd /home/cdhc/apps/cdhc-be
export PATH=$PATH:/home/cdhc/.bun/bin

# 1. Generate migration
bun run db:generate

# 2. Push to database
bun run db:push

# 3. Restart PM2
pm2 restart cdhc-api
```

---

## 3. BACKEND SERVICE — FUNCTION BY FUNCTION

### 3.1 `src/modules/custodial-wallet/encryption.ts`

```typescript
/**
 * AES-256-GCM encryption for custodial wallet private keys.
 * Uses Node.js crypto module (available in Bun 1.3.5).
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM recommended IV length
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.WALLET_ENCRYPTION_KEY;
  if (!key) throw new Error('WALLET_ENCRYPTION_KEY not set');
  const buf = Buffer.from(key, 'hex');
  if (buf.length !== 32) throw new Error('WALLET_ENCRYPTION_KEY must be 32 bytes (64 hex chars)');
  return buf;
}

export function encryptPrivateKey(privateKey: string): {
  ciphertext: string;
  iv: string;
  authTag: string;
} {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  let encrypted = cipher.update(privateKey, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

export function decryptPrivateKey(
  ciphertext: string,
  iv: string,
  authTag: string,
): string {
  const key = getEncryptionKey();
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'), {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### 3.2 `src/modules/custodial-wallet/custodial-wallet.service.ts`

```typescript
/**
 * Custodial Wallet Service — Backend giữ private key, ký thay user.
 *
 * Functions:
 * - ensureCustodialWallet(userId) — auto-create nếu chưa có
 * - getWalletStatus(userId) — address + balance
 * - sendTransaction(userId, to, amountAvax) — ký + gửi on-chain
 * - getPrivateKeyForExport(userId) — decrypt + return (có rate limit)
 */

import { eq } from 'drizzle-orm';
import { createPublicClient, createWalletClient, formatEther, http, parseEther } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { avalanche } from 'viem/chains';
import { db } from '@/db/connection';
import { custodialWallets } from '@/db/schema/custodial-wallets';
import { encryptPrivateKey, decryptPrivateKey } from './encryption';

// ═══ CONFIG ═══
const CHAIN_ID = parseInt(process.env.AVALANCHE_CHAIN_ID || '43114');
const RPC_URL = process.env.AVALANCHE_RPC_URL || 'https://api.avax.network/ext/bc/C/rpc';
const chain = avalanche; // Chỉ hỗ trợ mainnet

// ═══ SHARED PUBLIC CLIENT (singleton, giống pattern RWA module) ═══
let _publicClient: ReturnType<typeof createPublicClient> | null = null;
function getPublicClient() {
  if (!_publicClient) {
    _publicClient = createPublicClient({ chain, transport: http(RPC_URL) });
  }
  return _publicClient;
}

// ═══ SERVICE ═══
export const custodialWalletService = {
  /**
   * Tạo custodial wallet nếu user chưa có. Idempotent.
   * Gọi sau mỗi lần login thành công.
   */
  async ensureCustodialWallet(userId: string): Promise<{ address: string; created: boolean }> {
    // Check existing
    const [existing] = await db
      .select({ address: custodialWallets.address })
      .from(custodialWallets)
      .where(eq(custodialWallets.userId, userId))
      .limit(1);

    if (existing) {
      return { address: existing.address, created: false };
    }

    // Generate new wallet
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);

    // Encrypt private key
    const { ciphertext, iv, authTag } = encryptPrivateKey(privateKey);

    // Save to DB
    const [wallet] = await db
      .insert(custodialWallets)
      .values({
        userId,
        address: account.address,
        encryptedPrivateKey: ciphertext,
        iv,
        authTag,
        chainId: CHAIN_ID,
      })
      .onConflictDoNothing({ target: custodialWallets.userId })
      .returning();

    // Handle race condition: another request already created
    if (!wallet) {
      const [raceWinner] = await db
        .select({ address: custodialWallets.address })
        .from(custodialWallets)
        .where(eq(custodialWallets.userId, userId))
        .limit(1);
      return { address: raceWinner!.address, created: false };
    }

    console.log(`[CustodialWallet] Created wallet ${wallet.address} for user ${userId.slice(0, 8)}`);
    return { address: wallet.address, created: true };
  },

  /**
   * Get wallet status: address + on-chain balance.
   */
  async getWalletStatus(userId: string) {
    const [wallet] = await db
      .select()
      .from(custodialWallets)
      .where(eq(custodialWallets.userId, userId))
      .limit(1);

    if (!wallet) {
      return { hasWallet: false, address: null, balance: '0', chainId: CHAIN_ID };
    }

    const publicClient = getPublicClient();
    const balance = await publicClient.getBalance({
      address: wallet.address as `0x${string}`,
    });

    return {
      hasWallet: true,
      address: wallet.address,
      balance: formatEther(balance),
      chainId: wallet.chainId,
      isActive: wallet.isActive,
      createdAt: wallet.createdAt,
    };
  },

  /**
   * Send AVAX from user's custodial wallet to any address.
   * Backend decrypts key, creates walletClient, signs + sends.
   */
  async sendTransaction(
    userId: string,
    to: string,
    amountAvax: string,
  ): Promise<{ txHash: string }> {
    // 1. Get wallet + decrypt key
    const [wallet] = await db
      .select()
      .from(custodialWallets)
      .where(eq(custodialWallets.userId, userId))
      .limit(1);

    if (!wallet) throw new Error('WALLET_NOT_FOUND');
    if (!wallet.isActive) throw new Error('WALLET_DISABLED');

    const privateKey = decryptPrivateKey(
      wallet.encryptedPrivateKey,
      wallet.iv,
      wallet.authTag,
    );

    // 2. Create wallet client
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(RPC_URL),
    });

    // 3. Check balance sufficient
    const publicClient = getPublicClient();
    const balance = await publicClient.getBalance({ address: account.address });
    const amountWei = parseEther(amountAvax);

    // Estimate gas cost (~21000 gas * ~25 gwei = ~0.000525 AVAX on Avalanche)
    const estimatedGas = 21000n * 30_000_000_000n; // 30 gwei max
    if (balance < amountWei + estimatedGas) {
      const available = formatEther(balance);
      throw new Error(`Insufficient balance: ${available} AVAX (need ${amountAvax} + gas)`);
    }

    // 4. Send transaction
    const txHash = await walletClient.sendTransaction({
      to: to as `0x${string}`,
      value: amountWei,
    });

    console.log(`[CustodialWallet] TX sent: ${txHash} | user=${userId.slice(0, 8)} | to=${to.slice(0, 10)} | ${amountAvax} AVAX`);
    return { txHash };
  },

  /**
   * Export private key (for user to import to MetaMask).
   * Should be rate-limited and logged.
   */
  async getPrivateKeyForExport(userId: string): Promise<{ privateKey: string; address: string }> {
    const [wallet] = await db
      .select()
      .from(custodialWallets)
      .where(eq(custodialWallets.userId, userId))
      .limit(1);

    if (!wallet) throw new Error('WALLET_NOT_FOUND');

    const privateKey = decryptPrivateKey(
      wallet.encryptedPrivateKey,
      wallet.iv,
      wallet.authTag,
    );

    console.log(`[CustodialWallet] ⚠️ Key exported for user ${userId.slice(0, 8)}`);
    return { privateKey, address: wallet.address };
  },

  /**
   * Get wallet address only (no on-chain call). For quick lookup.
   */
  async getWalletAddress(userId: string): Promise<string | null> {
    const [wallet] = await db
      .select({ address: custodialWallets.address })
      .from(custodialWallets)
      .where(eq(custodialWallets.userId, userId))
      .limit(1);
    return wallet?.address || null;
  },
};
```

### 3.3 `src/modules/custodial-wallet/custodial-wallet.routes.ts`

```typescript
/**
 * Custodial Wallet API Routes
 *
 * GET  /status          — Address + balance + chainId
 * POST /withdraw        — Rút AVAX ra address bất kỳ
 * POST /export          — Xem private key (rate limited)
 */

import { Hono } from 'hono';
import { authMiddleware } from '@/modules/auth/middleware';
import type { AuthVariables } from '@/modules/auth/types';
import { custodialWalletService } from './custodial-wallet.service';
import { redis } from '@/db/redis';

type AuthEnv = { Variables: AuthVariables };
const custodialWalletRoutes = new Hono<AuthEnv>();

// All routes require auth
custodialWalletRoutes.use('/*', authMiddleware());

// GET /status
custodialWalletRoutes.get('/status', async (c) => {
  try {
    const user = c.get('user');
    const status = await custodialWalletService.getWalletStatus(user.id);
    return c.json({ success: true, data: status });
  } catch (error: any) {
    return c.json(
      { success: false, error: { code: 'STATUS_FAILED', message: error.message } },
      500,
    );
  }
});

// POST /withdraw — Rút AVAX ra ngoài
custodialWalletRoutes.post('/withdraw', async (c) => {
  try {
    const user = c.get('user');
    const { to, amount } = await c.req.json();

    // Validate
    if (!to || !/^0x[a-fA-F0-9]{40}$/.test(to)) {
      return c.json(
        { success: false, error: { code: 'INVALID_ADDRESS', message: 'Invalid address' } },
        400,
      );
    }
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      return c.json(
        { success: false, error: { code: 'INVALID_AMOUNT', message: 'Amount must be > 0' } },
        400,
      );
    }

    // Rate limit: max 10 withdrawals/hour/user
    const rateKey = `custodial:withdraw:${user.id}`;
    const count = await redis.incr(rateKey);
    if (count === 1) await redis.expire(rateKey, 3600);
    if (count > 10) {
      return c.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'Max 10 withdrawals per hour' } },
        429,
      );
    }

    const result = await custodialWalletService.sendTransaction(user.id, to, amount);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    if (error.message === 'WALLET_NOT_FOUND') {
      return c.json(
        { success: false, error: { code: 'WALLET_NOT_FOUND', message: 'Bạn chưa có ví' } },
        400,
      );
    }
    if (error.message.includes('Insufficient')) {
      return c.json(
        { success: false, error: { code: 'INSUFFICIENT_BALANCE', message: error.message } },
        400,
      );
    }
    return c.json(
      { success: false, error: { code: 'WITHDRAW_FAILED', message: error.message } },
      500,
    );
  }
});

// POST /export — Xem private key
custodialWalletRoutes.post('/export', async (c) => {
  try {
    const user = c.get('user');

    // Rate limit: max 3 exports/hour/user
    const rateKey = `custodial:export:${user.id}`;
    const count = await redis.incr(rateKey);
    if (count === 1) await redis.expire(rateKey, 3600);
    if (count > 3) {
      return c.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'Max 3 exports per hour' } },
        429,
      );
    }

    const result = await custodialWalletService.getPrivateKeyForExport(user.id);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    if (error.message === 'WALLET_NOT_FOUND') {
      return c.json(
        { success: false, error: { code: 'WALLET_NOT_FOUND', message: 'Bạn chưa có ví' } },
        400,
      );
    }
    return c.json(
      { success: false, error: { code: 'EXPORT_FAILED', message: error.message } },
      500,
    );
  }
});

export { custodialWalletRoutes };
```

---

## 4. AUTO-CREATE WALLET HOOK

**Chiến lược:** Gọi `ensureCustodialWallet(user.id)` ngay sau mỗi login thành công.
Hàm này idempotent — gọi nhiều lần không sao, chỉ tạo 1 lần.
Chạy fire-and-forget (không await nếu muốn login nhanh hơn, hoặc await nếu muốn trả address ngay).

### 4.1 Google Login — existing user (`src/modules/auth/routes/login.routes.ts`)

**Dòng ~68** — sau `setAuthCookies`, trước `return c.json`:
```typescript
// HIỆN TẠI (dòng ~62-70):
        await handleSuccessfulLogin(c, identifier);
        await dbAdapter.updateUserLogin(existingUser.id);
        const tokens = await generateTokenPair(existingUser);
        setAuthCookies(c, tokens.accessToken, tokens.refreshToken);

        // ═══ THÊM: Auto-create custodial wallet ═══
        custodialWalletService.ensureCustodialWallet(existingUser.id).catch(() => {});

        return c.json({
          success: true,
```

**Tương tự dòng ~102** — Google login qua email match:
```typescript
        setAuthCookies(c, tokens.accessToken, tokens.refreshToken);

        // ═══ THÊM: Auto-create custodial wallet ═══
        custodialWalletService.ensureCustodialWallet(userByEmail.id).catch(() => {});

        return c.json({
```

### 4.2 Google Register — new user (`src/modules/auth/routes/login.routes.ts`)

**Dòng ~232** — sau `setAuthCookies`:
```typescript
      const tokens = await generateTokenPair(newUser);
      setAuthCookies(c, tokens.accessToken, tokens.refreshToken);

      // ═══ THÊM: Auto-create custodial wallet ═══
      custodialWalletService.ensureCustodialWallet(newUser.id).catch(() => {});

      return c.json({
```

**Import cần thêm ở đầu file `login.routes.ts`:**
```typescript
import { custodialWalletService } from '../../custodial-wallet/custodial-wallet.service';
```

### 4.3 SIWE Login/Register (`src/modules/auth/wallet-auth.service.ts`)

**Dòng ~140** — trong hàm `walletLoginOrRegister`, sau `generateTokenPair`:
```typescript
  // 5. Generate JWT pair (same as Google flow)
  const tokens = await generateTokenPair(user);

  // ═══ THÊM: Auto-create custodial wallet ═══
  custodialWalletService.ensureCustodialWallet(user.id).catch(() => {});

  return { user, tokens, isNewUser };
```

**Import cần thêm ở đầu file `wallet-auth.service.ts`:**
```typescript
import { custodialWalletService } from '../custodial-wallet/custodial-wallet.service';
```

### 4.4 Passkey Login (`src/modules/auth/webauthn-routes.ts`)

**Dòng ~160** — sau `setAuthCookies`:
```typescript
      await dbAdapter.updateUserLogin(user.id);
      const tokens = await generateTokenPair(user);
      setAuthCookies(c, tokens.accessToken, tokens.refreshToken);

      // ═══ THÊM: Auto-create custodial wallet ═══
      custodialWalletService.ensureCustodialWallet(user.id).catch(() => {});

      return c.json({
```

**Import cần thêm ở đầu file `webauthn-routes.ts`:**
```typescript
import { custodialWalletService } from '../custodial-wallet/custodial-wallet.service';
```

---

## 5. MOUNT ROUTES — `src/index.ts`

### Thay đổi import (dòng ~38):
```typescript
// THAY:
import { smartWalletRoutes } from '@/modules/smart-wallet/smart-wallet.routes';
// BẰNG:
import { custodialWalletRoutes } from '@/modules/custodial-wallet/custodial-wallet.routes';
```

### Thay đổi route mount (dòng ~166):
```typescript
// THAY:
app.route('/api/smart-wallet', smartWalletRoutes);
// BẰNG:
app.route('/api/custodial-wallet', custodialWalletRoutes);
```

---

## 6. VIP PURCHASE VỚI CUSTODIAL WALLET

### Gas Sponsor Analysis — EOA Wallet:

Với EOA wallet (không có ERC-4337), gas phí trừ trực tiếp từ ví gửi.

| Option | Mô tả | Ưu/nhược |
|--------|--------|----------|
| **A: User trả gas** | Backend ký TX, gas trừ từ ví user | Đơn giản nhất. Gas Avalanche ~0.0005 AVAX (~$0.01) |
| B: Deployer sponsor | Deployer gửi AVAX nhỏ vào ví user trước → user gửi payment | 2 TX, phức tạp, tốn gas deployer |
| C: Deployer thay | Deployer gửi AVAX từ ví deployer → receiver, rồi trừ từ ví user | Off-chain accounting, không transparent |

**→ KHUYẾN NGHỊ: Option A** — User trả gas. Lý do:
1. Gas Avalanche cực rẻ (~0.0005 AVAX = $0.01)
2. Không cần thêm logic sponsor phức tạp
3. User nạp AVAX vào ví → mua VIP → gas trừ luôn = UX tự nhiên
4. Nếu muốn "miễn phí gas" về sau: chỉ cần Deployer gửi ~0.001 AVAX vào ví user 1 lần

### Thêm endpoint VIP purchase bằng custodial wallet:

#### Sửa `src/modules/vip/vip.routes.ts` — thêm endpoint:
```typescript
import { custodialWalletService } from '@/modules/custodial-wallet/custodial-wallet.service';

// POST /purchase-custodial — Mua VIP bằng custodial wallet (1 click)
vipRoutes.post('/purchase-custodial', authMiddleware(), async (c) => {
  try {
    const user = c.get('user');
    const { planId } = await c.req.json();
    if (!planId) return c.json({ success: false, error: 'planId required' }, 400);

    // 1. Create order
    const order = await createVipOrder(user.id, planId, c.req.header('x-forwarded-for'));

    // 2. Send AVAX from custodial wallet → receiver
    const { txHash } = await custodialWalletService.sendTransaction(
      user.id,
      PAYMENT_CONFIG.receiverAddress,
      order.amountAvax,
    );

    // 3. Verify on-chain (same as manual flow)
    const result = await verifyAvaxPayment(user.id, order.orderId, txHash);

    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[VIP] Custodial purchase error:', error.message);

    if (error.message === 'WALLET_NOT_FOUND') {
      return c.json({ success: false, error: 'Bạn chưa có ví FARMVERSE' }, 400);
    }
    if (error.message.includes('Insufficient')) {
      return c.json({ success: false, error: error.message }, 400);
    }
    return c.json({ success: false, error: error.message }, 500);
  }
});
```

**Import cần thêm ở đầu `vip.routes.ts`:**
```typescript
import { custodialWalletService } from '@/modules/custodial-wallet/custodial-wallet.service';
import { PAYMENT_CONFIG } from './payment.config';
```

---

## 7. FRONTEND THAY ĐỔI

### 7.1 `src/shared/api/game-api.ts` — Thay smart-wallet endpoints

**Thay dòng 1460-1536** bằng:
```typescript
  // ═══ CUSTODIAL WALLET ═══

  getCustodialWalletStatus: async (): Promise<{
    hasWallet: boolean;
    address: string | null;
    balance: string;
    chainId: number;
    isActive?: boolean;
  }> => {
    const url = API_BASE_URL + '/api/custodial-wallet/status';
    const response = await fetch(url, { method: 'GET', credentials: 'include' });
    if (response.status === 401) { handleUnauthorized('getCustodialWalletStatus'); throw new Error('Session expired'); }
    if (!response.ok) { await handleApiError(response); }
    const json = await response.json();
    return json.data;
  },

  withdrawCustodial: async (to: string, amount: string): Promise<{ txHash: string }> => {
    const url = API_BASE_URL + '/api/custodial-wallet/withdraw';
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, amount }),
    });
    if (response.status === 401) { handleUnauthorized('withdrawCustodial'); throw new Error('Session expired'); }
    if (!response.ok) { await handleApiError(response); }
    const json = await response.json();
    return json.data;
  },

  exportCustodialKey: async (): Promise<{ privateKey: string; address: string }> => {
    const url = API_BASE_URL + '/api/custodial-wallet/export';
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.status === 401) { handleUnauthorized('exportCustodialKey'); throw new Error('Session expired'); }
    if (!response.ok) { await handleApiError(response); }
    const json = await response.json();
    return json.data;
  },

  purchaseVipCustodial: async (planId: string): Promise<any> => {
    const url = API_BASE_URL + '/api/vip/purchase-custodial';
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
    });
    if (response.status === 401) { handleUnauthorized('purchaseVipCustodial'); throw new Error('Session expired'); }
    if (!response.ok) { await handleApiError(response); }
    const json = await response.json();
    return json.data;
  },
```

### 7.2 `src/shared/hooks/useCustodialWallet.ts` (MỚI)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';
import { toast } from 'sonner';

export function useCustodialWallet() {
  const queryClient = useQueryClient();

  const {
    data: walletStatus,
    isLoading,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ['custodial-wallet', 'status'],
    queryFn: () => gameApi.getCustodialWalletStatus(),
    staleTime: 15_000,
    retry: 1,
  });

  const hasWallet = walletStatus?.hasWallet ?? false;

  const withdrawMutation = useMutation({
    mutationFn: ({ to, amount }: { to: string; amount: string }) =>
      gameApi.withdrawCustodial(to, amount),
    onSuccess: (data) => {
      toast.success(`Đã gửi! TX: ${data.txHash.slice(0, 10)}...`);
      queryClient.invalidateQueries({ queryKey: ['custodial-wallet'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gửi thất bại');
    },
  });

  const exportMutation = useMutation({
    mutationFn: () => gameApi.exportCustodialKey(),
    onError: (error: any) => {
      toast.error(error.message || 'Export thất bại');
    },
  });

  return {
    walletStatus,
    hasWallet,
    isLoading,
    refetchStatus,
    withdraw: withdrawMutation.mutateAsync,
    isWithdrawing: withdrawMutation.isPending,
    exportKey: exportMutation.mutateAsync,
    isExporting: exportMutation.isPending,
  };
}
```

### 7.3 FE VIP PurchaseFlow — Thay đổi chính

**`src/modules/vip/components/PurchaseFlow.tsx`:**

Thay dòng 6:
```typescript
// THAY: import { useSmartWallet } from '@/shared/hooks/useSmartWallet';
import { useCustodialWallet } from '@/shared/hooks/useCustodialWallet';
```

Thay dòng 8-13:
```typescript
// THAY smart wallet imports:
// import { prepareSmartWalletOp, signAndSubmitSmartWalletOp, ... }
// BẰNG:
import { hasWalletExtension, sendViaWalletExtension } from '../utils/sendAvaxPayment';
```

Thay dòng 44:
```typescript
// THAY: const { walletStatus, hasWallet } = useSmartWallet();
const { walletStatus, hasWallet } = useCustodialWallet();
```

Thay payment button (dòng 379-406 — Smart Wallet section) bằng:
```tsx
{/* Option 1: Custodial Wallet (1 click) */}
{hasWallet && walletStatus?.address && (
  <button
    onClick={handlePurchaseCustodial}
    disabled={isPending || !canPayWithCustodial}
    className="w-full py-3 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
  >
    {isPending ? (
      <>
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        Đang thanh toán...
      </>
    ) : (
      <>
        <span className="material-symbols-outlined text-base">account_balance_wallet</span>
        Thanh toán {selectedPlan.priceAvax} AVAX (Ví FARMVERSE)
      </>
    )}
  </button>
)}
```

Thêm handler `handlePurchaseCustodial`:
```typescript
const handlePurchaseCustodial = async () => {
  if (!selectedPlan) return;
  setStep('processing');
  setProgress(1);
  setError(null);

  try {
    const result = await gameApi.purchaseVipCustodial(selectedPlan.id);
    setProgress(4);
    setResult(result);
    setStep('success');
    toast.success('VIP đã kích hoạt!');
  } catch (err: any) {
    setError(err.message || 'Thanh toán thất bại');
    setStep('confirm');
  }
};
```

**Bỏ hoàn toàn:** `step === 'signing'` section (dòng 491-567) — không cần countdown/fingerprint nữa.

### 7.4 `src/modules/profile/screens/ProfileScreen.tsx`

Thay dòng 19:
```typescript
// THAY: import { SmartWalletCard } from '../components/SmartWalletCard';
import { CustodialWalletCard } from '../components/CustodialWalletCard';
```

Thay dòng 327:
```tsx
// THAY: <SmartWalletCard />
<CustodialWalletCard />
```

### 7.5 `src/modules/vip/utils/sendAvaxPayment.ts`

**Xóa dòng 83-163** (toàn bộ Smart Wallet functions: `prepareSmartWalletOp`, `signAndSubmitSmartWalletOp`, `sendViaSmartWallet`).

**Giữ lại:** `hasWalletExtension()` + `sendViaWalletExtension()` (dòng 22-81) — vẫn cần cho MetaMask/Core external payment.

---

## 8. CLEANUP

### Smart Wallet module — Xóa toàn bộ:
```bash
rm -rf src/modules/smart-wallet/
```

### Schema — Xóa file cũ:
```bash
rm src/db/schema/smart-wallets.ts
```
(Đã thay bằng `custodial-wallets.ts` ở bước 2)

### `src/db/schema/index.ts` dòng 54:
```typescript
// THAY: export * from './smart-wallets';
export * from './custodial-wallets';
```

### DB table `smart_wallets` — GIỮ LẠI data cũ:
- KHÔNG DROP table ngay — backup data trước
- Sau khi confirm custodial wallet hoạt động OK → DROP table

### Dependencies cleanup (optional — sau khi test xong):
```bash
bun remove cbor-x  # Chỉ dùng cho COSE parse (smart wallet cũ)
```
Lưu ý: Kiểm tra `cbor-x` không dùng chỗ khác trước khi xóa:
```bash
grep -rn "cbor" --include="*.ts" src/ | grep -v smart-wallet
```

---

## 9. THỨ TỰ IMPLEMENT (STEP BY STEP)

| Step | Việc | Files | Ghi chú |
|------|------|-------|---------|
| 1 | Thêm `WALLET_ENCRYPTION_KEY` vào `.env` | `.env` | `openssl rand -hex 32` |
| 2 | Tạo schema `custodial-wallets.ts` | `src/db/schema/custodial-wallets.ts` | Drizzle schema |
| 3 | Sửa schema index | `src/db/schema/index.ts:54` | smart-wallets → custodial-wallets |
| 4 | Chạy migration | `bun run db:generate && bun run db:push` | Tạo table mới |
| 5 | Tạo `encryption.ts` | `src/modules/custodial-wallet/encryption.ts` | AES-256-GCM |
| 6 | Tạo `custodial-wallet.service.ts` | `src/modules/custodial-wallet/custodial-wallet.service.ts` | Core service |
| 7 | Tạo `custodial-wallet.routes.ts` | `src/modules/custodial-wallet/custodial-wallet.routes.ts` | API routes |
| 8 | Sửa `src/index.ts` | Import + mount routes | Thay smart-wallet |
| 9 | Sửa auth login hooks | 4 files auth | Thêm `ensureCustodialWallet` |
| 10 | Thêm VIP custodial endpoint | `vip.routes.ts` | `POST /purchase-custodial` |
| 11 | Restart PM2 | `pm2 restart cdhc-api` | Test backend |
| 12 | Sửa FE `game-api.ts` | Thay API endpoints | custodial-wallet |
| 13 | Tạo FE `useCustodialWallet.ts` | Hook mới | |
| 14 | Tạo FE `CustodialWalletCard.tsx` | Component mới | QR + balance + withdraw + export |
| 15 | Sửa FE `PurchaseFlow.tsx` | Thay Smart Wallet → Custodial | 1-click purchase |
| 16 | Sửa FE `ProfileScreen.tsx` | Import component mới | |
| 17 | Sửa FE `sendAvaxPayment.ts` | Xóa smart wallet functions | |
| 18 | Xóa FE `useSmartWallet.ts` + `SmartWalletCard.tsx` | Cleanup | |
| 19 | Xóa BE `src/modules/smart-wallet/` | Cleanup | Sau khi test OK |
| 20 | Test toàn bộ flow | Manual test | Xem checklist bên dưới |

---

## 10. TEST CHECKLIST

| # | Test case | Expected | Verify |
|---|-----------|----------|--------|
| 1 | Đăng nhập Google lần đầu | Auto tạo custodial wallet, GET /status trả address | curl /api/custodial-wallet/status |
| 2 | Đăng nhập Google lần 2 | Load wallet cũ, không tạo mới | Check DB: 1 row per user |
| 3 | Đăng nhập SIWE (MetaMask) | Auto tạo custodial wallet | |
| 4 | Đăng nhập Passkey | Auto tạo custodial wallet | |
| 5 | GET /status — ví trống | `{ hasWallet: true, balance: "0" }` | |
| 6 | Nạp AVAX từ sàn/MetaMask vào address | Balance cập nhật sau ~2s | Check Snowtrace |
| 7 | POST /withdraw — rút AVAX | TX thành công, balance giảm | Check txHash on Snowtrace |
| 8 | POST /withdraw — số dư không đủ | Error: Insufficient balance | |
| 9 | POST /withdraw — rate limit (>10/hr) | 429 RATE_LIMITED | |
| 10 | POST /export — xem private key | Trả private key hex | |
| 11 | POST /export — import key vào MetaMask | Address khớp | |
| 12 | POST /export — rate limit (>3/hr) | 429 RATE_LIMITED | |
| 13 | Mua VIP bằng custodial wallet | 1-click: TX → verify → activate | |
| 14 | Mua VIP — ví không đủ tiền | Error: Insufficient balance | |
| 15 | 2 user cùng tạo wallet cùng lúc | Mỗi user 1 wallet, không conflict | onConflictDoNothing |
| 16 | PM2 restart — wallet vẫn hoạt động | Data persistent trong DB | |
| 17 | Decrypt key — sai WALLET_ENCRYPTION_KEY | Error (auth tag mismatch) | Verify key đúng |
