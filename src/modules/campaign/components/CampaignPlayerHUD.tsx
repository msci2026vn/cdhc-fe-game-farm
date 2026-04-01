import React, { memo } from 'react';
import { PlayerHPBar, ManaBar } from '@/modules/boss/components/hud';
import ExpiryBanner from '@/shared/components/ExpiryBanner';
import AutoPlayToggle from '@/shared/components/AutoPlayToggle';
import { playSound } from '@/shared/audio';
import { useTranslation } from 'react-i18next';

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

// ── Circular skill button matching the mockup wood style ──
export interface CircleSkillBtnProps {
    icon?: string;
    imageSrc?: string;
    label: string;
    sublabel?: string;
    className?: string;
    variant?: 'green' | 'red' | 'blue' | 'ult' | 'run';
    isActive?: boolean;
    onCooldown?: boolean;
    cooldownSec?: number;
    cooldownPct?: number;     // 0-100
    ultChargePct?: number;    // 0-100 for ULT arc
    isReady?: boolean;
    isLocked?: boolean;
    isDodgeWindow?: boolean;
    onClick: () => void;
    size?: 'sm' | 'md' | 'lg';
}

export const CircleSkillBtn = memo(function CircleSkillBtn({
    icon, imageSrc, label, sublabel,
    className,
    variant = 'green',
    isActive = false,
    onCooldown = false,
    cooldownSec = 0,
    cooldownPct = 0,
    ultChargePct,
    isReady = true,
    isLocked = false,
    isDodgeWindow = false,
    onClick,
    size = 'md',
}: CircleSkillBtnProps) {
    const dim = size === 'lg' ? 72 : size === 'sm' ? 54 : 62;

    const gradients: Record<string, string> = {
        run: 'radial-gradient(circle at 38% 32%, #4fb830, #2c6e0c)',
        green: 'radial-gradient(circle at 38% 32%, #4fb830, #2c6e0c)',
        red: 'radial-gradient(circle at 38% 32%, #e74c3c, #a11a0c)',
        blue: 'radial-gradient(circle at 38% 32%, #0984e3, #054d94)',
        ult: 'radial-gradient(circle at 38% 32%, #9955ff, #3a18cc)',
    };

    const borders: Record<string, string> = {
        run: '#80cc30',
        green: '#80cc30',
        red: '#e86a5a',
        blue: '#5ba8f5',
        ult: '#aa77ff',
    };

    const glows: Record<string, string> = {
        run: 'rgba(100,200,50,0.65)',
        green: 'rgba(100,200,50,0.65)',
        red: 'rgba(231,76,60,0.65)',
        blue: 'rgba(9,132,227,0.65)',
        ult: 'rgba(160,80,255,0.65)',
    };

    const isUlt = variant === 'ult';
    const ultReady = isUlt && (ultChargePct ?? 0) >= 100;
    const canClick = !isLocked && !onCooldown && (isReady || isDodgeWindow);

    const borderColor = isLocked
        ? '#555'
        : isDodgeWindow && !onCooldown
            ? '#ff6b6b'
            : isActive
                ? borders[variant]
                : borders[variant];

    const bgStyle = isLocked
        ? 'rgba(40,40,40,0.6)'
        : isActive || (isReady && !onCooldown) || isDodgeWindow
            ? gradients[variant]
            : 'rgba(30,30,30,0.6)';

    const shadowStyle = isLocked
        ? 'none'
        : isDodgeWindow && !onCooldown
            ? '0 0 28px rgba(231,76,60,0.9), 0 5px 14px rgba(0,0,0,0.6)'
            : isActive
                ? `0 0 24px ${glows[variant]}, 0 5px 14px rgba(0,0,0,0.6)`
                : isReady && !onCooldown
                    ? `0 0 12px ${glows[variant]}55, 0 5px 14px rgba(0,0,0,0.5)`
                    : '0 3px 8px rgba(0,0,0,0.5)';

    return (
        <div className={`flex flex-col items-center gap-1.5 cursor-pointer ${className ?? ''}`} onClick={() => { if (canClick) { playSound('ui_click'); onClick(); } }}>
            <div
                className={`relative flex items-center justify-center active:scale-95 ${isDodgeWindow && !onCooldown ? 'campaign-skill-btn-dodge-active' : ''}`}
                style={{
                    width: dim,
                    height: dim,
                    borderRadius: '50%',
                    border: (imageSrc && !isDodgeWindow) ? 'none' : `3px solid ${borderColor}`,
                    background: imageSrc ? 'transparent' : bgStyle,
                    boxShadow: imageSrc && !isDodgeWindow ? 'none' : shadowStyle,
                    opacity: isLocked ? 0.5 : onCooldown && !isActive ? 0.65 : 1,
                }}
            >
                {/* Image Icon */}
                {imageSrc ? (
                    <img src={imageSrc} alt={label} className="w-full h-full object-contain relative z-10"
                        style={{ filter: isLocked ? 'grayscale(1) brightness(0.6)' : (onCooldown && !isActive) ? 'brightness(0.7)' : 'none' }} />
                ) : (
                    <span className="text-2xl relative z-10 select-none">
                        {icon}
                    </span>
                )}

                {/* ULT charge indicator — simple border opacity instead of conic-gradient */}
                {isUlt && (ultChargePct ?? 0) < 100 && (ultChargePct ?? 0) > 0 && (
                    <div className="absolute inset-[-4px] rounded-full pointer-events-none"
                        style={{ border: '3px solid rgba(180,120,255,0.5)', opacity: (ultChargePct ?? 0) / 100 }} />
                )}

                {/* Cooldown overlay */}
                {onCooldown && (
                    <div className="absolute inset-0 rounded-full flex items-center justify-center z-20"
                        style={{ background: 'rgba(0,0,0,0.68)', borderRadius: '50%' }}>
                        <span className="text-white font-bold text-sm">{cooldownSec}s</span>
                    </div>
                )}

                {/* Locked */}
                {isLocked && !imageSrc && (
                    <div className="absolute inset-0 rounded-full flex items-center justify-center z-10"
                        style={{ background: 'rgba(0,0,0,0.6)' }}>
                        <span className="text-lg">🔒</span>
                    </div>
                )}

                {/* Active duration bar (bottom arc) */}
                {isActive && !imageSrc && (
                    <div className="absolute inset-0 rounded-full pointer-events-none"
                        style={{ border: `2px solid rgba(255,255,255,0.4)` }} />
                )}

                {/* "top shine" gloss */}
                {!imageSrc && (
                    <div className="absolute pointer-events-none rounded-full"
                        style={{ top: 6, left: '20%', right: '20%', height: '28%', background: 'rgba(255,255,255,0.18)', borderRadius: '50%' }} />
                )}
            </div>

            {/* Label */}
            <span className="text-[10px] font-black text-center leading-tight"
                style={{
                    color: isUlt && ultReady ? '#cc99ff' : isLocked ? '#666' : '#e0d8b0',
                    textShadow: isUlt && ultReady ? '0 0 10px rgba(180,80,255,0.8),1px 1px 3px #000' : '1px 1px 3px #000',
                    marginTop: 0,
                    maxWidth: dim,
                }}>
                {label}
            </span>
            {sublabel && (
                <span className="text-[9px] font-semibold -mt-1"
                    style={{ color: 'rgba(255,255,255,0.45)', textShadow: '1px 1px 2px #000' }}>
                    {sublabel}
                </span>
            )}
        </div>
    );
});

export default function CampaignPlayerHUD({
    activeDebuffs, boss, shieldMax, combatStats, lastPlayerDamage,
    manaDodgeCost, manaUltCost, skillWarning, skillAlert, daysUntilExpiry,
    autoPlay, skillLevels, otHiemActive, otHiemCooldown, OT_HIEM_CONFIG,
    otHiemDuration, castOtHiem, romBocActive, romBocCooldown, ROM_BOC_CONFIG,
    romBocDuration, castRomBoc, handleDodge, fireUltimate
}: Props) {
    const { t } = useTranslation();
    const ultReady = (boss.ultCharge ?? 0) >= 100;
    const hasDodgeMana = boss.mana >= manaDodgeCost;
    const hasUltMana = boss.mana >= manaUltCost;
    const ultOnCooldown = (boss.ultCooldown ?? 0) > 0;
    const isBurning = activeDebuffs.length > 0 && activeDebuffs.some(d => d.type === 'burn');

    return (
        <div className="relative flex flex-col items-stretch w-full">
            {/* Skill warning - absolute image to avoid pushing HUD down */}
            {skillWarning && (
                <div className="absolute left-0 right-0 -top-80 flex justify-center pointer-events-none z-[60]">
                    <img
                        src="/assets/battle/notice_1.png"
                        alt="Notice"
                        className="w-[340px] object-contain animate-pulse"
                    />
                </div>
            )}

            {/* Debuff bar */}
            {activeDebuffs.length > 0 && (
                <div className="flex gap-1.5 mb-1 flex-wrap">
                    {activeDebuffs.map((d, i) => (
                        <span key={`${d.type}-${i}`} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                                background: d.type === 'burn' ? 'rgba(231,76,60,0.3)' :
                                    d.type === 'heal_block' ? 'rgba(108,92,231,0.3)' :
                                        'rgba(253,121,168,0.3)',
                                color: d.type === 'burn' ? '#ff6b6b' :
                                    d.type === 'heal_block' ? '#a29bfe' :
                                        '#fd79a8',
                                border: `1px solid ${d.type === 'burn' ? 'rgba(231,76,60,0.4)' :
                                    d.type === 'heal_block' ? 'rgba(108,92,231,0.4)' :
                                        'rgba(253,121,168,0.4)'}`,
                            }}>
                            {d.icon} {d.label} {d.remainingSec}s
                        </span>
                    ))}
                </div>
            )}



            {/* Boss skill alert - absolute image with text overlay */}
            {skillAlert && (
                <div className="absolute left-0 right-0 -top-56 flex justify-center pointer-events-none z-[55] animate-fade-in-up">
                    <div className="relative flex items-center justify-center">
                        <img 
                            src="/assets/battle/notice_2.png" 
                            alt="Boss Skill" 
                            className="w-[360px] object-contain" 
                        />
                        <div className="absolute inset-x-0 bottom-[18%] flex items-center justify-center px-4">
                            <span className="text-white font-bold text-xs uppercase tracking-wider drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                                {skillAlert.text}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {daysUntilExpiry !== null && daysUntilExpiry <= 2 && (
                <ExpiryBanner daysLeft={daysUntilExpiry} />
            )}

            <div className="flex-1 min-h-[4px]" />

            {/* ═══ Mockup-style circular skill row with wooden frame ═══ */}
            <div
                className="flex items-end justify-around px-2 pb-2 pt-6 -mx-3 mb-[-6px]"
                style={{
                    backgroundImage: "url('/assets/battle/frame_skill_bar.png')",
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                }}
            >
                {/* Ớt Hiểm */}
                <CircleSkillBtn
                    className="campaign-skill-btn"
                    imageSrc="/assets/battle/btn_skill1.png"
                    label="Skill 1"
                    sublabel={otHiemCooldown > 0 ? undefined : otHiemActive ? 'active' : undefined}
                    variant="red"
                    isActive={otHiemActive}
                    onCooldown={otHiemCooldown > 0}
                    cooldownSec={otHiemCooldown}
                    cooldownPct={OT_HIEM_CONFIG.cooldown > 0 ? (otHiemCooldown / OT_HIEM_CONFIG.cooldown) * 100 : 0}
                    isReady={skillLevels.ot_hiem > 0 && otHiemCooldown === 0 && !otHiemActive}
                    isLocked={skillLevels.ot_hiem === 0}
                    onClick={castOtHiem}
                    size="md"
                />

                {/* Rơm Bọc */}
                <CircleSkillBtn
                    className="campaign-skill-btn"
                    imageSrc="/assets/battle/btn_skill2.png"
                    label="Skill 2"
                    variant="green"
                    isActive={romBocActive}
                    onCooldown={romBocCooldown > 0}
                    cooldownSec={romBocCooldown}
                    cooldownPct={ROM_BOC_CONFIG.cooldown > 0 ? (romBocCooldown / ROM_BOC_CONFIG.cooldown) * 100 : 0}
                    isReady={skillLevels.rom_boc > 0 && romBocCooldown === 0 && !romBocActive}
                    isLocked={skillLevels.rom_boc === 0}
                    onClick={castRomBoc}
                    size="md"
                />

                {/* NÉ */}
                <CircleSkillBtn
                    className="campaign-skill-btn"
                    imageSrc="/assets/battle/btn_dodge.png"
                    label="Né"
                    variant="run"
                    isReady={hasDodgeMana}
                    isDodgeWindow={skillWarning && hasDodgeMana}
                    onClick={handleDodge}
                    size="md"
                />

                {/* ULT */}
                <CircleSkillBtn
                    className="campaign-skill-btn campaign-skill-btn-ult"
                    imageSrc="/assets/battle/btn_ult.png"
                    label={ultReady ? 'ULT ⚡' : `ULT, ${boss.ultCharge ?? 0}%`}
                    variant="ult"
                    isReady={ultReady && hasUltMana && !ultOnCooldown}
                    onCooldown={ultOnCooldown}
                    cooldownSec={boss.ultCooldown ?? 0}
                    ultChargePct={boss.ultCharge ?? 0}
                    onClick={fireUltimate}
                    size="md"
                />
            </div>
        </div>
    );
}
