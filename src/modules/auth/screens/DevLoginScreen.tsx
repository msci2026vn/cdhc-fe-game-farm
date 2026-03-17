import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { queryClient } from '@/shared/lib/queryClient';
import { PLAYER_PROFILE_KEY } from '@/shared/hooks/usePlayerProfile';
import { gameApi, resetRedirectLock } from '@/shared/api/game-api';
import { API_BASE_URL } from '@/shared/utils/constants';

export default function DevLoginScreen() {
  if (!import.meta.env.DEV) return <Navigate to="/login" replace />;

  return <DevLoginForm />;
}

function DevLoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('loutrinh2312000@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE_URL + '/api/auth/dev-login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        resetRedirectLock();
        try {
          await queryClient.prefetchQuery({
            queryKey: PLAYER_PROFILE_KEY,
            queryFn: () => gameApi.getProfile(),
          });
        } catch { /* non-blocking */ }
        navigate('/farm', { replace: true });
      } else {
        setError(data.error?.message || 'Login failed');
      }
    } catch {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#111] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#1a1a1a] border border-white/10 rounded-xl p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2 py-0.5 bg-green-900/60 border border-green-600/40 text-green-400 rounded">DEV</span>
          <h1 className="text-white text-sm font-mono">Dev Login</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/10 text-white text-sm font-mono placeholder:text-white/30 focus:outline-none focus:border-green-500/50"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            autoFocus
            className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/10 text-white text-sm font-mono placeholder:text-white/30 focus:outline-none focus:border-green-500/50"
          />

          {error && (
            <p className="text-red-400 text-xs font-mono">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-green-800/60 border border-green-600/40 text-green-300 text-sm font-mono hover:bg-green-700/60 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? '...' : 'Đăng nhập Dev'}
          </button>
        </form>

        <p className="text-white/20 text-[10px] font-mono text-center">
          only visible in dev mode
        </p>
      </div>
    </div>
  );
}
