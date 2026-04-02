import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { gameApi } from '@/shared/api/game-api';
import { handleUnauthorized } from '@/shared/api/api-utils';
import { useUIStore } from '@/shared/stores/uiStore';
import { useTranslation } from 'react-i18next';

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard - Check authentication status
 *
 * 1. Check auth ONCE on mount using useRef
 * 2. Re-check on visibilitychange (user returns to tab)
 * 3. Do NOT re-check on route change
 * 4. Do NOT use useMemo on children (causes re-mount)
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { t } = useTranslation();
  const [authState, setAuthState] = useState<AuthState>('loading');
  const navigate = useNavigate();
  const location = useLocation();

  // Use ref to track if we've already checked auth - CRITICAL FIX
  const hasCheckedAuth = useRef(false);
  const authResultRef = useRef<{ isAuthenticated: boolean; email?: string } | null>(null);

  useEffect(() => {
    // Skip if we already checked auth - CRITICAL FIX
    if (hasCheckedAuth.current) {
      return;
    }

    const checkAuth = async () => {
      console.log('[FARM-DEBUG] AuthGuard: Checking auth (FIRST TIME ONLY)');

      try {
        const result = await gameApi.ping();
        console.log('[FARM-DEBUG] AuthGuard: ping result =', result.success);

        // Cache result
        authResultRef.current = { isAuthenticated: result.success };
        hasCheckedAuth.current = true;

        if (result.success) {
          setAuthState('authenticated');
        } else {
          setAuthState('unauthenticated');

          if (location.pathname !== '/login') {
            // If the global overlay is already active, don't double-navigate
            if (!useUIStore.getState().isSessionExpired) {
              navigate('/login', { replace: true });
            }
          }
        }
      } catch (error) {
        console.error('[FARM-DEBUG] AuthGuard: Auth check failed:', error);
        authResultRef.current = { isAuthenticated: false };
        hasCheckedAuth.current = true;
        setAuthState('unauthenticated');

        if (location.pathname !== '/login') {
          if (!useUIStore.getState().isSessionExpired) {
            navigate('/login', { replace: true });
          }
        }
      }
    };

    checkAuth();
  }, []); // Empty deps - ONLY run on mount, NOT on location change!

  // Re-check auth when user returns to the tab (e.g. after being away 15+ min)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      if (authState !== 'authenticated') return;

      // Lightweight auth check — ping the server
      gameApi.ping().then((result) => {
        if (!result.success) {
          console.warn('[FARM-DEBUG] AuthGuard: Session expired while tab was hidden');
          handleUnauthorized('Tab focus re-check');
        }
      }).catch(() => {
        // Network error — don't logout, just log
        console.warn('[FARM-DEBUG] AuthGuard: Network check failed on tab focus');
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [authState]);

  // Show loading spinner while checking auth
  if (authState === 'loading') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center splash-gradient">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-white/80 font-semibold">{t('checking_auth')}</p>
        </div>
      </div>
    );
  }

  // FIX: Remove useMemo - it causes re-mount when children reference changes
  // Just render children directly - React will handle reconciliation efficiently
  // console.log('[FARM-DEBUG] AuthGuard: Rendering children (authState =', authState, ')');
  return <>{children}</>;
}
