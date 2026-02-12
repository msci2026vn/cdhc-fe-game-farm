import { Suspense, lazy, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { queryClient } from '@/shared/lib/queryClient';
import { AuthGuard } from '@/shared/components/AuthGuard';
import { Toaster } from '@/components/ui/sonner';
import { setNavigateToLogin } from '@/shared/utils/error-handler';
import { useGameSync } from '@/shared/hooks/useGameSync';
import { useLevelUpDetector } from '@/shared/hooks/useLevelUpDetector';
import { LevelUpOverlay } from '@/shared/components/LevelUpOverlay';
import Toast from '@/shared/components/Toast';

/**
 * Helper to handle "Failed to fetch dynamically imported module"
 * This usually happens when a new version is deployed and old assets are gone.
 */
const lazyWithRetry = (componentImport: () => Promise<{ default: any }>) =>
  lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.error('[FARM-DEBUG] Chunk load failed, reloading...', error);
      window.location.reload();
      return { default: () => null };
    }
  });

// Lazy load screens with retry logic
const SplashScreen = lazyWithRetry(() => import('@/modules/splash/screens/SplashScreen'));
const LoginScreen = lazyWithRetry(() => import('@/modules/auth/screens/LoginScreen'));
const FarmingScreen = lazyWithRetry(() => import('@/modules/farming/screens/FarmingScreen'));
const BossScreen = lazyWithRetry(() => import('@/modules/boss/screens/BossScreen'));
const QuizScreen = lazyWithRetry(() => import('@/modules/quiz/screens/QuizScreen'));
const ShopScreen = lazyWithRetry(() => import('@/modules/shop/screens/ShopScreen'));
const ProfileScreen = lazyWithRetry(() => import('@/modules/profile/screens/ProfileScreen'));
const OgnHistoryScreen = lazyWithRetry(() => import('@/modules/profile/screens/OgnHistoryScreen'));

const Fallback = () => (
  <div className="min-h-screen flex items-center justify-center splash-gradient">
    <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
  </div>
);

/**
 * NavigateSetup — Configure 401 auto-redirect + Game Sync + Level Up detection
 * Must be inside BrowserRouter to use useNavigate
 */
const NavigateSetup = () => {
  const navigate = useNavigate();
  // Initialize game sync engine (queues actions, auto-syncs every 60s)
  useGameSync();
  // Watch for level changes and trigger animation
  useLevelUpDetector();

  useEffect(() => {
    setNavigateToLogin(() => navigate('/login', { replace: true }));
    console.log('[FARM-DEBUG] NavigateSetup: setNavigateToLogin configured');
  }, [navigate]);

  return <LevelUpOverlay />;
};

/**
 * App Router with AuthGuard
 *
 * Routes:
 * - / → SplashScreen (auth check → redirect /farm hoặc /login)
 * - /login → LoginScreen (Google OAuth)
 * - /farm → FarmingScreen (protected by AuthGuard)
 * - /boss → BossScreen (protected by AuthGuard)
 * - /quiz → QuizScreen (protected by AuthGuard)
 * - /shop → ShopScreen (protected by AuthGuard)
 * - /profile → ProfileScreen (protected by AuthGuard)
 * - * → Redirect to /
 */
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <NavigateSetup />
        <Suspense fallback={<Fallback />}>
          <AuthGuard>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Navigate to="/farm" replace />} />
              <Route path="/login" element={<LoginScreen />} />

              {/* Protected routes (require auth) */}
              <Route path="/farm" element={<FarmingScreen />} />
              <Route path="/boss" element={<BossScreen />} />
              <Route path="/quiz" element={<QuizScreen />} />
              <Route path="/shop" element={<ShopScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
              <Route path="/ogn-history" element={<OgnHistoryScreen />} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthGuard>
        </Suspense>
        <Toaster />
        <Toast />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
