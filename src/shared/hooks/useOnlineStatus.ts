import { useSyncExternalStore } from 'react';

/**
 * useOnlineStatus - Detect network connectivity (FARMVERSE Step 16)
 * Uses high-reliability SyncExternalStore API
 */
function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

export function useOnlineStatus() {
  // Synchronize state with browser online/offline events
  const isOnline = useSyncExternalStore(subscribe, getSnapshot);
  return isOnline;
}
