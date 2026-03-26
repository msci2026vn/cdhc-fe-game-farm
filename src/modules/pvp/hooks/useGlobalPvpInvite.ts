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
      if (rid) navigate(`/pvp-test?roomId=${rid}`);
      else if (rcode) navigate(`/pvp-test?room=${rcode}`);
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
