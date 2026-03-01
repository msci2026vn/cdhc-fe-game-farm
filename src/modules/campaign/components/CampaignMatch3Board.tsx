import React from 'react';
import { motion } from 'framer-motion';

import { BlastVfx, BurstData } from '@/shared/match3/combat.types';
import { ParticleOverlay } from './ParticleOverlay';

interface Props {
    grid: any[];
    selected: number | null;
    matchedCells: Set<number>;
    spawningGems: Set<number>;
    lockedGems: Set<number>;
    highlightedGem: number | null;
    isStunned: boolean;
    animating: boolean;
    handlePointerDown: (index: number, e: any) => void;
    handlePointerMove: (e: any) => void;
    handlePointerUp: (e?: any) => void;
    combo: number;
    showCombo: boolean;
    otHiemActive: boolean;
    romBocActive: boolean;
    GEM_META: any;
    blastVfxs?: BlastVfx[];
    hintedGems?: number[];
    particleBursts?: BurstData[];
}

export default function CampaignMatch3Board({
    grid, selected, matchedCells, spawningGems, lockedGems, highlightedGem,
    isStunned, animating, handlePointerDown, handlePointerMove, handlePointerUp,
    combo, showCombo, otHiemActive, romBocActive, GEM_META, blastVfxs = [], hintedGems = [], particleBursts = []
}: Props) {
    return (
        <div className="relative flex-1">
            <ParticleOverlay bursts={particleBursts} />
            {showCombo && combo >= 3 && (
                <div key={`flash-${combo}`} className={`combo-flash-overlay combo-flash-${combo >= 20 ? 6 : combo >= 8 ? 5 : combo >= 5 ? 4 : combo >= 3 ? 3 : 2}`} />
            )}
            <div className={`grid grid-cols-8 gap-0.5 p-1 rounded-lg h-full ${isStunned ? 'pointer-events-none' : ''} ${combo >= 5 && showCombo ? 'grid-combo-shake' : ''} transition-all duration-300`}
                onPointerMove={handlePointerMove}
                style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: otHiemActive
                        ? '2px solid rgba(231,76,60,0.6)'
                        : romBocActive
                            ? '2px solid rgba(39,174,96,0.6)'
                            : '1px solid rgba(255,255,255,0.06)',
                    boxShadow: otHiemActive
                        ? '0 0 20px rgba(231,76,60,0.3), inset 0 0 10px rgba(231,76,60,0.1)'
                        : romBocActive
                            ? '0 0 20px rgba(39,174,96,0.3), inset 0 0 10px rgba(39,174,96,0.1)'
                            : 'none',
                    touchAction: 'none',
                }}>
                {grid.map((gem, i) => {
                    const meta = GEM_META[gem.type];
                    const isSelected = selected === i;
                    const isMatched = matchedCells.has(i);
                    const isHinted = hintedGems.includes(i);
                    const sp = gem.special;
                    return (
                        <motion.div key={gem.id}
                            layoutId={String(gem.id)}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            onPointerDown={(e: any) => handlePointerDown(i, e)}
                            onPointerUp={handlePointerUp}
                            className={`aspect-square rounded-md flex items-center justify-center text-[16px] cursor-pointer relative gem-shine transition-colors duration-200
                ${sp === 'rainbow' ? 'gem-rainbow' : meta.css}
                ${sp === 'striped_h' ? 'gem-special-striped-h' : ''}
                ${sp === 'striped_v' ? 'gem-special-striped-v' : ''}
                ${sp === 'bomb' ? 'gem-special-bomb' : ''}
                ${sp === 'rainbow' ? 'gem-special-rainbow' : ''}
                ${spawningGems.has(gem.id) ? 'gem-special-spawn' : ''}
                ${isSelected ? 'ring-2 ring-white scale-110 z-10' : 'active:scale-[0.88]'}
                ${isMatched ? 'animate-gem-pop gem-match-burst' : ''}
                ${animating && !isMatched ? 'pointer-events-none' : ''}
                ${lockedGems.has(i) ? 'opacity-50 ring-1 ring-gray-500' : ''}
                ${highlightedGem === i ? 'ring-2 ring-yellow-400 animate-pulse z-10' : ''}
                ${isHinted && !animating ? 'animate-gem-hint z-20 shadow-lg glow-pulse-intense ring-2 ring-white ring-opacity-50' : ''}
              `}>
                            {sp === 'rainbow' ? '🌈' : meta.emoji}
                            {lockedGems.has(i) && (
                                <span className="absolute inset-0 flex items-center justify-center text-[8px] pointer-events-none">🔒</span>
                            )}
                        </motion.div>
                    );
                })}

                {/* Candy Blast VFX Overlay */}
                {blastVfxs.map(vfx => (
                    vfx.type === 'row' ? (
                        <div key={`blast-${vfx.id}`} className="blast-row" style={{ top: `calc(${vfx.index * 12.5}% + 6.25%)` }} />
                    ) : (
                        <div key={`blast-${vfx.id}`} className="blast-col" style={{ left: `calc(${vfx.index * 12.5}% + 6.25%)` }} />
                    )
                ))}
            </div>

            {/* Stun overlay */}
            {isStunned && (
                <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}>
                    <div className="text-center animate-scale-in">
                        <span className="text-5xl block" style={{ animation: 'spin 1s linear infinite' }}>💫</span>
                        <span className="text-white font-heading font-bold text-xl block mt-2"
                            style={{ textShadow: '0 0 20px rgba(253,203,110,0.8)' }}>
                            CHOÁNG!
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
