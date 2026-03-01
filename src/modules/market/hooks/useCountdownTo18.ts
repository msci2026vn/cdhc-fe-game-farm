import { useState, useEffect, useCallback } from 'react';

export function useCountdownTo18() {
    const getSecondsLeft = useCallback(() => {
        const now = new Date();
        const target = new Date(now);
        target.setHours(18, 0, 0, 0);
        if (now >= target) {
            target.setDate(target.getDate() + 1);
        }
        return Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
    }, []);

    const [secs, setSecs] = useState(getSecondsLeft);

    useEffect(() => {
        const id = setInterval(() => setSecs(getSecondsLeft()), 1000);
        return () => clearInterval(id);
    }, [getSecondsLeft]);

    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const pad = (n: number) => String(n).padStart(2, '0');

    return { h, m, s, pad, secs };
}
