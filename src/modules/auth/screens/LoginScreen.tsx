import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { queryClient } from '@/shared/lib/queryClient';
import { PLAYER_PROFILE_KEY } from '@/shared/hooks/usePlayerProfile';
import { gameApi, resetRedirectLock } from '@/shared/api/game-api';
import { API_BASE_URL } from '@/shared/utils/constants';
import { useUIStore } from '@/shared/stores/uiStore';
import { WalletSelectModal } from '@/shared/components/WalletSelectModal';

// Google Client ID từ BE .env
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '572363325691-nj5r43cqfncrmh4jc548uvhc6kavvpqe.apps.googleusercontent.com';

function LoginScreenContent() {
  const navigate = useNavigate();
  const addToast = useUIStore((s) => s.addToast);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // No API call needed on login screen

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

      if (res.ok && data.success && data.needRegister) {
        // ═══ NEW USER — Auto-register as community ═══
        console.log('[FARM-DEBUG] LoginScreen: New user detected, auto-registering as community...');
        const googleUser = data.googleUser;

        const regRes = await fetch(API_BASE_URL + '/api/auth/google/register', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken,
            role: 'community',
            orgType: 'individual',
            profile: {
              fullName: googleUser?.name || 'Người chơi',
              province: 'Chưa cập nhật',
              ward: 'Chưa cập nhật',
              interests: ['organic_farming'],
            },
            isLegacyUser: data.isLegacyUser || false,
          }),
        });

        const regData = await regRes.json();
        console.log('[FARM-DEBUG] LoginScreen: Register response =', regData);

        if (regRes.ok && regData.success) {
          console.log('[FARM-DEBUG] LoginScreen: ✅ Auto-register successful → entering game...');
          resetRedirectLock();
          try {
            await queryClient.prefetchQuery({
              queryKey: PLAYER_PROFILE_KEY,
              queryFn: () => gameApi.getProfile(),
            });
          } catch (prefetchError) {
            console.warn('[FARM-DEBUG] LoginScreen: Profile prefetch failed (non-blocking):', prefetchError);
          }
          navigate('/farm', { replace: true });
        } else {
          setError(regData.error?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
        }
        return;
      }

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
        setError('Tài khoản đang chờ duyệt. Vui lòng liên hệ admin.');
      } else if (data.error?.code === 'ALREADY_PENDING') {
        setError('Tài khoản đang chờ phê duyệt.');
      } else {
        setError(data.error?.message || 'Đăng nhập thất bại');
      }
    } catch (err) {
      console.error('[FARM-DEBUG] LoginScreen: ❌ Exception:', err);
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Wallet modal
  const [showWalletModal, setShowWalletModal] = useState(false);

  return (
    <div className="min-h-[100dvh] w-full bg-[#1e1e1e] flex flex-col items-center justify-center font-sans antialiased overflow-hidden">
      <div
        className="relative w-full h-[100dvh] max-w-[430px] flex flex-col items-center justify-center overflow-hidden shadow-2xl bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/assets/login/anh-nen.png')" }}
      >
        <div className="relative z-10 w-full px-4 flex flex-col items-center gap-6 mb-10 overflow-y-auto max-h-full" style={{ scrollbarWidth: 'none' }}>
          {/* Title Section */}
          <div className="relative w-full flex flex-col items-center justify-center pt-8 pb-4">
            <h1 className="font-heading text-5xl md:text-6xl text-center leading-[0.9] tracking-tight relative z-20">
              <span className="honey-text block">Organic</span>
              <span className="block text-6xl md:text-7xl mt-1 honey-text-green">
                Kingdom
              </span>
            </h1>
            <div className="honey-drop w-3 h-6 top-[65%] right-[25%]" style={{ background: '#FFB300' }}></div>
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
              <div className="relative group flex justify-center w-full">
                <button
                  onClick={() => setShowWalletModal(true)}
                  disabled={loading}
                  className="w-full hover:brightness-110 active:scale-95 transition-all disabled:opacity-70 focus:outline-none"
                >
                  <img src="/assets/login/button-avalan.png" alt="Login with Avalanche" className="w-full h-auto object-contain drop-shadow-sm" />
                </button>
              </div>

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

        {/* Wallet Selection Modal */}
        {showWalletModal && (
          <WalletSelectModal
            mode="login"
            onSuccess={() => {
              setShowWalletModal(false);
              navigate('/farm', { replace: true });
            }}
            onClose={() => setShowWalletModal(false)}
          />
        )}
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
