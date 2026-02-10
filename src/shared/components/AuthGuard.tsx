import { useEffect, useState, useRef, useId } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { gameApi } from '@/shared/api/game-api';

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard - Check authentication status
 *
 * FIX Step 13: Prevent re-mount loop by:
 * 1. Check auth ONLY ONCE per session using useRef
 * 2. Do NOT re-check on route change
 * 3. Do NOT use useMemo on children (causes re-mount)
 * 4. Stable key using useId to prevent React from unmounting
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const navigate = useNavigate();
  const location = useLocation();

  // Use ref to track if we've already checked auth - CRITICAL FIX
  const hasCheckedAuth = useRef(false);
  const authResultRef = useRef<{ isAuthenticated: boolean; email?: string } | null>(null);

  useEffect(() => {
    // Skip if we already checked auth - CRITICAL FIX
    if (hasCheckedAuth.current) {
      // console.log('[FARM-DEBUG] AuthGuard: Already checked, skipping (hasCheckedAuth = true)');
      return;
    }

    const checkAuth = async () => {
      console.log('[FARM-DEBUG] AuthGuard: 🔍 Checking auth (FIRST TIME ONLY)');

      try {
        const result = await gameApi.ping();
        console.log('[FARM-DEBUG] AuthGuard: ping result =', result.success);

        // Cache result
        authResultRef.current = { isAuthenticated: result.success };
        hasCheckedAuth.current = true;

        if (result.success) {
          console.log('[FARM-DEBUG] AuthGuard: ✅ Authenticated');
          setAuthState('authenticated');
        } else {
          console.log('[FARM-DEBUG] AuthGuard: ❌ Unauthenticated');
          setAuthState('unauthenticated');

          if (location.pathname !== '/login') {
            console.log('[FARM-DEBUG] AuthGuard: Redirecting to /login');
            navigate('/login', { replace: true });
          }
        }
      } catch (error) {
        console.error('[FARM-DEBUG] AuthGuard: ❌ Auth check failed:', error);
        authResultRef.current = { isAuthenticated: false };
        hasCheckedAuth.current = true;
        setAuthState('unauthenticated');

        if (location.pathname !== '/login') {
          navigate('/login', { replace: true });
        }
      }
    };

    checkAuth();
  }, []); // Empty deps - ONLY run on mount, NOT on location change!

  // Show loading spinner while checking auth
  if (authState === 'loading') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center splash-gradient">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-white/80 font-semibold">Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    );
  }

  // FIX: Remove useMemo - it causes re-mount when children reference changes
  // Just render children directly - React will handle reconciliation efficiently
  // console.log('[FARM-DEBUG] AuthGuard: Rendering children (authState =', authState, ')');
  return <>{children}</>;
}
