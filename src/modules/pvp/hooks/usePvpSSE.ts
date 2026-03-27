import { useEffect, useRef } from 'react';
import type { PvpEvent } from '@/shared/api/api-pvp';
import { API_BASE_URL } from '@/shared/api/api-utils';

// EventSource không support custom headers, nhưng auth dùng cookie (same-origin) → OK
let sharedES: EventSource | null = null;
const listeners = new Set<(event: PvpEvent) => void>();

function getSharedES() {
  if (sharedES) return sharedES;
  sharedES = new EventSource(`${API_BASE_URL}/api/pvp/events`, {
    withCredentials: true,
  });
  sharedES.addEventListener('pvp', (e) => {
    try {
      const data = JSON.parse(e.data) as PvpEvent;
      listeners.forEach((l) => l(data));
    } catch {
      // ignore malformed
    }
  });
  sharedES.onerror = () => {
    // EventSource tự reconnect, không cần xử lý
  };
  return sharedES;
}

export function usePvpSSE(
  enabled: boolean,
  onEvent: (event: PvpEvent) => void,
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return;

    const listener = (event: PvpEvent) => onEventRef.current(event);
    listeners.add(listener);
    getSharedES();

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && sharedES) {
        sharedES.close();
        sharedES = null;
      }
    };
  }, [enabled]);
}
