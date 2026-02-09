import { Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const SplashScreen = lazy(() => import('@/modules/splash/screens/SplashScreen'));
const LoginScreen = lazy(() => import('@/modules/auth/screens/LoginScreen'));
const FarmingScreen = lazy(() => import('@/modules/farming/screens/FarmingScreen'));
const BossScreen = lazy(() => import('@/modules/boss/screens/BossScreen'));
const QuizScreen = lazy(() => import('@/modules/quiz/screens/QuizScreen'));
const ShopScreen = lazy(() => import('@/modules/shop/screens/ShopScreen'));
const ProfileScreen = lazy(() => import('@/modules/profile/screens/ProfileScreen'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, refetchOnWindowFocus: false } },
});

const Fallback = () => (
  <div className="min-h-screen flex items-center justify-center splash-gradient">
    <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
  </div>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<Fallback />}>
          <Routes>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/farm" element={<FarmingScreen />} />
            <Route path="/boss" element={<BossScreen />} />
            <Route path="/quiz" element={<QuizScreen />} />
            <Route path="/shop" element={<ShopScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
