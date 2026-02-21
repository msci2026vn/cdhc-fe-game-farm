import React from 'react';
import { usePrayerHistory } from '../hooks/usePrayerHistory';

export interface PrayerHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onWriteNew: () => void;
}

export function PrayerHistoryModal({ isOpen, onClose, onWriteNew }: PrayerHistoryModalProps) {
    const { data, isLoading } = usePrayerHistory();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-wood-table bg-[#5d4037] overflow-hidden select-none animate-slide-up">
            <div className="absolute inset-0 opacity-30 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>

            <div className="max-w-md w-full h-[100dvh] flex flex-col relative shadow-2xl overflow-hidden z-10">
                <div className="relative z-20 pt-12 pb-4 px-6 flex flex-col items-center safe-top">
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-black/40 to-transparent pointer-events-none"></div>

                    <div className="relative">
                        <div className="absolute -inset-1 bg-[#8c6239] rounded-lg blur opacity-70"></div>
                        <div className="relative bg-[#f4e4bc] border-4 border-[#8c6239] px-8 py-2 rounded-lg shadow-wood-shadow transform rotate-1">
                            <h1 className="font-display font-bold text-2xl text-farm-brown-dark uppercase tracking-wider text-center flex items-center gap-2">
                                <span className="material-symbols-outlined text-green-700">spa</span>
                                Nhật Ký Cầu Nguyện
                                <span className="material-symbols-outlined text-green-700">spa</span>
                            </h1>
                        </div>
                        <div className="absolute -top-16 left-4 w-1 h-20 bg-[#ccb289] z-[-1]"></div>
                        <div className="absolute -top-16 right-4 w-1 h-20 bg-[#ccb289] z-[-1]"></div>
                    </div>

                    <div className="mt-6 text-[#e9c46a] font-handwriting text-xl text-center opacity-90 drop-shadow-md">
                        "Gửi những tâm tư đến Mẹ Thiên Nhiên..."
                    </div>
                </div>

                <div className="flex-1 px-4 pb-24 relative z-10 overflow-y-auto scrollbar-hide">
                    <div className="bg-[#fdf6e3] w-full min-h-full rounded-tr-lg rounded-br-lg rounded-tl-sm rounded-bl-sm shadow-book-shadow relative p-1 mt-2 mb-8 mx-auto max-w-sm transform -rotate-1 border-l-8 border-[#8c6239] diary-paper">
                        <div className="absolute left-[-12px] top-0 bottom-0 w-8 flex flex-col justify-evenly py-4 z-20">
                            {Array.from({ length: 11 }).map((_, i) => (
                                <div key={i} className="w-6 h-3 bg-gray-400 rounded-full shadow-sm transform -rotate-12 border border-gray-600 mb-2"></div>
                            ))}
                        </div>

                        <div className="p-6 pl-8 h-full flex flex-col gap-6">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-full">
                                    <span className="text-farm-brown-dark/50 font-handwriting text-2xl animate-pulse">Đang giở từng trang...</span>
                                </div>
                            ) : !data?.length ? (
                                <div className="flex justify-center items-center h-full text-center">
                                    <span className="text-farm-brown-dark/50 font-handwriting text-2xl mt-12">Chưa có trang nhật ký nào được viết.</span>
                                </div>
                            ) : (
                                data.map((item) => {
                                    const date = new Date(item.createdAt);
                                    const formattedDate = `Ngày ${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
                                    const title = item.type === 'preset' ? item.category || 'Lời chúc mẫu' : 'Lời chúc tự do';
                                    const stars = Math.min(Math.max(item.multiplier || 1, 1), 3);

                                    return (
                                        <div key={item.id} className="relative group">
                                            <div className="flex items-center justify-between mb-1 border-b border-farm-brown/30 pb-1">
                                                <span className="font-handwriting text-2xl text-farm-green-dark font-bold">{formattedDate}</span>
                                                <div className="flex gap-1">
                                                    {Array.from({ length: stars }).map((_, i) => (
                                                        <span key={i} className="material-symbols-outlined text-yellow-500 text-sm">star</span>
                                                    ))}
                                                    {Array.from({ length: 3 - stars }).map((_, i) => (
                                                        <span key={i + stars} className="material-symbols-outlined text-gray-400 text-sm">star_outline</span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="pl-2 border-l-2 border-farm-green-light/50">
                                                <h3 className="font-display font-bold text-farm-brown text-sm uppercase mb-1">{title}</h3>
                                                <p className="font-handwriting text-ink-blue text-lg leading-6">
                                                    {item.text}
                                                </p>
                                            </div>

                                            {item.ognReward > 0 && (
                                                <div className="absolute -right-2 top-8 opacity-70 transform rotate-12 border-2 border-red-800/40 rounded-full w-16 h-16 flex items-center justify-center pointer-events-none">
                                                    <span className="text-xs font-bold text-red-800/60 uppercase text-center leading-none -rotate-12">Đã<br />Nhận</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {data && data.length > 0 && (
                            <div className="absolute bottom-2 right-4 opacity-60">
                                <span className="font-handwriting text-base text-farm-brown font-bold">Trang 1</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="absolute bottom-6 left-0 right-0 px-6 z-30 flex justify-between items-center pb-safe">
                    <button
                        onClick={onClose}
                        className="bg-[#8c6239] w-12 h-12 rounded-full border-2 border-[#f4e4bc] shadow-lg flex items-center justify-center active:scale-95 transition-transform hover:bg-[#7a5230]"
                    >
                        <span className="material-symbols-outlined text-[#f4e4bc] text-2xl">arrow_back</span>
                    </button>

                    <button
                        onClick={() => {
                            onClose();
                            onWriteNew();
                        }}
                        className="flex-1 ml-4 bg-[#52b788] h-12 rounded-full border-2 border-[#f4e4bc] shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-[#40916c] group"
                    >
                        <span className="material-symbols-outlined text-white text-2xl group-hover:rotate-12 transition-transform">edit_note</span>
                        <span className="font-display font-bold text-white uppercase text-sm tracking-wide">Viết Lời Cầu Nguyện Mới</span>
                    </button>
                </div>

                {/* Floating decorations */}
                <div className="absolute top-20 left-4 text-green-800/20 leaf-float pointer-events-none" style={{ animationDuration: '8s' }}>
                    <span className="material-symbols-outlined text-4xl">energy_savings_leaf</span>
                </div>
                <div className="absolute bottom-32 right-[-10px] text-yellow-600/20 leaf-float pointer-events-none" style={{ animationDuration: '10s', animationDelay: '2s' }}>
                    <span className="material-symbols-outlined text-5xl">eco</span>
                </div>
                <div className="absolute top-1/2 left-[-20px] text-green-900/10 leaf-float pointer-events-none" style={{ animationDuration: '12s', animationDelay: '1s' }}>
                    <span className="material-symbols-outlined text-6xl">psychiatry</span>
                </div>
            </div>
        </div>
    );
}
