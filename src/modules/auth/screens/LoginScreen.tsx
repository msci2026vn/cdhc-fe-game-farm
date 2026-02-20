import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { queryClient } from '@/shared/lib/queryClient';
import { PLAYER_PROFILE_KEY } from '@/shared/hooks/usePlayerProfile';
import { gameApi, resetRedirectLock } from '@/shared/api/game-api';
import { API_BASE_URL } from '@/shared/utils/constants';
import { useUIStore } from '@/shared/stores/uiStore';
import { useWalletAuth } from '@/shared/hooks/useWalletAuth';

// Google Client ID từ BE .env
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '572363325691-nj5r43cqfncrmh4jc548uvhc6kavvpqe.apps.googleusercontent.com';

function LoginScreenContent() {
  const navigate = useNavigate();
  const addToast = useUIStore((s) => s.addToast);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Static defaults — no API call needed on login screen
  const weather = 'sunny';
  const timeOfDay = 'day';

  const handleAuthSuccess = async (idToken: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log('[FARM-DEBUG] LoginScreen: Sending Google ID token to BE');

      // Gửi Google ID token lên BE
      const res = await fetch(API_BASE_URL + '/api/auth/google', {
        method: 'POST',
        credentials: 'include', // ← Nhận cookie từ BE
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();

      console.log('[FARM-DEBUG] LoginScreen: Response status =', res.status);
      console.log('[FARM-DEBUG] LoginScreen: Response data =', data);

      if (res.ok && data.success) {
        console.log('[FARM-DEBUG] LoginScreen: ✅ Login successful → prefetching profile...');

        // Reset the 401 redirect lock so future session expiries can trigger redirect again
        resetRedirectLock();

        try {
          await queryClient.prefetchQuery({
            queryKey: PLAYER_PROFILE_KEY,
            queryFn: () => gameApi.getProfile(),
          });
          console.log('[FARM-DEBUG] LoginScreen: Profile prefetched successfully');
        } catch (prefetchError) {
          console.warn('[FARM-DEBUG] LoginScreen: Profile prefetch failed (non-blocking):', prefetchError);
        }

        navigate('/farm', { replace: true });
      } else if (data.error?.code === 'NOT_APPROVED') {
        setError('⏳ Tài khoản đang chờ duyệt. Vui lòng liên hệ admin.');
      } else if (data.error?.code === 'ALREADY_PENDING') {
        setError('⏳ Tài khoản đang chờ phê duyệt.');
      } else {
        setError(data.error?.message || '❌ Đăng nhập thất bại');
      }
    } catch (err) {
      console.error('[FARM-DEBUG] LoginScreen: ❌ Exception:', err);
      setError('❌ Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Wallet auth
  const { loginWithWallet, isLoading: walletLoading, state: walletState, clearError: clearWalletError } = useWalletAuth();

  const handleAvalancheLogin = async () => {
    try {
      await loginWithWallet('metamask');
      navigate('/farm', { replace: true });
    } catch {
      // Error already set in walletState
    }
  };

  const walletLoadingText = walletState.isConnecting
    ? 'Kết nối ví...'
    : walletState.isSigning
      ? 'Chờ ký...'
      : walletState.isVerifying
        ? 'Xác thực...'
        : 'Avalanche';

  // Determine which background elements to show
  const isNight = timeOfDay === 'night';
  const isRainy = weather === 'rain' || weather === 'storm';
  const isCloudy = weather === 'cloudy';

  return (
    <div className={`h-[100dvh] font-sans antialiased relative flex flex-col items-center justify-center overflow-hidden transition-colors duration-1000 ${isNight ? 'bg-[#1A237E]' : 'bg-[#81C784]'}`}>
      {/* Background Decor */}
      <div className="sprout-bg" style={{
        background: isNight
          ? 'linear-gradient(180deg, #0D47A1 0%, #1A237E 100%)'
          : 'linear-gradient(180deg, #4FC3F7 0%, #81C784 100%)'
      }}>
        {/* Sun or Moon */}
        {!isNight ? (
          <div className="sun-circle sun-glow">
            {isCloudy && (
              <div className="cloud-decoration -top-8 -left-16 opacity-80" style={{ transform: 'scale(0.8)' }}>☁️</div>
            )}
          </div>
        ) : (
          <div className="moon-circle sun-glow">
            <div className="absolute top-4 left-4 text-white/20 text-xl">✨</div>
          </div>
        )}

        {/* Clouds for cloudy weather */}
        {isCloudy && (
          <>
            <div className="cloud-decoration top-[12%] left-[8%]" style={{ animationDelay: '2s' }}>☁️</div>
            <div className="cloud-decoration top-[22%] right-[12%]" style={{ animationDelay: '5s' }}>☁️</div>
          </>
        )}

        {/* Rain Particles */}
        {isRainy && (
          <div className="rain-overlay">
            {[...Array(25)].map((_, i) => (
              <div
                key={i}
                className="rain-drop"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-${Math.random() * 20}%`,
                  animationDelay: `${Math.random() * 1.5}s`,
                  opacity: Math.random() * 0.4 + 0.1
                }}
              />
            ))}
          </div>
        )}

        <div className="hill-1" style={{ filter: isNight ? 'brightness(0.4)' : 'none' }}></div>
        <div className="hill-2" style={{ filter: isNight ? 'brightness(0.3)' : 'none' }}></div>

        <div className="absolute top-10 left-10 text-6xl floating-leaf" style={{ animationDelay: '0s', opacity: isNight ? 0.1 : 0.3 }}>🌿</div>
        <div className="absolute top-40 right-10 text-5xl floating-leaf" style={{ animationDelay: '2s', opacity: isNight ? 0.1 : 0.3 }}>🌱</div>
        <div className="absolute bottom-20 left-20 text-7xl floating-leaf" style={{ animationDelay: '1s', opacity: isNight ? 0.1 : 0.3 }}>🍃</div>

        <div className="animate-bee">🐝</div>
        <div className="animate-worm-crawl">🐛</div>
      </div>

      <div className="relative z-10 w-full max-w-sm px-4 flex flex-col items-center gap-6 mb-10 overflow-y-auto max-h-full" style={{ scrollbarWidth: 'none' }}>
        {/* Title Section */}
        <div className="relative w-full flex flex-col items-center justify-center pt-8 pb-4">
          <h1 className="font-heading text-5xl md:text-6xl text-center leading-[0.9] tracking-tight relative z-20">
            <span className="honey-text block">Organic</span>
            <span className={`block text-6xl md:text-7xl mt-1 ${isNight ? 'honey-text-night' : 'honey-text-green'}`}>
              Kingdom
            </span>
          </h1>
          <div className="honey-drop w-3 h-6 top-[65%] right-[25%]" style={{ background: isNight ? '#C5CAE9' : '#FFB300' }}></div>
          <div className="absolute top-0 -right-4 z-10 text-5xl drop-shadow-lg transform hover:scale-110 transition-transform cursor-pointer animate-ladybug-title">🐞</div>
          <div className="absolute bottom-0 -left-6 z-10 text-5xl drop-shadow-lg transform hover:scale-110 transition-transform cursor-pointer animate-bee-title">🐝</div>
        </div>

        {/* Login Container */}
        <div className="wood-container w-full p-6 pt-10 pb-8 flex flex-col gap-5 relative mt-4">
          <div className="nail top-3 left-3"></div>
          <div className="nail top-3 right-3"></div>
          <div className="nail bottom-3 left-3"></div>
          <div className="nail bottom-3 right-3"></div>

          <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-[#FFCA28] text-amber-900 font-black py-2 px-6 rounded-lg border-4 border-[#FF6F00] shadow-md text-sm whitespace-nowrap -rotate-2">
            Start Farming! 👩‍🌾
          </div>

          <p className="text-center text-[#5D4037] font-bold text-lg mb-1 mt-2 font-heading">Let's Dig In!</p>

          <div className="space-y-4 relative">
            {/* Avalanche Login Button */}
            <div className="relative group">
              <div className="worm-decoration -top-3 left-6 -rotate-12 animate-slow-crawl">🐛</div>
              <button
                onClick={handleAvalancheLogin}
                disabled={walletLoading || loading}
                className="w-full btn-comic-red text-white py-4 px-4 flex items-center justify-between gap-3 relative overflow-hidden disabled:opacity-70"
              >
                <div className="w-10 h-10 bg-white/20 rounded-xl border-2 border-white/40 flex items-center justify-center shadow-[inset_0_2px_0_rgba(255,255,255,0.3)]">
                  {walletLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-white text-2xl drop-shadow-sm">account_balance_wallet</span>
                  )}
                </div>
                <div className="flex flex-col items-start flex-grow">
                  <span className="text-xs uppercase opacity-90 font-bold tracking-wider text-red-100">Login with</span>
                  <span className="text-xl font-black leading-none tracking-wide text-white drop-shadow-sm font-heading">{walletLoading ? walletLoadingText : 'Avalanche'}</span>
                </div>
                <span className="material-symbols-outlined text-white/80 group-hover:translate-x-1 transition-transform">arrow_forward_ios</span>
              </button>
              <div className="absolute -bottom-2 -right-1 text-xl">🌱</div>
            </div>

            {/* Wallet error + install links */}
            {walletState.error && (
              <div className="p-2.5 bg-red-100 border-2 border-red-200 rounded-lg animate-shake">
                <div className="flex items-center gap-2 text-red-600 text-xs font-bold">
                  <span className="flex-1">{walletState.error}</span>
                  <button onClick={clearWalletError} className="text-red-400 hover:text-red-600 flex-shrink-0">✕</button>
                </div>
                {walletState.error.includes('Chưa cài ví') && (
                  <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-red-200">
                    <p className="text-[10px] font-bold text-orange-700">Cài ví để đăng nhập:</p>
                    <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer"
                      className="text-[11px] font-bold text-orange-600 hover:text-orange-800 underline">
                      🦊 Cài MetaMask
                    </a>
                    <a href="https://core.app/download/" target="_blank" rel="noopener noreferrer"
                      className="text-[11px] font-bold text-orange-600 hover:text-orange-800 underline">
                      🔺 Cài Core Wallet (Avalanche)
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t-4 border-[#A1887F] border-dashed opacity-50"></div>
              <span className="flex-shrink-0 mx-4 text-[#795548] font-black text-sm bg-[#D7CCC8] px-2 rounded-full border-2 border-[#A1887F]">OR</span>
              <div className="flex-grow border-t-4 border-[#A1887F] border-dashed opacity-50"></div>
            </div>

            {/* Google Login Button */}
            <div className="relative group">
              <div className="worm-decoration -bottom-2 -left-2 rotate-[20deg] text-xl animate-slow-crawl">🪱</div>

              {/* Robust invisible overlay for GoogleLogin */}
              <div className="absolute inset-0 z-30 opacity-[0.01] overflow-hidden scale-[2] origin-center">
                <GoogleLogin
                  onSuccess={(res) => {
                    if (res.credential) handleAuthSuccess(res.credential);
                  }}
                  onError={() => {
                    // FedCM/silent sign-in failure is expected — don't show error
                    console.warn('[LoginScreen] GoogleLogin onError — user needs to click manually');
                  }}
                  width="400"
                />
              </div>

              <button
                className="w-full btn-comic-white text-gray-700 py-4 px-4 flex items-center justify-center gap-3 active:translate-y-[2px] transition-all relative z-10"
                style={{ cursor: loading ? 'wait' : 'pointer' }}
              >
                <div className="absolute inset-0 z-10 overflow-hidden rounded-2xl opacity-0">
                  {/* GoogleLogin component is overlaid in the parent wrapper */}
                </div>

                <svg className="w-6 h-6 filter drop-shadow-sm" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                </svg>
                <span className="font-black text-lg text-gray-600 font-heading">{loading ? 'Loading...' : 'Google'}</span>
              </button>
              <div className="absolute top-1 right-2 text-xs">🐞</div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-2 p-2 bg-red-100 border-2 border-red-200 rounded-lg text-red-600 text-xs text-center font-bold animate-shake">
              {error}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center mt-2 flex items-center justify-center gap-2 bg-[#A5D6A7] px-6 py-2.5 rounded-full border-2 border-[#81C784] shadow-sm">
          <div className="w-5 h-5 bg-[#2E7D32] rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[12px] font-bold">spa</span>
          </div>
          <span className="text-[10px] font-black text-[#1B5E20] uppercase tracking-widest font-heading">Powered by Avalanche</span>
        </div>
      </div>
    </div>
  );
}

// Custom wrapper to properly render the hidden GoogleLogin for credential access
import { GoogleLogin } from '@react-oauth/google';

export default function LoginScreen() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LoginScreenContent />
    </GoogleOAuthProvider>
  );
}
