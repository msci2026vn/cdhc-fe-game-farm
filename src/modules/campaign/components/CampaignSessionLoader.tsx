import React from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
    sessionError: string | null;
    sessionReady: boolean;
    onBack: () => void;
}

export default function CampaignSessionLoader({ sessionError, sessionReady, onBack }: Props) {
    const { t } = useTranslation();
    // Session error — block board render
    if (sessionError) {
        return (
            <div className="h-[100dvh] max-w-[430px] mx-auto boss-gradient flex flex-col items-center justify-center px-6 overflow-hidden">
                <div className="text-center animate-fade-in">
                    <div className="text-[56px] mb-3">⚔️</div>
                    <h2 className="font-heading text-xl font-bold text-red-400 mb-2">{t('campaign.ui.cannot_start_battle')}</h2>
                    <p className="text-white/70 text-sm mb-6">{sessionError}</p>
                    <button
                        onClick={onBack}
                        className="px-6 py-3 rounded-xl font-heading text-sm font-bold text-white active:scale-[0.97] transition-transform"
                        style={{ background: 'linear-gradient(135deg, hsl(35,80%,45%), hsl(35,90%,55%))', boxShadow: '0 4px 15px rgba(200,150,50,0.3)' }}>
                        ← {t('campaign.screens.back_to_map')}
                    </button>
                </div>
            </div>
        );
    }

    // Session loading — wait for BE
    if (!sessionReady) {
        return (
            <div className="h-[100dvh] max-w-[430px] mx-auto boss-gradient flex items-center justify-center overflow-hidden">
                <div className="text-center animate-fade-in">
                    <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-white/70 font-heading font-bold text-sm">{t('campaign.ui.preparing_battle')}</p>
                </div>
            </div>
        );
    }

    return null;
}
