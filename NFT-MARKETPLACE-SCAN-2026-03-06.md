# Bao Cao Scan — NFT Marketplace External Tab
**Ngay:** 2026-03-06
**Branch:** avalan
**Scanner:** Claude Opus 4.6 via MCP cdhc-test

---

## 1. Map Code Hien Tai

### 1.1 Files & Modules

| File | Dong | Vai tro |
|------|------|---------|
| `src/modules/nft/nft.routes.ts` | 322 | API endpoints: my-cards, event cards, card detail, withdraw, admin test |
| `src/modules/nft/nft-orchestrator.service.ts` | 242 | Pipeline dieu phoi: B1(prompt) -> B2(image) -> B3(upload) -> B4(mint) |
| `src/modules/nft/nft-mint.service.ts` | 135 | On-chain mint via viem: safeMint(to, uri) tren Avalanche C-Chain |
| `src/modules/nft/nft-image.service.ts` | 98 | AI image gen: Gemini 3.1 Flash -> sharp compress 512x768 JPEG |
| `src/modules/nft/nft-ipfs.service.ts` | 159 | R2 image upload + Pinata IPFS metadata upload + ERC-721 metadata builder |
| `src/modules/nft/nft-prompt.service.ts` | 305 | GPT-4o-mini tao prompt tu boss data -> Gemini render |
| `src/modules/marketplace/marketplace.routes.ts` | 512 | Marketplace CRUD: list, buy, cancel, browse + admin stats/all/force-cancel |
| `src/contracts/nft-card-abi.ts` | 129 | ERC-721 ABI: safeMint, transferFrom, ownerOf, approve, balanceOf, etc. |
| `src/db/schema/nft-listings.ts` | 31 | Drizzle schema cho bang nft_listings |
| `src/services/r2.service.ts` | 98 | Cloudflare R2 upload/delete via @aws-sdk/client-s3 |
| `src/modules/custodial-wallet/custodial-wallet.service.ts` | 528 | Wallet CRUD, send AVAX, NFT transfer, PIN system, passkey verify |
| `src/modules/custodial-wallet/custodial-wallet.routes.ts` | 465 | Wallet API: status, create, send, export, PIN, passkey |
| **Tong** | **3,024** | |

### 1.2 API Endpoints Hien Co

#### NFT Routes (`/api/nft`)

| Method | Path | Auth | Mo ta |
|--------|------|------|-------|
| GET | `/my-cards` | Yes | Lay tat ca NFT cards cua user (tu world_boss_rewards) |
| GET | `/event/:eventId` | No | Lay cards cua mot boss event cu the |
| GET | `/card/:eventId` | Yes | Card detail cua user hien tai (FE polls) |
| GET | `/card/:eventId/:userId` | No | Card detail public (legacy) |
| POST | `/admin/test-generate` | Admin | Test NFT generation pipeline |
| POST | `/withdraw` | Yes | Rut NFT ve vi MetaMask (transferFrom custodial -> external) |

#### Marketplace Routes (`/api/marketplace`)

| Method | Path | Auth | Mo ta |
|--------|------|------|-------|
| POST | `/list` | Yes | Rao ban NFT (verify on-chain owner, insert listing) |
| DELETE | `/list/:id` | Yes | Huy rao ban |
| GET | `/my-listings` | Yes | Listings cua user |
| GET | `/` | No | Browse active listings (sort: newest/price_asc/price_desc) |
| POST | `/buy/:listingId` | Yes | Mua NFT (optimistic lock + NFT transfer + AVAX transfer) |
| GET | `/admin/stats` | Admin | Thong ke marketplace |
| GET | `/admin/all` | Admin | Tat ca listings (filter by status) |
| DELETE | `/admin/force-cancel/:id` | Admin | Admin force cancel |
| GET | `/admin/withdrawals` | Admin | Danh sach NFT withdrawals |

#### Custodial Wallet Routes (`/api/custodial-wallet`)

| Method | Path | Auth | Mo ta |
|--------|------|------|-------|
| GET | `/status` | Yes | Wallet info + AVAX balance (auto-create) |
| POST | `/create` | Yes | Tao vi thu cong |
| POST | `/send` | Yes+PIN | Gui AVAX (max 10 AVAX/tx) |
| POST | `/export` | Yes+PIN | Export private key |
| GET | `/security-status` | Yes | PIN + passkey info |
| POST | `/set-pin` | Yes | Set PIN lan dau (6 digits, argon2id) |
| POST | `/verify-pin` | Yes | Verify PIN (rate limited, 5 attempts) |
| POST | `/change-pin` | Yes | Doi PIN |
| POST | `/reset-pin` | Yes | Reset PIN (can login < 5 phut) |

### 1.3 Database Tables Hien Co

#### `nft_listings`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| seller_user_id | uuid FK -> users | NOT NULL |
| token_id | integer | NOT NULL — chi cho FarmVerse contract |
| event_id | uuid | Nullable — link to world_boss_events |
| price_avax | numeric(18,6) | NOT NULL |
| status | varchar(20) | 'active' / 'processing' / 'sold' / 'cancelled' (CHECK constraint) |
| buyer_user_id | uuid FK -> users | Nullable |
| sold_tx_hash | varchar(100) | AVAX payment tx |
| nft_tx_hash | varchar(100) | NFT transfer tx |
| listed_at | timestamptz | NOT NULL, default now() |
| sold_at | timestamptz | Nullable |
| cancelled_at | timestamptz | Nullable |

**Indexes:**
- `nft_listings_pkey` — PK on id
- `idx_nft_listings_status` — status
- `idx_nft_listings_seller` — seller_user_id
- `idx_nft_listings_token` — token_id
- `idx_nft_listings_active_token` — UNIQUE partial index on token_id WHERE status='active'

**Constraints:**
- FK seller_user_id -> users(id)
- FK buyer_user_id -> users(id)
- CHECK status IN ('active','processing','sold','cancelled')

#### `nft_withdrawals`
| Column | Type |
|--------|------|
| id | uuid PK |
| user_id | uuid |
| token_id | integer |
| to_address | varchar |
| tx_hash | varchar |
| created_at | timestamptz |

#### `world_boss_rewards` (NFT-related columns)
| Column | Type | Notes |
|--------|------|-------|
| nft_card_type | varchar | 'last_hit' / 'top_damage' / 'dual_champion' |
| nft_card_image_url | text | R2 CDN URL |
| nft_metadata_uri | text | ipfs:// URI |
| nft_token_id | varchar | On-chain token ID |
| nft_tx_hash | varchar | Mint transaction hash |
| nft_mint_status | varchar | 'none'/'pending'/'minting'/'minted'/'uploaded'/'failed' |

#### `player_stats` (OGN balance)
| Column | Type | Notes |
|--------|------|-------|
| ogn | integer | In-game currency (Seed/Hat) |
| level | integer | Player level 1-100 |

#### Cac bang CHUA ton tai (can tao moi):
- `nft_contract_whitelist` — **KHONG co**
- `user_marketplace_slots` — **KHONG co**
- `external_nft_cache` — **KHONG co**
- `marketplace_reports` — **KHONG co**

### 1.4 Smart Contract Integration

| Item | Chi tiet |
|------|---------|
| **Contract** | FarmverseNFTCard (ERC-721 + URIStorage) |
| **Address** | ENV `NFT_CONTRACT_ADDRESS` (mainnet: `0x9b801a3E4144b100130506D5F1a2057355E601eC`) |
| **Chain** | Avalanche C-Chain (43114) |
| **Minter** | `DEPLOYER_PRIVATE_KEY` — wallet `0x8547ff92099e6Cd6202aa6F559f7Dd8C7Da32A24` |
| **Functions dung** | `safeMint(to, uri)` — only owner mint |
| | `transferFrom(from, to, tokenId)` — custodial transfer |
| | `ownerOf(tokenId)` — verify ownership |
| | `approve(to, tokenId)` — co trong ABI nhung **CHUA DUNG** |
| | `setApprovalForAll(operator, approved)` — co trong ABI nhung **CHUA DUNG** |
| | `getApproved(tokenId)` — co trong ABI nhung **CHUA DUNG** |
| | `balanceOf(owner)` — co trong ABI nhung **CHUA DUNG** |
| **RPC** | `AVALANCHE_RPC_URL` = `https://api.avax.network/ext/bc/C/rpc` (public RPC) |
| **Gas limit** | 300,000 |
| **Retry** | 3 attempts, delay 3s * attempt |

### 1.5 External Dependencies

| Package | Version | Dung cho |
|---------|---------|----------|
| `viem` | ^2.46.2 | Blockchain interaction (wallet, contract, RPC) |
| `hono` | ^4.11.3 | HTTP framework |
| `pg` | ^8.18.0 | PostgreSQL driver |
| `openai` | ^6.25.0 | GPT-4o-mini (NFT prompt generation) |
| `sharp` | ^0.34.5 | Image compression (512x768 JPEG) |
| `@aws-sdk/client-s3` | (indirect) | Cloudflare R2 upload |
| `@google/genai` | (indirect) | Gemini 3.1 Flash (image generation) |
| `drizzle-orm` | (indirect) | ORM + schema |

**CHUA CO:**
- `alchemy-sdk` — Can cho scan vi NFT ngoai
- Khong co ERC-2981 royalty detection
- Khong co ERC-1155 support

### 1.6 Data Thuc Te

| Metric | Gia tri |
|--------|---------|
| Tong NFT cards minted | 22 |
| Tong listings | 1 |
| Active listings | 1 |
| Sold listings | 0 |
| Total withdrawals | 0 |
| Token IDs range | 1-22 |

---

## 2. Gap Analysis — Can gi de implement External NFT

### 2.1 Database Changes Can Them

| # | Thay doi | Chi tiet | Rui ro |
|---|----------|---------|--------|
| 1 | `ALTER nft_listings ADD COLUMN tab` | varchar(20) DEFAULT 'farmverse', values: 'farmverse' / 'external' | **Low** — default giu backward compat |
| 2 | `ALTER nft_listings ADD COLUMN contract_address` | varchar(42), nullable (null = FarmVerse contract) | **Low** |
| 3 | `ALTER nft_listings ADD COLUMN metadata_uri` | text, nullable — cache tokenURI cho external NFTs | **Low** |
| 4 | `ALTER nft_listings ADD COLUMN image_url` | text, nullable — cache image URL cho external NFTs | **Low** |
| 5 | `ALTER nft_listings ADD COLUMN collection_name` | varchar(100), nullable — ten collection | **Low** |
| 6 | `ALTER nft_listings ADD COLUMN fee_percent` | numeric(5,2) DEFAULT 5.0 — phi marketplace | **Low** |
| 7 | `ALTER nft_listings ADD COLUMN featured` | boolean DEFAULT false | **Low** |
| 8 | `ALTER nft_listings ADD COLUMN cooldown_until` | timestamptz, nullable — anti-flip cooldown | **Low** |
| 9 | `UPDATE status CHECK` | Them 'expired' vao CHECK constraint | **Low** |
| 10 | `CREATE TABLE nft_contract_whitelist` | id, contract_address(unique), name, symbol, total_supply, is_erc721, is_verified, trust_score, floor_price, added_by, auto_scored_at, created_at | **None** — bang moi |
| 11 | `CREATE TABLE user_marketplace_slots` | id, user_id(unique), base_slots, bonus_slots, vip_slots, used_slots, created_at, updated_at | **None** — bang moi |
| 12 | `CREATE TABLE marketplace_reports` | id, listing_id, reporter_user_id, reason, details, status, resolved_by, created_at, resolved_at | **None** — bang moi |
| 13 | `CREATE TABLE external_nft_cache` | id, contract_address, token_id, owner_address, metadata_uri, image_url, name, collection_name, last_synced_at | **None** — cache bang |
| 14 | `ADD INDEX idx_nft_listings_tab` | On (tab, status) | **Low** |
| 15 | `ADD INDEX idx_nft_listings_contract` | On (contract_address) WHERE tab='external' | **Low** |

### 2.2 Backend Code Can Them

| # | Module | File moi / sua | Mo ta |
|---|--------|----------------|-------|
| 1 | **Alchemy Service** | `src/services/alchemy.service.ts` (MOI) | getNftsForOwner(), getContractMetadata(), getFloorPrice() |
| 2 | **Whitelist Engine** | `src/services/whitelist.service.ts` (MOI) | Auto-score contracts, CRUD whitelist, verify ERC-721 |
| 3 | **External NFT Routes** | `src/modules/marketplace/external.routes.ts` (MOI) | API cho tab NFT Ngoai: browse external, list external, get wallet NFTs |
| 4 | **Slot Manager** | `src/services/slot.service.ts` (MOI) | Tinh slot dua tren level + VIP, check used/available |
| 5 | **Fee Service** | `src/services/marketplace-fee.service.ts` (MOI) | Tinh phi 5%/10%, dot OGN, distribute |
| 6 | **Report Service** | `src/services/report.service.ts` (MOI) | Report listing, admin review, auto-delist |
| 7 | **Marketplace Routes** | `src/modules/marketplace/marketplace.routes.ts` (SUA) | Them tab filter, fee logic, slot check vao list/buy |
| 8 | **NFT Listings Schema** | `src/db/schema/nft-listings.ts` (SUA) | Them cot moi: tab, contract_address, fee_percent, etc. |
| 9 | **Contract ABI** | `src/contracts/erc721-standard-abi.ts` (MOI) | ABI chuan ERC-721 + ERC-2981 cho doc external NFTs |
| 10 | **Cron / Background** | `src/jobs/whitelist-scorer.ts` (MOI) | Periodic auto-score contracts, update cache |

### 2.3 Dependencies Can Cai

| Package | Version | Ly do |
|---------|---------|-------|
| `alchemy-sdk` | ^3.x | getNftsForOwner, getContractMetadata, getFloorPrice — API toi uu cho Avalanche |

**Hoac thay the:** Dung viem truc tiep voi public RPC (da co) + multicall batching. Tiet kiem dependency nhung cham hon va khong co indexed data.

---

## 3. Phuong An Implement

### Phuong an A: Mo rong module hien tai

**Uu:** It file moi, dung lai code marketplace.routes.ts va nft-listings schema
**Nhuoc:** File marketplace.routes.ts da 512 dong, se phình len 800+ dong. Mix logic 2 tab
**Cach:** Them tab filter + external logic truc tiep vao marketplace.routes.ts

### Phuong an B: Module moi tach biet

**Uu:** Clean separation, de maintain, de test doc lap
**Nhuoc:** Duplicate mot so logic (listing CRUD, buy flow), 2 module cung truy cap nft_listings
**Cach:** Tao `src/modules/external-marketplace/` rieng

### Phuong an C: Hybrid — Shared core + tab-specific routes

**Mo ta:**
- **Shared:** `nft_listings` table dung chung (them cot tab, contract_address), `marketplace-core.service.ts` chua logic dung chung (listing, buy, cancel, fee)
- **Tab-specific:** `marketplace.routes.ts` giu FarmVerse logic, `external-marketplace.routes.ts` chua External NFT logic (wallet scan, whitelist check, approve flow)
- **Services moi:** `alchemy.service.ts`, `whitelist.service.ts`, `slot.service.ts` doc lap, inject vao routes

**Uu:**
- Database thong nhat (1 bang listings, dung tab filter)
- Browse endpoint `/api/marketplace?tab=external` reuse cung query voi filter
- Logic dac thu (approve flow, whitelist check) tach rieng
- File khong qua lon (moi file < 300 dong)

**Nhuoc:**
- Can refactor mot so logic ra shared service

### *** De xuat: Phuong an C (Hybrid)

**Ly do:**
1. **Database thong nhat** — Admin stats, browse, search chay tren 1 bang, khong can UNION
2. **Code separation** — Transfer flow khac nhau (custodial vs approve-based), nen tach routes
3. **Reusable** — Fee logic, slot logic, report logic dung chung ca 2 tab
4. **Scalable** — De them tab thu 3 (VD: "ERC-1155 Items") sau nay

---

## 4. Implementation Plan (Thu tu)

| # | Task | Files | Mo ta | Phu thuoc |
|---|------|-------|-------|-----------|
| **Phase 1: Database** | | | | |
| 1.1 | Migration: ALTER nft_listings | SQL migration | Them tab, contract_address, metadata_uri, image_url, collection_name, fee_percent, featured, cooldown_until | — |
| 1.2 | Migration: CREATE tables | SQL migration | nft_contract_whitelist, user_marketplace_slots, marketplace_reports, external_nft_cache | — |
| 1.3 | Update Drizzle schema | `nft-listings.ts` + 3 file moi | Sync schema voi DB | #1.1, #1.2 |
| **Phase 2: Core Services** | | | | |
| 2.1 | Alchemy Service | `src/services/alchemy.service.ts` | getNftsForOwner, getContractMetadata, cache Redis 5min | — |
| 2.2 | Whitelist Service | `src/services/whitelist.service.ts` | Auto-score, CRUD, verifyContract(ERC-721 check via supportsInterface) | #1.2 |
| 2.3 | Slot Service | `src/services/slot.service.ts` | getSlots(userId): base(level) + bonus(VIP), checkAvailable | #1.2 |
| 2.4 | Fee Service | `src/services/marketplace-fee.service.ts` | calculateFee(tab, price), deduct OGN/AVAX | — |
| 2.5 | Marketplace Core Service | `src/services/marketplace-core.service.ts` | Refactor: shared listing/buy/cancel logic tu marketplace.routes.ts | #1.1 |
| **Phase 3: External NFT Routes** | | | | |
| 3.1 | Wallet Scan endpoint | `external-marketplace.routes.ts` | GET /api/marketplace/external/my-nfts — scan vi user qua Alchemy | #2.1 |
| 3.2 | List External NFT | Same file | POST /api/marketplace/external/list — whitelist check + slot check + approve verify | #2.2, #2.3 |
| 3.3 | Buy External NFT | Same file | POST /api/marketplace/external/buy/:id — approve-based transfer | #2.4 |
| 3.4 | Browse External tab | Same file | GET /api/marketplace?tab=external | #1.1 |
| **Phase 4: Enhancement** | | | | |
| 4.1 | Featured Listings | marketplace.routes.ts | OGN burn to feature, 24h duration | #2.4 |
| 4.2 | Cooldown System | marketplace-core.service.ts | Anti-flip: 24h cooldown sau khi mua | #1.1 |
| 4.3 | Report System | `src/modules/marketplace/report.routes.ts` | POST /report, admin review, auto-delist | #1.2 |
| 4.4 | Admin Whitelist CRUD | admin routes | GET/POST/PUT/DELETE whitelist, manual override | #2.2 |
| **Phase 5: Background Jobs** | | | | |
| 5.1 | Whitelist Auto-scorer | `src/jobs/whitelist-scorer.ts` | Cron: score new contracts, update floor price | #2.2 |
| 5.2 | Listing Expiry | `src/jobs/listing-expiry.ts` | Cron: expire listings > 30 days | #1.1 |
| 5.3 | NFT Cache Sync | `src/jobs/nft-cache-sync.ts` | Periodic re-verify on-chain ownership | #2.1 |

---

## 5. Phan Tich Kien Truc Chi Tiet

### 5.1 Transfer Flow — Diem Khac Biet Quan Trong

#### FarmVerse NFT (hien tai):
```
User list -> Server verify ownerOf() -> Insert listing
User buy  -> Server transferFrom(seller_custodial, buyer_custodial) [server co private key]
            -> Server sendTransaction(buyer -> seller AVAX)
```
- **Server co toan quyen** vi giu encrypted private key cua custodial wallets
- Khong can user approve — server la "custodian"

#### External NFT (can implement):
```
User list -> FE: user.approve(marketplace_escrow_contract, tokenId) [user ky bang MetaMask]
          -> BE: verify getApproved(tokenId) == escrow_address
          -> BE: escrow.transferFrom(user, escrow, tokenId) [lock NFT vao escrow]
          -> Insert listing

User buy  -> BE: escrow.transferFrom(escrow, buyer, tokenId) [unlock NFT]
          -> BE: sendTransaction(buyer -> seller AVAX minus fee)
```
- **Can smart contract escrow** rieng hoac **approval-based flow**
- User PHAI tuong tac voi blockchain (approve tx) truoc khi list

### 5.2 2 Sub-Options cho External Transfer

#### Option 1: Smart Contract Escrow (An toan hon)
- Deploy 1 smart contract `FarmverseMarketplace.sol`
- User approve -> contract lock NFT -> buyer pay -> contract release NFT
- **Uu:** Atomic, trustless, on-chain guarantee
- **Nhuoc:** Can deploy contract moi, gas cost cao hon, phuc tap hon

#### Option 2: Approval-Based (Don gian hon)
- User approve marketplace operator (server wallet) cho tokenId
- Server goi transferFrom khi co buyer
- **Uu:** Khong can deploy contract moi, nhanh implement
- **Nhuoc:** Centralized trust (server co quyen transfer), user phai trust server
- **Phu hop:** Vi FarmVerse da la custodial model, users da trust server

### *** De xuat: Option 2 (Approval-Based) cho MVP

Ly do: Consistent voi custodial model hien tai. Sau nay co the upgrade len escrow contract.

Flow chi tiet:
1. FE: User connect MetaMask -> goi `nft.approve(SERVER_WALLET, tokenId)` tren contract external
2. FE: POST /api/marketplace/external/list `{contractAddress, tokenId, priceAvax}`
3. BE: Verify `getApproved(tokenId) == SERVER_WALLET` on-chain
4. BE: Verify contract trong whitelist
5. BE: Check user slot available
6. BE: Insert listing (tab='external', contract_address=..., token_id=...)
7. Khi co buyer:
   - BE: `contract.transferFrom(seller, buyer_custodial_or_external, tokenId)` bang SERVER_WALLET
   - BE: Transfer AVAX (buyer -> seller, tru fee)
   - BE: Dot fee (OGN hoac AVAX)

### 5.3 Wallet Scan Strategy

| Phuong an | Toc do | Chi phi | Do chinh xac |
|-----------|--------|---------|-------------|
| **Alchemy SDK** | Nhanh (~200ms) | API key free tier: 300 req/s | Cao (indexed data) |
| **Direct RPC multicall** | Cham (~2-5s) | Free (public RPC) | Cao nhung can biet contract list truoc |
| **Hybrid** | Trung binh | Alchemy cho scan, RPC cho verify | Tot nhat |

**De xuat: Alchemy SDK** — Free tier du cho MVP. Cache Redis 5 phut.

---

## 6. Rui Ro & Luu Y

| # | Rui ro | Muc do | Mitigation |
|---|--------|--------|------------|
| 1 | **Alchemy API rate limit** | Medium | Cache Redis 5min per wallet, batch calls, free tier 300 CU/s |
| 2 | **On-chain verify cham** | Medium | Cache whitelist score 24h, chi verify approve khi list |
| 3 | **User revoke approve sau khi list** | High | Verify getApproved() truoc khi execute buy, neu revoked -> auto-cancel listing |
| 4 | **Scam NFT / fake collection** | High | Whitelist system bat buoc, auto-score trust, manual review cho score thap |
| 5 | **Gas cost cho transfer external NFT** | Medium | SERVER_WALLET can AVAX cho gas. Tinh gas vao fee hoac buyer chiu |
| 6 | **ERC-1155 tokens** | Low | Phase 1 chi ho tro ERC-721. Them ERC-1155 sau |
| 7 | **Re-entrancy attack** | Low | Dung optimistic lock pattern hien tai (update status='processing' truoc) |
| 8 | **NFT metadata/image unavailable** | Low | Cache metadata + image URL trong external_nft_cache, fallback placeholder |
| 9 | **Public RPC rate limit** | Medium | Da co AVALANCHE_RPC_URL, nen dung private RPC hoac Alchemy RPC |
| 10 | **Approve cho toan bo collection** | Medium | Chi approve tung tokenId (approve, KHONG phai setApprovalForAll) de giam rui ro |

---

## 7. Cau Hoi Can Giai Quyet

- [ ] **Alchemy API key:** Da co chua? Can dang ky Alchemy account + tao app cho Avalanche C-Chain
- [ ] **Escrow hay Approval-based?** De xuat Approval-based cho MVP (consistent voi custodial model)
- [ ] **Fee model:** 5% FarmVerse, 10% external — thanh toan bang AVAX hay OGN? Dot hay vao treasury?
- [ ] **Slot formula:** Base slot = level/10? VIP bonus = +2/+5/+10? Can confirm so cu the
- [ ] **Whitelist auto-score threshold:** Trust score >= 60 moi cho list? Hay can admin approve?
- [ ] **Server wallet cho approve flow:** Dung DEPLOYER_PRIVATE_KEY hien tai hay tao wallet rieng?
- [ ] **Cooldown duration:** 24h hay 48h sau khi mua external NFT?
- [ ] **Featured duration:** 24h? Chi phi OGN bao nhieu?
- [ ] **Max price cap:** Co can gioi han gia toi da cho listing? (Hien tai marketplace khong co cap)
- [ ] **External NFT withdraw:** Cho phep user rut external NFT (cancel listing + return) hay chi ban xong?

---

## 8. So Sanh Marketplace Hien Tai vs Target

| Feature | Hien tai | Target (External Tab) |
|---------|---------|----------------------|
| Tab | 1 (FarmVerse only) | 2 (FarmVerse + External) |
| NFT Source | World Boss rewards only | + Bat ky ERC-721 tren Avalanche |
| Contract | 1 (FarmverseNFTCard) | N (whitelist-verified) |
| Transfer | Server custodial transferFrom | Approval-based (user approve -> server transfer) |
| Fee | 0% | 5% FarmVerse, 10% External |
| Slots | Unlimited | Level-based + VIP bonus |
| Featured | Khong co | OGN burn to boost |
| Cooldown | Khong co | Anti-flip 24h |
| Report | Khong co | User report + admin review |
| Wallet scan | Khong co | Alchemy getNftsForOwner |
| Price | AVAX only | AVAX only (giu nguyen) |
| Sort | newest/price_asc/price_desc | + collection, + rarity, + featured_first |
| Search | Khong co | By collection, by name |
| Pagination | LIMIT 50 | Cursor-based pagination |

---

## 9. File Structure De Xuat (Sau Implement)

```
src/
  contracts/
    nft-card-abi.ts              # (giu nguyen) FarmVerse NFT ABI
    erc721-standard-abi.ts       # (MOI) Standard ERC-721 + ERC-2981 ABI
  db/schema/
    nft-listings.ts              # (SUA) Them cot: tab, contract_address, fee_percent, etc.
    nft-contract-whitelist.ts    # (MOI) Whitelist schema
    user-marketplace-slots.ts    # (MOI) Slot schema
    marketplace-reports.ts       # (MOI) Report schema
    external-nft-cache.ts        # (MOI) Cache schema
  modules/marketplace/
    marketplace.routes.ts        # (SUA) Them tab filter, refactor dung core service
    external.routes.ts           # (MOI) External NFT endpoints
    report.routes.ts             # (MOI) Report endpoints
  services/
    alchemy.service.ts           # (MOI) Alchemy SDK wrapper
    whitelist.service.ts         # (MOI) Contract verification + scoring
    slot.service.ts              # (MOI) Slot management
    marketplace-fee.service.ts   # (MOI) Fee calculation + deduction
    marketplace-core.service.ts  # (MOI) Shared listing/buy/cancel logic
  jobs/
    whitelist-scorer.ts          # (MOI) Background auto-score
    listing-expiry.ts            # (MOI) Background expiry
```

**File moi: 12 | File sua: 2 | Tong estimated lines: ~2,000-2,500**

---

## 10. Migration SQL (Draft)

```sql
-- Phase 1: ALTER nft_listings
ALTER TABLE nft_listings
  ADD COLUMN tab VARCHAR(20) NOT NULL DEFAULT 'farmverse',
  ADD COLUMN contract_address VARCHAR(42),
  ADD COLUMN metadata_uri TEXT,
  ADD COLUMN image_url TEXT,
  ADD COLUMN collection_name VARCHAR(100),
  ADD COLUMN fee_percent NUMERIC(5,2) DEFAULT 5.0,
  ADD COLUMN featured BOOLEAN DEFAULT FALSE,
  ADD COLUMN cooldown_until TIMESTAMPTZ;

-- Update CHECK constraint
ALTER TABLE nft_listings DROP CONSTRAINT valid_status;
ALTER TABLE nft_listings ADD CONSTRAINT valid_status
  CHECK (status IN ('active','processing','sold','cancelled','expired'));

-- New indexes
CREATE INDEX idx_nft_listings_tab ON nft_listings(tab, status);
CREATE INDEX idx_nft_listings_contract ON nft_listings(contract_address) WHERE tab = 'external';
CREATE INDEX idx_nft_listings_featured ON nft_listings(featured, listed_at) WHERE status = 'active';

-- Phase 2: New tables
CREATE TABLE nft_contract_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_address VARCHAR(42) NOT NULL UNIQUE,
  name VARCHAR(100),
  symbol VARCHAR(20),
  total_supply INTEGER,
  is_erc721 BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  trust_score INTEGER NOT NULL DEFAULT 0, -- 0-100
  floor_price NUMERIC(18,6),
  holder_count INTEGER,
  added_by UUID REFERENCES users(id),
  auto_scored_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_marketplace_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  base_slots INTEGER NOT NULL DEFAULT 2,
  bonus_slots INTEGER NOT NULL DEFAULT 0,
  vip_slots INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE marketplace_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES nft_listings(id),
  reporter_user_id UUID NOT NULL REFERENCES users(id),
  reason VARCHAR(50) NOT NULL, -- 'fake','stolen','inappropriate','scam','other'
  details TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending','reviewed','resolved','dismissed'
  resolved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  UNIQUE(listing_id, reporter_user_id) -- 1 user chi report 1 listing 1 lan
);

CREATE TABLE external_nft_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_address VARCHAR(42) NOT NULL,
  token_id INTEGER NOT NULL,
  owner_address VARCHAR(42),
  metadata_uri TEXT,
  image_url TEXT,
  name VARCHAR(200),
  collection_name VARCHAR(100),
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(contract_address, token_id)
);
CREATE INDEX idx_external_nft_cache_owner ON external_nft_cache(owner_address);
```

---

**KET LUAN:** Backend hien tai co nen tang tot (custodial wallet, viem integration, NFT mint pipeline, marketplace CRUD voi optimistic lock). Viec mo rong them tab "NFT Ngoai" can chu yeu la: (1) Alchemy integration de scan vi, (2) whitelist system de verify contract, (3) approval-based transfer flow thay vi custodial, (4) fee + slot + report system. Phuong an Hybrid (C) la phu hop nhat — dung chung bang nft_listings, tach routes theo tab, shared core services.
