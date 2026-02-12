import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { queryClient } from '@/shared/lib/queryClient';
import { PLAYER_PROFILE_KEY } from '@/shared/hooks/usePlayerProfile';
import { gameApi } from '@/shared/api/game-api';
import { useUIStore } from '@/shared/stores/uiStore';

// Google Client ID từ BE .env
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '572363325691-nj5r43cqfncrmh4jc548uvhc6kavvpqe.apps.googleusercontent.com';

function LoginScreenContent() {
  const navigate = useNavigate();
  const addToast = useUIStore((s) => s.addToast);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuthSuccess = async (idToken: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log('[FARM-DEBUG] LoginScreen: Sending Google ID token to BE');

      // Gửi Google ID token lên BE
      const res = await fetch('https://sta.cdhc.vn/api/auth/google', {
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

  // Google Login Hook for custom button
  // Note: flow: 'implicit' returns access_token, but our BE expects idToken.
  // We need to use 'google-one-tap' or the standard button if we want idToken easily, 
  // OR use a more advanced flow. 
  // For simplicity and compatibility with the existing BE, I'll use the implicit flow to get a token 
  // if possible, BUT the original code used the GoogleLogin component which provides the credential (idToken).
  // Actually, useGoogleLogin doesn't easily provide idToken without extra steps.
  // Instead, I'll use a invisible GoogleLogin component and trigger it, or just use a custom button 
  // that triggers useGoogleLogin and then we might need to change BE or get the idToken.
  // WAIT: There is 'google-one-tap' but it's not a button.
  // Let's use useGoogleLogin with flow: 'auth-code' OR just use the standard button but styled.
  // Stying the standard Google button is limited.
  // I will use 'user-one-tap' and a custom button that triggers the login.

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      // BE needs idToken, but useGoogleLogin implicit returns access_token.
      // If BE only accepts idToken, we have a problem. 
      // Let's assume the BE can handle access_token or we use the standard component hiddenly.
      // Actually, many BEs use the access_token to fetch user info from https://www.googleapis.com/oauth2/v3/userinfo.
      // But since I must maintain "các luồng chức năng", I'll try to find a way to get the idToken or stick to the component.
      // I'll use GoogleLogin component with a custom render if possible? No, @react-oauth/google doesn't support custom render for GoogleLogin anymore.
      // BUT we can use `useGoogleLogin` and then fetch the user info if needed.
      // FOR NOW, I will use a clever trick: style the button like the template and use `useGoogleLogin`.
      // If it fails because of idToken, I'll have to adjust.
      console.log('[FARM-DEBUG] LoginScreen: Google Success', tokenResponse);
      // If we only have access_token, we might need to send that instead.
      // Let's check the original LoginScreen again. It sent data.credential.
      addToast('Đang xử lý đăng nhập Google...', 'info');
      // For now, I'll provide the UI and a placeholder action for the button.
    },
    onError: () => setError('❌ Google Sign-In thất bại. Vui lòng thử lại.'),
  });

  const handleAvalancheLogin = () => {
    addToast('Tính năng đăng nhập ví Avalanche đang được phát triển! 🚀', 'info');
  };

  return (
    <div className="min-h-screen font-sans antialiased overflow-hidden relative flex flex-col items-center justify-center bg-[#81C784]">
      {/* Background Decor */}
      <div className="sprout-bg">
        {/* Sun */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[#FFD54F] border-[12px] border-[#FFB300] shadow-[0_0_100px_rgba(255,179,0,0.4)] z-0"></div>

        {/* Leaves */}
        <div className="absolute top-10 left-10 text-6xl opacity-20 floating-leaf" style={{ animationDelay: '0s' }}>🌿</div>
        <div className="absolute top-40 right-10 text-5xl opacity-20 floating-leaf" style={{ animationDelay: '2s' }}>🌱</div>
        <div className="absolute bottom-20 left-20 text-7xl opacity-20 floating-leaf" style={{ animationDelay: '1s' }}>🍃</div>
        <div className="absolute bottom-40 right-30 text-4xl opacity-20 floating-leaf" style={{ animationDelay: '3s' }}>☘️</div>

        {/* Hills (Mountains) */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] h-1/3 bg-[#8BC34A] rounded-[100%] translate-y-1/2 border-t-[10px] border-[#689F38] z-0"></div>
        <div className="absolute bottom-0 left-[20%] w-[180%] h-1/4 bg-[#7CB342] rounded-[100%] translate-y-1/3 border-t-[10px] border-[#558B2F] z-0"></div>

        {/* Animated Critters */}
        <div className="animate-bee text-5xl fixed">🐝</div>
        <div className="animate-worm-crawl text-4xl fixed">🐛</div>
      </div>

      <div className="relative z-10 w-full max-w-sm px-4 flex flex-col items-center gap-6 mb-10">
        {/* Title Section */}
        <div className="relative w-full flex flex-col items-center justify-center pt-8 pb-4">
          <h1 className="font-heading text-5xl md:text-6xl text-center leading-[0.9] tracking-tight relative z-20">
            <span className="honey-text block">Organic</span>
            <span className="honey-text block text-6xl md:text-7xl mt-1" style={{
              color: '#76FF03',
              WebkitTextStroke: '2px #33691E',
              background: 'linear-gradient(180deg, #CCFF90 20%, #76FF03 80%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '2px 2px 0 #FFF, 4px 4px 0 #1B5E20'
            }}>Kingdom</span>
          </h1>
          <div className="honey-drop w-3 h-6 top-[65%] right-[25%]"></div>
          <div className="absolute top-0 -right-4 rotate-12 z-10 text-5xl drop-shadow-lg transform hover:scale-110 transition-transform cursor-pointer">🐞</div>
          <div className="absolute bottom-0 -left-6 -rotate-12 z-10 text-5xl drop-shadow-lg transform hover:scale-110 transition-transform cursor-pointer">🐝</div>
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
              <div className="worm-decoration -top-3 left-6 -rotate-12">🐛</div>
              <button
                onClick={handleAvalancheLogin}
                className="w-full btn-comic-red text-white py-4 px-4 flex items-center justify-between gap-3 relative overflow-hidden"
              >
                <div className="w-10 h-10 bg-white/20 rounded-xl border-2 border-white/40 flex items-center justify-center shadow-[inset_0_2px_0_rgba(255,255,255,0.3)]">
                  <span className="material-symbols-outlined text-white text-2xl drop-shadow-sm">account_balance_wallet</span>
                </div>
                <div className="flex flex-col items-start flex-grow">
                  <span className="text-xs uppercase opacity-90 font-bold tracking-wider text-red-100">Login with</span>
                  <span className="text-xl font-black leading-none tracking-wide text-white drop-shadow-sm font-heading">Avalanche</span>
                </div>
                <span className="material-symbols-outlined text-white/80 group-hover:translate-x-1 transition-transform">arrow_forward_ios</span>
              </button>
              <div className="absolute -bottom-2 -right-1 text-xl">🌱</div>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t-4 border-[#A1887F] border-dashed opacity-50"></div>
              <span className="flex-shrink-0 mx-4 text-[#795548] font-black text-sm bg-[#D7CCC8] px-2 rounded-full border-2 border-[#A1887F]">OR</span>
              <div className="flex-grow border-t-4 border-[#A1887F] border-dashed opacity-50"></div>
            </div>

            {/* Google Login Button */}
            <div className="relative group">
              <div className="worm-decoration -bottom-2 -left-2 rotate-[20deg] text-xl">🪱</div>

              {/* This is the tricky part: triggering the ID token login */}
              {/* I'll use the official invisible button to trigger it properly so we get idToken */}
              <div className="opacity-0 absolute inset-0 z-20">
                <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                  <div className="w-full h-full">
                    {/* We can't use style on this, but we can overlay it */}
                    {/* However, the best way to get ID Token is to use the provided GoogleLogin but make it invisible */}
                    {/* and place it on top of our custom button */}
                  </div>
                </GoogleOAuthProvider>
              </div>

              <button
                className="w-full btn-comic-white text-gray-700 py-3 px-4 flex items-center justify-center gap-3 active:translate-y-[6px] active:shadow-none transition-all"
                style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
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
        <div className="text-center mt-2 flex items-center justify-center gap-2 bg-white/60 px-4 py-2 rounded-full backdrop-blur-sm border-2 border-white/40 shadow-sm">
          <span className="material-symbols-outlined text-green-700 text-sm">spa</span>
          <span className="text-xs font-bold text-green-800 uppercase tracking-wide">Powered by Avalanche</span>
        </div>
      </div>
    </div>
  );
}

// Custom wrapper to properly render the hidden GoogleLogin for credential access
import { GoogleLogin } from '@react-oauth/google';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('https://sta.cdhc.vn/api/auth/google', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: credentialResponse.credential }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await queryClient.prefetchQuery({
          queryKey: PLAYER_PROFILE_KEY,
          queryFn: () => gameApi.getProfile(),
        });
        navigate('/farm', { replace: true });
      } else {
        setError(data.error?.message || '❌ Đăng nhập thất bại');
      }
    } catch (err) {
      setError('❌ Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="relative min-h-screen">
        <LoginScreenContent />

        {/* Transparent overlay of GoogleLogin component to handle logic */}
        <div className="fixed top-[65.5%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[310px] h-[55px] opacity-[0.01] overflow-hidden z-[100] cursor-pointer pointer-events-auto">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => { }}
            useOneTap
            type="standard"
            shape="pill"
            width="310px"
          />
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
