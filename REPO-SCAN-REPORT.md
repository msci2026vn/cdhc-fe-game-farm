# REPO SCAN REPORT — The Organic Kingdom
## Avalanche Build Games 2026 — Submission Prep
**Scan date:** 2026-03-06

---

## 1. PROJECT STRUCTURE

### 1.1 Frontend (React + Vite + TypeScript)
- **Path:** `/mnt/d/du-an/cdhc/cdhc-game-vite/`
- **Size:** ~44MB (excluding node_modules/.git)
- **Files:** 521 .tsx, 416 .ts, 36 .css, 144 .svg, 132 .mp3, 40 .png, 198 .md

**Module structure (28 screens):**
```
src/
  modules/
    admin/         — Admin marketplace management
    auth/          — Login (Google OAuth + Wallet)
    boss/          — Boss fight (deprecated, replaced by campaign)
    campaign/      — Campaign match-3 boss battles (zones, skills, recipes, missions, achievements, fragments)
    farming/       — Farm plots, plant, harvest, sell
    friends/       — Friend system (add, accept, search)
    home/          — Main menu
    inventory/     — Player inventory
    language/      — Multi-language (vi/en via Google Translate)
    market/        — Agri price prediction game
    marketplace/   — NFT marketplace P2P
    nft/           — NFT gallery
    prayer/        — Community prayer/blessing system
    profile/       — Player profile, OGN history
    quiz/          — Organic farming quiz
    rwa/           — Real-World Asset (IoT garden, delivery, blockchain proof)
    settings/      — User settings
    shop/          — In-game shop
    splash/        — Splash screen
    vip/           — VIP subscription (AVAX payment)
    world-boss/    — World boss cooperative battles
  shared/
    api/           — 18 API modules (auth, farm, boss, campaign, economy, etc.)
    audio/         — Sound system (AudioManager, FallbackSynth)
    autoplay/      — AI auto-play system (MCTS, learner, scorer)
    components/    — Shared UI (ErrorBoundary, LevelUpButton, DailyXpBar, etc.)
    config/        — wagmi.ts (Avalanche chain config)
    hooks/         — 30+ shared hooks
    match3/        — Match-3 game engine (board utils, combat types, gem pointer)
    stores/        — Zustand stores
    types/         — TypeScript type definitions
    utils/         — Utilities
  styles/          — CSS modules (farm, campaign, combat, prayer, etc.)
  desktop/         — Desktop top-up module (PayPal/Stripe)
```

### 1.2 Backend (Bun + Hono + Drizzle + PostgreSQL + Redis)
- **Path:** `/home/cdhc/apps/cdhc-be/`
- **Runtime:** Bun.js, PM2 (2 instances, fork mode)
- **146 .bak files** in src/

**Backend modules:**
```
src/modules/
  admin/           — Admin panel v1
  admin-v2/        — Admin panel v2 (monitoring, control, legacy recovery)
  auction/         — NFT auction (escrow via minter wallet)
  auth/            — Google OAuth + WebAuthn/Passkey + Wallet auth (SIWE)
  conversion/      — OGN<->VND conversion
  custodial-wallet/ — Custodial wallet (PIN-protected)
  game/            — Core game logic (farm, boss, campaign, shop, quiz, leaderboard, social, etc.)
  legacy/          — Legacy data migration
  market/          — Agri market prediction
  marketplace/     — NFT marketplace
  news/            — News/announcements
  nft/             — NFT minting (ERC-721 via deployer wallet)
  points/          — Points system
  prayer/          — Prayer system
  rwa/             — Real-World Asset (IoT sensors, delivery, blockchain proof)
  smart-wallet/    — ERC-4337 smart wallet (SimpleAccount, Pimlico bundler)
  topup/           — Fiat-to-crypto top-up (PayPal/Stripe -> AVAX)
  vip/             — VIP subscription
  weather/         — Weather data (cron + API)
  world-boss/      — World boss system (Redis Lua atomic)
```

### 1.3 Blockchain Integration
- **Chain:** Avalanche C-Chain (43114) + Fuji Testnet (43113)
- **Library:** viem + wagmi (FE), viem (BE)
- **Contract addresses found in BE code:**
  - Merkle Contract: `0x27CD564b8A98EFAa4Aff145Ee2E158bAE0051775`
  - Payment Receiver: `0x43029a55621023911961296796AC2246a43D1257`
  - Smart Wallet Factory: `0x0BA5ED0c6AA8c49038F819E587E2633c4A9F428a`
  - EntryPoint (ERC-4337): `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789`
  - Chainlink AVAX/USD: `0x0A77230d17318075983913bC2145DB16C7366156`
- **No .sol files found** — contracts deployed externally / ABI-only integration

### 1.4 Tech Stack Summary
| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite 5, TypeScript, TailwindCSS 3, Zustand, TanStack Query, Framer Motion |
| Backend | Bun.js, Hono, Drizzle ORM, PostgreSQL, Redis/DragonflyDB |
| Blockchain | Avalanche C-Chain, viem, wagmi, ERC-4337 (Pimlico), SIWE |
| AI | OpenAI (BE), Google GenAI (BE), MCTS auto-play (FE) |
| Auth | Google OAuth, WebAuthn/Passkeys, SIWE wallet auth |
| Payments | Stripe, PayPal, VNPay, native AVAX |
| Infra | PM2, Sentry, Pino logger, BullMQ, Croner |
| PWA | vite-plugin-pwa, fullscreen portrait |

---

## 2. AI/CLAUDE TRACES TO REMOVE

### 2.1 Files & Directories
| # | Path | Issue |
|---|------|-------|
| 1 | `.claude/` | Claude Code config directory (launch.json, settings.local.json, worktrees/) |
| 2 | `.claude/worktrees/romantic-wilson/` | Worktree with full repo copy |
| 3 | `.claude/settings.local.json` | Contains Claude-specific permissions with "Co-Authored-By: Claude Opus 4.6" |

### 2.2 Git Commits Mentioning Claude/AI
| Hash | Message |
|------|---------|
| `275f2a8` | fix: remove dangling .claude/worktrees submodule entry from git index |
| `1a27877` | fix: remove .claude from git tracking — was causing submodule error on deploy |
| `cc78fd6` | fix: apply gitignore for .claude properly |
| `960b55b` | Update camera live view and **claude settings** |
| `a879db5` | chore: update farming screen and **claude settings** |
| `ce2cdc1` | Refactor BossFightCampaign into smaller components |

### 2.3 Code Comments — NO AI traces found in src/
- Frontend src/: Only CSS `cursor` matches (false positives). **Clean.**
- Backend src/: Only Redis `cursor` variable uses (false positives). **Clean.**

---

## 3. JUNK FILES TO DELETE

### 3.1 Frontend Root — Report/Doc Files (55 files!)
These are Claude-generated scan/fix/debug reports that should NOT be in the repo:

```
# Root .md reports (ALL should be deleted)
CUSTODIAL-WALLET-IMPLEMENT.md
CUSTODIAL-WALLET-SCAN-REPORT.md
DATA-SYNC-REPORT-2026-02-21.md
DEBUG-HARVEST-INSERT-500-2026-02-14.md
DEBUG-INVENTORY-500-2026-02-14.md
FARMVERSE-PLANT-MANAGEMENT-GUIDE.md
FE-ACHIEVEMENTS-HUB-REPORT.md
FE-BALANCE-STARTBATTLE-FIX-REPORT.md
FE-COMBAT-FORMULAS-FIX-REPORT.md
FE-P11-BOSS-INTERVALS-COMBO-TIERS-REPORT.md
FE-P12-GRID-8X8-EXPANSION-REPORT.md
FE-P13-NAVIGATION-MENU-REPORT.md
FE-RECIPE-MISSIONS-REPORT.md
FE-SPECIAL-GEMS-REPORT.md
FEAT-ACHIEVEMENTS-STREAK-LEADERBOARD-REPORT.md
FEAT-DAILY-WEEKLY-MISSIONS-REPORT.md
FEAT-FRAGMENT-DROP-SYSTEM-REPORT.md
FEAT-PLAYER-SKILLS-SCHEMA-REPORT.md
FEAT-RECIPE-CRAFTING-REPORT.md
FEAT-SKILL-SERVICE-ROUTES-REPORT.md
FEAT-SKILLS-COMBAT-INTEGRATION-REPORT.md
FEAT-SKILLS-SCAN-FRAGMENT-INVENTORY-REPORT.md
FEAT-SKILLS-UI-FE-REPORT.md
FINAL-TEST-BACKEND-BOSS-CAMPAIGN.md
FINAL-VALIDATION-BACKEND.md
FIX-7BUGS-FINAL-TEST-REPORT.md
FIX-8BUGS-SCAN-REPORT.md
FIX-ALL-3-ERRORS-2026-02-14.md
FIX-ANTICHEAT-SESSION-REPORT.md
FIX-COMBAT-CONSTANTS-REPORT.md
FIX-HARVEST-500-2026-02-14.md
FRIEND-FARM-ANALYSIS.md
FRIEND-FARM-DOCS.md
GAME_DOCUMENTATION.md
LOGOUT-BUG-SCAN-REPORT-2026-02-27.md
MARKET-INTEGRATION-PLAN.md
NFT-MARKETPLACE-SCAN-2026-03-06.md
OGN-XP-ECONOMY-ANALYSIS.md
PERFORMANCE-SCAN-8X8.md
PLANT-TYPES-DOC.md
PRAYER-SYSTEM-SCAN-REPORT.md
PRAYER-SYSTEM-SCAN-V2-DETAIL.md
QA-SCAN-ALL-SCREENS.md
SCAN-BACKEND-BOSS-CAMPAIGN.md
SCAN-PASSKEY-ERC4337-MODULE.md
SCAN-TEST-PHASE1-4-REPORT.md
SCAN-WORLD-BOSS-FINAL-AUDIT-2026-03-03.md
SCAN-WORLD-BOSS-VS-STANDARD-2026-03-02.md
SVG-AUDIT-REPORT.md
TEST-REPORT-PROMPT-9-12.md
VERIFY-INVENTORY-DEPLOY-2026-02-14.md
VERIFY-INVENTORY-UUID-SELL-2026-02-13.md
VERIFY-LOGOUT-FIX-2026-02-27.md
WALLET-PIN-SCAN-REPORT.md
WMO-QUICK-REFERENCE.md
WORLD-BOSS-9ISSUES-FIX-REPORT.md
WORLD-BOSS-9ISSUES-TEST-REPORT.md
WORLD-BOSS-SCAN-FIX-REPORT.md
XP-LEVEL-SYSTEM-ANALYSIS.md
backend-deployment-guide.md
debug-initial-load-report.md
farm-game-design-report.md
level-xp-fix-report.md
react-error-310-fix-report.md
step20-fix-report.md
step20-social-audit-report.md
step21-leaderboard-report.md
step21-leaderboard-test-report.md
step22-referral-detail-report.md
step22-sync-report.md
step23-wither-test-report.md
step25-farmstore-cleanup-report.md
step26-stores-cleanup-report.md
step26-stores-test-report.md
step27-header-report.md
step28-notification-report.md
step28-notification-test-report.md
step29-integration-test-report.md
step30-perf-deploy-report.md
step31-weather-integration-report.md
weather-implementation-summary.md
```

**docs/ folder (23 files — ALL should be deleted):**
```
docs/AUTO-AI-BUSINESS-PLAN.md
docs/AUTO-PLAY-ANALYSIS-2026-03-01.md
docs/AUTO-PLAY-FULL-SCAN-REPORT.md
docs/AUTO-PLAY-SCAN-REPORT.md
docs/BLOCKCHAIN-REALTIME-ANALYSIS-2026-03-05.md
docs/BOSS-CAMPING-MIGRATION-PLAN.md
docs/E2E-TEST-2026-03-05.md
docs/FE1-API-LAYER-2026-03-05.md
docs/FE2-UI-FRIEND-SYSTEM-2026-03-05.md
docs/FE3-FIX-TABBAR-2026-03-05.md
docs/FE5-FIX-MAPPING-2026-03-05.md
docs/FINAL-AUDIT-2026-03-05.md
docs/FRIEND-SYSTEM-FE-ANALYSIS-2026-03-05.md
docs/LEVEL-BALANCE-TODO.md
docs/LEVEL-SYSTEM.md
docs/LUA-ATOMIC-VERIFICATION-2026-03-05.md
docs/PRAYER_PHASE6_POLISH_2026-02-17.md
docs/TOPUP-ADMIN-BACKEND-RESULT.md
docs/TOPUP-GAME-UI-RESULT.md
docs/TOPUP-PROMPT3-RESULT-2026-02-24.md
docs/TOPUP-USER-SCAN-RESULT.md
docs/WEATHER-BACKEND-SCAN-REPORT.md
docs/WEATHER-FE-BE-INTEGRATION-SCAN.md
docs/auto-strategy.json
```

### 3.2 Frontend Root — Junk Scripts & Files
| File | Reason |
|------|--------|
| `backend-weather-endpoint.ts` | Stray BE code in FE repo |
| `generate-campaign-bosses.cjs` | One-time migration script |
| `migrate_inventory.js` | One-time migration script |
| `replace.py` | One-time Python script |
| `nul` | Windows artifact (empty file) |
| `src/shared/types/game-api.types.ts.backup` | Backup file in src |
| `public/assets/bosses/ruong-lua/r.zip` | ZIP file in public assets |
| `bun.lock` | Duplicate — project uses npm (package-lock.json exists) |

### 3.3 Backend — 146 .bak Files + Junk
All `.bak` files should be deleted. Plus:

| File | Reason |
|------|--------|
| `*.bak` (146 files) | Auto-backup files from Claude Code MCP tool |
| `farm.ts.backup`, `farm.ts.backup-20260210-145836` | Manual backups |
| `farm.ts.bak2` | Manual backup |
| `webauthn-routes.ts.backup2`, `webauthn-routes.ts.backup3` | Manual backups |
| `index.ts.backup-1770639790` | Manual backup |
| `index.ts.patch` | Leftover patch |
| `farm.service.ts.backup` | Manual backup |
| `monitoring.ts.backup-20260112-234219` | Manual backup |
| `.env.2026-01-12T09-29-45-141Z.bak` | Env backup |
| `.env.backup-before-sta-fix` | Env backup |
| `.env.backup.20260110_104426` | Env backup |
| `.env.backup.20260204_205619` | Env backup |
| `.env.backup.20260204_210222` | Env backup |
| `.env.backup.r2-fix` | Env backup |
| `.env.example.2026-01-12T09-30-08-134Z.bak` | Env example backup |
| `package-lock.json` | BE uses Bun (bun.lock) |

**Backend root junk files:**
| File | Reason |
|------|--------|
| `auto-scan-backend.sh` | Scan script |
| `get-docker.sh` | Docker install script |
| `server-hardening.sh` | Server setup script |
| `backend-scan-report.txt` | Scan output |
| `backend-security-performance-report.txt` | Scan output |
| `scan-*.txt` (17 files) | All scan outputs |
| `ADMIN_SYSTEM_DESIGN.md` | Dev doc |
| `DEPLOY-INVENTORY-SUMMARY-2026-02-13.md` | Dev doc |
| `E2E-FRIEND-SYSTEM-2026-03-05.md` | Dev doc |
| `FIX-COMPLETE-REPORT.md` | Dev doc |
| `GOOGLE-OAUTH-DEBUG-REPORT.md` | Dev doc |
| `LEGACY_MIGRATION_COMPLETE_GUIDE.md` | Dev doc |
| `QUICK-FIX-GUIDE.md` | Dev doc |
| `SCAN-RESULTS-FINAL.md` | Dev doc |

---

## 4. SECURITY ISSUES

### 4.1 Sensitive Files Committed
| File | Risk | Action |
|------|------|--------|
| FE `.env` | Google OAuth Client ID (public, OK for FE) | Add to .gitignore, use .env.example |
| FE `.env.local` | Same as .env | Add to .gitignore |
| BE `.env` + 6 backups | DATABASE_URL, REDIS, JWT, DEPLOYER_PRIVATE_KEY, API keys | Already in .gitignore but backups on disk |

### 4.2 Hardcoded Values in Code (NOT in .env)
| File | Value | Risk |
|------|-------|------|
| `auto-play.service.ts:41` | Receiver address `0x4302...` hardcoded | Low (public address) |
| `payment.config.ts:13` | Same receiver address hardcoded | Low (public address) |
| `smart-wallet.config.ts` | Factory + EntryPoint addresses | Low (standard contracts) |
| `delivery-label.service.ts:19` | Merkle contract fallback | Low (public contract) |
| `LoginScreen.tsx:13` | Google Client ID fallback | Low (public ID) |

### 4.3 Private Keys
- **No hardcoded private keys found** in source code
- `DEPLOYER_PRIVATE_KEY` is always read from `process.env` — correct pattern
- `WALLET_ENCRYPTION_KEY` same — env-only
- FE has NO private key references (only UI text "Hien Private Key" for custodial wallet export)

### 4.4 Git History Secrets
- **No secrets found** in git log for FE repo (checked commit messages)
- BE git history appears clean (conventional commits)

---

## 5. CURRENT .GITIGNORE STATUS

### Frontend .gitignore — NEEDS FIX
Current `.gitignore` has issues:
```
. c l a u d e    ← Broken format (spaces between chars on line 30)
 .claude          ← Extra space prefix on line 31
```
Both lines should be replaced with a single clean `.claude/` entry.

**Missing entries:**
```
.claude/
*.bak
*.backup
*.tmp
*.zip
nul
bun.lock
docs/
*.md (except README.md)
```

### Backend .gitignore — GOOD but missing:
```
*.bak
*.backup*
*.patch
scan-*.txt
*.sh (except package scripts)
```

---

## 6. RECOMMENDED .GITIGNORE (Frontend)

```gitignore
# Dependencies
node_modules/

# Build
dist/
dist-ssr/
*.tsbuildinfo

# Environment
.env
.env.*
!.env.example

# Logs
logs/
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db
nul

# Editor
.vscode/*
!.vscode/extensions.json
.idea/
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# AI Tools
.claude/
.cursorrules
.cursorignore
.aider*
CLAUDE.md

# Temp/Backup
*.bak
*.backup
*.tmp
*.orig
*.patch
*.zip

# Lock (using npm)
bun.lock
bun.lockb

# Local
*.local
```

---

## 7. README.md — COLLECTED INFO

### Project Name
**The Organic Kingdom** — FARMVERSE

### Tagline
A Web3 farming game on Avalanche combining match-3 combat, real-world organic agriculture data, and blockchain-verified produce delivery.

### Key Features (from code scan)
1. **Farming System** — Plant, grow, harvest & sell crops (wheat, tomato, carrot, chili)
2. **Match-3 Campaign** — Boss battles with gem-matching mechanics, skills, combos
3. **World Boss** — Cooperative real-time boss fights (Redis Lua atomic)
4. **RWA Integration** — IoT sensor data, real garden monitoring, blockchain-verified delivery
5. **NFT Marketplace** — Mint, list, buy, transfer ERC-721 NFTs
6. **VIP System** — AVAX payment for premium features
7. **Smart Wallet** — ERC-4337 account abstraction (passkey-based)
8. **Custodial Wallet** — PIN-protected server-side wallet
9. **AI Auto-Play** — MCTS-based intelligent match-3 solver
10. **Prayer/Blessing** — Community engagement with streak rewards
11. **Market Prediction** — Agricultural price prediction game
12. **Quiz System** — Organic farming knowledge quiz
13. **Friend System** — Add friends, visit farms
14. **Multi-language** — Vietnamese/English
15. **PWA** — Installable, fullscreen mobile app

### ENV Vars Needed (Frontend)
```
VITE_API_URL=https://your-api.domain
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id (optional)
```

### ENV Vars Needed (Backend — 46 vars)
```
NODE_ENV, PORT, DATABASE_URL, REDIS_URL, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD,
JWT_SECRET, JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY,
GOOGLE_WEB_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID, GOOGLE_IOS_CLIENT_ID,
APP_URL, ADMIN_URL, FRONTEND_URL, DEV_CORS_ORIGINS,
DEPLOYER_PRIVATE_KEY, AVALANCHE_RPC_URL, AVALANCHE_CHAIN_ID, AVAX_RPC_URL,
MERKLE_CONTRACT_ADDRESS, MERKLE_CHAIN_ID, MERKLE_RPC_URL,
NFT_CONTRACT_ADDRESS, SMART_WALLET_FACTORY_ADDRESS, ENTRYPOINT_ADDRESS,
PIMLICO_API_KEY, PIMLICO_SPONSORSHIP_POLICY_ID,
WALLET_ENCRYPTION_KEY, VIP_RECEIVER_WALLET, VIP_CRON_ENABLED,
OPENAI_API_KEY, GOOGLE_AI_API_KEY,
RESEND_API_KEY, EMAIL_FROM,
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
PAYPAL_CLIENT_SECRET, PAYPAL_MODE,
PINATA_API_KEY, PINATA_SECRET_KEY, PINATA_GATEWAY_URL,
SENTRY_DSN, IOT_DEVICE_API_KEY, CONVERSION_HASH_SECRET,
BLOCKCHAIN_CRON_ENABLED, BLOCKCHAIN_CRON_SCHEDULE,
DELIVERY_BLOCKCHAIN_STRATEGY, MOCK_SENSOR_ENABLED, MOCK_SENSOR_CRON
```

### Scripts (Frontend)
```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "lint": "eslint .",
  "test": "vitest run"
}
```

### Scripts (Backend)
```json
{
  "dev": "bun --watch src/index.ts",
  "start": "bun src/index.ts",
  "build": "bun build src/index.ts --outdir dist --target bun",
  "lint": "biome check src/",
  "test": "bun test",
  "db:generate": "drizzle-kit generate",
  "db:push": "drizzle-kit push"
}
```

---

## 8. ACTION PLAN (Priority Order)

### Phase A: Clean Frontend Repo
1. **Delete 80+ .md report files** at root and docs/
2. **Delete junk scripts:** `backend-weather-endpoint.ts`, `generate-campaign-bosses.cjs`, `migrate_inventory.js`, `replace.py`, `nul`
3. **Delete backup:** `src/shared/types/game-api.types.ts.backup`
4. **Delete zip:** `public/assets/bosses/ruong-lua/r.zip`
5. **Delete duplicate lock:** `bun.lock`
6. **Delete .claude/ directory** entirely (including worktrees)
7. **Fix .gitignore** with clean version
8. **Create .env.example** from current env vars
9. **Remove .env and .env.local** from tracking (git rm --cached)

### Phase B: Clean Backend Repo
1. **Delete 146 .bak files** + 9 .backup/.patch/.bak2 files
2. **Delete 7 .env backup files**
3. **Delete scan/report files:** 17 scan-*.txt + 3 .sh + 2 .txt reports
4. **Delete dev .md reports** (8 files, keep README.md + BACKEND_DOCUMENTATION.md)
5. **Update .gitignore** to exclude .bak, .backup, scan-*.txt

### Phase C: Write README.md
1. Professional README with hackathon formatting
2. Architecture diagram (text-based)
3. Feature highlights
4. Setup instructions
5. Tech stack badges
6. Screenshots placeholder

### Phase D: Git History (Optional)
1. **Squash/rebase** to clean commit messages (remove claude references)
2. OR create fresh branch from current state
3. **No BFG needed** — no secrets found in history

---

## 9. RISK ASSESSMENT

| Category | Status |
|----------|--------|
| Hardcoded secrets in code | CLEAN — all secrets in env vars |
| Private keys leaked | CLEAN — env-only |
| AI traces in source code | CLEAN — no comments/markers |
| AI traces in git history | LOW RISK — 6 commits mention "claude" |
| Junk files | HIGH — 80+ reports, 146 .bak files |
| .gitignore quality | NEEDS FIX — broken .claude entry |
| .env committed | MODERATE — public keys only (Google Client ID) |
| Overall repo cleanliness | NEEDS CLEANUP before submission |
