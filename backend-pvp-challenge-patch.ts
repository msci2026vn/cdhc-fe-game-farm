// ═══════════════════════════════════════════════════════════════════════
// BACKEND PATCH — PVP Auto-Challenge + Quick Match Open Rooms
// Apply this to: /home/cdhc/apps/cdhc-be/src/modules/pvp/
// ═══════════════════════════════════════════════════════════════════════

// ──────────────────────────────────────────────────────────────────────
// 1. pvp.sse.ts — Add presence tracking (pvp:online Redis set)
// ──────────────────────────────────────────────────────────────────────
/*
  THÊM vào handler SSE connect (khi user connect EventSource):

  // Khi SSE connect — track user online
  await redis.sadd('pvp:online', userId);

  // Khi SSE disconnect (res.on('close')) — remove from online
  res.on('close', async () => {
    sseClients.delete(userId);
    await redis.srem('pvp:online', userId);
  });

  // Heartbeat mỗi 30s — refresh presence
  const heartbeat = setInterval(async () => {
    try {
      res.write(': heartbeat\n\n');
      // Re-add vào set phòng trường hợp Redis restart
      await redis.sadd('pvp:online', userId);
    } catch {
      clearInterval(heartbeat);
      await redis.srem('pvp:online', userId);
    }
  }, 30_000);

  res.on('close', () => clearInterval(heartbeat));
*/

// ──────────────────────────────────────────────────────────────────────
// 2. pvp.routes.ts — New endpoints
// ──────────────────────────────────────────────────────────────────────
/*
  THÊM 2 route mới vào pvp routes:

  // ── POST /api/pvp/start-challenge ────────────────────────────────
  // Host gọi sau khi createOpenRoom, tự tìm 1 user online để challenge
  app.post('/start-challenge', authMiddleware, async (c) => {
    const userId = c.get('userId');
    const userName = c.get('userName') || 'Unknown';
    const { roomCode } = await c.req.json<{ roomCode: string }>();
    if (!roomCode) return c.json({ error: 'missing roomCode' }, 400);

    // Lấy rating host
    const hostRating = await pvpService.getPlayerRating(userId);

    await pvpService.startChallenge({
      roomCode,
      hostId: userId,
      hostName: userName,
      hostRating: hostRating?.rating ?? 1000,
      attempt: 1,
      exclude: [],
    });

    return c.json({ ok: true });
  });

  // ── POST /api/pvp/re-open-room (MỚI) ──────────────────────────
  // Host gọi sau khi trận đấu kết thúc (room_reset) để hiện lại phòng
  app.post('/re-open-room', authMiddleware, async (c) => {
    const userId = c.get('userId');
    const userName = c.get('userName') || 'Unknown';
    const { roomCode, roomId } = await c.req.json<{ roomCode: string; roomId: string }>();
    
    if (!roomCode || !roomId) return c.json({ error: 'missing params' }, 400);

    const hostRating = await pvpService.getPlayerRating(userId);
    await pvpService.registerOpenRoom(roomCode, roomId, userId, userName, hostRating?.rating ?? 1000);

    return c.json({ ok: true });
  });

  // ── POST /api/pvp/challenge-respond (SỬA LẠI) ──────────────────
  // Target chấp nhận hoặc từ chối challenge
  app.post('/challenge-respond', authMiddleware, async (c) => {
    const userId = c.get('userId');
    const { accept } = await c.req.json<{ accept: boolean }>();

    const result = await pvpService.respondChallenge(userId, accept);
    if (result.error) return c.json({ error: result.error }, 400);
    return c.json(result);
  });
*/

// ──────────────────────────────────────────────────────────────────────
// 3. pvp.service.ts — Core logic
// ──────────────────────────────────────────────────────────────────────

/*
  THÊM vào pvpService:

  // ── Redis keys ──────────────────────────────────────────────────────
  // pvp:online              SET  — userId đang ở trang PVP (SSE connected)
  // pvp:in_game:{userId}    KEY  — đang trong game (set khi startGame)
  // pvp:pending_challenge:{userId} KEY — đang bị challenge (TTL 35s)
  // pvp:challenge_host:{hostId}    KEY — host đang chờ ai accept (TTL 120s)
  // pvp:open_rooms          SET  — roomCode invite rooms đang chờ
  // pvp:open_room:{code}    KEY  — metadata of open room (TTL 900s)

  // ── Feature 1: Register open room for Quick Match ──────────────────
  // Gọi trong createOpenRoom() hoặc reOpenRoom():
  async function registerOpenRoom(roomCode: string, roomId: string, hostId: string, hostName: string, hostRating: number) {
    const data = JSON.stringify({ 
      roomCode, 
      roomId, // THÊM roomId vào metadata để join chính xác
      hostId, 
      hostName, 
      hostRating, 
      createdAt: Date.now() 
    });
    await redis.setex(`pvp:open_room:${roomCode}`, 900, data);
    await redis.sadd('pvp:open_rooms', roomCode);
  }

  // Gọi khi room đóng (closeOpenRoom, startGame, onLeave):
  async function unregisterOpenRoom(roomCode: string) {
    await redis.srem('pvp:open_rooms', roomCode);
    await redis.del(`pvp:open_room:${roomCode}`);
  }

  // Trong findMatch() — thêm bước tìm open rooms:
  async function findMatchInOpenRooms(userId: string, userRating: number): Promise<{ roomCode: string; hostId: string } | null> {
    const openRooms = await redis.smembers('pvp:open_rooms');
    for (const roomCode of openRooms) {
      const raw = await redis.get(`pvp:open_room:${roomCode}`);
      if (!raw) {
        await redis.srem('pvp:open_rooms', roomCode);
        continue;
      }
      const room = JSON.parse(raw) as { roomCode: string; hostId: string; hostName: string; hostRating: number };
      if (room.hostId === userId) continue;
      if (Math.abs(room.hostRating - userRating) > 200) continue;
      // Found match — clean up
      await unregisterOpenRoom(roomCode);
      return { roomCode: room.roomCode, hostId: room.hostId };
    }
    return null;
  }

  // ── Feature 2: Auto-challenge logic ────────────────────────────────
  const MAX_CHALLENGE_ATTEMPTS = 3;

  async function startChallenge(params: {
    roomCode: string;
    hostId: string;
    hostName: string;
    hostRating: number;
    attempt: number;
    exclude: string[];
  }) {
    const { roomCode, hostId, hostName, hostRating, attempt, exclude } = params;

    // Lấy tất cả user đang online
    const allOnline = await redis.smembers('pvp:online');

    // Lọc candidates
    const candidates: string[] = [];
    for (const uid of allOnline) {
      if (uid === hostId) continue;
      if (exclude.includes(uid)) continue;
      const inGame = await redis.exists(`pvp:in_game:${uid}`);
      if (inGame) continue;
      const hasPending = await redis.exists(`pvp:pending_challenge:${uid}`);
      if (hasPending) continue;
      candidates.push(uid);
    }

    if (candidates.length === 0) {
      // Không có ai — notify host
      const hostClient = sseClients.get(hostId);
      if (hostClient) {
        hostClient.write(`event: pvp\ndata: ${JSON.stringify({ type: 'challenge_failed', reason: 'no_candidates' })}\n\n`);
      }
      return;
    }

    // Random chọn 1 người
    const targetId = candidates[Math.floor(Math.random() * candidates.length)];

    // Ghi pending challenge cho target (TTL 35s — 30s timeout + 5s buffer)
    await redis.setex(`pvp:pending_challenge:${targetId}`, 35,
      JSON.stringify({ roomCode, hostId, hostName, hostRating }));

    // Ghi host challenge state (TTL 120s)
    await redis.setex(`pvp:challenge_host:${hostId}`, 120,
      JSON.stringify({ roomCode, hostId, hostName, hostRating, attempt, exclude: [...exclude, targetId] }));

    // SSE push tới target
    const targetClient = sseClients.get(targetId);
    if (targetClient) {
      targetClient.write(`event: pvp\ndata: ${JSON.stringify({
        type: 'pvp_challenge',
        roomCode,
        hostId,
        hostName,
        hostRating,
        timeoutMs: 30000,
      })}\n\n`);
    } else {
      // Target không còn SSE — retry ngay với người khác
      await redis.del(`pvp:pending_challenge:${targetId}`);
      if (attempt < MAX_CHALLENGE_ATTEMPTS) {
        await startChallenge({ ...params, attempt: attempt + 1, exclude: [...exclude, targetId] });
      } else {
        const hostClient = sseClients.get(hostId);
        if (hostClient) {
          hostClient.write(`event: pvp\ndata: ${JSON.stringify({ type: 'challenge_failed', reason: 'no_responsive_candidates' })}\n\n`);
        }
      }
    }
  }

  async function respondChallenge(userId: string, accept: boolean): Promise<{ ok: boolean; roomCode?: string; error?: string }> {
    const raw = await redis.get(`pvp:pending_challenge:${userId}`);
    if (!raw) return { ok: false, error: 'challenge_expired' };

    const challenge = JSON.parse(raw) as { roomCode: string; hostId: string; hostName: string; hostRating: number };
    await redis.del(`pvp:pending_challenge:${userId}`);

    if (accept) {
      // Clear host challenge key
      await redis.del(`pvp:challenge_host:${challenge.hostId}`);
      // Notify host
      const hostClient = sseClients.get(challenge.hostId);
      if (hostClient) {
        hostClient.write(`event: pvp\ndata: ${JSON.stringify({
          type: 'challenge_accepted',
          targetUserId: userId,
          roomCode: challenge.roomCode,
        })}\n\n`);
      }
      return { ok: true, roomCode: challenge.roomCode };
    } else {
      // Decline — retry với người khác
      const hostRaw = await redis.get(`pvp:challenge_host:${challenge.hostId}`);
      if (hostRaw) {
        const hostData = JSON.parse(hostRaw) as {
          roomCode: string; hostId: string; hostName: string; hostRating: number;
          attempt: number; exclude: string[];
        };
        if (hostData.attempt < MAX_CHALLENGE_ATTEMPTS) {
          await startChallenge({
            ...hostData,
            attempt: hostData.attempt + 1,
            exclude: [...(hostData.exclude || []), userId],
          });
        } else {
          // Đã hết retry — notify host
          const hostClient = sseClients.get(challenge.hostId);
          if (hostClient) {
            hostClient.write(`event: pvp\ndata: ${JSON.stringify({ type: 'challenge_failed', reason: 'all_declined' })}\n\n`);
          }
          await redis.del(`pvp:challenge_host:${challenge.hostId}`);
        }
      }
      return { ok: true };
    }
  }

  // ── Timeout auto-decline (cron hoặc Redis keyspace notification) ────
  // Option A: Redis keyspace notification khi pvp:pending_challenge:* expire
  // Option B: setTimeout 30s trong startChallenge:
  //   setTimeout(async () => {
  //     const stillPending = await redis.get(`pvp:pending_challenge:${targetId}`);
  //     if (stillPending) await respondChallenge(targetId, false);
  //   }, 31_000);
*/

// ──────────────────────────────────────────────────────────────────────
// 4. INTEGRATION POINTS — where to call new functions
// ──────────────────────────────────────────────────────────────────────

/*
  A. In createOpenRoom():
     AFTER creating room successfully:
     → await registerOpenRoom(roomCode, userId, userName, rating);

  B. In closeOpenRoom():
     → await unregisterOpenRoom(roomCode);

  C. In PvpRoom.ts (Colyseus) — startGame():
     → fetch(`${BE_URL}/api/pvp/close-open-room`, { method: 'POST', body: JSON.stringify({ roomCode }) });
     → await redis.setex(`pvp:in_game:${player1}`, 600, '1');
     → await redis.setex(`pvp:in_game:${player2}`, 600, '1');

  D. In PvpRoom.ts — onLeave() / game end:
     → await redis.del(`pvp:in_game:${userId}`);
     → fetch(`${BE_URL}/api/pvp/close-open-room`, ...);

  E. In findMatch() (matchmaking):
     BEFORE creating new Colyseus room:
     → const openRoom = await findMatchInOpenRooms(userId, userRating);
     → if (openRoom) return { matched: true, roomCode: openRoom.roomCode };
     → // else continue normal queue logic...
*/

export {}; // make it a module
