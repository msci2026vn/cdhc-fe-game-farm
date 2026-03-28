import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PvpEvent } from '@/shared/api/api-pvp';
import { usePvpSSE } from './usePvpSSE';
import { pvpApi } from '@/shared/api/api-pvp';

export function useGlobalPvpInvite(isLoggedIn: boolean) {
  const navigate = useNavigate();
  const [invite, setInvite] = useState<(PvpEvent & { type: 'pvp_invite' }) | null>(null);

  usePvpSSE(isLoggedIn, useCallback((event: PvpEvent) => {
    if (event.type === 'pvp_invite') {
      setInvite(event);
    }
  }, []));

  const acceptInvite = useCallback(async () => {
    if (!invite) return;
    const inviteId = invite.inviteId;
    setInvite(null);
    try {
      const data = await pvpApi.respondInvite(inviteId, 'accept');
      const rid = (data as any).roomId || (data as any).room_id;
      const rcode = (data as any).roomCode || (data as any).room_code;

      if (rid) {
        // Best case: server returns roomId directly
        navigate(`/pvp-test?roomId=${rid}`);
        return;
      }

      if (rcode) {
        // Server returned roomCode only — try to resolve to roomId first
        // Step 1: check public rooms list
        try {
          const { rooms } = await pvpApi.getRooms();
          const match = rooms.find(r => r.roomCode.toUpperCase() === rcode.toUpperCase());
          if (match?.roomId) {
            navigate(`/pvp-test?roomId=${match.roomId}`);
            return;
          }
        } catch {
          // ignore
        }

        // Step 2: try dedicated join-by-code endpoint
        try {
          const resolved = await pvpApi.joinByCode(rcode);
          const resolvedId = resolved.roomId || resolved.room_id;
          if (resolvedId) {
            navigate(`/pvp-test?roomId=${resolvedId}`);
            return;
          }
        } catch {
          // ignore
        }

        // Step 3: fallback — pass roomCode, let PvpTestScreen handle resolution
        navigate(`/pvp-test?room=${rcode}`);
      }
    } catch (err) {
      console.error('[GlobalPvpInvite] Accept failed:', err);
    }
  }, [invite, navigate]);

  const declineInvite = useCallback(async () => {
    if (!invite) return;
    const inviteId = invite.inviteId;
    setInvite(null);
    try {
      await pvpApi.respondInvite(inviteId, 'reject');
    } catch (err) {
      console.error('[GlobalPvpInvite] Decline failed:', err);
    }
  }, [invite]);

  return { invite, acceptInvite, declineInvite };
}
