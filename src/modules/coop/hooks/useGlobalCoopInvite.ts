// ═══════════════════════════════════════════════════════════════
// useGlobalCoopInvite — Global SSE listener for co-op invites
// Mount in AuthenticatedApp so invites are received on ANY screen
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CoopInvitePayload, CoopSSEEvent } from '@/modules/coop/types/coop.types';
import { useCoopSSE } from './useCoopSSE';

export function useGlobalCoopInvite(isLoggedIn: boolean) {
  const navigate = useNavigate();
  const [invitePayload, setInvitePayload] = useState<CoopInvitePayload | null>(null);

  useCoopSSE(isLoggedIn, useCallback((event: CoopSSEEvent) => {
    if (event.type === 'coop_invite') {
      setInvitePayload(event.payload);
    }
  }, []));

  const acceptInvite = useCallback(() => {
    if (!invitePayload) return;
    const roomId = invitePayload.roomId;
    setInvitePayload(null);
    // Navigate to world-boss with coopRoom query param
    // WorldBossScreen reads this and auto-opens CoopScreen
    navigate(`/world-boss?coopRoom=${encodeURIComponent(roomId)}`);
  }, [invitePayload, navigate]);

  const declineInvite = useCallback(() => {
    setInvitePayload(null);
  }, []);

  return { invitePayload, acceptInvite, declineInvite };
}
