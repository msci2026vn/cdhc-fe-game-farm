import React from 'react';

import { BlastVfx, BurstData } from '@/shared/match3/combat.types';
import { ParticleOverlay } from './ParticleOverlay';
import { FloatingCombatText, FloatingTextData } from './FloatingCombatText';
import { ChainLightningContainer } from './ChainLightningContainer';
import { ChainLightningData } from '@/shared/match3/combat.types';
import { useTranslation } from 'react-i18next';

// ═══ Candy glass gem colors — oval white highlight at top + deep color base ═══
// 2 static bg layers: painted once, no GPU repaint. Must match .gem-* CSS classes.
// ⚔️ atk = đỏ   💚 hp = xanh lá   🛡️ def = xanh biển   ⭐ star = vàng
const HIGHLIGHT = 'radial-gradient(ellipse 68% 44% at 50% 13%, rgba(255,255,255,0.58) 0%, rgba(255,255,255,0) 100%)';
const GEM_STYLES: Record<string, React.CSSProperties> = {
    atk: { background: `${HIGHLIGHT}, linear-gradient(160deg, #ff5566 0%, #ee2233 45%, #aa0011 100%)` },
    hp: { background: `${HIGHLIGHT.replace('0.58', '0.55')}, linear-gradient(160deg, #44ee77 0%, #22bb44 45%, #0d7722 100%)` },
    def: { background: `${HIGHLIGHT.replace('0.58', '0.55')}, linear-gradient(160deg, #5588ff 0%, #2255ee 45%, #0d33aa 100%)` },
    star: { background: `${HIGHLIGHT.replace('0.58', '0.62')}, linear-gradient(160deg, #ffee33 0%, #ffbb00 45%, #aa7700 100%)` },
};

// Pre-computed grid styles to avoid creating new objects every render
const GRID_STYLES = {
    normal: { background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(120,80,30,0.3)', touchAction: 'none' as const, borderRadius: 8, padding: 1, flex: 1 },
    otHiem: { background: 'rgba(231,76,60,0.08)', border: '2px solid rgba(231,76,60,0.5)', touchAction: 'none' as const, borderRadius: 8, padding: 1, flex: 1 },
    romBoc: { background: 'rgba(39,174,96,0.08)', border: '2px solid rgba(39,174,96,0.5)', touchAction: 'none' as const, borderRadius: 8, padding: 1, flex: 1 },
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

const CampaignMatch3Board = React.memo(function CampaignMatch3Board({
    grid, selected, matchedCells, spawningGems, lockedGems, highlightedGem,
    isStunned, animating, handlePointerDown, handlePointerMove, handlePointerUp,
    combo, showCombo, otHiemActive, romBocActive, GEM_META,
    blastVfxs = [], hintedGems = [], particleBursts = [], floatingTexts = [], chainLightnings = []
}: Props) {
    // Convert hintedGems array to Set for O(1) lookup instead of O(n) includes() on every gem
    const hintedSet = React.useMemo(() => new Set(hintedGems), [hintedGems]);
    const { t } = useTranslation();

    return (
        <div className="relative flex-1 flex items-start justify-center">
            <ChainLightningContainer strikes={chainLightnings} />
            <ParticleOverlay bursts={particleBursts} />
            <FloatingCombatText data={floatingTexts} />

            {/* ── Wooden frame wrapper (matching HTML mockup .grid-frame) ── */}
            <div className="campaign-grid-frame relative w-full h-full flex flex-col" style={{ padding: 2 }}>
                {showCombo && combo >= 3 && (
                    <div key={`flash-${combo}`} className={`combo-flash-overlay combo-flash-${combo >= 20 ? 6 : combo >= 8 ? 5 : combo >= 5 ? 4 : combo >= 3 ? 3 : 2}`} />
                )}
                <div className={`grid grid-cols-8 gap-[1px] rounded-lg h-full ${isStunned ? 'pointer-events-none' : ''} ${combo >= 5 && showCombo ? 'grid-combo-shake' : ''}`}
                    onPointerMove={handlePointerMove}
                    style={otHiemActive ? GRID_STYLES.otHiem : romBocActive ? GRID_STYLES.romBoc : GRID_STYLES.normal}>
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
                                className={`aspect-square rounded-xl flex items-center justify-center text-[22px] cursor-pointer relative
                ${sp === 'rainbow' ? 'gem-rainbow' : ''}
                ${sp === 'striped_h' ? 'gem-special-striped-h' : ''}
                ${sp === 'striped_v' ? 'gem-special-striped-v' : ''}
                ${sp === 'bomb' ? 'gem-special-bomb' : ''}
                ${sp === 'rainbow' ? 'gem-special-rainbow' : ''}
                ${spawningGems.has(gem.id) ? 'gem-special-spawn' : ''}
                ${isSelected ? 'ring-2 ring-white scale-110 z-10' : 'active:scale-[0.88]'}
                ${isMatched ? `animate-gem-pop gem-${gem.type}` : ''}
                ${animating && !isMatched ? 'pointer-events-none' : ''}
                ${lockedGems.has(i) ? 'opacity-50 ring-1 ring-gray-500' : ''}
                ${highlightedGem === i ? 'ring-2 ring-yellow-400 z-10' : ''}
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
                            <span className="text-5xl block">💫</span>
                            <span className="text-white font-heading font-bold text-xl block mt-2"
                                style={{ textShadow: '0 0 20px rgba(253,203,110,0.8)' }}>
                                {t('campaign.combat.stunned')}
                            </span>
                        </div>
                    </div>
                )}
            </div>{/* end wooden frame */}
        </div>
    );
});

export default CampaignMatch3Board;
