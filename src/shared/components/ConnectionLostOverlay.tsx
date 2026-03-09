import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { useUIStore } from '@/shared/stores/uiStore';
import { useTranslation } from 'react-i18next';

const ConnectionLostOverlay = () => {
    const { t } = useTranslation();
    const isOnline = useOnlineStatus();
    const isApiDisconnected = useUIStore(s => s.isApiDisconnected);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsed, setElapsed] = useState(0);

    const isVisible = !isOnline || isApiDisconnected;

    useEffect(() => {
        // Log status change
        console.warn(`[FARM-DEBUG] ConnectionLostOverlay: Network=${isOnline ? 'ON' : 'OFF'}, API=${isApiDisconnected ? 'OFF' : 'ON'}`);

        if (isVisible) {
            if (!startTime) {
                setStartTime(Date.now());
            }
            const interval = setInterval(() => {
                setElapsed(Math.floor((Date.now() - (startTime || Date.now())) / 1000));
            }, 1000);
            return () => clearInterval(interval);
        } else {
            setStartTime(null);
            setElapsed(0);
        }
    }, [isOnline, isApiDisconnected, isVisible, startTime]);

    if (!isVisible) return null;

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return [hrs, mins, secs]
            .map(v => v < 10 ? '0' + v : v)
            .join(':');
    };

    // Use Portal to ensure it's at the very top of the DOM
    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

            {/* Popup Container */}
            <div className="relative w-full max-w-sm wood-frame-v2 p-1 pt-0 overflow-hidden transform scale-100 animate-bounce-in shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                {/* Nails */}
                <div className="absolute top-3 left-3 w-3 h-3 bg-[#5D4037] rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.2)] z-20"></div>
                <div className="absolute top-3 right-3 w-3 h-3 bg-[#5D4037] rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.2)] z-20"></div>
                <div className="absolute bottom-3 left-3 w-3 h-3 bg-[#5D4037] rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.2)] z-20"></div>
                <div className="absolute bottom-3 right-3 w-3 h-3 bg-[#5D4037] rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.2)] z-20"></div>

                {/* Warning Banner */}
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 z-30">
                    <div className="bg-[#e74c3c] text-white font-black text-sm py-2 px-8 rounded-b-xl shadow-md border-x-2 border-b-2 border-[#c0392b] uppercase tracking-wider relative">
                        {t('connection_lost')}
                        <div className="absolute top-0 left-0 w-full h-full bg-white opacity-10 rounded-b-xl pointer-events-none"></div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="bg-[#FFF8E1] m-3 mt-8 rounded-2xl border-4 border-[#D7CCC8] shadow-inner p-6 flex flex-col items-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 stripe-pattern pointer-events-none"></div>

                    {/* Character/Icon Area */}
                    <div className="relative w-48 h-32 flex items-center justify-center mb-4">
                        <div className="absolute top-2 right-6 opacity-30">
                            <span className="material-icons-round text-gray-400 text-6xl">signal_wifi_off</span>
                        </div>

                        <div className="relative w-24 h-24 transform -translate-x-2 translate-y-2">
                            {/* Ears */}
                            <div className="absolute top-6 -left-2 w-7 h-11 bg-white border-2 border-black rounded-full transform -rotate-45"></div>
                            <div className="absolute top-6 -right-2 w-7 h-11 bg-white border-2 border-black rounded-full transform rotate-45"></div>

                            {/* Face */}
                            <div className="absolute top-0 left-2 w-20 h-20 bg-white border-2 border-black rounded-[40%] z-10 overflow-hidden shadow-sm">
                                <div className="absolute top-0 right-0 w-8 h-8 bg-black rounded-bl-3xl"></div>
                            </div>

                            {/* Mouth Area */}
                            <div className="absolute bottom-2 left-4 w-16 h-12 bg-pink-100 border-2 border-black rounded-3xl z-20">
                                <div className="absolute top-4 left-3 w-2 h-3 bg-black rounded-full opacity-60"></div>
                                <div className="absolute top-4 right-3 w-2 h-3 bg-black rounded-full opacity-60"></div>
                            </div>

                            {/* Eyes */}
                            <div className="absolute top-7 left-6 w-2.5 h-2.5 bg-black rounded-full z-20"></div>
                            <div className="absolute top-7 right-6 w-2.5 h-2.5 bg-black rounded-full z-20"></div>

                            {/* Sweat Drop */}
                            <div className="absolute top-2 right-1 text-blue-400 text-xl font-bold animate-bounce z-30">💧</div>
                        </div>
                    </div>

                    {/* Timer */}
                    <div className="bg-[#3E2723] rounded-lg px-5 py-2 mb-6 shadow-md border-b-2 border-white/10">
                        <span className="font-mono text-2xl font-black text-red-400 tracking-widest drop-shadow-[0_0_8px_rgba(239,83,80,0.6)]">
                            {formatTime(elapsed)}
                        </span>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-[#7CB342] hover:bg-[#689F38] active:scale-95 transition-all duration-200 text-white font-black text-lg py-3 rounded-xl shadow-[0_5px_0_#33691E,0_8px_10px_rgba(0,0,0,0.2)] border-t border-[#AED581] relative overflow-hidden group mb-2"
                    >
                        <div className="absolute top-0 left-0 w-full h-full bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                        <span className="drop-shadow-md">{t('relogin')}</span>
                    </button>

                    <p className="mt-2 text-[10px] text-gray-500 font-extrabold text-center uppercase tracking-tighter opacity-70">
                        {isApiDisconnected ? t('cannot_connect_server') : t('check_internet')}
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConnectionLostOverlay;
