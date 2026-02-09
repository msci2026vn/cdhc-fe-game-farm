import { Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const SplashScreen = lazy(() => import('@/modules/splash/screens/SplashScreen'));
const LoginScreen = lazy(() => import('@/modules/auth/screens/LoginScreen'));
const FarmingScreen = lazy(() => import('@/modules/farming/screens/FarmingScreen'));
const BossScreen = lazy(() => import('@/modules/boss/screens/BossScreen'));
const ShopScreen = lazy(() => import('@/modules/shop/screens/ShopScreen'));
const ProfileScreen = lazy(() => import('@/modules/profile/screens/ProfileScreen'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const Fallback = () => (
  <div className="min-h-screen flex items-center justify-center farm-sky-gradient">
    <LoadingSpinner />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/farm" element={<FarmingScreen />} />
          <Route path="/boss" element={<BossScreen />} />
          <Route path="/shop" element={<ShopScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
