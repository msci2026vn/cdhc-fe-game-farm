// ═══════════════════════════════════════════════════════════════
// useCoopSSE — SSE listener cho Co-op invite events
// Pattern: follow usePvpSSE.ts (EventSource + event listener)
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react';
import type { CoopSSEEvent } from '@/modules/coop/types/coop.types';
import { API_BASE_URL } from '@/shared/api/api-utils';

// EventSource không support custom headers → auth dùng cookie (same-origin) → OK
export function useCoopSSE(
  enabled: boolean,
  onEvent: (event: CoopSSEEvent) => void,
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return;

    const es = new EventSource(`${API_BASE_URL}/api/coop/events`, {
      withCredentials: true,
    });

    // Channel 'coop': nhận coop_invite và coop_invite_response
    es.addEventListener('coop', (e) => {
      try {
        const data = JSON.parse(e.data) as CoopSSEEvent;
        onEventRef.current(data);
      } catch {
        // ignore malformed JSON
      }
    });

    es.onerror = () => {
      // EventSource tự reconnect sau lỗi — không cần xử lý thêm
    };

    return () => es.close();
  }, [enabled]);
}
