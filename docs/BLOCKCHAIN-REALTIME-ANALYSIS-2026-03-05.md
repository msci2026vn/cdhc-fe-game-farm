# BLOCKCHAIN REALTIME PUSH — ANALYSIS REPORT

> **Date:** 2026-03-05
> **Scope:** Backend RWA Delivery → Blockchain flow
> **Status:** SCAN ONLY — no code changes

---

## A. BLOCKCHAIN FLOW HIỆN TẠI

### A1. Hàm đẩy blockchain

| Item | Detail |
|------|--------|
| **File** | `src/modules/rwa/services/delivery-blockchain.service.ts` |
| **Hàm chính** | `batchDeliveriesToBlockchain()` |
| **Gọi bởi** | Cron trong `src/modules/rwa/delivery.cron.ts` (biến `blockchainCron`) |
| **Schedule** | `0 0,12 * * *` — chạy lúc 00:00 và 12:00 VN |
| **Timezone** | `Asia/Ho_Chi_Minh` |

### A2. Data đẩy lên chain

**Quy trình Merkle:**
1. Query tất cả rows trong `delivery_qr_codes` có `delivery_hash IS NOT NULL` và `blockchain_tx IS NULL`
2. Lấy mảng `delivery_hash` → build Merkle tree → ra 1 `merkleRoot`
3. Gọi contract `storeRoot(root, count)` — 1 TX cho toàn bộ batch
4. Sau khi TX confirmed → update mỗi row QR với `blockchain_tx`, `merkle_proof`, `merkle_index`
5. Đồng thời update `delivery_slots.blockchain_tx`

**Data trong mỗi `delivery_hash`** (hash SHA-256 của):
```typescript
{
  slotId, userId, subscriptionId, monthYear, slotNumber,
  farm, product, harvestDate, deliveredAt, verifiedBy, otpCode
}
```

### A3. Contract & Chain

| Item | Value |
|------|-------|
| **Chain** | Avalanche C-Chain (mainnet, chainId 43114) |
| **Contract** | Merkle root storage (custom) |
| **Contract functions** | `storeRoot(bytes32, uint256)`, `storeBatch(bytes32[], uint256[])`, `isRootStored(bytes32)` |
| **Library** | `viem` (publicClient + walletClient, lazy-init singleton) |
| **Explorer** | snowtrace.io |

### A4. Cron logic chi tiết

```
delivery.cron.ts:
├── deliveryCron: '0 1 * * *'     → tạo daily slots + expire old
└── blockchainCron: '0 0,12 * * *' → batchDeliveriesToBlockchain()
```

**Batch logic:** Gom TẤT CẢ pending rows → 1 Merkle root → 1 TX. Không giới hạn batch size.

### A5. Error handling khi blockchain fail

| Scenario | Xử lý hiện tại |
|----------|----------------|
| Deployer balance < 0.005 AVAX | Return `{ success: false, error }` — log ra console, **KHÔNG retry** |
| `writeContract` fail | Return error — **KHÔNG retry** |
| TX reverted on-chain | Return error — **KHÔNG retry** |
| Confirmation timeout (60s) | Return error — **KHÔNG retry** |
| General exception | Catch → return error |

**Kết luận:** KHÔNG có retry mechanism. Nếu fail, phải chờ cron chạy lại (12h sau).

### A6. Ước lượng thời gian 1 lần đẩy blockchain

| Step | Estimated time |
|------|---------------|
| DB query pending rows | ~50ms |
| Build Merkle tree (in-memory) | ~1ms (thường < 10 rows) |
| Check deployer balance (RPC call) | 500ms–2s |
| `writeContract` (sign + send TX) | 1–3s |
| `waitForTransactionReceipt` (timeout 60s) | **2–15s** (Avalanche ~2s block time) |
| DB update rows | ~50ms per row |
| **TOTAL** | **~5–20 giây** |

---

## B. ĐIỂM CHÈN REALTIME

### B1. Hai hàm chuyển sang `delivered`

**Hàm 1: `scanClaimDelivery()`** — QR scan (dòng ~318, delivery.service.ts)
```
Flow: verify OTP+secretToken → update QR isVerified → update slot status='delivered'
     → compute deliveryHash → update QR deliveryHash → log gameAction → addXP
     → return { blockchainStatus: 'pending' }
```

**Hàm 2: `verifyOtp()`** — Manual code input (dòng ~393, delivery.service.ts)
```
Flow: verify OTP → update QR isVerified → update slot status='delivered'
     → compute deliveryHash → update QR deliveryHash → log gameAction → addXP
     → return { blockchainStatus: 'pending' }
```

### B2. Điểm chèn cụ thể

Cả 2 hàm đều kết thúc bằng:
```typescript
return {
  success: true,
  slotId,
  deliveredAt: now,
  deliveryHash,
  blockchainStatus: 'pending' as const,
  message: '...',
};
```

**Chèn NGAY TRƯỚC `return`** — sau khi đã có `deliveryHash` và đã update DB xong.

### B3. User có phải chờ không?

- Nếu `await batchDeliveriesToBlockchain()` → user chờ thêm 5–20s → **BAD UX**
- Nếu fire-and-forget (không await) → user nhận response ngay → **GOOD UX**
- Nhưng fire-and-forget cho batch function thì batch sẽ gom cả slots khác → **SAI LOGIC**

**→ Cần hàm mới: `pushSingleDeliveryToBlockchain(slotId)` hoặc gọi batch chỉ cho 1 row.**

### B4. Nếu blockchain fail → slot vẫn delivered?

**CÓ.** Status `delivered` đã được set trước khi gọi blockchain. Nếu blockchain fail:
- Slot vẫn `delivered` ✓
- QR có `delivery_hash` ✓
- QR thiếu `blockchain_tx` → FE hiện "Waiting for blockchain recording"
- Cron backup sẽ gom slot này vào batch tiếp theo ✓

---

## C. ĐỀ XUẤT PHƯƠNG ÁN

### Phương án 1: Fire-and-forget gọi batch function (KHÔNG recommend)

```
delivered → fire batchDeliveriesToBlockchain() (no await) → return ngay
```

**Vấn đề:** Batch function query TẤT CẢ pending rows, không chỉ slot vừa delivered. Nếu 2 user delivered cùng lúc → race condition (2 TX cùng gom chung rows → 1 fail).

### Phương án 2: Hàm mới `pushSingleDelivery()` + fire-and-forget (RECOMMENDED)

```
delivered → fire pushSingleDelivery(qrCodeId) (no await) → return ngay
Cron backup: vẫn chạy 12h → quét orphaned rows
```

**Hàm mới sẽ:**
1. Query 1 row QR by ID (đã biết ID, không cần scan)
2. Build Merkle tree chỉ 1 leaf → root = leaf hash
3. Gọi `storeRoot(hash, 1)` → 1 TX cho 1 delivery
4. Update row QR + slot

**Ưu điểm:**
- User không chờ
- Không race condition (mỗi slot 1 TX riêng)
- Cron backup vẫn hoạt động cho orphaned slots
- Đơn giản, không cần dependency mới

**Nhược điểm:**
- Tốn gas hơn (1 TX/delivery thay vì batch) — nhưng trên AVAX gas rẻ (~0.001 AVAX/TX)
- Nếu fire fail silent → chờ cron 12h (chấp nhận được vì có backup)

### Phương án 3: Queue-based (BullMQ)

```
delivered → push job vào BullMQ queue → return ngay
Worker: process queue → đẩy blockchain → retry 3 lần nếu fail
Cron backup: quét orphaned slots
```

**Ưu điểm:**
- Retry tự động, reliable nhất
- Có thể batch (gom jobs gần nhau)
- Dashboard monitoring

**Nhược điểm:**
- Cần thêm BullMQ dependency (nhưng đã có Redis)
- Phức tạp hơn đáng kể
- Overkill cho volume hiện tại (vài deliveries/ngày)

### SO SÁNH

| Tiêu chí | PA2 (fire-and-forget) | PA3 (BullMQ queue) |
|----------|----------------------|-------------------|
| Độ phức tạp | Thấp | Trung bình |
| User wait | 0s | 0s |
| Retry | Không (cron backup) | Có (auto 3 lần) |
| Race condition | Không | Không |
| Dependency mới | Không | BullMQ |
| Gas cost | Cao hơn (1 TX/delivery) | Có thể batch |
| Phù hợp volume | < 50 deliveries/ngày | > 50 deliveries/ngày |
| **Recommendation** | **✓ CHỌN** | Upgrade sau nếu cần |

---

## D. THIẾT KẾ CONFIG LINH HOẠT

### D1. Environment variable

```env
# ===== BLOCKCHAIN PUSH STRATEGY =====
# 'realtime' → đẩy ngay sau delivered (fire-and-forget, 1 TX/delivery)
# 'cron'     → chỉ đẩy qua cron batch (0 0,12 * * *)
# Cron backup LUÔN chạy bất kể strategy nào.
DELIVERY_BLOCKCHAIN_STRATEGY=realtime
```

### D2. Code pattern — strategy dispatcher

```typescript
// src/modules/rwa/services/delivery-blockchain.service.ts

// [BLOCKCHAIN STRATEGY]
// Đổi strategy bằng env DELIVERY_BLOCKCHAIN_STRATEGY:
//   'realtime' → fire-and-forget pushSingleDelivery() ngay sau delivered
//   'cron'     → chỉ đẩy qua cron batch mỗi 12h
// Cron backup LUÔN chạy dù strategy nào (quét orphaned rows).
// Xem: docs/BLOCKCHAIN-REALTIME-ANALYSIS-2026-03-05.md

const STRATEGY = process.env.DELIVERY_BLOCKCHAIN_STRATEGY || 'realtime';

export function shouldPushRealtime(): boolean {
  return STRATEGY === 'realtime';
}

export async function pushSingleDelivery(qrCodeId: string): Promise<...> {
  // 1. Query 1 row by ID
  // 2. Merkle tree 1 leaf (root = hash)
  // 3. storeRoot(hash, 1)
  // 4. Update QR + slot
}

// Gọi từ delivery.service.ts (2 chỗ):
export function fireBlockchainPushIfNeeded(qrCodeId: string): void {
  if (!shouldPushRealtime()) return;
  // Fire-and-forget — log error nhưng KHÔNG throw
  pushSingleDelivery(qrCodeId).catch((err) => {
    console.error('[Blockchain Realtime] Push failed, cron will retry:', err.message);
  });
}
```

### D3. Điểm gọi trong delivery.service.ts

**scanClaimDelivery()** — sau dòng `await db.update(deliveryQrCodes).set({ deliveryHash, ... })`:
```typescript
// [BLOCKCHAIN] Fire-and-forget push nếu strategy = 'realtime'
fireBlockchainPushIfNeeded(qrCode.id);
```

**verifyOtp()** — tương tự, sau khi set `deliveryHash`:
```typescript
// [BLOCKCHAIN] Fire-and-forget push nếu strategy = 'realtime'
fireBlockchainPushIfNeeded(qrCode.id);
```

### D4. Cron backup — không thay đổi

`batchDeliveriesToBlockchain()` giữ nguyên. Nó query `WHERE delivery_hash IS NOT NULL AND blockchain_tx IS NULL` — chỉ gom rows chưa có TX (dù realtime hay cron).

Nếu realtime đã push thành công → row đã có `blockchain_tx` → cron tự skip.
Nếu realtime fail → row vẫn thiếu `blockchain_tx` → cron gom vào batch tiếp theo. ✓

---

## E. DB STATE HIỆN TẠI

### Slots đã có blockchain TX (5 gần nhất)

| slot_id | slot_number | slot_date | blockchain_tx | delivered_at |
|---------|-------------|-----------|---------------|-------------|
| 1ebbdaf7 | 1 | 2026-03-01 | 0x9c17...e2d4 | 2026-03-04 11:26 |
| 02c25580 | 4 | 2026-02-01 | 0x1fca...76a2 | 2026-02-23 08:57 |
| 8c6a4abd | 3 | 2026-02-01 | 0x1fca...76a2 | 2026-02-23 07:03 |
| dabad5d3 | 2 | 2026-02-01 | 0x1fca...76a2 | 2026-02-23 07:03 |
| 2e4d5cce | 1 | 2026-02-01 | 0x1fca...76a2 | 2026-02-23 07:02 |

**Nhận xét:** Slot 2-4 (2026-02) chia sẻ cùng 1 TX → batch hoạt động đúng.

### Slots pending blockchain (chưa có TX)

| slot_id | slot_number | slot_date | delivered_at |
|---------|-------------|-----------|-------------|
| e0903d79 | 1 | 2026-03-05 | 2026-03-04 21:04 |

**→ 1 slot delivered tối 2026-03-04, phải chờ tới cron 00:00 hoặc 12:00 mới lên chain.**

### QR pending blockchain

| qr_id | slot_id | delivery_hash | verified_at |
|-------|---------|---------------|-------------|
| a3751824 | e0903d79 | 0x3f7d...60e9 | 2026-03-04 21:04 |

---

## F. FILES CẦN SỬA (cho prompt tiếp theo)

| # | File | Thay đổi |
|---|------|----------|
| 1 | `src/modules/rwa/services/delivery-blockchain.service.ts` | Thêm `pushSingleDelivery()`, `fireBlockchainPushIfNeeded()`, `shouldPushRealtime()` |
| 2 | `src/modules/rwa/services/delivery.service.ts` | Gọi `fireBlockchainPushIfNeeded(qrCode.id)` trong `scanClaimDelivery()` và `verifyOtp()` |
| 3 | `.env` | Thêm `DELIVERY_BLOCKCHAIN_STRATEGY=realtime` |

**Không cần sửa:**
- `delivery.cron.ts` — giữ nguyên làm backup
- `blockchain.config.ts` — không thay đổi
- Schema DB — không thay đổi
- Frontend — không thay đổi (đã handle `pending_blockchain` status)

---

## G. RISK ASSESSMENT

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Gas cost tăng (1 TX/delivery) | Thấp (~0.001 AVAX/TX, AVAX mainnet rẻ) | Monitor deployer balance |
| Fire-and-forget fail silent | Thấp — cron backup 12h | Log error rõ ràng |
| Nonce conflict (2 deliveries cùng giây) | Trung bình — 2 TX cùng nonce → 1 fail | Cron backup sẽ retry. Hoặc thêm mutex lock trên Redis |
| Deployer balance hết | Trung bình — tất cả push fail | Alert khi balance < 0.01 AVAX |

### Nonce conflict — giải pháp

Nếu 2 user delivered cùng lúc → 2 `pushSingleDelivery()` fire cùng lúc → cùng nonce → 1 TX fail.

**Giải pháp đơn giản:** Redis mutex lock `blockchain:push:lock` TTL 30s. Nếu locked → skip (cron sẽ gom).

```typescript
const LOCK_KEY = 'blockchain:delivery:push:lock';
const LOCK_TTL = 30; // seconds

export async function pushSingleDelivery(qrCodeId: string) {
  const locked = await redis.set(LOCK_KEY, '1', 'EX', LOCK_TTL, 'NX');
  if (!locked) {
    console.log('[Blockchain Realtime] Another push in progress, cron will handle');
    return null;
  }
  try {
    // ... push logic ...
  } finally {
    await redis.del(LOCK_KEY);
  }
}
```

---

## H. TÓM TẮT

**Phương án chọn: PA2 — Fire-and-forget `pushSingleDelivery()` + cron backup**

1. Thêm hàm `pushSingleDelivery(qrCodeId)` — đẩy 1 delivery lên chain
2. Thêm `fireBlockchainPushIfNeeded(qrCodeId)` — wrapper fire-and-forget
3. Gọi wrapper sau khi set `deliveryHash` trong cả `scanClaimDelivery()` và `verifyOtp()`
4. Config qua env `DELIVERY_BLOCKCHAIN_STRATEGY` — đổi giữa `realtime` / `cron`
5. Cron backup giữ nguyên — tự skip rows đã có TX
6. Redis mutex lock chống nonce conflict

**Effort estimate:** ~60 dòng code mới + 2 dòng gọi + 1 dòng env.
