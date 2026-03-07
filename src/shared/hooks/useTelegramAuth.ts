import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { telegramApi } from '@/shared/api/api-telegram';
import { queryClient } from '@/shared/lib/queryClient';
import { PLAYER_PROFILE_KEY } from '@/shared/hooks/usePlayerProfile';
import { gameApi, resetRedirectLock } from '@/shared/api/game-api';

// ============================================
// MINI APP DETECTION
// ============================================
export function isTelegramMiniApp(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.Telegram?.WebApp?.initData &&
    window.Telegram.WebApp.initData.length > 0
  );
}

export function getTelegramInitData(): string | null {
  if (!isTelegramMiniApp()) return null;
  return window.Telegram!.WebApp!.initData;
}

// ============================================
// HOOK
// ============================================
export function useTelegramAuth() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoLoginAttempted = useRef(false);

  const afterLoginSuccess = useCallback(async () => {
    resetRedirectLock();
    try {
      await queryClient.prefetchQuery({
        queryKey: PLAYER_PROFILE_KEY,
        queryFn: () => gameApi.getProfile(),
      });
    } catch {
      // non-blocking
    }
    navigate('/farm', { replace: true });
  }, [navigate]);

  // --- Mini App Auto-Login (gọi 1 lần duy nhất) ---
  const autoLoginMiniApp = useCallback(async () => {
    if (autoLoginAttempted.current) return;
    autoLoginAttempted.current = true;

    const initData = getTelegramInitData();
    if (!initData) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await telegramApi.webAppLogin(initData);
      if (result.success) {
        window.Telegram?.WebApp?.expand();
        window.Telegram?.WebApp?.ready();
        console.log('[Telegram] Mini App auto-login:', result.user?.name);
        await afterLoginSuccess();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đăng nhập thất bại';
      console.error('[Telegram] Auto-login failed:', message);
      setError(message);
      autoLoginAttempted.current = false; // allow retry
    } finally {
      setIsLoading(false);
    }
  }, [afterLoginSuccess]);

  // --- Widget Login (web bình thường) ---
  const loginWithWidget = useCallback(async (widgetData: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
    hash: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await telegramApi.widgetLogin(widgetData);
      if (result.success) {
        console.log('[Telegram] Widget login:', result.user?.name);
        await afterLoginSuccess();
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đăng nhập thất bại';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [afterLoginSuccess]);

  return {
    isLoading,
    error,
    isMiniApp: isTelegramMiniApp(),
    autoLoginMiniApp,
    loginWithWidget,
    clearError: () => setError(null),
  };
}
