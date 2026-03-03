import { Suspense, lazy, useEffect } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { wagmiConfig } from '@/shared/config/wagmi';
import { queryClient } from '@/shared/lib/queryClient';
import { AuthGuard } from '@/shared/components/AuthGuard';
import { Toaster } from '@/components/ui/sonner';
import { setNavigateToLogin } from '@/shared/utils/error-handler';
import { useGameSync } from '@/shared/hooks/useGameSync';
import { useLevelUpDetector } from '@/shared/hooks/useLevelUpDetector';
import { LevelUpOverlay } from '@/shared/components/LevelUpOverlay';
import Toast from '@/shared/components/Toast';
import ConnectionLostOverlay from '@/shared/components/ConnectionLostOverlay';
import { audioManager } from '@/shared/audio';
import ErrorBoundary from '@/shared/components/ErrorBoundary';
import { AppDisplayPrompt } from '@/components/AppDisplayPrompt';

/**
 * Helper to handle "Failed to fetch dynamically imported module"
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

// Lazy load screens
const LoginScreen = lazyWithRetry(() => import('@/modules/auth/screens/LoginScreen'));
const FarmingScreen = lazyWithRetry(() => import('@/modules/farming/screens/FarmingScreen'));
const BossScreen = lazyWithRetry(() => import('@/modules/boss/screens/BossScreen'));
const QuizScreen = lazyWithRetry(() => import('@/modules/quiz/screens/QuizScreen'));
const ShopScreen = lazyWithRetry(() => import('@/modules/shop/screens/ShopScreen'));
const InventoryScreen = lazyWithRetry(() => import('@/modules/inventory/screens/InventoryScreen'));
const FriendsScreen = lazyWithRetry(() => import('@/modules/friends/screens/FriendsScreen'));
const ProfileScreen = lazyWithRetry(() => import('@/modules/profile/screens/ProfileScreen'));
const OgnHistoryScreen = lazyWithRetry(() => import('@/modules/profile/screens/OgnHistoryScreen'));
const CampaignMapScreen = lazyWithRetry(() => import('@/modules/campaign/screens/CampaignMapScreen'));
const CampaignZoneScreen = lazyWithRetry(() => import('@/modules/campaign/screens/CampaignZoneScreen'));
const CampaignBattleScreen = lazyWithRetry(() => import('@/modules/campaign/screens/CampaignBattleScreen'));
const SkillUpgradeScreen = lazyWithRetry(() => import('@/modules/campaign/screens/SkillUpgradeScreen'));
const FragmentInventoryScreen = lazyWithRetry(() => import('@/modules/campaign/screens/FragmentInventoryScreen'));
const RecipeCraftScreen = lazyWithRetry(() => import('@/modules/campaign/screens/RecipeCraftScreen'));
const MissionScreen = lazyWithRetry(() => import('@/modules/campaign/screens/MissionScreen'));
const AchievementsHubScreen = lazyWithRetry(() => import('@/modules/campaign/screens/AchievementsHubScreen'));
const MainMenuScreen = lazyWithRetry(() => import('@/modules/home/screens/MainMenuScreen'));
const PrayerScreen = lazyWithRetry(() => import('@/modules/prayer/screens/PrayerScreen'));
const MarketScreen = lazyWithRetry(() => import('@/modules/market/screens/MarketScreen'));
const VipPurchaseScreen = lazyWithRetry(() => import('@/modules/vip/screens/VipPurchaseScreen'));
const SettingsScreen = lazyWithRetry(() => import('@/modules/settings/screens/SettingsScreen'));
const MyGardenScreen = lazyWithRetry(() => import('@/modules/rwa/screens/MyGardenScreen'));
const TopupPage = lazyWithRetry(() => import('@/desktop/modules/avalan/farmverse/pages/TopupPage'));
const TopupSuccessPage = lazyWithRetry(() => import('@/desktop/modules/avalan/farmverse/pages/TopupSuccessPage'));
const TopupCancelPage = lazyWithRetry(() => import('@/desktop/modules/avalan/farmverse/pages/TopupCancelPage'));
const WorldBossScreen = lazyWithRetry(() => import('@/modules/world-boss/screens/WorldBossScreen').then(m => ({ default: m.WorldBossScreen })));
const NftGalleryScreen = lazyWithRetry(() => import('@/modules/nft/screens/NftGalleryScreen'));

const Fallback = () => (
  <div className="h-[100dvh] flex items-center justify-center splash-gradient">
    <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
  </div>
);

/**
 * NavigateSetup — ONLY configure 401 redirect
 * Runs globally (before auth) — no API calls here!
 */
const NavigateSetup = () => {
  const navigate = useNavigate();

  useEffect(() => {
    setNavigateToLogin(() => navigate('/login', { replace: true }));
  }, [navigate]);

  return null;
};

/**
 * AuthenticatedApp — Only runs AFTER AuthGuard confirms authentication
 * Game sync + level up detector + protected routes live here
 */
const AuthenticatedApp = () => {
  // These hooks call usePlayerProfile → getProfile API
  // Safe here because AuthGuard already confirmed auth
  useGameSync();
  useLevelUpDetector();

  // Initialize audio on first user interaction + preload UI sounds
  useEffect(() => {
    const init = () => {
      audioManager.init();
      audioManager.preloadScene('ui');
      audioManager.preloadScene('progression');
    };
    window.addEventListener('touchstart', init, { once: true });
    window.addEventListener('click', init, { once: true });
    return () => {
      window.removeEventListener('touchstart', init);
      window.removeEventListener('click', init);
    };
  }, []);

  return (
    <>
      <LevelUpOverlay />
      <Routes>
        <Route path="/" element={<MainMenuScreen />} />
        <Route path="/farm" element={<FarmingScreen />} />
        <Route path="/boss" element={<BossScreen />} />
        <Route path="/quiz" element={<QuizScreen />} />
        <Route path="/shop" element={<ShopScreen />} />
        <Route path="/inventory" element={<InventoryScreen />} />
        <Route path="/friends" element={<FriendsScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/ogn-history" element={<OgnHistoryScreen />} />
        <Route path="/campaign" element={<CampaignMapScreen />} />
        <Route path="/campaign/battle/:bossId" element={<CampaignBattleScreen />} />
        <Route path="/campaign/skills" element={<SkillUpgradeScreen />} />
        <Route path="/campaign/fragments" element={<FragmentInventoryScreen />} />
        <Route path="/campaign/recipes" element={<RecipeCraftScreen />} />
        <Route path="/campaign/missions" element={<MissionScreen />} />
        <Route path="/campaign/achievements" element={<AchievementsHubScreen />} />
        <Route path="/campaign/:zoneNumber" element={<CampaignZoneScreen />} />
        <Route path="/prayer" element={<PrayerScreen />} />
        <Route path="/world-boss" element={<WorldBossScreen />} />
        <Route path="/market" element={<MarketScreen />} />
        <Route path="/vip/purchase" element={<VipPurchaseScreen />} />
        <Route path="/rwa/my-garden" element={<MyGardenScreen />} />
        <Route path="/nft-gallery" element={<NftGalleryScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/farmverse/topup" element={<TopupPage />} />
        <Route path="/farmverse/topup/success" element={<TopupSuccessPage />} />
        <Route path="/farmverse/topup/cancel" element={<TopupCancelPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

/**
 * App Router
 *
 * /login → PUBLIC (no AuthGuard, no API calls)
 * /* → PROTECTED (AuthGuard → then game hooks + routes)
 */
const App = () => {
  return (
    <ErrorBoundary>
      <AppDisplayPrompt />
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <ConnectionLostOverlay />
            <NavigateSetup />
            <Suspense fallback={<Fallback />}>
              <Routes>
                {/* Public — NO AuthGuard, NO game hooks */}
                <Route path="/login" element={<LoginScreen />} />

                {/* Protected — AuthGuard first, then game hooks */}
                <Route path="/*" element={
                  <AuthGuard>
                    <AuthenticatedApp />
                  </AuthGuard>
                } />
              </Routes>
            </Suspense>
            <Toaster />
            <Toast />
          </BrowserRouter>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  );
};

export default App;
