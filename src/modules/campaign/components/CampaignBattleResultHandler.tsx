import React from 'react';
import { BattleResult } from '@/modules/boss/components/hud';
import DropAnimation from './DropAnimation';
import type { DropResult } from '../types/fragment.types';

interface Props {
    won: boolean;
    bossComplete: any; // Return type of useBattleEnd mutation
    dropData: DropResult | undefined;
    showDropAnim: boolean;
    setShowDropAnim: (show: boolean) => void;
    bossData: { name: string; emoji: string };
    totalDmgDealt: number;
    combatStatsTracker: any;
    level: number;
    playerHpPct: number;
    bossTurnCount: number;
    archetype: string;
    archetypeTip?: string;
    onBack: () => void;
    onRetry: () => void;
    stars: number;
    durationSeconds: number;
    maxCombo: number;
}

export default function CampaignBattleResultHandler({
    won, bossComplete, dropData, showDropAnim, setShowDropAnim,
    bossData, totalDmgDealt, combatStatsTracker, level, playerHpPct,
    bossTurnCount, archetype, archetypeTip, onBack, onRetry,
    stars, durationSeconds, maxCombo
}: Props) {
    const serverData = bossComplete.data;

    // API still processing — show loading spinner
    if (bossComplete.isPending) {
        return (
            <div className="h-[100dvh] max-w-[430px] mx-auto boss-gradient flex items-center justify-center overflow-hidden">
                <div className="text-center animate-fade-in">
                    <div className="text-[64px] mb-3">{won ? '🏆' : '💀'}</div>
                    <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-white/70 font-heading font-bold text-sm">Đang ghi nhận kết quả...</p>
                </div>
            </div>
        );
    }

    // API failed — show error with retry
    if (bossComplete.isError && !serverData) {
        return (
            <div className="h-[100dvh] max-w-[430px] mx-auto boss-gradient flex items-center justify-center overflow-hidden px-6">
                <div className="text-center animate-fade-in">
                    <div className="text-[56px] mb-3">{won ? '🏆' : '💀'}</div>
                    <p className="text-white font-heading font-bold text-lg mb-1">
                        {won ? 'Chiến thắng!' : 'Thất bại!'}
                    </p>
                    <p className="text-white/50 text-xs mb-4">
                        Kết quả chưa được ghi nhận do lỗi kết nối.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={onBack}
                            className="px-5 py-2.5 rounded-xl font-heading text-sm font-bold text-white active:scale-[0.97] transition-transform"
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                            Về Map
                        </button>
                        <button
                            onClick={onRetry}
                            className="px-5 py-2.5 rounded-xl font-heading text-sm font-bold text-white active:scale-[0.97] transition-transform btn-green">
                            Đánh lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Show drop animation before BattleResult (if drop data exists)
    if (won && dropData && showDropAnim) {
        return (
            <div className="h-[100dvh] max-w-[430px] mx-auto boss-gradient flex items-center justify-center overflow-hidden">
                <DropAnimation
                    drop={dropData}
                    isVisible={showDropAnim}
                    onClose={() => setShowDropAnim(false)}
                />
            </div>
        );
    }

    return (
        <BattleResult
            won={won}
            bossName={bossData.name}
            bossEmoji={bossData.emoji}
            totalDmgDealt={totalDmgDealt}
            serverData={serverData}
            combatStats={combatStatsTracker}
            playerLevel={level}
            isCampaign={true}
            playerHpPct={playerHpPct}
            turnUsed={bossTurnCount}
            turnMax={0}
            archetype={archetype}
            archetypeTip={archetypeTip}
            onBack={onBack}
            onRetry={onRetry}
            leveledUp={serverData?.leveledUp}
            newLevel={serverData?.newLevel}
            combatStars={stars}
            durationSeconds={durationSeconds}
            maxCombo={maxCombo}
        />
    );
}
