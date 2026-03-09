# 📖 PVP System — Tài Liệu Kỹ Thuật

> Cập nhật: 2026-03-09
> Stack: Colyseus 0.17.39 · Bun.js · Hono 4.11 · Drizzle ORM · Redis · Avalanche C-Chain

---

## 1. TỔNG QUAN KIẾN TRÚC

### 1.1 Sơ đồ hệ thống

```
[Client Mobile/Web]
        ↓ WSS + HTTPS
[Nginx — sta.cdhc.vn]
        ↓ /pvp-ws  →  127.0.0.1:3001  (Colyseus WS)
        ↓ /api/pvp →  127.0.0.1:3000  (Bun/Hono)
        ↓ /        →  127.0.0.1:3000

[pvp-server :3001 + :3002]         [cdhc-api :3000]
  @colyseus/core 0.17.39              Bun + Hono
  WS transport                        pvp.routes.ts
  PvpRoom.ts (game logic)            pvp.service.ts
  BotEngine (AI)                     pvp-proof.service.ts
  /home/cdhc/apps/pvp-server/        pvp.sse.ts (SSE)
        ↓                                  ↓
   PostgreSQL (pvp_matches,          Redis pub/sub
   pvp_ratings, pvp_invites,         (presence + events)
   pvp_queue)
        ↓
   IPFS (Pinata)
   Avalanche C-Chain (storeRoot)
```

### 1.2 Ports & Paths

| Service | Port | Protocol | Path trên VPS |
|---------|------|----------|---------------|
| cdhc-api | 3000 | HTTP | `/home/cdhc/apps/cdhc-be/` |
| pvp-server (Colyseus WS) | 3001 | WS | `/home/cdhc/apps/pvp-server/` |
| pvp-server (Admin HTTP) | 3002 | HTTP | cùng folder |

### 1.3 PM2 processes

| id | Name | Status | Memory | Restarts |
|----|------|--------|--------|----------|
| 0 | cdhc-api | online | ~264 MB | 65 |
| 1 | cdhc-api | online | ~270 MB | 61 |
| 2 | pvp-server | online | ~85 MB | 26 |

> **Lưu ý:** cdhc-api chạy fork mode (2 instance — clustered). pvp-server chạy single fork.

---

## 2. CẤU TRÚC FILE

### 2.1 Backend (cdhc-api — `/home/cdhc/apps/cdhc-be/`)

```
src/modules/pvp/
├── pvp.routes.ts          # HTTP endpoints, ELO update, auth guard
├── pvp.service.ts         # Business logic: invite, matchmaking, open-room, challenge
├── pvp.sse.ts             # SSE stream /api/pvp/events — real-time notifications
└── pvp-proof.service.ts   # Proof-of-Play: Merkle → IPFS → Avalanche
```

### 2.2 pvp-server (Colyseus — `/home/cdhc/apps/pvp-server/src/`)

```
rooms/
├── PvpRoom.ts             # Room logic: game state machine, combat, junk tiles
├── PvpState.ts            # Colyseus Schema: PvpState, PlayerState, BoardState
bot/
├── BotConfig.ts           # Bot tiers (easy/medium/hard/expert), BOT_POOL, BOSS_POOL
└── BotEngine.ts           # AI engine: swap interval, combo awareness, error rate
utils/
└── board.utils.ts         # generateBoard, mulberry32 RNG, isValidSwap, runCascade, calcJunk
index.ts                   # Server khởi động: Colyseus :3001 + Admin HTTP :3002
```

### 2.3 Frontend (`src/`)

```
src/modules/pvp/
├── PvpTestScreen.tsx      # Màn hình chính lobby + matchmaking
├── PvpLobby.tsx           # Lobby room (waiting room UI)
├── PostGameScreen.tsx     # Màn hình kết quả sau trận
└── components/
    └── ProofBadge.tsx     # Badge ⛓️ hiện on-chain proof
src/shared/api/
└── api-pvp.ts             # pvpApi object: tất cả HTTP calls đến /api/pvp/*
src/modules/pvp/
└── hooks/
    ├── useCanvasBoard.ts  # Canvas board rendering + gesture handling
    └── usePvpSSE.ts       # SSE listener: nhận pvp_invite, pvp_matched, pvp_challenge
```

---

## 3. DATABASE SCHEMA

### 3.1 pvp_matches

| Column | Type | Ghi chú |
|--------|------|---------|
| id | uuid (PK) | Auto-generated |
| room_code | varchar | Room code 8 ký tự |
| player1_id | uuid (FK→users) | Host |
| player2_id | uuid (FK→users) | Guest |
| player1_score | integer | Tổng damage dealt |
| player2_score | integer | Tổng damage dealt |
| winner_id | uuid nullable | NULL = draw |
| is_draw | boolean | |
| is_sudden_death | boolean | Có xảy ra Sudden Death? |
| duration_seconds | integer | Thời gian thực tế |
| created_at | timestamptz | |
| mvp_stats | jsonb | `{ highestCombo, fastestSwapMs, debuffSent, ... }` |
| moves_log | jsonb | `MoveEntry[]` — capped 500 entries |
| initial_seeds | jsonb | `{ userId: boardSeed }` — seed ban đầu của mỗi board |
| merkle_root | varchar(66) | `0x...` sha256 Merkle root |
| ipfs_hash | text | CID Pinata |
| tx_hash | varchar(66) | Avalanche tx hash |

### 3.2 pvp_ratings

| Column | Type | Ghi chú |
|--------|------|---------|
| user_id | uuid (PK) | |
| rating | integer | ELO bắt đầu 1000 |
| wins | integer | |
| losses | integer | |
| draws | integer | |
| updated_at | timestamptz | |

### 3.3 pvp_invites

| Column | Type | Ghi chú |
|--------|------|---------|
| id | uuid (PK) | |
| from_user_id | uuid | Người gửi |
| to_user_id | uuid | Người nhận |
| room_code | varchar | Code phòng |
| status | varchar | `pending` / `accepted` / `rejected` |
| expires_at | timestamptz | +60 giây từ lúc tạo |
| created_at | timestamptz | |

### 3.4 pvp_queue (matchmaking)

| Column | Type | Ghi chú |
|--------|------|---------|
| user_id | uuid (PK) | |
| rating | integer | Snapshot lúc vào queue |
| level | integer | Từ player_stats |
| room_code | varchar nullable | Được gán khi tìm được đối thủ |
| joined_at | timestamptz | Dùng để tính waitSeconds |

---

## 4. REDIS KEYS

| Key Pattern | Type | TTL | Mục đích |
|-------------|------|-----|----------|
| `pvp:online` | SET | — | userId đang mở SSE (PVP lobby) |
| `pvp:online:{userId}` | STRING | 60s | TTL refresh mỗi 20s qua ping |
| `pvp:open_rooms` | SET | — | roomCode đang ở trạng thái WAITING |
| `pvp:open_room:{roomCode}` | STRING | 900s | JSON: hostId, hostName, hostRating, createdAt |
| `pvp:pending_challenge:{userId}` | STRING | 35s | JSON challenge đang gửi tới userId |
| `pvp:challenge_host:{hostId}` | STRING | 120s | JSON challenge state của host (attempt, exclude list) |
| `pvp:in_game:{userId}` | STRING | 1800s | Đánh dấu userId đang trong game, không nhận challenge mới |

### Pub/Sub channels (Redis)

| Channel | Ai publish | Ai subscribe |
|---------|-----------|--------------|
| `pvp:invite:{userId}` | pvp.service → sendInvite | SSE: người nhận invite |
| `pvp:invite:response:{fromUserId}` | pvp.service → respondInvite | SSE: người gửi invite |
| `pvp:match:{userId}` | pvp.service → _findMatch | SSE: matched player |
| `pvp:challenge:{userId}` | pvp.service → challengeNextUser | SSE: người bị challenge |

---

## 5. COLYSEUS GAME STATE

### 5.1 PvpState (Colyseus Schema)

```typescript
class PvpState {
  phase: "waiting" | "ready" | "playing" | "sudden_death" | "finished"
  players: MapSchema<PlayerState>   // key = sessionId
  roomCode: string
  countdown: int8        // -1 = không đếm, 3→0 trước khi start
  board1: BoardState     // 8x8 = 64 tiles cho host
  board2: BoardState     // 8x8 = 64 tiles cho guest
  hostId: string         // sessionId của host
  timeLeft: int16        // giây còn lại (60 → 0)
  lobbyTimeLeft: int16   // giây lobby timeout (900 = 15 phút)
  winnerId: string       // sessionId hoặc "draw"
}

class PlayerState {
  id: string             // userId từ DB
  name: string
  ready: boolean
  score: int32           // tổng raw damage dealt
  junkPending: uint8     // junk tiles sẽ được apply tick tiếp theo
  hp: int32              // mặc định 1000
  maxHp: int32           // 1000
  armor: int32           // shield, absorb damage trước HP
  mana: int32            // 0 → 200 (chưa dùng skill)
  maxMana: int32         // 200
}

class BoardState {
  tiles: ArraySchema<uint8>  // 64 phần tử: 0=ATK, 1=HP, 2=DEF, 3=STAR, 4=JUNK, -1=empty
}
```

### 5.2 Gem Types

| Value | Type | Effect khi match |
|-------|------|-----------------|
| 0 | ATK (đỏ) | Gây damage cho đối thủ |
| 1 | HP (xanh lá) | Heal bản thân |
| 2 | DEF (xanh dương) | Tăng armor (shield) |
| 3 | STAR (vàng) | +damage (như ATK) + +mana |
| 4 | JUNK (xám) | Unmatchable — junk tile |

### 5.3 Combat Constants

```typescript
PVP_PLAYER_HP        = 1000     // HP ban đầu
PVP_PLAYER_MAX_MANA  = 200
PVP_ATK_PER_GEM      = ?        // damage per ATK gem matched
PVP_STAR_PER_GEM     = 25       // damage per STAR gem (dual: ATK + mana)
PVP_HP_PER_GEM       = ?        // heal per HP gem
PVP_DEF_PER_GEM      = ?        // armor per DEF gem
PVP_MANA_PER_STAR    = 8        // mana per STAR gem (flat, không nhân combo)

// Combo multiplier — grows with consecutive cascades
getPvpComboMult(combo: number): number
// Sudden Death multiplier: ×1.5 cho tất cả effects
```

---

## 6. FLOWS CHI TIẾT

### 6.1 Invite Flow (Direct Invite)

```
[Player A]                    [cdhc-api]                  [Player B SSE]
  POST /api/pvp/invite
  { toUserId: B }
        ↓
  pvpService.sendInvite()
  → fetch POST Colyseus:3002/create-room
  → INSERT pvp_invites (status=pending, expiresAt+60s)
  → redis.publish("pvp:invite:B", { type:"pvp_invite", ... })
                                          ↓
                                   B nhận SSE event
                                   hiện modal invite

  POST /api/pvp/invite/respond
  { inviteId, action: "accept" }
        ↓
  pvpService.respondInvite()
  → UPDATE pvp_invites SET status="accepted"
  → redis.publish("pvp:invite:response:A", { type:"pvp_invite_response", roomCode })
                          ↓
               A nhận SSE event
               cả 2 join Colyseus room cùng roomCode
```

### 6.2 Quick Match (Matchmaking Queue)

```
[Player A]                    [cdhc-api]              [Player B SSE]
  POST /api/pvp/find-match
        ↓
  pvpService.joinQueue()
  → DELETE pvp_queue WHERE userId=A (dedupe)
  → INSERT pvp_queue { userId, rating, level }
  → _findMatch(A, rating)
    → query pvp_queue candidates (khác A, chưa có roomCode)
    → nếu có → sort theo |rating diff| → pick best
    → UPDATE pvp_queue SET room_code=XXXX WHERE userId IN (A, B)
    → redis.publish("pvp:match:B", { type:"pvp_matched", roomCode })
    → return { matched: true, roomCode }
                                          ↓
                                   B nhận SSE event
                                   cả 2 join Colyseus room

  Nếu không có candidate:
  → check redis pvp:open_rooms (invite rooms đang WAITING)
  → nếu có room phù hợp (rating diff ≤ 300)
    → xóa khỏi open_rooms
    → publish host: { type:"quick_match_joined", userId:A, roomCode }
    → return { matched: true, roomCode }

  Nếu vẫn không có:
  → return { matched: false } → client poll GET /find-match/status

  Sau 55s chờ:
  → Auto-fallback: 50% → createBossGame, 50% → createBotGame("medium")
```

### 6.3 Auto-Challenge Flow (Open Room)

```
[Host]                       [cdhc-api]                 [Target SSE]
  POST /api/pvp/create-open-room
        ↓
  pvpService.createOpenRoom()
  → fetch Colyseus:3002/create-room
  → redis.setex("pvp:open_room:{roomCode}", 900, JSON)
  → redis.sadd("pvp:open_rooms", roomCode)
  → pvpService.startChallenge() [fire-and-forget]
    ↓
  challengeNextUser({ attempt:1, exclude:[] })
  → redis.smembers("pvp:online")
  → lọc: exclude hostId, có pvp:in_game, có pvp:pending_challenge
  → chọn ngẫu nhiên 1 targetId
  → redis.setex("pvp:pending_challenge:{target}", 35, JSON)
  → redis.setex("pvp:challenge_host:{host}", 120, JSON)
  → redis.publish("pvp:challenge:{target}", { type:"pvp_challenge", ... })
                                              ↓
                                       Target nhận SSE
                                       hiện popup challenge (30s timeout)

  Target: POST /api/pvp/challenge-respond { accept: true }
  → pvpService.respondChallenge()
  → DELETE pvp:pending_challenge:{target}
  → DELETE pvp:challenge_host:{host}
  → redis.setex("pvp:in_game:{target}", 1800, "1")
  → redis.setex("pvp:in_game:{host}", 1800, "1")
  → publish host: { type:"challenge_accepted", roomCode }
  ← return { ok, roomCode }
  → Cả 2 join Colyseus room

  Target: reject → challengeNextUser(attempt+1, exclude: [target])
  Nếu attempt > 3 → publish host: { type:"challenge_failed" }
```

### 6.4 Game Flow (trong PvpRoom)

```
Phase: waiting
  → Player join → onJoin() → add PlayerState
  → Khi đủ 2 player (hoặc bot game) → phase = "ready"

Phase: ready
  → Host send "start" → startCountdown()
  → countdown 3→2→1→0 (1s mỗi tick)

Phase: playing
  → startGame():
    - generateBoard(seed1) cho host, generateBoard(seed2) cho guest
    - send "game_start" kèm myBoard + opponentBoard
    - Init combat stats (hp=1000, armor=0, mana=0)
    - startBotEngine() nếu là bot game
    - Start 60s gameTimer interval

  → Player send "swap" { from: flatIndex, to: flatIndex }:
    - Rate limit: 500ms cooldown
    - Validate: isAdjacent + isValidSwap (creates ≥3 match)
    - applySwap + runCascade(seeded RNG)
    - Apply effects: damage opp, heal self, shield self, gain mana
    - calcJunk → sendJunkToOpponent (junkPending++)
    - Log move vào moveLog (capped 500)
    - send "board_update" → swapper
    - send "opponent_update" → both players
    - send "combat_hit" → opponent
    - checkDeath() → finishGame() nếu HP = 0

  → gameTimer mỗi 1s:
    - timeLeft--
    - Apply junkPending cho mỗi player (seeded RNG)
    - Khi timeLeft = 0 → endGame()

Phase: sudden_death (nếu HP hòa)
  → +15s, comboMult × 1.5
  → Khi timeLeft = 0 → finishGame()

Phase: finished
  → finishGame():
    - Sort players: HP desc → score desc
    - broadcast "game_over" { winnerId, players, isSuddenDeath, duration }
    - saveMatchToDB() → POST /api/pvp/match-result
      → response: { matchId }
      → broadcast "match_saved" { matchId }
      → fire-and-forget POST /api/pvp/submit-proof (Proof-of-Play)
    - broadcastStateSummary()
```

### 6.5 Proof-of-Play Pipeline

```
[PvpRoom.finishGame()]
        ↓
saveMatchToDB()
  → POST http://localhost:3000/api/pvp/match-result (X-Internal-Key)
  → INSERT pvp_matches → response { matchId }
  → broadcast("match_saved", { matchId })  ← FE polling trigger
  → fire-and-forget: POST /api/pvp/submit-proof { matchId, moves, initialSeeds, ... }

[pvp-proof.service.ts / buildAndSubmitProof()]
  1. Hash mỗi move: sha256(JSON.stringify(move)) → leaf[]
  2. Build Merkle tree → merkleRoot (0x...)
  3. Upload IPFS: POST Pinata /pinning/pinJSONToIPFS → ipfsHash (CID)
  4. Write on-chain: walletClient.writeContract(storeRoot, merkleRoot, moveCount)
     → txHash (Avalanche)
  5. UPDATE pvp_matches SET merkle_root, ipfs_hash, tx_hash, moves_log, initial_seeds

[Frontend — usePvpSSE / PvpTestScreen]
  → onMessage("match_saved") → setMatchId
  → poll GET /api/pvp/proof/{matchId} mỗi 3s tối đa 10 lần
  → khi có txHash → ProofBadge hiện (⛓️ On-chain verified)
```

---

## 7. HTTP API ENDPOINTS

### Auth required (JWT cookie)

| Method | Path | Chức năng |
|--------|------|-----------|
| POST | `/api/pvp/invite` | Gửi invite cho user khác |
| POST | `/api/pvp/invite/respond` | Accept/reject invite |
| GET | `/api/pvp/invite/pending` | Xem invite chờ |
| POST | `/api/pvp/find-match` | Vào matchmaking queue |
| DELETE | `/api/pvp/find-match` | Rời khỏi queue |
| GET | `/api/pvp/find-match/status` | Poll trạng thái queue |
| GET | `/api/pvp/history?limit=N` | Lịch sử trận đấu (max 50) |
| GET | `/api/pvp/rating` | Rating + rank của mình |
| GET | `/api/pvp/leaderboard?limit=N` | Bảng xếp hạng (max 100) |
| GET | `/api/pvp/head-to-head/:opponentId` | Lịch sử đối đầu |
| GET | `/api/pvp/rooms` | Danh sách phòng WAITING |
| POST | `/api/pvp/play-bot` | Tạo bot game { tier } |
| POST | `/api/pvp/boss-challenge` | Tạo boss game |
| POST | `/api/pvp/create-open-room` | Tạo open room + bắt đầu challenge |
| POST | `/api/pvp/close-open-room` | Đóng open room |
| POST | `/api/pvp/challenge-respond` | Accept/reject challenge |
| POST | `/api/pvp/start-challenge` | Trigger lại challenge |
| GET | `/api/pvp/events` | SSE stream (real-time) |
| GET | `/api/pvp/proof/:matchId` | Query on-chain proof |

### Internal only (X-Internal-Key header)

| Method | Path | Ai gọi |
|--------|------|--------|
| POST | `/api/pvp/match-result` | pvp-server (sau game) |
| POST | `/api/pvp/submit-proof` | pvp-server (fire-and-forget) |
| POST | `/api/pvp/register-open-room` | pvp-server (khi room tạo xong) |

### Colyseus Admin HTTP (:3002)

| Method | Path | Chức năng |
|--------|------|-----------|
| POST | `/create-room` | Tạo PvpRoom thường |
| POST | `/create-bot-room` | Tạo PvpRoom với bot { botTier, isBoss } |
| GET | `/rooms` | List rooms phase=waiting |

### Colyseus WS (:3001) — qua Nginx `/pvp-ws`

```
ws://sta.cdhc.vn/pvp-ws/matchmake/joinById/{roomId}?token=JWT
```

---

## 8. COLYSEUS MESSAGES (WebSocket)

### Client → Server

| Message | Data | Mô tả |
|---------|------|-------|
| `ready` | — | Đánh dấu ready (phase=ready) |
| `start` | — | Host bắt đầu countdown |
| `kick` | `{ sessionId }` | Host kick player |
| `swap` | `{ from, to }` | Swap gem (flat board index 0-63) |
| `taunt` | `{ emoji }` | Gửi emoji taunt |
| `rematch_request` | — | Yêu cầu tái đấu |

### Server → Client

| Message | Data | Mô tả |
|---------|------|-------|
| `room_info` | `{ roomId, roomCode, isHost, mySessionId, myOrder }` | Khi join |
| `state_update` | `{ phase, roomCode, hostId, countdown, players, timeLeft, lobbyTimeLeft, winnerId }` | State summary |
| `game_start` | `{ myBoard: number[], opponentBoard: number[] }` | Bắt đầu trận |
| `board_update` | `{ tiles, score, combo, gained, junkReceived, hp, maxHp, armor, mana, damageDealt, effects, junkSent }` | Sau swap thành công |
| `opponent_update` | `{ tiles?, opponentHp, opponentMaxHp, opponentArmor, opponentMana, opponentScore?, myHp?, ... }` | Đối thủ đã swap |
| `combat_hit` | `{ damage, absorbed, remainingHp, remainingArmor }` | Mình bị hit |
| `timer_tick` | `{ timeLeft }` | Mỗi giây |
| `timer_event` | `{ type: "last_10s"|"sudden_death", remaining? }` | Sự kiện timer |
| `sudden_death` | — | Kích hoạt Sudden Death |
| `game_over` | `{ winnerId, winnerSessionId, players, isSuddenDeath, duration }` | Kết thúc |
| `match_saved` | `{ matchId }` | DB save xong → FE poll proof |
| `combo_event` | `{ combo }` | Combo ≥ 5 |
| `score_event` | `{ type: "overtake"|"comeback"|"danger_zone", ... }` | Sự kiện tỷ số |
| `taunt_received` | `{ emoji, fromSessionId }` | Nhận taunt |
| `taunt_blocked` | `{ reason, remainMs }` | Taunt bị block (cooldown) |
| `debuff_applied` | `{ type: "shake"|"freeze"|"hide_timer", duration, source }` | Bị debuff |
| `spam_warning` | `{ message }` | Cảnh báo spam taunt |
| `tilted_event` | `{ attackerId, debuffType }` | 3 taunt/10s → debuff đối thủ |
| `lobby_warning` | `{ secondsLeft }` | Cảnh báo lobby timeout (300s, 60s) |
| `lobby_timeout` | — | Lobby hết giờ → disconnect |
| `rematch_start` | `{ roomId }` | Cả 2 agree rematch |
| `emoji_taunt` | `{ from, emoji, name }` | Bot taunt |

---

## 9. BOT & BOSS

### Bot Tiers

| Tier | Label | Swap interval | Combo awareness | Error rate |
|------|-------|--------------|-----------------|------------|
| easy | Dễ | 2500–4000ms | 20% | 30% |
| medium | Trung Bình | 1500–2800ms | 50% | 15% |
| hard | Khó | 800–1800ms | 75% | 5% |
| expert | Chuyên Gia | 400–1000ms | 95% | 1% |

### Stealth Bot (disguise)

- Tên ngẫu nhiên từ BOT_POOL: Minh Tú, Hữu Phước, Thanh Hằng...
- Sau 55s queue không có đối thủ → 50% auto-match với bot (isStealth=true)
- Bot game **không** lưu vào DB (skip saveMatchToDB)

### Boss

- HP cao hơn bình thường: boss_mushroom=1200, boss_dragon=1500, boss_shadow=1000
- Tier: expert hoặc hard
- Dùng Colyseus `/create-bot-room` với `isBoss: true`
- Bot game → không lưu DB

---

## 10. ELO RATING

```
K = 32
expected1 = 1 / (1 + 10^((r2 - r1) / 400))
score1 = 1 (win) | 0.5 (draw) | 0 (loss)
newR1 = round(r1 + K * (score1 - expected1))
newR2 = round(r2 + K * (score2 - (1 - expected1)))
```

- Rating khởi đầu: 1000 (ON CONFLICT DO NOTHING)
- Cập nhật sau mỗi match real (không update bot/boss game)
- Rank = COUNT(players có rating cao hơn) + 1

---

## 11. NGINX CONFIG

### Config hoạt động tại `/etc/nginx/sites-available/cdhc-be`

```nginx
# Bắt buộc có trong nginx.conf (http block):
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

# PVP WebSocket — Colyseus :3001
location /pvp-ws {
    rewrite ^/pvp-ws/(.*) /$1 break;  # ← QUAN TRỌNG: strip prefix
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 86400s;
    proxy_send_timeout 86400s;
    proxy_buffering off;
    proxy_cache off;
}
```

**Tại sao cần `rewrite`?**
```
Không có rewrite:
  Client: /pvp-ws/matchmake/joinById/abc
  Colyseus nhận: /pvp-ws/matchmake/joinById/abc → 404 ❌

Có rewrite:
  Client: /pvp-ws/matchmake/joinById/abc
  Colyseus nhận: /matchmake/joinById/abc → ✅
```

**Tại sao cần `map $connection_upgrade`?**
- Connection: `upgrade` cứng → block HTTP responses bình thường (Transfer-Encoding: chunked)
- Map cho phép: WS dùng `upgrade`, HTTP dùng `close`

---

## 12. CÁC LỖI HAY GẶP VÀ CÁCH FIX

### ❌ Lỗi 1: "Failed to fetch" khi join room
**Triệu chứng:** Client báo Failed to fetch, Colyseus connection bị reject
**Nguyên nhân:** Nginx chưa có location `/pvp-ws` hoặc `map` directive thiếu
**Fix:**
```bash
# Kiểm tra:
curl -si https://sta.cdhc.vn/pvp-ws/matchmake/joinById/test
# Phải trả 522 từ Colyseus, không phải nginx 404

# Nếu 404 → thêm location /pvp-ws vào nginx config
sudo nginx -t && sudo nginx -s reload
```

---

### ❌ Lỗi 2: Quick Match không thấy invite room
**Triệu chứng:** Bấm "Tìm Trận" nhưng không vào được phòng host đang mở
**Nguyên nhân:** URL param mismatch — share link dùng `?room=` nhưng code đọc `?roomId=`
**Fix:**
```typescript
const urlRoomCode = searchParams.get('roomId') || searchParams.get('room');
```

---

### ❌ Lỗi 3: ProofBadge không hiển thị
**Triệu chứng:** Ván đấu kết thúc nhưng badge ⛓️ không xuất hiện
**Nguyên nhân:** FE không biết matchId để poll proof
**Fix:** pvp-server broadcast `"match_saved"` sau `saveMatchToDB`:
```typescript
const json = await res.json();
this.broadcast("match_saved", { matchId: json.matchId }); // ← có rồi trong code
```
FE dùng `usePvpSSE` listen `"match_saved"` → setMatchId → poll `/proof/:matchId` mỗi 3s × 10

---

### ❌ Lỗi 4: Drizzle UPDATE syntax error
**Triệu chứng:** `PostgresError: syntax error at or near "where"`
**Nguyên nhân:** Schema Drizzle thiếu columns mới → UPDATE SET rỗng
**Fix:** Thêm đủ 5 cột vào `pvpMatches` trong Drizzle schema:
```typescript
movesLog:     jsonb('moves_log'),
initialSeeds: jsonb('initial_seeds'),
merkleRoot:   varchar('merkle_root', { length: 66 }),
ipfsHash:     text('ipfs_hash'),
txHash:       varchar('tx_hash', { length: 66 }),
```
Rồi chạy `bun run db:push` hoặc migration.

---

### ❌ Lỗi 5: `/submit-proof` bị authMiddleware chặn (MISSING_TOKEN)
**Nguyên nhân:** Route đặt sau `pvp.use('/*', authMiddleware())`
**Fix:** Di chuyển `/submit-proof` và `/proof/:id` lên TRƯỚC dòng `pvp.use('/*', authMiddleware())`

---

### ❌ Lỗi 6: pvp:in_game không được SET
**Triệu chứng:** Player đang trong game nhưng vẫn nhận challenge mới
**Nguyên nhân:** Code check `pvp:in_game` nhưng quên set
**Fix:** `pvpService.respondChallenge()` đã set:
```typescript
await redis.setex(`pvp:in_game:${userId}`, 1800, '1');
await redis.setex(`pvp:in_game:${challenge.hostId}`, 1800, '1');
```
Sau match: `pvp.routes.ts` `/match-result` gọi:
```typescript
redis.del(`pvp:in_game:${p1.userId}`, `pvp:in_game:${p2.userId}`).catch(() => {});
```

---

### ❌ Lỗi 7: Nginx duplicate directives
**Triệu chứng:** `nginx: [emerg] directive is duplicate`
**Nguyên nhân:** Dùng sed thêm directive nhiều lần
**Fix:**
```bash
# Kiểm tra trước khi thêm
grep -n 'proxy_buffering\|proxy_http_version\|connection_upgrade' /etc/nginx/sites-available/cdhc-be
# Nếu duplicate → tìm và xóa block cũ trước
```

---

### ❌ Lỗi 8: Colyseus seat reservation timeout (15s)
**Triệu chứng:** Player join URL nhưng bị "seat reservation expired"
**Nguyên nhân:** Colyseus default seat reservation = 15s — quá ngắn cho invite flow
**Fix:** `PvpRoom.onCreate()`:
```typescript
this.setSeatReservationTime(900); // 15 phút
```

---

### ❌ Lỗi 9: Bot game lưu vào DB với userId = sessionId (không phải real userId)
**Triệu chứng:** pvp_matches có player_id bắt đầu bằng "BOT_"
**Nguyên nhân:** Dùng sessionId thay vì userId
**Fix:** `PvpRoom.finishGame()` đã check:
```typescript
if (!this.isBotGame) {
  this.saveMatchToDB(...);
} else {
  console.log("[PvpRoom] Bot game — skipping DB save");
}
```

---

## 13. PROOF-OF-PLAY — CHI TIẾT KỸ THUẬT

### 13.1 MoveEntry (unit of proof)

```typescript
interface MoveEntry {
  seq:       number;    // thứ tự tuyến tính, bắt đầu từ 1
  type:      "swap" | "junk";
  userId:    string;    // userId thật (không phải sessionId)
  from?:     number;    // flat index (0-63) cho swap
  to?:       number;
  junkSeed?: number;    // seed cho junk tile placement
  ts:        number;    // timestamp ms
}
```

### 13.2 Seeded RNG — mulberry32

```typescript
// Deterministic, verifiable — KHÔNG dùng Math.random()
function mulberry32(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Junk seed: deterministic từ gameStartedAt + counter
private getJunkSeed(): number {
  return this.gameStartedAt + this.junkSeedCounter * 1337;
}
```

### 13.3 Merkle Tree

```
moves = [m1, m2, m3, m4]
leaves = [sha256(m1), sha256(m2), sha256(m3), sha256(m4)]

Level 1: [hash(L0+L1), hash(L2+L3)]
Root:    [hash(H0+H1)]  ← merkleRoot
```
- Combine rule: smaller hash first: `a < b ? a + b : b + a` (canonical ordering)
- Nếu số lẻ → giữ nguyên node cuối

### 13.4 IPFS Payload

```json
{
  "matchId": "uuid",
  "merkleRoot": "0x...",
  "players": [{ "id": "uuid", "score": 1234 }],
  "winnerId": "uuid|draw",
  "duration": 60,
  "startTime": 1741500000000,
  "initialSeeds": { "userId1": 1741500000000, "userId2": 1741512345 },
  "moves": [...MoveEntry[]],
  "totalMoves": 42,
  "generatedAt": 1741500060000
}
```

### 13.5 On-chain (Avalanche)

```typescript
walletClient.writeContract({
  address: BLOCKCHAIN_CONFIG.contractAddress,
  abi: BLOCKCHAIN_CONFIG.abi,
  functionName: 'storeRoot',
  args: [merkleRoot as `0x${string}`, BigInt(moves.length)],
})
```
- Tái dùng contract `storeRoot` từ RWA sensor system
- Config tại `src/modules/rwa/blockchain.config.ts`

---

## 14. DEPLOY CHECKLIST

### 14.1 Backend (cdhc-api)

```bash
export PATH=$PATH:/home/cdhc/.bun/bin
cd /home/cdhc/apps/cdhc-be
git pull
bun install
bun run build         # nếu có build step
pm2 restart cdhc-api
pm2 logs cdhc-api --lines 20 --nostream
```

### 14.2 pvp-server (Colyseus)

```bash
cd /home/cdhc/apps/pvp-server
git pull              # nếu quản lý bằng git
bun install
pm2 restart pvp-server
pm2 logs pvp-server --lines 20 --nostream
```

### 14.3 Frontend

```bash
# Local:
bun run build
# Upload dist/ lên Cloudflare Pages hoặc server static
```

### 14.4 Nginx (khi thay đổi config)

```bash
sudo nginx -t                 # test trước
sudo nginx -s reload          # reload (không downtime)

# Verify WebSocket:
curl -si https://sta.cdhc.vn/pvp-ws/matchmake/joinById/test
# → phải trả 4xx/5xx từ Colyseus (không phải nginx 404)
```

### 14.5 Database migration (Drizzle)

```bash
cd /home/cdhc/apps/cdhc-be
bun run db:generate    # tạo migration file
bun run db:push        # apply lên DB
```

### 14.6 Verify sau deploy

```bash
# PM2 status
pm2 status

# Redis health
redis-cli ping
redis-cli keys 'pvp:*'

# Proof pipeline check
export PATH=$PATH:/home/cdhc/.bun/bin
cd /home/cdhc/apps/cdhc-be
bun -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query(\"SELECT COUNT(*) total, COUNT(merkle_root) has_proof, COUNT(tx_hash) on_chain FROM pvp_matches\")
  .then(r => { console.log(r.rows[0]); pool.end(); });
"
```

---

## 15. ENVIRONMENT VARIABLES

### pvp-server (`/home/cdhc/apps/pvp-server/.env`)

| Var | Default | Mục đích |
|-----|---------|---------|
| `PVP_PORT` | 3001 | Colyseus WS port |
| `PVP_API_PORT` | 3002 | Admin HTTP port |
| `DATABASE_URL` | — | PostgreSQL connection |
| `REDIS_URL` | — | Redis connection |
| `JWT_SECRET` | "changeme" | Verify token khi client join |
| `INTERNAL_KEY` | "pvp-internal-secret" | Auth nội bộ → cdhc-api |

### cdhc-api (`/home/cdhc/apps/cdhc-be/.env`)

| Var | Mục đích |
|-----|---------|
| `DATABASE_URL` | PostgreSQL |
| `REDIS_URL` | Redis |
| `COLYSEUS_URL` | URL pvp-server (mặc định http://localhost:3001) |
| `PINATA_API_KEY` | Upload IPFS |
| `PINATA_SECRET_KEY` | Upload IPFS |
| `DEPLOYER_PRIVATE_KEY` | Ký Avalanche tx (từ BLOCKCHAIN_CONFIG) |
| `INTERNAL_KEY` | Nhận request nội bộ từ pvp-server |

---

## 16. MONITORING

```bash
# Xem tất cả processes
pm2 status

# Log realtime
pm2 logs pvp-server
pm2 logs cdhc-api

# SSE hoạt động không?
redis-cli smembers pvp:online

# Open rooms
redis-cli smembers pvp:open_rooms

# Proof pipeline stats
bun -e "
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL });
p.query(\`
  SELECT
    COUNT(*) total,
    COUNT(merkle_root) has_proof,
    COUNT(tx_hash) on_chain,
    MAX(created_at) last_match
  FROM pvp_matches
\`).then(r => { console.log(r.rows[0]); p.end(); });
"

# Recent matches with proof status
bun -e "
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL });
p.query(\`
  SELECT id, room_code, created_at,
    CASE WHEN tx_hash IS NOT NULL THEN 'on-chain'
         WHEN ipfs_hash IS NOT NULL THEN 'ipfs-only'
         WHEN merkle_root IS NOT NULL THEN 'merkle-only'
         ELSE 'no-proof' END AS proof_status,
    jsonb_array_length(COALESCE(moves_log, '[]')) AS moves
  FROM pvp_matches ORDER BY created_at DESC LIMIT 5
\`).then(r => { console.table(r.rows); p.end(); });
"
```

---

## 17. QUICK REFERENCE — COLYSEUS CLIENT (Frontend)

```typescript
import * as Colyseus from 'colyseus.js';

const COLYSEUS_URL = import.meta.env.VITE_COLYSEUS_URL || 'wss://sta.cdhc.vn/pvp-ws';
const client = new Colyseus.Client(COLYSEUS_URL);

// Join room
const room = await client.joinById(roomId, { token: getAuthToken() });

// Listen events
room.onMessage('game_start', ({ myBoard, opponentBoard }) => { ... });
room.onMessage('board_update', (data) => { ... });
room.onMessage('game_over', (data) => { ... });
room.onMessage('match_saved', ({ matchId }) => {
  // Poll proof
  pollProof(matchId);
});

// Send swap
room.send('swap', { from: flatIndex1, to: flatIndex2 });

// Send taunt
room.send('taunt', { emoji: '🔥' });
```

---

> **Ghi chú:** Tài liệu này được tạo từ scan trực tiếp source code ngày 2026-03-09.
> Mọi thay đổi sau ngày này cần cập nhật lại tài liệu.
