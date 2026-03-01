import React, { useMemo } from 'react';
import { useWeatherStore, WeatherType, TimeOfDay } from '../../farming/stores/weatherStore';

export function BoardWeatherOverlay() {
    const weather = useWeatherStore((s) => s.weather);
    const timeOfDay = useWeatherStore((s) => s.timeOfDay);

    return (
        <div className="absolute inset-0 z-40 pointer-events-none rounded-[inherit] overflow-hidden">
            {/* Night tint */}
            {timeOfDay === 'night' && (
                <div className="absolute inset-0 bg-black/20 mix-blend-multiply" />
            )}

            {/* Fog effect */}
            {(weather === 'cold' || (weather as string) === 'fog') && (
                <div className="absolute inset-0 backdrop-blur-[2px] bg-white/10" />
            )}

            {/* Rain tint */}
            {weather === 'rain' && (
                <div className="absolute inset-0 bg-[#aed6f1]/20 mix-blend-overlay" />
            )}

            {/* Sun glow */}
            {weather === 'hot' && (
                <div className="absolute inset-0 bg-yellow-500/10 mix-blend-overlay shadow-[inset_0_0_20px_rgba(255,165,0,0.2)]" />
            )}

            {/* Mini Rain particles specific for board */}
            {(weather === 'rain' || weather === 'storm') && <BoardRain />}

            {/* Storm lightning flash inside board */}
            {weather === 'storm' && <div className="absolute inset-0 animate-storm-flash bg-white/30 mix-blend-overlay" />}
        </div>
    );
}

function BoardRain() {
    const drops = useMemo(() =>
        Array.from({ length: 40 }, () => ({
            left: `${Math.random() * 100}%`,
            delay: `${Math.random() * 2}s`,
            duration: `${0.8 + Math.random() * 0.4}s`,
        })), []);

    return (
        <>
            {drops.map((d, i) => (
                <div key={i} className="absolute w-[2px] h-[15px] animate-rain-drop"
                    style={{
                        left: d.left,
                        top: '-20px',
                        background: 'linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.4))',
                        animationDelay: d.delay,
                        animationDuration: d.duration,
                    }}
                />
            ))}
        </>
    );
}
