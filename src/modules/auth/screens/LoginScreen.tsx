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
        <div className="relative z-10 w-full h-[100dvh] px-4 flex flex-col items-center pt-[8vh] pb-[10vh]" style={{ scrollbarWidth: 'none' }}>
          {/* Title Section */}
          <div className="relative w-full flex flex-col items-center justify-center flex-shrink-0">
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

          <div className="flex-grow"></div>

          {/* Login Container (Buttons positioned into the wooden board) */}
          <div className="w-full max-w-[280px] flex flex-col items-center gap-7 relative">

            <div className="relative w-full flex flex-col items-center gap-5">
              {/* Avalanche Login Button */}
              <div className="relative group w-full flex justify-center">
                <button
                  onClick={() => setShowWalletModal(true)}
                  disabled={loading}
                  className="w-full hover:animate-button-vibrate hover:brightness-110 active:animate-button-pop active:scale-95 transition-all disabled:opacity-70 focus:outline-none"
                >
                  <img src="/assets/login/button-avalan.png" alt="Login with Avalanche" className="w-full h-auto object-contain drop-shadow-sm" />
                </button>
              </div>

              {/* Google Login Button */}
              <div className="relative group w-full flex justify-center cursor-pointer">

                {/* Robust invisible overlay for GoogleLogin */}
                <div className="absolute inset-0 z-30 opacity-[0.01] flex items-center justify-center overflow-hidden rounded-2xl">
                  <div className="w-full h-full flex items-center justify-center transform scale-y-[2] scale-x-[1.3]">
                    <GoogleLogin
                      onSuccess={(res) => {
                        if (res.credential) handleAuthSuccess(res.credential);
                      }}
                      onError={() => {
                        // FedCM/silent sign-in failure is expected — don't show error
                        console.warn('[LoginScreen] GoogleLogin onError — user needs to click manually');
                      }}
                      width="350"
                      size="large"
                      shape="pill"
                    />
                  </div>
                </div>

                <div className={`w-full transition-all relative z-10 pointer-events-none ${loading ? 'opacity-70 cursor-wait' : 'group-hover:animate-button-vibrate group-hover:brightness-110 group-active:animate-button-pop group-active:scale-95'}`}>
                  <img src="/assets/login/btn-g.png" alt="Login with Google" className="w-full h-auto object-contain drop-shadow-sm" />
                </div>
              </div>
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
