import React, { useMemo } from 'react';
import { useWeatherStore } from '../../farming/stores/weatherStore';

export function BoardWeatherOverlay() {
    const weather = useWeatherStore((s) => s.weather);
    const timeOfDay = useWeatherStore((s) => s.timeOfDay);

    // Skip rendering entirely for normal weather to save perf
    if (weather === 'normal' && timeOfDay !== 'night') return null;

    return (
        <div className="absolute inset-0 z-40 pointer-events-none rounded-[inherit] overflow-hidden">
            {/* Night tint */}
            {timeOfDay === 'night' && (
                <div className="absolute inset-0 bg-black/20" />
            )}

            {/* Fog effect — removed backdrop-blur (very expensive) */}
            {(weather === 'cold' || (weather as string) === 'fog') && (
                <div className="absolute inset-0 bg-white/10" />
            )}

            {/* Rain tint */}
            {weather === 'rain' && (
                <div className="absolute inset-0 bg-[#aed6f1]/15" />
            )}

            {/* Sun glow */}
            {weather === 'hot' && (
                <div className="absolute inset-0 bg-yellow-500/10" />
            )}

            {/* Mini Rain particles — reduced from 40 to 12 */}
            {(weather === 'rain' || weather === 'storm') && <BoardRain />}
        </div>
    );
}

function BoardRain() {
    const drops = useMemo(() =>
        Array.from({ length: 12 }, () => ({
            left: `${Math.random() * 100}%`,
            delay: `${Math.random() * 2}s`,
            duration: `${0.8 + Math.random() * 0.4}s`,
        })), []);

    return (
        <>
            {drops.map((d, i) => (
                <div key={i} className="absolute w-[1px] h-[12px] animate-rain-drop"
                    style={{
                        left: d.left,
                        top: '-20px',
                        background: 'linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.3))',
                        animationDelay: d.delay,
                        animationDuration: d.duration,
                    }}
                />
            ))}
        </>
    );
}
