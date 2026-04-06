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

  const retryCountRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const connect = () => {
      if (!enabled) return;
      
      const es = new EventSource(`${API_BASE_URL}/api/coop/events`, {
        withCredentials: true,
      });

      es.onopen = () => {
        retryCountRef.current = 0; // Reset on success
      };

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
        es.close();
        const delay = Math.min(30000, Math.pow(2, retryCountRef.current) * 2000);
        retryCountRef.current += 1;
        
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(connect, delay);
      };

      return es;
    };

    const es = connect();

    return () => {
      if (es) es.close();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [enabled]);
}
