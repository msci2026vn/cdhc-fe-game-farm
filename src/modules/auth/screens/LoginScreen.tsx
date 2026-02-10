import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

// Google Client ID từ BE .env
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '572363325691-nj5r43cqfncrmh4jc548uvhc6kavvpqe.apps.googleusercontent.com';

function LoginScreenContent() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setError(null);

    try {
      console.log('[FARM-DEBUG] LoginScreen: Sending Google ID token to BE');

      // Gửi Google ID token lên BE
      const res = await fetch('https://sta.cdhc.vn/api/auth/google', {
        method: 'POST',
        credentials: 'include', // ← Nhận cookie từ BE
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: credentialResponse.credential,
        }),
      });

      const data = await res.json();

      console.log('[FARM-DEBUG] LoginScreen: Response status =', res.status);
      console.log('[FARM-DEBUG] LoginScreen: Response data =', data);

      if (res.ok && data.success) {
        console.log('[FARM-DEBUG] LoginScreen: ✅ Login successful → navigating to /farm');
        // Login thành công → redirect /farm
        navigate('/farm', { replace: true });
      } else if (data.error?.code === 'NOT_APPROVED') {
        console.log('[FARM-DEBUG] LoginScreen: ❌ Account NOT_APPROVED');
        setError('⏳ Tài khoản đang chờ duyệt. Vui lòng liên hệ admin.');
      } else if (data.error?.code === 'ALREADY_PENDING') {
        console.log('[FARM-DEBUG] LoginScreen: ❌ Account ALREADY_PENDING');
        setError('⏳ Tài khoản đang chờ phê duyệt.');
      } else {
        console.log('[FARM-DEBUG] LoginScreen: ❌ Login failed -', data.error?.message);
        setError(data.error?.message || '❌ Đăng nhập thất bại');
      }
    } catch (err) {
      console.error('[FARM-DEBUG] LoginScreen: ❌ Exception:', err);
      setError('❌ Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('❌ Google Sign-In thất bại. Vui lòng thử lại.');
  };

  return (
    <div className="min-h-screen farm-sky-gradient flex flex-col items-center justify-center px-6">
      <div className="animate-bounce-in flex flex-col items-center gap-4 mb-12">
        <div className="w-24 h-24 rounded-3xl bg-primary/90 flex items-center justify-center shadow-xl green-glow">
          <span className="text-5xl">🌱</span>
        </div>
        <h1 className="font-heading font-bold text-2xl text-primary">Organic Kingdom</h1>
        <p className="text-sm text-muted-foreground">Nông trại hữu cơ của bạn</p>
      </div>

      {/* Google Login Button */}
      <div className="w-full max-w-[300px]">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          useOneTap
          type="standard"
          theme="filled_blue"
          size="large"
          text="signin_with"
          shape="pill"
          disabled={loading}
        />
      </div>

      {/* Loading state */}
      {loading && (
        <div className="mt-4 flex items-center gap-2 text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Đang đăng nhập...</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-6 text-sm text-red-500 text-center max-w-[300px]">{error}</p>
      )}

      <p className="mt-8 text-xs text-muted-foreground text-center">
        Tham gia cộng đồng nông trại hữu cơ<br />cùng công nghệ blockchain Avalanche
      </p>
    </div>
  );
}

/**
 * Login Screen - Google OAuth
 *
 * Flow:
 * 1. User clicks "Sign in with Google"
 * 2. Google popup → user selects account
 * 3. Google returns ID token (credential)
 * 4. FE sends ID token to BE: POST /api/auth/google
 * 5. BE verifies token → creates session → sets cookie
 * 6. FE redirects to /farm
 */
export default function LoginScreen() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LoginScreenContent />
    </GoogleOAuthProvider>
  );
}
