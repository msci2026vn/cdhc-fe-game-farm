import React from 'react';
import { PlayerHPBar, ManaBar, SkillBar } from '@/modules/boss/components/hud';
import AutoPlayToggle from '@/shared/components/AutoPlayToggle';
import ExpiryBanner from '@/shared/components/ExpiryBanner';
import CampaignSkillButton from './CampaignSkillButton';

interface Props {
    activeDebuffs: any[];
    boss: any;
    shieldMax: number;
    combatStats: any;
    lastPlayerDamage: number;
    manaDodgeCost: number;
    manaUltCost: number;
    skillWarning: boolean;
    skillAlert: any;
    daysUntilExpiry: number | null;
    autoPlay: any;
    skillLevels: any;
    otHiemActive: boolean;
    otHiemCooldown: number;
    OT_HIEM_CONFIG: any;
    otHiemDuration: number;
    castOtHiem: () => void;
    romBocActive: boolean;
    romBocCooldown: number;
    ROM_BOC_CONFIG: any;
    romBocDuration: number;
    castRomBoc: () => void;
    handleDodge: () => void;
    fireUltimate: () => void;
}

export default function CampaignPlayerHUD({
    activeDebuffs, boss, shieldMax, combatStats, lastPlayerDamage,
    manaDodgeCost, manaUltCost, skillWarning, skillAlert, daysUntilExpiry,
    autoPlay, skillLevels, otHiemActive, otHiemCooldown, OT_HIEM_CONFIG,
    otHiemDuration, castOtHiem, romBocActive, romBocCooldown, ROM_BOC_CONFIG,
    romBocDuration, castRomBoc, handleDodge, fireUltimate
}: Props) {
    return (
        <>
            {/* Debuff bar */}
            {activeDebuffs.length > 0 && (
                <div className="flex gap-1.5 mb-1 flex-wrap">
                    {activeDebuffs.map((d, i) => (
                        <span key={`${d.type}-${i}`} className="text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse"
                            style={{
                                background: d.type === 'burn' ? 'rgba(231,76,60,0.3)' :
                                    d.type === 'heal_block' ? 'rgba(108,92,231,0.3)' :
                                        'rgba(253,121,168,0.3)',
                                color: d.type === 'burn' ? '#ff6b6b' :
                                    d.type === 'heal_block' ? '#a29bfe' :
                                        '#fd79a8',
                                border: `1px solid ${d.type === 'burn' ? 'rgba(231,76,60,0.4)' :
                                    d.type === 'heal_block' ? 'rgba(108,92,231,0.4)' :
                                        'rgba(253,121,168,0.4)'
                                    }`,
                            }}>
                            {d.icon} {d.label} {d.remainingSec}s
                        </span>
                    ))}
                </div>
            )}

            {/* Player damage popup near HP bar */}
            <div className={`relative ${activeDebuffs.some(d => d.type === 'burn') ? 'ring-1 ring-orange-500/50' : ''}`}
                style={activeDebuffs.some(d => d.type === 'burn') ? { boxShadow: '0 0 12px rgba(231,76,60,0.3), inset 0 0 8px rgba(231,76,60,0.15)' } : {}}>
                <PlayerHPBar
                    hp={boss.playerHp}
                    maxHp={boss.playerMaxHp}
                    shield={boss.shield}
                    maxShield={shieldMax}
                    def={combatStats.def}
                    isHit={!!lastPlayerDamage}
                />
                {lastPlayerDamage > 0 && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 pointer-events-none z-30 animate-damage-float">
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
            />

            {/* Skill warning inline text */}
            {skillWarning && (
                <div className="text-center py-1 pointer-events-none animate-pulse">
                    <span className="bg-red-900/80 text-red-300 px-4 py-1 rounded-full text-sm font-bold">
                        ⚡ Đòn mạnh đang đến!
                    </span>
                </div>
            )}

            {/* Boss skill alert banner */}
            {skillAlert && (
                <div className="text-center py-1 animate-fade-in">
                    <span className="px-4 py-1.5 rounded-full text-xs font-bold text-purple-200"
                        style={{ background: 'rgba(108,92,231,0.85)', boxShadow: '0 0 15px rgba(108,92,231,0.3)' }}>
                        {skillAlert.icon} {skillAlert.text}
                    </span>
                </div>
            )}

            {/* Auto-play toggle + expiry warning */}
            {daysUntilExpiry !== null && daysUntilExpiry <= 2 && (
                <ExpiryBanner daysLeft={daysUntilExpiry} />
            )}

            <div className="flex-1" />

            {/* Player skill buttons row — Ớt | Rơm | [NÉ + ULT] | AutoAI */}
            <div className="flex items-center gap-1 mt-0.5 pt-2">
                <CampaignSkillButton
                    skillId="ot_hiem"
                    emoji="🌶️"
                    label="Ớt"
                    level={skillLevels.ot_hiem}
                    isActive={otHiemActive}
                    cooldownRemaining={otHiemCooldown}
                    cooldownTotal={OT_HIEM_CONFIG.cooldown}
                    durationRemaining={otHiemDuration}
                    onCast={castOtHiem}
                />
                <CampaignSkillButton
                    skillId="rom_boc"
                    emoji="🪹"
                    label="Rơm"
                    level={skillLevels.rom_boc}
                    isActive={romBocActive}
                    cooldownRemaining={romBocCooldown}
                    cooldownTotal={ROM_BOC_CONFIG.cooldown}
                    durationRemaining={romBocDuration}
                    onCast={castRomBoc}
                />
                <div className="flex-1">
                    <SkillBar
                        mana={boss.mana}
                        maxMana={boss.maxMana}
                        dodgeCost={manaDodgeCost}
                        ultCost={manaUltCost}
                        ultCharge={boss.ultCharge}
                        ultCooldown={boss.ultCooldown}
                        isDodgeWindow={!!skillWarning}
                        onDodge={handleDodge}
                        onUlt={fireUltimate}
                    />
                </div>
                {/* Auto AI — inline in skill row */}
                <AutoPlayToggle
                    isActive={autoPlay.isActive}
                    onToggle={autoPlay.toggle}
                    vipLevel={autoPlay.vipLevel}
                    dodgeFreeRemaining={autoPlay.dodgeFreeRemaining}
                    currentSituation={autoPlay.currentSituation}
                    compact
                />
            </div>
        </>
    );
}
