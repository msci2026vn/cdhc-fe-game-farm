import { useEffect, useRef } from 'react';
import type { PvpEvent } from '@/shared/api/api-pvp';
import { API_BASE_URL } from '@/shared/api/api-utils';

// EventSource không support custom headers, nhưng auth dùng cookie (same-origin) → OK
export function usePvpSSE(
  enabled: boolean,
  onEvent: (event: PvpEvent) => void,
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return;

    const es = new EventSource(`${API_BASE_URL}/api/pvp/events`, {
      withCredentials: true,
    });

    es.addEventListener('pvp', (e) => {
      try {
        const data = JSON.parse(e.data) as PvpEvent;
        onEventRef.current(data);
      } catch {
        // ignore malformed
      }
    });

    es.onerror = () => {
      // EventSource tự reconnect, không cần xử lý
    };

    return () => es.close();
  }, [enabled]);
}
