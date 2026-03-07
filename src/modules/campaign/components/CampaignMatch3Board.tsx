import React from 'react';

import { BlastVfx, BurstData } from '@/shared/match3/combat.types';
import { ParticleOverlay } from './ParticleOverlay';
import { FloatingCombatText, FloatingTextData } from './FloatingCombatText';
import { ChainLightningContainer } from './ChainLightningContainer';
import { ChainLightningData } from '@/shared/match3/combat.types';

// Fix: Tailwind JIT purge-safe gem colors — inline styles bypass dynamic class scanning
// ⚔️ atk  = đỏ (red)   💛 star = vàng (gold)   🛡️ def = xanh nước biển   💚 hp = xanh lá
const GEM_STYLES: Record<string, React.CSSProperties> = {
    atk: {
        background: 'linear-gradient(145deg, #ff3b2f 0%, #c0150a 100%)',
        boxShadow: '0 2px 6px rgba(220, 38, 38, 0.4)',
    },
    hp: {
        background: 'linear-gradient(145deg, #22c55e 0%, #15803d 100%)',
        boxShadow: '0 2px 6px rgba(34, 197, 94, 0.4)',
    },
    def: {
        background: 'linear-gradient(145deg, #38bdf8 0%, #1d4ed8 100%)',
        boxShadow: '0 2px 6px rgba(59, 130, 246, 0.4)',
    },
    star: {
        background: 'linear-gradient(145deg, #fde047 0%, #ca8a04 100%)',
        boxShadow: '0 2px 6px rgba(234, 179, 8, 0.4)',
    },
};

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
    floatingTexts?: FloatingTextData[];
    chainLightnings?: ChainLightningData[];
}

export default function CampaignMatch3Board({
    grid, selected, matchedCells, spawningGems, lockedGems, highlightedGem,
    isStunned, animating, handlePointerDown, handlePointerMove, handlePointerUp,
    combo, showCombo, otHiemActive, romBocActive, GEM_META,
    blastVfxs = [], hintedGems = [], particleBursts = [], floatingTexts = [], chainLightnings = []
}: Props) {
    // Convert hintedGems array to Set for O(1) lookup instead of O(n) includes() on every gem
    const hintedSet = React.useMemo(() => new Set(hintedGems), [hintedGems]);

    return (
        <div className="relative flex-1 flex items-start justify-center">
            <ChainLightningContainer strikes={chainLightnings} />
            <ParticleOverlay bursts={particleBursts} />
            <FloatingCombatText data={floatingTexts} />

            {/* ── Wooden frame wrapper (matching HTML mockup .grid-frame) ── */}
            <div className="campaign-grid-frame relative w-full h-full flex flex-col" style={{
                background: 'linear-gradient(180deg, #2a1500 0%, #0d0804 100%)',
                border: '4px solid #a06018',
                borderRadius: 14,
                padding: 5,
                boxShadow: '0 0 0 2px #3d1f08, 0 8px 28px rgba(0,0,0,0.7)',
            }}>
                {showCombo && combo >= 3 && (
                    <div key={`flash-${combo}`} className={`combo-flash-overlay combo-flash-${combo >= 20 ? 6 : combo >= 8 ? 5 : combo >= 5 ? 4 : combo >= 3 ? 3 : 2}`} />
                )}
                <div className={`grid grid-cols-8 gap-[3px] rounded-lg h-full ${isStunned ? 'pointer-events-none' : ''} ${combo >= 5 && showCombo ? 'grid-combo-shake' : ''}`}
                    onPointerMove={handlePointerMove}
                    style={{
                        background: otHiemActive
                            ? 'rgba(231,76,60,0.08)'
                            : romBocActive
                                ? 'rgba(39,174,96,0.08)'
                                : 'rgba(0,0,0,0.25)',
                        border: otHiemActive
                            ? '2px solid rgba(231,76,60,0.5)'
                            : romBocActive
                                ? '2px solid rgba(39,174,96,0.5)'
                                : '1px solid rgba(120,80,30,0.4)',
                        touchAction: 'none',
                        borderRadius: 10,
                        padding: 3,
                        flex: 1,
                    }}>
                    {grid.map((gem, i) => {
                        const meta = GEM_META[gem.type];
                        const isSelected = selected === i;
                        const isMatched = matchedCells.has(i);
                        const isHinted = hintedSet.has(i);
                        const sp = gem.special;
                        return (
                            <div key={gem.id}
                                onPointerDown={(e: any) => handlePointerDown(i, e)}
                                onPointerUp={handlePointerUp}
                                style={sp !== 'rainbow' ? GEM_STYLES[gem.type] ?? GEM_STYLES.atk : undefined}
                                className={`aspect-square rounded-md flex items-center justify-center text-[16px] cursor-pointer relative gem-shine
                ${sp === 'rainbow' ? 'gem-rainbow' : ''}
                ${sp === 'striped_h' ? 'gem-special-striped-h' : ''}
                ${sp === 'striped_v' ? 'gem-special-striped-v' : ''}
                ${sp === 'bomb' ? 'gem-special-bomb' : ''}
                ${sp === 'rainbow' ? 'gem-special-rainbow' : ''}
                ${spawningGems.has(gem.id) ? 'gem-special-spawn' : ''}
                ${isSelected ? 'ring-2 ring-white scale-110 z-10' : 'active:scale-[0.88]'}
                ${isMatched ? `animate-gem-pop gem-match-burst gem-${gem.type}` : ''}
                ${animating && !isMatched ? 'pointer-events-none' : ''}
                ${lockedGems.has(i) ? 'opacity-50 ring-1 ring-gray-500' : ''}
                ${highlightedGem === i ? 'ring-2 ring-yellow-400 animate-pulse z-10' : ''}
                ${isHinted && !animating ? 'animate-gem-hint z-20' : ''}
              `}>
                                {sp === 'rainbow' ? '🌈' : meta.emoji}
                                {lockedGems.has(i) && (
                                    <span className="absolute inset-0 flex items-center justify-center text-[8px] pointer-events-none">🔒</span>
                                )}
                            </div>
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
                        style={{ background: 'rgba(0,0,0,0.6)' }}>
                        <div className="text-center animate-scale-in">
                            <span className="text-5xl block" style={{ animation: 'spin 1s linear infinite' }}>💫</span>
                            <span className="text-white font-heading font-bold text-xl block mt-2"
                                style={{ textShadow: '0 0 20px rgba(253,203,110,0.8)' }}>
                                CHOÁNG!
                            </span>
                        </div>
                    </div>
                )}
            </div>{/* end wooden frame */}
        </div>
    );
}
