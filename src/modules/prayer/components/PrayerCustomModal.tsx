import { useState } from 'react';

export interface PrayerCustomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (text: string) => void;
    isPending: boolean;
    limitUsed: number;
    limitMax: number;
}

export function PrayerCustomModal({ isOpen, onClose, onSubmit, isPending, limitUsed, limitMax }: PrayerCustomModalProps) {
    const [text, setText] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (text.length >= 10 && !isPending && limitUsed < limitMax) {
            onSubmit(text);
            setText(''); // Reset input upon successful trigger
        }
    };

    const isSubmitDisabled = text.length < 10 || isPending || limitUsed >= limitMax;

    return (
        <div className="fixed inset-0 z-50 max-w-md mx-auto h-[100dvh] flex flex-col relative bg-prayer-vibe shadow-2xl overflow-hidden animate-slide-up">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-yellow-100/40 rounded-full blur-[80px]"></div>
                <div className="absolute bottom-[-50px] right-[-50px] w-64 h-64 bg-green-200/40 rounded-full blur-[60px]"></div>
                <div className="absolute top-20 right-10 float-slow opacity-60">
                    <span className="material-symbols-outlined text-white text-6xl drop-shadow-lg">cloud</span>
                </div>
                <div className="absolute top-40 left-5 float-delayed opacity-40">
                    <span className="material-symbols-outlined text-white text-5xl drop-shadow-lg">cloud</span>
                </div>
                <div className="absolute bottom-32 left-0 w-full flex justify-between px-4 opacity-20 pointer-events-none">
                    <span className="material-symbols-outlined text-farm-green-dark text-9xl transform -scale-x-100">grass</span>
                    <span className="material-symbols-outlined text-farm-green-dark text-9xl">grass</span>
                </div>
            </div>

            <div className="relative z-30 px-4 pt-12 pb-2 flex justify-between items-center safe-top">
                <button
                    onClick={onClose}
                    className="w-10 h-10 bg-[#f4e4bc] rounded-full border-2 border-farm-brown shadow-sm flex items-center justify-center hover:bg-[#e9c46a] transition-colors"
                >
                    <span className="material-symbols-outlined text-farm-brown-dark">arrow_back</span>
                </button>
                <div className="bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] bg-[#8c6239] px-6 py-2 rounded-lg border-2 border-[#5d4037] shadow-lg transform rotate-1">
                    <h1 className="text-[#fefae0] text-lg font-display font-bold uppercase tracking-wide drop-shadow-md text-center">Lời Cầu Nguyện</h1>
                </div>
                <div className="w-10 h-10"></div>
            </div>

            <div className="flex-1 relative z-10 flex flex-col items-center justify-center px-4 pb-12 w-full">
                <div className="w-full max-w-[340px] wood-frame rounded-2xl p-2 mb-4 relative">
                    <div className="absolute -top-6 -left-4 z-20 float-slow">
                        <span className="material-symbols-outlined text-farm-green-light text-5xl drop-shadow-md">spa</span>
                    </div>
                    <div className="absolute -top-8 right-0 z-20 float-delayed">
                        <div className="bg-white rounded-full p-2 shadow-md border border-farm-brown">
                            <span className="material-symbols-outlined text-blue-400 text-3xl">flutter_dash</span>
                        </div>
                    </div>
                    <div className="bg-[#fcf6e9] rounded-xl p-6 h-[480px] flex flex-col items-center relative shadow-inner overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-b from-black/5 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-t from-black/5 to-transparent"></div>

                        <div className="text-farm-brown text-sm font-bold mb-4 flex items-center gap-2 bg-[#f4e4bc] px-3 py-1 rounded-full border border-farm-brown/30">
                            <span className="material-symbols-outlined text-lg">edit_note</span>
                            <span className="uppercase tracking-wider text-xs">Tự viết ({limitUsed}/{limitMax})</span>
                        </div>

                        <div className="w-full flex-1 relative mb-4">
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                maxLength={200}
                                className="w-full h-full parchment-input rounded-lg p-4 text-farm-brown-dark text-lg font-display leading-relaxed resize-none placeholder-farm-brown/40 focus:outline-none focus:border-[#8b4513]"
                                placeholder="Viết những lời cầu nguyện chân thành nhất gửi tới Mẹ Thiên Nhiên..."
                            />
                            <div className="absolute bottom-3 right-3 opacity-30 pointer-events-none">
                                <span className="material-symbols-outlined text-farm-brown text-4xl">eco</span>
                            </div>
                        </div>

                        <div className="w-full border-t-2 border-dashed border-farm-brown/20 pt-4 flex justify-between items-center text-xs text-farm-brown/70">
                            <span>{text.length}/200 từ</span>
                            <div className="flex gap-1">
                                {(text.length < 10) && <span className="text-red-400">Tối thiểu 10 ký tự</span>}
                            </div>
                        </div>
                    </div>

                    <div className="absolute -bottom-4 -right-2 z-20">
                        <span className="material-symbols-outlined text-farm-green-dark text-6xl drop-shadow-lg transform rotate-12">potted_plant</span>
                    </div>
                    <div className="absolute -bottom-2 -left-6 z-10">
                        <span className="material-symbols-outlined text-farm-straw text-5xl drop-shadow-lg transform -rotate-12">nest_cam_outdoor</span>
                    </div>
                </div>

                <div className="w-full max-w-[340px] flex justify-center mt-6">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitDisabled}
                        className="wood-btn-carved w-full py-4 rounded-xl flex items-center justify-center gap-3 group transition-all relative overflow-hidden disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                    >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="material-symbols-outlined text-[#fefae0] text-2xl group-active:scale-90 transition-transform">send</span>
                        <span className="text-[#fefae0] text-xl font-display font-bold uppercase tracking-wider text-shadow-sm">
                            {isPending ? 'Đang gửi...' : 'Gửi Đi'}
                        </span>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                    </button>
                </div>

                <div className="mt-4 text-center">
                    <p className="text-farm-brown-dark/60 text-xs font-medium italic">"Mỗi lời cầu nguyện là một hạt giống gieo vào đất lành"</p>
                </div>
            </div>

            <div className="absolute bottom-0 w-full h-12 bg-[#8c6239] border-t-4 border-[#5d4037] z-40 flex items-center justify-center shadow-[0_-5px_15px_rgba(0,0,0,0.3)]">
                <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#5d4037]"></div>
                    <div className="w-2 h-2 rounded-full bg-[#5d4037]"></div>
                    <div className="w-8 h-2 rounded-full bg-[#f4e4bc] shadow-inner"></div>
                    <div className="w-2 h-2 rounded-full bg-[#5d4037]"></div>
                    <div className="w-2 h-2 rounded-full bg-[#5d4037]"></div>
                </div>
            </div>
        </div>
    );
}
