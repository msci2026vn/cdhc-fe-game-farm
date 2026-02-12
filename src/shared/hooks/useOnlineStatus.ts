import { useSyncExternalStore } from 'react';

/**
 * useOnlineStatus — Detect network connectivity using SyncExternalStore (React 18+)
 * FARMVERSE Step 16
 */
function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  console.log('[FARM-DEBUG] useOnlineStatus: Subscribed to network events');

  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
    console.log('[FARM-DEBUG] useOnlineStatus: Unsubscribed from network events');
  };
}

function getSnapshot() {
  return navigator.onLine;
}

export function useOnlineStatus() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot);

  // Extra log for debugging in console
  if (!isOnline) {
    console.warn('[FARM-DEBUG] useOnlineStatus: DETECTED OFFLINE');
  }

  return isOnline;
}
