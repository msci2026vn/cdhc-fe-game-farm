import React from 'react';

export interface FloatingTextData {
    id: number;
    text: string;
    x: number;
    y: number;
    color: string;
    expiresAt?: number;
}

interface Props {
    data: FloatingTextData[];
}

export function FloatingCombatText({ data }: Props) {
    return (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
            {data.map(item => (
                <div
                    key={item.id}
                    className="absolute font-heading font-extrabold text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                    style={{
                        left: `${item.x}%`,
                        top: `${item.y}%`,
                        color: item.color,
                        textShadow: `0 0 10px ${item.color}`,
                        animation: 'combat-float-up 1.2s cubic-bezier(0.2, 1, 0.3, 1) forwards'
                    }}
                >
                    {item.text}
                </div>
            ))}
        </div>
    );
}
