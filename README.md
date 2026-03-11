# 🌾 Organic Kingdom — Con Duong Huu Co

![Live](https://img.shields.io/badge/Live-game.cdhc.vn-brightgreen)
![Network](https://img.shields.io/badge/Network-Avalanche%20Mainnet-red)
![Chain](https://img.shields.io/badge/Chain%20ID-43114-blue)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Bun](https://img.shields.io/badge/Bun-Runtime-f9f1e1)
![License](https://img.shields.io/badge/License-MIT-yellow)

> ⚠️ **MVP Development Notice**
> This is an MVP focused on **building features first**.
> UI/UX polish is planned for upcoming sprints.
> Core gameplay and blockchain integration are fully functional.

**[🎮 Play Now](https://game.cdhc.vn)** | **[📹 Demo Video](https://www.youtube.com/watch?v=FXUyC021D3k)** | **[🔗 API](https://sta.cdhc.vn/health)**

---

## 🎯 What It Does

**Organic Kingdom** is a Web3 farming simulation game on Avalanche C-Chain that bridges virtual gameplay with real-world organic agriculture. Players farm crops, battle bosses through match-3 puzzle combat, collect NFT cards, participate in on-chain prayer ceremonies, and engage in real-time PvP — all while connecting to actual IoT sensor data from physical organic farms in Vietnam.

The blockchain runs silently underneath — players just play. No gas fees, no seed phrases, no wallet setup required. ERC-4337 Smart Wallets with Pimlico Paymaster handle everything behind the scenes.

## 🎮 Live Demo

| Resource | URL |
|----------|-----|
| 🎮 Game | https://game.cdhc.vn |
| 📹 Demo Video | https://www.youtube.com/watch?v=FXUyC021D3k |
| 🔗 API Health | https://sta.cdhc.vn/health |

## 🏗️ Architecture

```
                         Organic Kingdom ARCHITECTURE
    ┌─────────────────────────────────────────────────────────────┐
    │                      FRONTEND (This Repo)                   │
    │          React 18 + Vite + TanStack Query + Zustand          │
    │      Wagmi + viem (SIWE) │ Colyseus SDK │ SSE Events         │
    └──────────────┬──────────────┬──────────────┬────────────────┘
                   │              │              │
          REST API │    WebSocket │     SSE      │
                   │    (Colyseus)│   (PvP)      │
    ┌──────────────▼──────────────▼──────────────▼────────────────┐
    │                      BACKEND (VPS)                           │
    │            Bun.js + Hono + Drizzle ORM                       │
    │                                                              │
    │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
    │  │ Farming  │ │  Boss    │ │  Prayer  │ │   RWA / IoT    │  │
    │  │  Engine  │ │  Engine  │ │  Engine  │ │  Sensor Ingest │  │
    │  └──────────┘ └────┬─────┘ └────┬─────┘ └───────┬────────┘  │
    │                    │            │                │            │
    │  ┌────────┐  ┌─────┴────┐  ┌───┴─────┐  ┌──────┴────────┐  │
    │  │Postgres│  │  Redis   │  │Colyseus │  │   Pimlico     │  │
    │  │  (DB)  │  │ (Cache)  │  │(Realtime│  │  (ERC-4337    │  │
    │  │        │  │          │  │  Rooms) │  │   Bundler)    │  │
    │  └────────┘  └──────────┘  └─────────┘  └──────┬────────┘  │
    └──────────────────────────────────────────────── │ ──────────┘
                                                      │
              ┌───────────────────────────────────────┘
              │
    ┌─────────▼──────────────────────────────────────────────────┐
    │                  AVALANCHE C-CHAIN (43114)                  │
    │                                                             │
    │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
    │  │FarmverseNFT  │  │PrayerRecord  │  │ MerkleRootStore  │  │
    │  │  ERC-721     │  │  Contract    │  │    Contract      │  │
    │  │ (Card Mint)  │  │(Batch Proof) │  │  (RWA Hash)      │  │
    │  └──────────────┘  └──────────────┘  └──────────────────┘  │
    └─────────────────────────────────────────────────────────────┘
```

## ✨ Features

### 🌾 Farming System

- **3-slot farm grid** with plant lifecycle: seed, grow, harvest, wilt
- **4 crop types:** Wheat (15min, 5 XP), Tomato (1hr, 15 XP), Carrot (3hr, 30 XP), Chili (6hr, 50 XP)
- **Water mechanics** with cooldown timer
- **Weather system** affecting crop happiness (temperature, humidity from real IoT sensors)
- **Happiness decay** — neglected crops lose yield
- **Bug catch mini-game** for bonus XP
- **Friend garden visits** — see what your friends are growing

### ⚔️ Combat System — Campaign Boss

- **10-zone story campaign** with 40 bosses (4 per zone)
- **Match-3 puzzle combat** — swap gems to deal damage
- **Boss archetypes:** Warrior, Mage, Tank, Rogue — each with unique mechanics
- **Multi-phase final boss** (De Vuong) with 4 transformation stages
- **3 player skills:** Sam Dong (lightning), Ot Hiem (chili), Rom Boc (nest)
- **Fragment drops** from bosses → craft recipes → farm buffs
- **Mission system:** daily/weekly objectives with rewards
- **Achievement badges** with login streak calendar

### 🗡️ Combat System — Weekly Boss

- **Weekly rotating boss roster** with match-3 combat
- **Boss rage mechanics** — boss enrages at low HP
- **Combo multiplier** system for skill play
- **OGN + XP rewards** per victory

### 👹 World Boss (Cooperative Raid)

- **Global shared boss** — all players attack the same HP pool
- **Real-time HP bar** with live damage feed
- **30-minute raid sessions** with countdown timer
- **Damage ranking leaderboard** — top contributors earn NFT card drops
- **History** of past World Boss events and rewards

### 🥊 PvP Arena (Real-time 1v1)

- **Match-3 multiplayer battles** via Colyseus WebSocket
- **Quick Match** — automatic matchmaking queue
- **Friend Invite** — challenge specific friends
- **Bot Battles** — 4 difficulty tiers (Easy, Medium, Hard, Expert)
- **Open Rooms** — create/browse public matches
- **Elo rating system** with ranked leaderboard
- **Server-Sent Events** for real-time notifications (invites, matches, challenges)
- **Match history** with win/loss/draw tracking

### 🙏 Prayer System (On-chain)

- **9 prayer categories:** Peace, Nature, Harvest, Health, Family, Community, Earth, Spiritual, All
- **Preset + custom prayers** with daily limits
- **Quick pray** button for fast devotion
- **Streak counter** for consecutive daily prayers
- **Community leaderboard** — most devout players
- **OGN + XP rewards** with milestone multipliers
- **On-chain Merkle proof** — prayers batched and recorded to `FarmversePrayerRecord` contract
- Any player can independently verify their prayer was included via Merkle proof

### 🖼️ NFT System

**NFT Gallery:**
- View owned NFT cards (earned from World Boss drops)
- Card rarity system: Common, Rare, Epic, Legendary
- **Sell** on P2P Marketplace
- **Auction** via queue-based auction system
- **Withdraw** to external wallet (MetaMask) — ERC-721 on-chain transfer
- IPFS metadata via Pinata, Snowtrace tx links

**P2P Marketplace:**
- Browse/filter NFT listings by rarity
- Sort by newest, price ascending/descending
- Purchase flow with OGN payment + fee breakdown
- My listings management, transaction history

**Auction House:**
- Spotlight + side auction sessions
- Queue system — bidders wait for their slot
- Sealed bid phase with reveal animation
- **Sudden death** mechanic in final 30 seconds
- Penny bid button (auto-increment by minimum)
- Whale alert animations for big bids
- Emoji reaction bar during live bidding

### 🌱 RWA — Real World Assets (IoT Integration)

- **VIP-exclusive** real garden dashboard
- **Live IoT sensor data:** temperature, humidity, soil moisture
- **Camera livestream** from physical organic farm (WebRTC + HLS)
- **Delivery slot booking** with QR code verification
- **OTP claim system** for produce delivery
- **Blockchain proof of delivery** — sensor data hashed to `MerkleRootStore` contract
- **Sensor timeline** with historical charts
- **Snowtrace verification** for all on-chain proofs

### 👛 Wallet System

**ERC-4337 Smart Wallet (Account Abstraction):**
- Auto-deployed Coinbase Smart Wallet for new players
- WebAuthn/Passkey biometric signing
- Pimlico Bundler for gasless transactions — players pay $0 AVAX
- UserOperation building + signing handled by backend

**Custodial Wallet:**
- Backend-managed wallet for total beginners
- No wallet setup needed — just play

**External Wallet (MetaMask / Core / WalletConnect):**
- SIWE (Sign-In with Ethereum, EIP-4361) authentication
- Direct on-chain transactions for power users

### 📚 Quiz & Education

- **5-question daily quiz** about organic farming
- **15-second timer** per question with audio feedback
- **4 multiple-choice options** with reveal animations
- **OGN + XP rewards** based on correctness
- Score summary with replay option

### 👥 Social

- **Friends list** with online status
- **Friend garden visits** — view friends' farms
- **Friend request** system (send/accept/reject)
- **User search** to find and add friends
- **Invite friends** — share referral link (+50 OGN reward)
- **Global leaderboard** with level + XP ranking

### 📈 Stock Market (Prediction Game)

- **Price prediction game** — guess if stock goes up or down
- **Price index** tracking with historical charts
- **Prediction streaks** for bonus rewards
- **Market leaderboard** for top predictors

### 💎 VIP & Monetization

- **VIP subscription** tiers with AVAX payment
- Unlock extra farm plots + RWA garden access
- **Topup packages** via PayPal/crypto (desktop payment page)
- **Order history** with Snowtrace tx verification

### 🔐 Authentication

- **Google OAuth** — one-click login with auto-registration
- **Telegram Mini App** — seamless auth from Telegram
- **Telegram Widget** — login via bot
- **SIWE Wallet Auth** — Sign-In with Ethereum (Avalanche C-Chain + Fuji)
- **Passkey/WebAuthn** — biometric login for Smart Wallet users
- **JWT session** with refresh token rotation

---

## ⛓️ Blockchain Architecture on Avalanche

### Design Philosophy — "Blockchain Invisible, Value Real"

> Most Web3 games force users to sign transactions, pay gas, and understand wallets
> before they can play. **Organic Kingdom flips this entirely.**
>
> Players just play. Blockchain runs silently underneath — recording value,
> proving integrity, and enabling true ownership — without ever interrupting the experience.

### How Blockchain Fits Into The Game

```
PLAYER ACTION
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│                   Organic Kingdom BACKEND                   │
│  (Bun.js + Hono — business logic, game state, auth)     │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │ Farming  │  │  Boss    │  │  Prayer  │  │  RWA   │  │
│  │  Engine  │  │  Engine  │  │  Engine  │  │  IoT   │  │
│  └──────────┘  └────┬─────┘  └────┬─────┘  └───┬────┘  │
└───────────────────── │ ─────────── │ ─────────── │ ─────┘
                        │             │             │
              ┌─────────┘   ┌─────────┘             │
              ▼             ▼                        ▼
   ┌──────────────┐  ┌──────────────┐   ┌──────────────────┐
   │ FarmverseNFT │  │PrayerRecord  │   │ MerkleRootStore  │
   │  ERC-721     │  │  Contract    │   │    Contract      │
   │  (mint NFT)  │  │(batch proof) │   │  (RWA hash)      │
   └──────────────┘  └──────────────┘   └──────────────────┘
              │             │                        │
              └─────────────┴────────────────────────┘
                                  │
                     ┌────────────▼────────────┐
                     │  Avalanche C-Chain       │
                     │  Mainnet (Chain ID 43114)│
                     └─────────────────────────┘
```

### Feature 1 — NFT Cards from World Boss (ERC-721)

**The core "play-to-earn" mechanic — fully on-chain.**

```
Player joins World Boss raid
         │
         ▼
Multiplayer PvE battle (Colyseus realtime server)
         │
         ▼
Boss defeated → Backend calculates damage ranking
         │
         ▼
Top contributors qualify for NFT drop
         │
         ▼
Backend calls FarmverseNFTCard.mint()
         │   ├── tokenId auto-incremented
         │   ├── metadata: card type, rarity, stats
         │   └── IPFS URI via Pinata
         ▼
NFT minted to player's wallet on Avalanche C-Chain
         │
         ▼
Player sees card in NFT Gallery
         │
         ▼
Can list on P2P Marketplace or enter Auction (Colyseus)
```

**Why this matters:** NFT cards are not cosmetic — they represent combat power gained
through real gameplay effort, verifiably owned on-chain. No admin can take them away.

### Feature 2 — Prayer System with Merkle Proof

**Transparent on-chain record — every prayer is provably stored.**

```
Player submits prayer (text)
         │
         ▼
Backend stores in PostgreSQL prayers table
         │
         ▼  (batch job — every N prayers or time interval)
Backend builds Merkle tree from all pending prayers
         │   └── Each leaf = keccak256(prayerId + userId + content + timestamp)
         ▼
Merkle root submitted to FarmversePrayerRecord contract
         │   └── tx recorded on Avalanche C-Chain
         ▼
Player can verify their prayer is included:
         Merkle proof path → verify against on-chain root ✅
```

**Why this matters:** Unlike typical game databases that can be altered,
prayer records on Organic Kingdom are cryptographically tamper-proof.
Any player can independently verify their prayer was recorded — no trust required.

### Feature 3 — RWA: Real Organic Farm → Blockchain

**The bridge between digital gameplay and the physical world.**

```
Real organic farm (Vietnam)
         │
         ▼
IoT sensors collect data:
    ├── Soil moisture
    ├── Temperature
    ├── Humidity
    └── Harvest timestamp
         │
         ▼
Sensor data → SHA-256 hash generated
         │
         ▼
Hash submitted to MerkleRootStore contract
         │   └── immutable proof on Avalanche C-Chain
         ▼
QR code generated per delivery batch
         │
         ▼
Consumer scans QR → verifies product authenticity
    on-chain vs physical delivery record ✅
```

**Why this matters:** This connects Organic Kingdom's virtual farming game to a real-world
supply chain transparency problem. The IoT data hash on-chain makes organic certification
verifiable by anyone, not just centralized auditors.

### Feature 4 — ERC-4337 Smart Wallet (Account Abstraction)

**Zero friction onboarding — new players never touch a seed phrase.**

```
New player signs up (Google / Telegram / Email)
         │
         ▼
Backend deploys Coinbase Smart Wallet via Factory
    └── 0x0BA5ED0c6AA8c49038F819E587E2633c4A9F428a
         │
         ▼
Wallet address assigned to player account
         │
         ▼
Player earns OGN tokens / receives NFT
    └── goes directly into smart wallet
         │
         ▼
When player wants to transact on-chain:
    ├── UserOperation built by backend
    ├── Sent to Pimlico Bundler
    ├── Paymaster sponsors gas (player pays 0 AVAX)
    └── Transaction executed on Avalanche ✅
```

**Why this matters:** Mainstream gaming audiences abandon Web3 when asked to
buy gas tokens before playing. ERC-4337 eliminates this — players experience
blockchain benefits (true ownership, interoperability) without blockchain complexity.

### Feature 5 — SIWE Auth (Sign-In with Ethereum)

For players who already have a Web3 wallet (MetaMask, WalletConnect):

```
Player clicks "Connect Wallet"
         │
         ▼
Backend generates nonce (one-time, expires in 5 min)
         │
         ▼
Frontend prompts wallet to sign EIP-4361 message:
    "Sign in to Organic Kingdom at game.cdhc.vn
     Nonce: abc123
     Issued: 2026-03-11T..."
         │
         ▼
Signature verified server-side (no password needed)
         │
         ▼
JWT issued → player authenticated ✅
```

### On-Chain Activity (Live)

| Metric | Data |
|--------|------|
| Network | Avalanche C-Chain Mainnet |
| NFTs Minted | Verifiable on Snowtrace |
| Prayer Batches | On-chain since 2026-03-10 |
| RWA Hashes | Recorded per delivery batch |
| Smart Wallets Deployed | 3+ (growing) |
| Gas for Players | **$0** — Pimlico Paymaster |

### Technical Decisions & Tradeoffs

| Decision | Why |
|----------|-----|
| **Avalanche C-Chain** over Ethereum | 2s finality, ~$0.001 tx cost — viable for game microtransactions |
| **ERC-721** over ERC-1155 | Each NFT card is unique (different stats, rarity) — not fungible |
| **Merkle batching** for prayers | Cost-efficient — 1000 prayers = 1 on-chain tx, still fully verifiable |
| **Custodial + Smart Wallet** dual mode | Custodial for total beginners, Smart Wallet for power users |
| **Backend-initiated minting** | Game server controls mint eligibility — prevents exploits |
| **IPFS via Pinata** for NFT metadata | Decentralized storage — metadata survives even if our servers go down |

---

## 🔗 Smart Contracts

> ✅ All contracts deployed on **Avalanche C-Chain Mainnet (Chain ID: 43114)**
> Real transactions. Real ownership. No testnet. No simulation.

| Contract | Address | Explorer | Role |
|----------|---------|----------|------|
| FarmverseNFTCard (ERC-721) | `0x9b801a3e4144b100130506d5f1a2057355e601ec` | [Snowtrace ↗](https://snowtrace.io/address/0x9b801a3e4144b100130506d5f1a2057355e601ec) | NFT cards from World Boss |
| FarmversePrayerRecord | `0x853185f76a3daa50432c2802846c7a4f38a1a3f0` | [Snowtrace ↗](https://snowtrace.io/address/0x853185f76a3daa50432c2802846c7a4f38a1a3f0) | On-chain Merkle prayer proof |
| MerkleRootStore | `0x27CD564b8A98EFAa4Aff145Ee2E158bAE0051775` | [Snowtrace ↗](https://snowtrace.io/address/0x27CD564b8A98EFAa4Aff145Ee2E158bAE0051775) | RWA IoT data integrity |
| SmartWalletFactory (ERC-4337) | `0x0BA5ED0c6AA8c49038F819E587E2633c4A9F428a` | [Snowtrace ↗](https://snowtrace.io/address/0x0BA5ED0c6AA8c49038F819E587E2633c4A9F428a) | Coinbase Smart Wallet v1.1 |
| EntryPoint (ERC-4337) | `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789` | [Snowtrace ↗](https://snowtrace.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789) | ERC-4337 standard EntryPoint |

### Verify On-Chain

All contracts are deployed and verifiable:

- NFT Contract: https://snowtrace.io/address/0x9b801a3e4144b100130506d5f1a2057355e601ec
- Prayer Record: https://snowtrace.io/address/0x853185f76a3daa50432c2802846c7a4f38a1a3f0
- Merkle Root Store: https://snowtrace.io/address/0x27CD564b8A98EFAa4Aff145Ee2E158bAE0051775

---

## 🛠️ Tech Stack

### Frontend (This Repo)
| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| Vite 5 | Build tool + HMR |
| TypeScript | Type safety |
| TanStack Query v5 | Server state + caching |
| Zustand | Client state (farm, UI, level-up) |
| React Router v6 | Routing (37+ lazy-loaded screens) |
| Tailwind CSS 3 | Styling |
| shadcn/ui (Radix) | Component library |
| Wagmi v3 + viem | Wallet connection + SIWE |
| Colyseus SDK | WebSocket realtime (PvP, Auction) |
| Framer Motion | Animations |
| i18next | Internationalization (vi-VN primary) |
| Vite PWA | Progressive Web App support |
| SimpleWebAuthn | Passkey/biometric auth |
| Recharts | Data visualization |
| html2canvas | Screenshot sharing |
| html5-qrcode | QR code scanning (RWA delivery) |
| qrcode.react | QR code generation |

### Backend (Separate Repo)
| Technology | Purpose |
|-----------|---------|
| Bun.js | JavaScript runtime |
| Hono | HTTP framework |
| Drizzle ORM | Database access |
| PostgreSQL | Primary database |
| Redis | Caching, rate limiting, sessions |
| Colyseus | Realtime game server (PvP, Auction) |
| viem | Smart contract interactions |
| Pinata | IPFS storage for NFT metadata |
| Pimlico | ERC-4337 bundler (gasless TX) |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Avalanche C-Chain | Blockchain (2s finality, ~$0.001/tx) |
| PM2 | Process manager |
| Nginx | Reverse proxy + SSL |
| Cloudflare | CDN + DNS |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun 1.0+
- npm, yarn, or bun

### Installation

```bash
git clone https://github.com/msci2026vn/cdhc-fe-game-farm.git
cd cdhc-fe-game-farm

npm install        # or: bun install

cp .env.example .env.local
# Edit .env.local — fill in VITE_GOOGLE_CLIENT_ID at minimum

npm run dev        # http://localhost:8080
```

### Build for Production

```bash
npm run build
npm run preview
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 8080) |
| `npm run build` | Build for production |
| `npm run build:dev` | Build with development mode |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint code (ESLint) |

## 🌐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API base URL |
| `VITE_GOOGLE_CLIENT_ID` | Yes | Google OAuth Client ID |
| `VITE_TELEGRAM_BOT_USERNAME` | No | Telegram bot username for auth widget |
| `VITE_WALLETCONNECT_PROJECT_ID` | No | WalletConnect Cloud project ID |

See [`.env.example`](.env.example) for a complete template with comments.

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/google` | Google OAuth login |
| POST | `/api/auth/google/register` | Auto-register new Google user |
| POST | `/api/auth/telegram/callback` | Telegram widget auth |
| POST | `/api/auth/telegram/webapp` | Telegram Mini App auth |
| POST | `/api/auth/telegram/link` | Link Telegram to existing account |
| GET | `/api/auth/wallet/nonce` | Get SIWE nonce |
| POST | `/api/auth/wallet/verify` | Verify SIWE signature |
| POST | `/api/auth/wallet/link` | Link wallet to existing account |
| POST | `/api/auth/session/refresh` | Refresh JWT token |
| POST | `/api/auth/session/logout` | Logout |

### Game — Farming
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/game/farm/plots` | Get player's farm plots |
| POST | `/api/game/farm/plant` | Plant a seed |
| POST | `/api/game/farm/water` | Water a plot |
| POST | `/api/game/farm/harvest` | Harvest a crop |
| POST | `/api/game/farm/clear` | Clear a plot |

### Game — Combat & Campaign
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/game/combat/zones` | Get campaign zones |
| POST | `/api/game/combat/battle` | Submit battle result |
| GET | `/api/game/combat/progress` | Get campaign progress |

### Game — Player
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/me` | Get player profile |
| PUT | `/api/auth/profile` | Update profile |
| GET | `/api/auth/profile/full` | Full profile + stats |
| POST | `/api/game/player/level-up` | Manual level up |

### Game — Social
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/game/social/friends` | Friends list |
| POST | `/api/game/social/send-request` | Send friend request |
| POST | `/api/game/social/accept-friend/:fromId` | Accept request |
| DELETE | `/api/game/social/unfriend/:friendId` | Unfriend |
| GET | `/api/game/social/friend-farm/:friendId` | Visit friend's farm |
| GET | `/api/game/social/referral` | Get referral info |
| GET | `/api/game/leaderboard` | Global leaderboard |

### Game — Skills, Recipes, Missions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/game/skill` | Get player skills |
| POST | `/api/game/skill/upgrade` | Upgrade a skill |
| GET | `/api/game/recipe` | List recipes |
| GET | `/api/game/recipe/inventory` | Recipe inventory |
| POST | `/api/game/recipe/craft` | Craft a recipe |
| GET | `/api/game/recipe/buffs` | Active farm buffs |

### World Boss
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/world-boss/current` | Get active World Boss |
| GET | `/api/world-boss/current/lite` | Lightweight boss status |
| POST | `/api/world-boss/attack` | Submit attack damage |
| GET | `/api/world-boss/leaderboard/:eventId` | Event leaderboard |
| GET | `/api/world-boss/history` | Past events |
| GET | `/api/world-boss/my-rewards/:eventId` | Player rewards |

### PvP
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/pvp/find-match` | Join matchmaking queue |
| DELETE | `/api/pvp/find-match` | Leave queue |
| GET | `/api/pvp/find-match/status` | Queue status |
| POST | `/api/pvp/play-bot` | Play vs AI |
| POST | `/api/pvp/boss-challenge` | Challenge boss |
| POST | `/api/pvp/create-open-room` | Create public room |
| POST | `/api/pvp/create-invite-link` | Generate invite link |
| GET | `/api/pvp/validate-invite/:token` | Validate invite |
| POST | `/api/pvp/invite` | Send friend invite |
| POST | `/api/pvp/invite/respond` | Accept/reject invite |
| POST | `/api/pvp/start-challenge` | Start challenge |
| POST | `/api/pvp/challenge-respond` | Respond to challenge |
| GET | `/api/pvp/rating` | Player rating |
| GET | `/api/pvp/history` | Match history |
| GET | `/api/pvp/leaderboard` | PvP leaderboard |
| GET | `/api/pvp/rooms` | List open rooms |
| GET | `/api/pvp/events` | SSE event stream |

### Prayer
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/prayer/offer` | Submit a prayer |
| GET | `/api/prayer/status` | Prayer status + limits |
| GET | `/api/prayer/presets` | Preset prayer texts |
| GET | `/api/prayer/history` | Prayer history |
| GET | `/api/prayer/leaderboard` | Top prayer users |
| GET | `/api/prayer/global` | Global prayer stats |
| GET | `/api/prayer/categories` | Prayer categories |

### NFT & Marketplace
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/nft/my-cards` | Player's NFT cards |
| POST | `/api/nft/withdraw` | Withdraw NFT to wallet |
| GET | `/api/marketplace/listings` | Browse listings |
| POST | `/api/marketplace/list` | List NFT for sale |
| POST | `/api/marketplace/buy` | Purchase listing |
| POST | `/api/marketplace/cancel` | Cancel listing |

### Auction
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auction/list` | Active auctions |
| GET | `/api/auction/session/next` | Next auction session |
| POST | `/api/auction/create` | Create auction |
| POST | `/api/auction/bid/:id` | Place bid |
| POST | `/api/auction/cancel/:id` | Cancel auction |
| POST | `/api/auction/withdraw/:id` | Withdraw from auction |
| GET | `/api/auction/my-bids` | Player's bid history |
| GET | `/api/auction/my-listings` | Player's auction listings |
| GET | `/api/auction/bidpack/:sessionId` | Bid pack info |

### RWA (IoT Garden)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rwa/my-garden` | Garden dashboard (VIP) |
| GET | `/api/rwa/my-garden/summary` | Garden summary |
| GET | `/api/rwa/sensors/latest` | Latest sensor readings |
| GET | `/api/rwa/sensors/history` | Historical sensor data |
| GET | `/api/rwa/sensors/hourly` | Hourly aggregated data |
| GET | `/api/rwa/sensors/dates` | Available dates |
| GET | `/api/rwa/devices` | List IoT devices |
| GET | `/api/rwa/camera/stream-info` | Camera livestream URL |
| GET | `/api/rwa/blockchain/stats` | Blockchain proof stats |
| GET | `/api/rwa/blockchain/logs` | On-chain tx logs |
| GET | `/api/rwa/delivery-history` | Delivery history (VIP) |
| POST | `/api/rwa/delivery/claim/:slotId` | Claim delivery slot |
| POST | `/api/rwa/delivery/scan-claim` | Scan claim delivery |
| POST | `/api/rwa/delivery/verify-otp` | Verify delivery OTP |
| GET | `/api/rwa/delivery/qr/:slotId` | Get slot QR code |
| GET | `/api/rwa/delivery/verify/:slotId` | Delivery proof |

### Smart Wallet & VIP
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/game/player/prepare-user-op` | Prepare ERC-4337 UserOp |
| POST | `/api/game/player/submit-signed-op` | Submit signed UserOp |
| GET | `/api/vip/orders` | VIP order history |
| POST | `/api/vip/purchase` | Purchase VIP |
| GET | `/api/market/prices` | Stock market prices |

### Weather & Misc
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/weather/current` | Current weather data |
| GET | `/api/game/ogn/history` | OGN transaction history |
| GET | `/health` | API health check |

## 📊 Live Stats

| Metric | Count |
|--------|-------|
| Registered Users | 405 |
| Active Players | 32 |
| Highest Player Level | 64 |
| Boss Battles Fought | 2,408 |
| Campaign Progress Records | 226 |
| World Boss Events | 192 |
| Prayers Offered | 129 |
| PvP Matches | 18 |
| NFT Listings | 4 |
| Auction Sessions | 3 |
| Smart Wallets Deployed | 3 |
| Game Modules | 23 |
| Screens/Pages | 37+ |
| Smart Contracts | 5 |

## 📂 Project Structure

```
src/
├── App.tsx                    # Router + providers (Wagmi, QueryClient, Auth)
├── main.tsx                   # Entry point
├── i18n.ts                    # Internationalization config
├── modules/                   # Feature modules (23 total)
│   ├── auth/                  # Google, Telegram, Wallet (SIWE) login
│   ├── farming/               # Core farming gameplay
│   │   ├── screens/           # FarmingScreen
│   │   ├── components/        # PlotRow, BugCatchGame, HUD, etc.
│   │   ├── hooks/             # useFarmingActions, useFarmPlots
│   │   ├── stores/            # farmStore (Zustand)
│   │   └── data/              # plants.ts (crop config)
│   ├── boss/                  # Weekly boss fights (Match-3)
│   ├── campaign/              # 10-zone story mode
│   │   ├── screens/           # Map, Zone, Battle, Skills, Fragments
│   │   ├── data/              # zones, bossDetails, archetypes, recipes
│   │   └── hooks/             # useMatch3Campaign
│   ├── world-boss/            # Global cooperative raids
│   ├── pvp/                   # Real-time 1v1 arena
│   ├── prayer/                # On-chain prayer system
│   ├── nft/                   # NFT gallery + withdraw
│   ├── marketplace/           # P2P trading hub
│   ├── auction/               # NFT auction house
│   ├── rwa/                   # IoT garden + delivery
│   ├── quiz/                  # Daily organic farming quiz
│   ├── friends/               # Social + leaderboard
│   ├── inventory/             # Crop storage + selling
│   ├── shop/                  # Seeds, tools, cards, NFTs
│   ├── market/                # Stock prediction game
│   ├── vip/                   # Subscription + payment
│   ├── profile/               # Stats, wallet, achievements
│   ├── home/                  # Main menu hub
│   ├── settings/              # Fullscreen, PIN, language
│   ├── admin/                 # Marketplace stats, wallet monitor
│   ├── language/              # i18n config
│   └── splash/                # Loading screen
├── shared/                    # Shared utilities
│   ├── api/                   # API client (game-api, api-rwa)
│   ├── hooks/                 # useWalletAuth, useGameSync, useBlockchain
│   ├── stores/                # playerStore, uiStore
│   ├── config/                # wagmi.ts (chain config)
│   ├── components/            # AuthGuard, ErrorBoundary
│   └── utils/                 # error-handler, helpers
├── components/ui/             # shadcn/ui components
├── desktop/                   # Desktop payment pages (Topup)
├── locales/                   # Translation files (vi, en)
├── assets/                    # Static assets
└── styles/                    # Global styles
```

## 🗺️ Roadmap

- [x] Core farming mechanics (plant, water, harvest, weather)
- [x] Boss battle system (weekly + 10-zone campaign)
- [x] Match-3 puzzle combat engine
- [x] World Boss cooperative raids
- [x] PvP real-time arena (Colyseus WebSocket)
- [x] On-chain prayer + Merkle proof batching
- [x] NFT ERC-721 minting + Gallery
- [x] P2P Marketplace + Auction House
- [x] Smart Wallet ERC-4337 (gasless transactions)
- [x] SIWE wallet authentication
- [x] RWA IoT sensor integration + delivery verification
- [x] Stock market prediction game
- [x] VIP subscription with AVAX payment
- [x] Multi-auth (Google + Telegram + Wallet + Passkey)
- [x] PWA support (installable web app)
- [x] i18n internationalization
- [ ] UI/UX polish and responsive refinement
- [ ] Mobile app (React Native)
- [ ] Token launch (OGN)
- [ ] DAO governance
- [ ] Cross-chain bridge

## 📄 License

MIT
