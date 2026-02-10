import { useState, useEffect, useCallback } from 'react';

export function useCooldown(initialSeconds: number = 0) {
  const [remaining, setRemaining] = useState(initialSeconds);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [remaining]);

  const start = useCallback((seconds: number) => {
    setRemaining(seconds);
  }, []);

  return { remaining, isActive: remaining > 0, start };
}
