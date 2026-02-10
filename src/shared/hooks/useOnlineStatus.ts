/**
 * useOnlineStatus — Detect network connectivity
 * FARMVERSE Step 16
 */
import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      console.log('[FARM-DEBUG] useOnlineStatus: ✅ ONLINE');
      setIsOnline(true);
    };
    const handleOffline = () => {
      console.log('[FARM-DEBUG] useOnlineStatus: ❌ OFFLINE');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
