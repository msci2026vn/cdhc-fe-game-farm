import { useState, useCallback, useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';

export const useServiceWorker = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [updateSW, setUpdateSW] = useState<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    const sw = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {
        console.log('[SW] Offline ready');
      },
    });
    setUpdateSW(() => sw);
  }, []);

  const updateServiceWorker = useCallback(() => {
    updateSW?.(true);
  }, [updateSW]);

  const dismissUpdate = useCallback(() => {
    setNeedRefresh(false);
  }, []);

  return { needRefresh, updateServiceWorker, dismissUpdate };
};
