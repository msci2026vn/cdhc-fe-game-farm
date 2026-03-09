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
                    className="absolute font-heading font-extrabold text-2xl animate-combat-float-up"
                    style={{
                        left: `${item.x}%`,
                        top: `${item.y}%`,
                        color: item.color,
                        textShadow: `0 2px 4px rgba(0,0,0,0.8), 0 0 10px ${item.color}`,
                    }}
                >
                    {item.text}
                </div>
            ))}
        </div>
    );
}
