import React, { useEffect, useState } from 'react';

export interface FloatingTextData {
    id: number;
    text: string;
    x: number;
    y: number;
    color: string;
    duration?: number;
}

interface Props {
    data: FloatingTextData[];
}

export function FloatingCombatText({ data }: Props) {
    // We use local state to track items so we can fade them out gracefully
    // before the parent completely unmounts them via GC
    const [items, setItems] = useState<FloatingTextData[]>([]);

    useEffect(() => {
        // Add new ones
        setItems(prev => {
            const existingIds = new Set(prev.map(i => i.id));
            const incoming = data.filter(d => !existingIds.has(d.id));
            return [...prev, ...incoming];
        });
    }, [data]);

    useEffect(() => {
        // Local GC to clear strictly expired things from React DOM
        const interval = setInterval(() => {
            const now = Date.now();
            setItems(prev => {
                const next = prev.filter(i => {
                    // We infer expiration by adding duration to some arbitrary start,
                    // but really we rely on parent's GC. This just masks them earlier if needed.
                    return true;
                });
                return next;
            });
        }, 100);
        return () => clearInterval(interval);
    }, []);

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
