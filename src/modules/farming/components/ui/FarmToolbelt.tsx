import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
    setShowFriends: (show: boolean) => void;
}

export default function FarmToolbelt({ setShowFriends }: Props) {
    const navigate = useNavigate();

    return (
        <div className="px-5 py-2 mb-4 shrink-0 z-40">
            <div className="flex justify-between items-center bg-white/30 backdrop-blur-md rounded-[24px] p-2 border border-white/40 shadow-sm max-w-[340px] mx-auto gap-2">

                <button onClick={() => navigate('/prayer')} className="flex-1 group flex flex-col items-center gap-1 active:scale-95">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-b from-[#B39DDB] to-[#7E57C2] shadow border border-white/60 flex items-center justify-center">
                        <span className="text-xl drop-shadow-sm">🙏</span>
                    </div>
                </button>

                <button onClick={() => navigate('/quiz')} className="flex-1 group flex flex-col items-center gap-1 relative active:scale-95">
                    <span className="absolute top-[-4px] right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm border border-white z-10 animate-bounce">!</span>
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-b from-[#FFCC80] to-[#FFA726] shadow border border-white/60 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px] text-white drop-shadow-sm">school</span>
                    </div>
                </button>

                <button onClick={() => navigate('/market')} className="flex-1 group flex flex-col items-center gap-1 active:scale-95">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-b from-[#80CBC4] to-[#26A69A] shadow border border-white/60 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px] text-white drop-shadow-sm">monitoring</span>
                    </div>
                </button>

                <button onClick={() => setShowFriends(true)} className="flex-1 group flex flex-col items-center gap-1 active:scale-95">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-b from-[#F48FB1] to-[#EC407A] shadow border border-white/60 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px] text-white drop-shadow-sm">group</span>
                    </div>
                </button>

                <button onClick={() => navigate('/campaign')} className="flex-1 group flex flex-col items-center gap-1 active:scale-95">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-b from-[#FFAB91] to-[#FF7043] shadow border border-white/60 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px] text-white drop-shadow-sm">explore</span>
                    </div>
                </button>

            </div>
        </div>
    );
}
