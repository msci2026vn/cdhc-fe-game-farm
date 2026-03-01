import React, { useRef, useEffect } from 'react';
import { BurstData } from '@/shared/match3/combat.types';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    life: number;
    maxLife: number;
    type: 'burst' | 'fire' | 'heal';
}

interface Props {
    bursts: BurstData[];
}

export function ParticleOverlay({ bursts }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationRef = useRef<number>();
    const seenBurstsRef = useRef<Set<number>>(new Set());

    // 1. Process incoming bursts
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);

        bursts.forEach(b => {
            if (!seenBurstsRef.current.has(b.id)) {
                seenBurstsRef.current.add(b.id);

                // Keep memory check (optional, but good for GC)
                if (seenBurstsRef.current.size > 200) {
                    const iterator = seenBurstsRef.current.values();
                    seenBurstsRef.current.delete(iterator.next().value);
                }

                const col = b.index % 8;
                const row = Math.floor(b.index / 8);

                // Calculate center in pixels based on canvas geometry.
                // The grid padding is minimal so cell centers map evenly.
                const cx = (col + 0.5) * (width / 8);
                const cy = (row + 0.5) * (height / 8);

                const particleCount = b.type === 'burst' ? 15 + Math.random() * 8 : b.type === 'fire' ? 12 : 8; // Fewer particles for fire/heal

                for (let i = 0; i < particleCount; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    let speed = 2 + Math.random() * 8;
                    let vx = Math.cos(angle) * speed;
                    let vy = Math.sin(angle) * speed;

                    // Custom fire/heal initialization
                    if (b.type === 'fire') {
                        vx = (Math.random() - 0.5) * 4;
                        vy = -(2 + Math.random() * 3); // upward
                    } else if (b.type === 'heal') {
                        vx = (Math.random() - 0.5) * 3;
                        vy = -(1 + Math.random() * 2); // upward slowly
                    }

                    particlesRef.current.push({
                        x: cx,
                        y: cy,
                        vx,
                        vy,
                        radius: b.type === 'burst' ? 2 + Math.random() * 4 : 3 + Math.random() * 5,
                        color: b.color,
                        life: 0,
                        maxLife: b.type === 'burst' ? 30 + Math.random() * 20 : 40 + Math.random() * 30,
                        type: b.type,
                    });
                }
            }
        });
    }, [bursts]);

    // 2. Setup Canvas and render loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize handler for Canvas sharpness
        const resize = () => {
            const rect = canvas.parentElement?.getBoundingClientRect();
            if (rect) {
                const dpr = window.devicePixelRatio || 1;
                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;
                ctx.scale(dpr, dpr);
                canvas.style.width = `${rect.width}px`;
                canvas.style.height = `${rect.height}px`;
            }
        };
        resize();
        window.addEventListener('resize', resize);

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const particles = particlesRef.current;
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.life++;

                if (p.life >= p.maxLife) {
                    particles.splice(i, 1);
                    continue;
                }

                // Physics update depends on type
                if (p.type === 'burst') {
                    p.vx *= 0.90; // high friction
                    p.vy *= 0.90; // high friction
                    p.vy += 0.45; // gravity pull down
                } else if (p.type === 'fire') {
                    p.vx *= 0.95; // some drift
                    p.vy += -0.05; // gravity pull UP
                } else if (p.type === 'heal') {
                    p.vx *= 0.97; // smooth drift
                    p.vy += -0.02; // slow rise
                }

                p.x += p.vx;
                p.y += p.vy;

                // Opacity decay
                const progress = p.life / p.maxLife;
                const opacity = Math.max(0, 1 - Math.pow(progress, 2.5));

                // Draw
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;

                // Slight glow effect built into fill with globalAlpha
                ctx.globalAlpha = opacity;
                ctx.fill();

                ctx.globalAlpha = 1.0;
            }

            animationRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resize);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none z-50 rounded-lg"
            style={{ width: '100%', height: '100%' }}
        />
    );
}
