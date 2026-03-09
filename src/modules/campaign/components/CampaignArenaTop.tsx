import React, { useMemo } from 'react';
import { BossHPBar, BattleTopBar, ComboDisplay, DamagePopupLayer } from '@/modules/boss/components/hud';
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
}

const CampaignArenaTop = React.memo(function CampaignArenaTop({
    boss, bossData, level, combatStats, onBack, elapsedSeconds, enrageLevel,
    pauseBattle, resumeBattle, zoneName, archetype, archetypeIcon,
    currentPhase, totalPhases, activeBossStats, activeBossBuffs,
    spriteSrc, spriteState, hasSprites, enrageMultiplier, skillWarning,
    egg, popups, combo, showCombo, comboInfo
}: Props) {
    const { t } = useTranslation();
    // Memoize .some() calls — avoid O(n) scan on every render
    const shieldBuff = useMemo(() => activeBossBuffs.some((b: any) => b.type === 'shield'), [activeBossBuffs]);
    const reflectBuff = useMemo(() => activeBossBuffs.some((b: any) => b.type === 'reflect'), [activeBossBuffs]);
    const isBurning = useMemo(() => activeBossBuffs.some((b: { type: string }) => b.type === 'burn') || activeBossStats.burnActive, [activeBossBuffs, activeBossStats.burnActive]);

    return (
        <div className="flex-[0_0_30%] pt-safe px-3 pb-0 flex flex-col relative overflow-hidden z-[5]">
            <div className="absolute inset-0" style={{
                background: 'radial-gradient(circle at 50% 60%, rgba(30,100,15,0.2) 0%, transparent 55%), radial-gradient(circle at 20% 20%, rgba(20,80,10,0.12) 0%, transparent 40%)'
            }} />

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

            {/* Zone label */}
            {zoneName && (
                <div className="z-10 mb-1">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded"
                        style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                        📍 {zoneName}
                    </span>
                </div>
            )}

            {/* Boss HP bar */}
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

            {/* Boss sprite + damage popups + combo */}
            <div className="flex-1 flex items-center justify-center relative z-10">
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

                {/* Egg */}
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
        </div>
    );
});

export default CampaignArenaTop;
