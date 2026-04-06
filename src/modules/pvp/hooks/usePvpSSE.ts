import { useEffect, useRef } from 'react';
import type { PvpEvent } from '@/shared/api/api-pvp';
import { API_BASE_URL } from '@/shared/api/api-utils';

// EventSource không support custom headers, nhưng auth dùng cookie (same-origin) → OK
let sharedES: EventSource | null = null;
const listeners = new Set<(event: PvpEvent) => void>();
let retryCount = 0;
let retryTimeout: ReturnType<typeof setTimeout> | null = null;

function getSharedES() {
  if (sharedES) return sharedES;
  
  if (retryTimeout) {
    return null;
  }

  sharedES = new EventSource(`${API_BASE_URL}/api/pvp/events`, {
    withCredentials: true,
  });

  sharedES.onopen = () => {
    retryCount = 0;
  };

  sharedES.addEventListener('pvp', (e) => {
    try {
      const data = JSON.parse(e.data) as PvpEvent;
      listeners.forEach((l) => l(data));
    } catch {
      // ignore malformed
    }
  });

  sharedES.onerror = () => {
    if (sharedES) {
      sharedES.close();
      sharedES = null;
    }

    const delay = Math.min(30000, Math.pow(2, retryCount) * 2000);
    retryCount += 1;

    if (retryTimeout) clearTimeout(retryTimeout);
    retryTimeout = setTimeout(() => {
      retryTimeout = null;
      if (listeners.size > 0) {
        getSharedES();
      }
    }, delay);
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
