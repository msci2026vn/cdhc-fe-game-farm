import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SplashScreen() {
  const navigate = useNavigate();
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      navigate('/farm', { replace: true });
    }, 2800);
    return () => clearTimeout(timer);
  }, [navigate]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] farm-sky-gradient flex flex-col items-center justify-center gap-8">
      {/* Logo area */}
      <div className="animate-bounce-in flex flex-col items-center gap-3">
        <div className="w-28 h-28 rounded-3xl bg-primary/90 flex items-center justify-center shadow-xl green-glow">
          <span className="text-6xl">🌱</span>
        </div>
        <h1 className="font-heading font-bold text-3xl text-primary">
          Organic Kingdom
        </h1>
        <p className="text-sm text-muted-foreground font-semibold">
          Nông trại hữu cơ thông minh
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-56 h-2 bg-primary-pale rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full animate-splash-progress" />
      </div>

      {/* Footer */}
      <div className="absolute bottom-12 flex flex-col items-center gap-1">
        <p className="text-xs text-muted-foreground">FARMVERSE × Avalanche</p>
        <p className="text-[10px] text-muted-foreground/60">Build Games 2026</p>
      </div>
    </div>
  );
}
