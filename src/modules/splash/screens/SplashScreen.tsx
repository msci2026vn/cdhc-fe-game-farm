import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gameApi } from '@/shared/api/game-api';

const LEAVES = [
  { emoji: '🍃', top: '10%', left: '10%', delay: '0s', size: 'text-4xl' },
  { emoji: '🌿', top: '25%', right: '15%', delay: '1.5s', size: 'text-3xl' },
  { emoji: '🍀', bottom: '30%', left: '8%', delay: '3s', size: 'text-5xl' },
  { emoji: '🌱', bottom: '15%', right: '10%', delay: '0.8s', size: 'text-4xl' },
  { emoji: '☘️', top: '50%', left: '50%', delay: '2s', size: 'text-[35px]' },
];

/**
 * SplashScreen - Entry point với auth check
 *
 * Flow:
 * 1. Show splash animation (2.8s)
 * 2. Check auth status (call /api/game/ping)
 * 3. If authenticated → redirect /farm
 * 4. If not authenticated → redirect /login
 * 5. User can tap to skip animation
 */
export default function SplashScreen() {
  const navigate = useNavigate();
  const [tapped, setTapped] = useState(false);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const hasChecked = useRef(false);

  useEffect(() => {
    // Prevent double check
    if (hasChecked.current) return;
    hasChecked.current = true;

    console.log('[FARM-DEBUG] SplashScreen: Starting auth check');

    // Show splash animation for 2.8s
    const animTimer = setTimeout(() => setTapped(true), 2800);

    // Check auth after animation
    const checkAuth = async () => {
      try {
        console.log('[FARM-DEBUG] SplashScreen: Calling gameApi.ping()');
        const result = await gameApi.ping();

        console.log('[FARM-DEBUG] SplashScreen: ping result =', result);

        if (result.success) {
          console.log('[FARM-DEBUG] SplashScreen: ✅ Authenticated → navigating to /farm');
          navigate('/farm', { replace: true });
        } else {
          console.log('[FARM-DEBUG] SplashScreen: ❌ Not authenticated → navigating to /login');
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('[FARM-DEBUG] SplashScreen: ❌ Auth check failed:', error);
        navigate('/login', { replace: true });
      } finally {
        setCheckedAuth(true);
      }
    };

    // Schedule auth check
    const authTimer = setTimeout(() => {
      checkAuth();
    }, 3000);

    return () => {
      clearTimeout(animTimer);
      clearTimeout(authTimer);
    };
  }, [navigate]);

  const handleTap = async () => {
    if (!tapped) {
      setTapped(true);
      return; // Wait for auth check
    }

    if (checkedAuth) return; // Already redirected

    // Manual tap → check auth immediately
    try {
      const result = await gameApi.ping();
      if (result.success) {
        navigate('/farm', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    } catch {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] splash-gradient flex flex-col items-center justify-center cursor-pointer safe-x"
      onClick={handleTap}
    >
      {/* Background radials */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.05) 0%, transparent 40%)'
      }} />

      {/* Floating leaves */}
      {LEAVES.map((leaf, i) => (
        <span
          key={i}
          className={`absolute ${leaf.size} opacity-15 animate-float-leaf`}
          style={{
            top: leaf.top, left: leaf.left, right: leaf.right, bottom: leaf.bottom,
            animationDelay: leaf.delay,
          }}
        >
          {leaf.emoji}
        </span>
      ))}

      {/* Content */}
      <div className="text-center z-10 animate-splash-in">
        <div className="w-[140px] h-[140px] mx-auto mb-5 rounded-full flex items-center justify-center animate-logo-pulse"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)' }}
        >
          <span className="text-7xl">🌳</span>
        </div>
        <h1 className="font-heading text-4xl font-bold text-white text-shadow-md tracking-wide">
          Organic Kingdom
        </h1>
        <p className="text-sm text-white/75 mt-1.5 font-semibold tracking-[2px] uppercase">
          Grow • Learn • Battle
        </p>
      </div>

      {/* Progress bar */}
      <div className="mt-12 w-[200px] h-1.5 bg-white/20 rounded-full overflow-hidden z-10">
        <div className="h-full rounded-full animate-splash-progress"
          style={{ background: 'linear-gradient(90deg, #f0b429, #ffe066)' }}
        />
      </div>

      {/* Tap text */}
      <p className="mt-14 text-white/60 text-[13px] font-semibold tracking-wider z-10"
        style={{ animation: 'fade-in-up 1s 2.5s both' }}
      >
        {tapped ? 'Đang kiểm tra đăng nhập...' : 'Chạm để bắt đầu'}
      </p>
    </div>
  );
}
