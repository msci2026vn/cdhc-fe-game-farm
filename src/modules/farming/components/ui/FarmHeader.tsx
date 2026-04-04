import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatedNumber } from '@/shared/components/AnimatedNumber';

interface Props {
    profile: any;
    auth: any;
    isVip: boolean;
    temperature: number;
    locationName: string;
    currentDate: string;
    isNightLocal: boolean;
    isMuted: boolean;
    toggleMute: (e: React.MouseEvent) => void;
}

export default function FarmHeader({
    profile, auth, isVip,
    temperature, locationName, currentDate,
    isNightLocal, isMuted, toggleMute
}: Props) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const textColor = isNightLocal ? 'text-white' : 'text-gray-800';
    const subTextColor = isNightLocal ? 'text-white/60' : 'text-gray-700/60';

    return (
        <header className="flex flex-col gap-3 px-4 pt-safe mt-2 z-50 shrink-0">
            {/* Row 1: Profile & Weather */}
            <div className="flex items-center justify-between gap-2">
                {/* User Profile Glass UI */}
                <div className="flex items-center gap-2.5 glass-ui-v2 p-1 pr-3 rounded-full flex-shrink-1 min-w-0 shadow-sm border border-white/40">
                    <div className="relative group cursor-pointer shrink-0" onClick={() => navigate('/profile')}>
                        <div className={`w-10 h-10 rounded-full border-2 overflow-hidden bg-white flex items-center justify-center ${isVip ? 'border-[#FDB931]' : 'border-white'}`}>
                            {(auth?.user?.picture || profile?.picture) ? (
                                <img
                                    alt={auth?.user?.name || profile?.name}
                                    className="w-full h-full object-cover"
                                    src={auth?.user?.picture || profile?.picture}
                                />
                            ) : (
                                <span className="text-xl">🧑‍🌾</span>
                            )}
                        </div>
                        {isVip && (
                            <div className="absolute -top-1.5 -left-1.5 bg-gradient-to-r from-yellow-300 to-yellow-500 text-[#8B4513] text-[8px] px-1.5 py-[1px] rounded-full font-black border border-white shadow flex items-center gap-0.5 z-10 -rotate-12">
                                <span className="material-symbols-outlined text-[10px] fill-current">crown</span>
                                <span className="tracking-widest drop-shadow-sm">VIP</span>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col min-w-0 py-0.5">
                        <h1 className="font-black text-[12px] text-gray-800 leading-none mb-1 truncate">
                            {auth?.user?.name || profile?.name || t('farming.default_farmer')}
                        </h1>
                        <div className="flex items-center gap-1.5">
                            <span className="bg-yellow-400 text-yellow-900 text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm border border-yellow-500 uppercase leading-none">Lv.{profile?.level || 1}</span>
                            <button onClick={() => navigate('/points')} className="text-amber-900 active:scale-95 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[16px]">notifications</span>
                            </button>
                            <button onClick={toggleMute} className={`active:scale-95 flex items-center justify-center ${isMuted ? 'text-amber-900/50' : 'text-amber-900'}`}>
                                <span className="material-symbols-outlined text-[16px]">{isMuted ? 'volume_off' : 'volume_up'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Weather & Location Pill */}
                <div className="glass-ui-v2 rounded-full px-3 py-1.5 flex items-center gap-2 border border-white/40 shrink-0 shadow-sm">
                    <div className="flex flex-col items-end">
                        <span className={`text-[8px] font-black ${subTextColor} uppercase tracking-tighter leading-none mb-0.5`}>{currentDate}</span>
                        <div className="flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[10px] text-blue-500 max-w-full">location_on</span>
                            <span className={`text-[9px] font-bold ${textColor} truncate max-w-[55px]`}>{locationName}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-0.5 border-l border-white/30 pl-2">
                        <span className={`material-symbols-outlined text-[16px] ${temperature > 25 ? 'text-red-500' : 'text-blue-500'}`}>
                            {temperature > 25 ? 'device_thermostat' : 'ac_unit'}
                        </span>
                        <span className={`text-[12px] font-black ${textColor} leading-none`}>{Math.round(temperature)}°</span>
                    </div>
                </div>
            </div>

            {/* Row 2: Scrollable Stats & Shortcuts (Horizontal) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 px-1 -mx-4 hide-scrollbar snap-x">
                {/* Pad left spacing */}
                <div className="snap-start shrink-0 w-3"></div>

                {/* OGN Balance */}
                <div onClick={() => navigate('/ogn-history')} className="snap-start shrink-0 wood-sign-v2 rounded-xl px-3 py-1.5 flex items-center gap-1.5 active:scale-95 transition-transform shadow-sm cursor-pointer border border-[#8B4513]/30">
                    <img src="/icons/ogn_coin.png" alt="coin" className="w-[14px] h-[14px] object-contain drop-shadow-sm" />
                    <span className="font-black text-[#5D4037] text-xs"><AnimatedNumber value={profile?.ogn ?? 0} /></span>
                </div>

                {/* Energy */}
                <div className="snap-start shrink-0 wood-sign-v2 rounded-xl px-3 py-1.5 flex items-center gap-1.5 shadow-sm border border-[#8B4513]/30">
                    <span className="text-[14px] drop-shadow-sm">⚡</span>
                    <span className="font-black text-[#5D4037] text-xs">8/10</span>
                </div>

                {/* RWA Nông Trại Button */}
                <button onClick={() => navigate('/rwa/my-garden')} className="snap-start shrink-0 bg-gradient-to-br from-green-500 to-green-600 px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-green-400 shadow-md active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-green-100 text-[14px]">grass</span>
                    <span className="text-[9px] font-black text-white uppercase tracking-wider">RWA Farm</span>
                </button>

                {/* My Garden Button */}
                <button onClick={() => navigate('/rwa/my-garden')} className="snap-start shrink-0 bg-gradient-to-br from-blue-500 to-blue-600 px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-blue-400 shadow-md active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-blue-100 text-[14px]">yard</span>
                    <span className="text-[9px] font-black text-white uppercase tracking-wider">My Garden</span>
                </button>

                {/* Minimap Region */}
                <div className="snap-start shrink-0 bg-green-100 border border-green-300 rounded-xl px-3 py-1.5 flex items-center gap-1 cursor-pointer active:scale-95 transition-transform shadow-sm mr-4">
                    <span className="material-symbols-outlined text-green-600 text-[14px]">map</span>
                    <span className="text-[9px] font-black text-green-800 uppercase">{t('farming.zone_1')}</span>
                </div>
            </div>
        </header>
    );
}
