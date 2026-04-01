import React, { useMemo } from 'react';
import { BossHPBar, BattleTopBar, ComboDisplay, DamagePopupLayer, PlayerHPBar, ManaBar } from '@/modules/boss/components/hud';
import { BossStatsBadges, BossBuffsBadges } from './BossStatsDisplay';
import { BossSprite } from './BossSprite';
import { useTranslation } from 'react-i18next';

interface Props {
    boss: any;
    bossData: any;
    level: number;
    combatStats: any;
    onBack: () => void;
    elapsedSeconds: number;
    enrageLevel: number;
    pauseBattle: () => void;
    resumeBattle: () => void;
    zoneName?: string;
    archetype: string;
    archetypeIcon?: string;
    currentPhase: number;
    totalPhases: number;
    activeBossStats: any;
    activeBossBuffs: any;
    spriteSrc: string;
    spriteState: any;
    hasSprites: boolean;
    enrageMultiplier: number;
    skillWarning: boolean;
    egg: any;
    popups: any;
    combo: number;
    showCombo: boolean;
    comboInfo: any;
    activeDebuffs: any[];
    shieldMax: number;
    lastPlayerDamage: number;
    manaDodgeCost: number;
    manaUltCost: number;
}

const CampaignArenaTop = React.memo(function CampaignArenaTop({
    boss, bossData, level, combatStats, onBack, elapsedSeconds, enrageLevel,
    pauseBattle, resumeBattle, zoneName, archetype, archetypeIcon,
    currentPhase, totalPhases, activeBossStats, activeBossBuffs,
    spriteSrc, spriteState, hasSprites, enrageMultiplier, skillWarning,
    egg, popups, combo, showCombo, comboInfo,
    activeDebuffs = [], shieldMax, lastPlayerDamage, manaDodgeCost, manaUltCost
}: Props) {
    const { t } = useTranslation();
    // Memoize .some() calls — avoid O(n) scan on every render
    const shieldBuff = useMemo(() => activeBossBuffs.some((b: any) => b.type === 'shield'), [activeBossBuffs]);
    const reflectBuff = useMemo(() => activeBossBuffs.some((b: any) => b.type === 'reflect'), [activeBossBuffs]);
    const isBurning = useMemo(() => activeBossBuffs.some((b: { type: string }) => b.type === 'burn') || activeBossStats.burnActive, [activeBossBuffs, activeBossStats.burnActive]);
    const isPlayerBurning = useMemo(() => activeDebuffs.some(d => d.type === 'burn'), [activeDebuffs]);

    return (
        <div className="flex-[0_0_30%] pt-safe px-3 pb-0 flex flex-col relative overflow-hidden z-[5]">
            <div className="absolute inset-0" style={{
                background: 'radial-gradient(circle at 50% 60%, rgba(30,100,15,0.2) 0%, transparent 55%), radial-gradient(circle at 20% 20%, rgba(20,80,10,0.12) 0%, transparent 40%)'
            }} />

            {/* Top Center Frame for Boss Name */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center pointer-events-none w-full">
                <div className="relative flex items-center justify-center">
                    <img
                        src="/assets/battle/stage_name.png"
                        alt="Stage name"
                        className="w-[260px] max-w-none object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]"
                    />
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center pt-1.5">
                        <span
                            className="font-heading font-black uppercase tracking-widest leading-none"
                            style={{
                                fontSize: '20px',
                                color: '#FFE680',
                                textShadow: '-1.5px -1.5px 0 #3e2723, 1.5px -1.5px 0 #3e2723, -1.5px 1.5px 0 #3e2723, 1.5px 1.5px 0 #3e2723, 0px 3px 4px rgba(0,0,0,1)'
                            }}
                        >
                            {bossData.name}
                        </span>
                    </div>
                </div>
            </div>

            {/* Top bar */}
            <BattleTopBar
                turn={boss.turnCount}
                maxTurns={0}
                level={level}
                atk={combatStats.atk}
                def={combatStats.def}
                onRetreat={onBack}
                isCampaign={true}
                elapsedSeconds={elapsedSeconds}
                enrageLevel={enrageLevel}
                onPause={pauseBattle}
                onResume={resumeBattle}
            />

            {/* Player Stats Block (HP, Shield, Mana) -> Top Left */}
            <div className="absolute bottom-2 left-1 z-20 w-[140px] pointer-events-auto">
                <div className={`relative ${isPlayerBurning ? 'ring-1 ring-orange-500/50' : ''}`}>
                    <PlayerHPBar
                        hp={boss.playerHp}
                        maxHp={boss.playerMaxHp}
                        shield={boss.shield}
                        maxShield={shieldMax}
                        def={combatStats.def}
                        isHit={!!lastPlayerDamage}
                    />
                    {lastPlayerDamage > 0 && (
                        <div className="absolute top-1/2 right-[-40px] -translate-y-1/2 pointer-events-none z-30 animate-damage-float">
                            <span className="font-heading text-xl font-bold text-red-500"
                                style={{ textShadow: '0 0 8px rgba(231,76,60,0.6), 0 2px 4px rgba(0,0,0,0.5)' }}>
                                -{lastPlayerDamage}
                            </span>
                        </div>
                    )}
                </div>
                <ManaBar
                    mana={boss.mana}
                    maxMana={boss.maxMana}
                    dodgeCost={manaDodgeCost}
                    ultCost={manaUltCost}
                    ultCharge={boss.ultCharge ?? 0}
                />
            </div>

            {/* Boss sprite — absolute top-right */}
            <div className="absolute right-1 top-[150px] w-[20%] aspect-square z-10">
                <BossSprite
                    src={spriteSrc}
                    state={spriteState}
                    hasSprites={hasSprites}
                    emoji={bossData.emoji}
                    name={bossData.name}
                    enrageMultiplier={enrageMultiplier}
                    shieldBuff={shieldBuff}
                    reflectBuff={reflectBuff}
                    isBurning={isBurning}
                    skillWarning={!!skillWarning}
                    bossDead={boss.bossHp <= 0}
                />
            </div>

            {/* Boss HP bar — centered under frame */}
            <div className="w-[220px] mx-auto mt-[1px] relative z-50">
                <BossHPBar
                    name={bossData.name}
                    emoji={bossData.emoji}
                    hp={boss.bossHp}
                    maxHp={boss.bossMaxHp}
                    archetype={archetype}
                    archetypeIcon={archetypeIcon}
                    phase={currentPhase}
                    totalPhases={totalPhases}
                    healPerTurn={activeBossStats.healPercent}
                />

                {/* Boss stats badges */}
                <BossStatsBadges def={activeBossStats.def} freq={activeBossStats.freq} enrageLevel={enrageLevel} />

                {/* Boss buffs */}
                <BossBuffsBadges activeBossBuffs={activeBossBuffs} />
            </div>

            {/* Egg indicator */}
            {egg && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center animate-scale-in">
                    <span className={`text-4xl ${egg.countdown <= 3 ? 'opacity-100' : 'opacity-90'}`}>🥚</span>
                    <div className="w-12 h-1.5 rounded-full bg-gray-700 mt-1 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-300"
                            style={{
                                width: `${Math.round((egg.hp / egg.maxHp) * 100)}%`,
                                background: egg.hp / egg.maxHp > 0.5 ? '#27ae60' : egg.hp / egg.maxHp > 0.25 ? '#f39c12' : '#e74c3c',
                            }} />
                    </div>
                    <span className="text-[9px] font-bold text-white mt-0.5">{egg.hp}/{egg.maxHp}</span>
                    {egg.countdown <= 3 && (
                        <span className="text-[8px] font-bold text-red-400 animate-pulse">{t('campaign.ui.hatching_soon')}</span>
                    )}
                </div>
            )}

            <DamagePopupLayer popups={popups} />

            <ComboDisplay
                combo={combo}
                show={showCombo}
                label={comboInfo.label}
                mult={comboInfo.mult}
                color={comboInfo.color}
            />
        </div>
    );
});

export default CampaignArenaTop;
