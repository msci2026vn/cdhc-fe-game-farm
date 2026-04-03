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
    junk: { background: `${HIGHLIGHT.replace('0.58', '0.40')}, linear-gradient(160deg, #6b7280 0%, #4b5563 45%, #374151 100%)` },
};

const GEM_ICONS: Record<string, string> = {
    atk: 'sword',
    def: 'shield',
    hp: 'heart',
    star: 'star'
};

// Pre-computed grid styles to avoid creating new objects every render
const GRID_STYLES = {
    normal: { background: 'transparent', border: '1px solid rgba(120,80,30,0.3)', touchAction: 'none' as const, borderRadius: 8, padding: 1, flex: 1 },
    otHiem: { background: 'rgba(231,76,60,0.15)', border: '2px solid rgba(231,76,60,0.5)', touchAction: 'none' as const, borderRadius: 8, padding: 1, flex: 1 },
    romBoc: { background: 'rgba(39,174,96,0.15)', border: '2px solid rgba(39,174,96,0.5)', touchAction: 'none' as const, borderRadius: 8, padding: 1, flex: 1 },
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
    landedGems?: Set<number>;
    showDimensionShatter?: boolean;
}

const CampaignMatch3Board = React.memo(function CampaignMatch3Board({
    grid, selected, matchedCells, spawningGems, lockedGems, highlightedGem,
    isStunned, animating, handlePointerDown, handlePointerMove, handlePointerUp,
    combo, showCombo, otHiemActive, romBocActive, GEM_META,
    blastVfxs = [], hintedGems = [], particleBursts = [], floatingTexts = [], chainLightnings = [],
    landedGems = new Set(),
    showDimensionShatter = false,
}: Props) {
    // Convert hintedGems array to Set for O(1) lookup instead of O(n) includes() on every gem
    const hintedSet = React.useMemo(() => new Set(hintedGems), [hintedGems]);
    const { t } = useTranslation();

    return (
        <div className="relative flex-1 flex items-center justify-center px-0 py-1 w-full max-w-full">
            <ChainLightningContainer strikes={chainLightnings} />
            <ParticleOverlay bursts={particleBursts} />
            <FloatingCombatText data={floatingTexts} />
            {showDimensionShatter && <div className="vfx-dimension-shatter-container" />}

            {/* ── Wooden frame wrapper (matching HTML mockup .grid-frame) ── */}
            <div className="campaign-grid-frame relative w-full flex flex-col" style={{ paddingTop: 45, paddingBottom: 25, paddingLeft: 28, paddingRight: 26 }}>
                {/* Background board layer: hides behind the wood frame edge but covers the padded gap */}
                <div
                    className="absolute z-0 pointer-events-none"
                    style={{
                        top: 32, bottom: 14, left: 16, right: 14,
                        backgroundImage: "url('/assets/battle/background_frame_gem_board.png')",
                        backgroundSize: '100% 100%'
                    }}
                />

                {showCombo && combo >= 3 && (
                    <div key={`flash-${combo}`} className={`combo-flash-overlay z-20 combo-flash-${combo >= 20 ? 6 : combo >= 8 ? 5 : combo >= 5 ? 4 : combo >= 3 ? 3 : 2}`} />
                )}
                <div className={`grid grid-cols-8 grid-rows-8 gap-[1px] w-full aspect-square rounded-lg relative z-10 ${isStunned ? 'pointer-events-none' : ''} ${combo >= 5 && showCombo ? 'grid-combo-shake' : ''}`}
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
                                style={
                                    (GEM_ICONS[gem.type] || sp === 'rainbow')
                                        ? { background: '#253520', border: '1px solid #3a5030', boxShadow: 'inset 0px 2px 4px rgba(255,255,255,0.15), 0 3px 5px rgba(0,0,0,0.6)' }
                                        : (GEM_STYLES[gem.type] ?? GEM_STYLES.atk)
                                }
                                className={`aspect-square rounded-[14px] flex items-center justify-center text-[22px] cursor-pointer relative
                ${spawningGems.has(gem.id) ? 'gem-special-spawn' : ''}
                ${landedGems.has(gem.id) ? 'gem-landed' : ''}
                ${gem.isTransforming ? 'gem-transforming' : ''}
                ${isSelected ? 'ring-2 ring-white scale-110 z-10' : 'active:scale-[0.88]'}
                ${isMatched ? `animate-gem-pop gem-${gem.type}` : ''}
                ${animating && !isMatched ? 'pointer-events-none' : ''}
                ${lockedGems.has(i) ? 'opacity-50 ring-1 ring-gray-500' : ''}
                ${highlightedGem === i ? 'ring-2 ring-yellow-400 z-10' : ''}
                ${isHinted && !animating ? 'animate-gem-hint z-20' : ''}
              `}>
                                {sp === 'rainbow' ? (
                                    <img
                                        src={`/assets/battle/icon_special.png`}
                                        alt="rainbow"
                                        className={`w-[75%] h-[75%] object-contain pointer-events-none drop-shadow-lg gem-special-pulse`}
                                        draggable={false}
                                    />
                                ) : (
                                    GEM_ICONS[gem.type] ? (
                                        <img
                                            src={`/assets/battle/icon_${GEM_ICONS[gem.type]}${sp === 'bomb' ? '_1' : sp === 'striped_h' ? '_2' : sp === 'striped_v' ? '_3' : ''}.png`}
                                            alt={gem.type}
                                            className={`w-[75%] h-[75%] object-contain pointer-events-none drop-shadow-lg ${sp === 'bomb' || sp === 'striped_h' || sp === 'striped_v' ? 'gem-special-pulse' : ''}`}
                                            draggable={false}
                                        />
                                    ) : (
                                        meta.emoji
                                    )
                                )}
                                {lockedGems.has(i) && (
                                    <span className="absolute inset-0 flex items-center justify-center text-[8px] pointer-events-none">🔒</span>
                                )}
                            </div>
                        );
                    })}

                    {/* Candy Blast VFX Overlay */}
                    {blastVfxs.map(vfx => {
                        if (vfx.type === 'row') {
                            return <div key={`blast-${vfx.id}`} className="blast-row" style={{ top: `calc(${vfx.index * 12.5}% + 6.25%)` }} />;
                        } else if (vfx.type === 'row-wide') {
                            return <div key={`blast-${vfx.id}`} className="blast-row-wide" style={{ top: `calc(${vfx.index * 12.5}% + 6.25%)` }} />;
                        } else if (vfx.type === 'col-wide') {
                            return <div key={`blast-${vfx.id}`} className="blast-col-wide" style={{ left: `calc(${vfx.index * 12.5}% + 6.25%)` }} />;
                        } else if (vfx.type === 'bomb' || vfx.type === 'bomb-mega') {
                            const col = vfx.index % 8;
                            const row = Math.floor(vfx.index / 8);
                            const cx = `${(col + 0.5) * 12.5}%`;
                            const cy = `${(row + 0.5) * 12.5}%`;
                            return <div key={`blast-${vfx.id}`} className={vfx.type === 'bomb-mega' ? 'blast-bomb-mega' : 'blast-bomb'} style={{ left: cx, top: cy }} />;
                        } else {
                            return <div key={`blast-${vfx.id}`} className="blast-col" style={{ left: `calc(${vfx.index * 12.5}% + 6.25%)` }} />;
                        }
                    })}
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
