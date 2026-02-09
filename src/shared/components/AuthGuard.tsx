import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { gameApi } from '@/shared/api/game-api';

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard - Check authentication status
 *
 * Logic:
 * 1. Call /api/auth/me to check if user is logged in
 * 2. If authenticated → render children
 * 3. If unauthenticated AND not on /login → redirect to /login
 * 4. Show loading spinner while checking
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Sử dụng ping() hoặc getProfile() để check auth
        const result = await gameApi.ping();

        if (result.success) {
          console.log('[AuthGuard] ✅ Authenticated:', result.email);
          setAuthState('authenticated');
        } else {
          console.log('[AuthGuard] ❌ Unauthenticated:', result.message);
          setAuthState('unauthenticated');

          // Redirect to login nếu chưa ở trang login
          if (location.pathname !== '/login') {
            navigate('/login', { replace: true });
          }
        }
      } catch (error) {
        console.error('[AuthGuard] ❌ Auth check failed:', error);
        setAuthState('unauthenticated');

        if (location.pathname !== '/login') {
          navigate('/login', { replace: true });
        }
      }
    };

    checkAuth();
  }, [navigate, location.pathname]);

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

  // Nếu authenticated hoặc đang ở trang login, render children
  return <>{children}</>;
}
