import React, { useMemo } from 'react';
import { ChainLightningData } from '@/shared/match3/combat.types';

interface Props {
    strikes?: ChainLightningData[];
}

export function ChainLightningContainer({ strikes = [] }: Props) {
    if (strikes.length === 0) return null;

    return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-40"
            viewBox="0 0 100 100" preserveAspectRatio="none"
            style={{ filter: 'drop-shadow(0 0 3px #00f0ff)' }}>
            {strikes.map(strike => (
                <LightningStrike key={strike.id} strike={strike} />
            ))}
        </svg>
    );
}

function LightningStrike({ strike }: { strike: ChainLightningData }) {
    const segments = useMemo(() => {
        const segs = [];
        for (let i = 0; i < strike.path.length - 1; i++) {
            const p1 = getPoint(strike.path[i]);
            const p2 = getPoint(strike.path[i + 1]);
            segs.push(createJaggedLine(p1, p2, 4));
        }
        return segs;
    }, [strike.path]);

    const baseColor = strike.color || '#e0ffff';

    return (
        <>
            {segments.map((points, idx) => {
                const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                // Calculate delay based on jump index for chain effect
                const delay = idx * 0.08;

                return (
                    // Render 2 strokes: an outer glow stroke and an inner core stroke
                    <g key={idx} className="opacity-0 animate-bolt-flash" style={{ animationDelay: `${delay}s`, animationFillMode: 'forwards' }}>
                        <path
                            d={pathData}
                            fill="none"
                            stroke={baseColor}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="miter"
                            opacity="0.5"
                        />
                        <path
                            d={pathData}
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth="0.8"
                            strokeLinecap="round"
                            strokeLinejoin="miter"
                        />
                    </g>
                );
            })}
        </>
    );
}

function getPoint(index: number) {
    const col = index % 8;
    const row = Math.floor(index / 8);
    // 8x8 grid -> each cell is 12.5% width/height. Center is at +6.25%
    return { x: col * 12.5 + 6.25, y: row * 12.5 + 6.25 };
}

function createJaggedLine(p1: { x: number, y: number }, p2: { x: number, y: number }, segments: number) {
    const points = [p1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    for (let i = 1; i < segments; i++) {
        const px = p1.x + (dx * i) / segments;
        const py = p1.y + (dy * i) / segments;

        // Add perpendicular offset for jaggedness (random offset between -3 and 3)
        const offset = (Math.random() - 0.5) * 6;
        const len = Math.sqrt(dx * dx + dy * dy);

        // Perpendicular vector normalized
        const nx = -dy / len;
        const ny = dx / len;

        points.push({
            x: px + nx * offset,
            y: py + ny * offset
        });
    }
    points.push(p2);
    return points;
}
