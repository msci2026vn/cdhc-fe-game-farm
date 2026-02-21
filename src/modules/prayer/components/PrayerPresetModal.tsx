import { useState } from 'react';
import { usePrayerPresets } from '../hooks/usePrayerPresets';

export const CATEGORIES = [
    { key: 'all', label: 'Tất cả', emoji: '🙏' },
    { key: 'peace', label: 'Hòa bình', emoji: '🕊️' },
    { key: 'nature', label: 'Thiên nhiên', emoji: '🌿' },
    { key: 'harvest', label: 'Mùa màng', emoji: '🌾' },
    { key: 'health', label: 'Sức khỏe', emoji: '❤️' },
    { key: 'family', label: 'Gia đình', emoji: '👨‍👩‍👧‍👦' },
    { key: 'community', label: 'Cộng đồng', emoji: '🤝' },
    { key: 'earth', label: 'Trái đất', emoji: '🌍' },
    { key: 'spiritual', label: 'Tâm linh', emoji: '🧘' },
] as const;

export interface PrayerPresetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (presetId: string, text: string) => void;
    isPending: boolean;
}

export function PrayerPresetModal({ isOpen, onClose, onSelect, isPending }: PrayerPresetModalProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const { data: presets } = usePrayerPresets(selectedCategory === 'all' ? undefined : selectedCategory);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 max-w-md mx-auto h-[100dvh] flex flex-col bg-nature-vibe-list shadow-2xl overflow-hidden animate-slide-up">
            {/* Background Decor */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
                <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-yellow-200 rounded-full blur-[60px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-green-200 rounded-full blur-[60px]"></div>
                <span className="material-symbols-outlined absolute top-20 left-10 text-green-700/20 text-6xl transform rotate-12">spa</span>
                <span className="material-symbols-outlined absolute top-40 right-4 text-green-700/20 text-4xl transform -rotate-12">local_florist</span>
                <span className="material-symbols-outlined absolute bottom-32 left-1/2 text-green-700/20 text-8xl transform -translate-x-1/2 opacity-20">forest</span>
            </div>

            <div className="relative z-20 pt-12 px-4 pb-4 safe-top">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-[#fdf6e3] border-2 border-farm-brown text-farm-brown-dark flex items-center justify-center shadow-md active:scale-95 transition-transform"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>

                    <div className="bg-[#8c6239] px-6 py-2 rounded-xl border-2 border-[#5d4037] shadow-[0_4px_0_#5d4037] relative">
                        <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#e9c46a] rounded-full border border-[#5d4037]"></div>
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#e9c46a] rounded-full border border-[#5d4037]"></div>
                        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#e9c46a] rounded-full border border-[#5d4037]"></div>
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#e9c46a] rounded-full border border-[#5d4037]"></div>
                        <h1 className="text-[#fefae0] text-lg font-display font-bold uppercase tracking-wider drop-shadow-md text-center">Lời Cầu Nguyện</h1>
                    </div>

                    <button className="w-10 h-10 rounded-full bg-[#fdf6e3] border-2 border-farm-brown text-farm-brown-dark flex items-center justify-center shadow-md active:scale-95 transition-transform">
                        <span className="material-symbols-outlined">help</span>
                    </button>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-4 pt-1 no-scrollbar">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.key}
                            onClick={() => setSelectedCategory(cat.key)}
                            className={`px-4 py-1.5 rounded-full border-2 whitespace-nowrap text-sm bg-[#fdf6e3] ${selectedCategory === cat.key ? 'tab-active' : 'tab-inactive'}`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-4 relative z-10 no-scrollbar">
                {presets ? presets.map((preset) => {
                    let icon = 'public';
                    let iconColor = 'text-green-600';
                    let bgClass = 'bg-green-100 border-green-300';
                    let title = 'Trái Đất Xanh Tươi';

                    switch (preset.category) {
                        case 'peace': icon = 'wb_sunny'; iconColor = 'text-orange-600'; bgClass = 'bg-orange-100 border-orange-300'; title = 'Ánh Sáng Yêu Thương'; break;
                        case 'nature': icon = 'spa'; iconColor = 'text-green-600'; bgClass = 'bg-green-100 border-green-300'; title = 'Trái Đất Xanh Tươi'; break;
                        case 'harvest': icon = 'grain'; iconColor = 'text-blue-600'; bgClass = 'bg-blue-100 border-blue-300'; title = 'Mưa Thuận Gió Hòa'; break;
                        case 'health': icon = 'health_and_safety'; iconColor = 'text-red-500'; bgClass = 'bg-red-100 border-red-300'; title = 'Sức Khỏe Bình An'; break;
                        case 'family': icon = 'family_restroom'; iconColor = 'text-purple-600'; bgClass = 'bg-purple-100 border-purple-300'; title = 'Gia Đình Hạnh Phúc'; break;
                        case 'community': icon = 'diversity_1'; iconColor = 'text-purple-600'; bgClass = 'bg-purple-100 border-purple-300'; title = 'Cộng Đồng Gắn Kết'; break;
                        case 'spiritual': icon = 'self_improvement'; iconColor = 'text-amber-500'; bgClass = 'bg-amber-100 border-amber-300'; title = 'Tâm Hồn Thanh Tĩnh'; break;
                    }

                    return (
                        <div key={preset.id} className="wood-card rounded-xl p-4 flex flex-col gap-3">
                            <div className="flex items-start gap-3">
                                <div className={`w-12 h-12 rounded-lg ${bgClass} border flex items-center justify-center shrink-0`}>
                                    <span className={`material-symbols-outlined ${iconColor} text-3xl`}>{icon}</span>
                                </div>
                                <div>
                                    <h3 className="font-display font-bold text-farm-brown-dark text-lg leading-tight">{title}</h3>
                                    <p className="text-sm text-farm-brown mt-1">"{preset.text}"</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-1 border-t border-dashed border-farm-brown/30 pt-3">
                                <div className="flex items-center gap-1 text-xs font-bold text-farm-brown">
                                    <span className="material-symbols-outlined text-base">{icon}</span>
                                    <span>{CATEGORIES.find(c => c.key === preset.category)?.label || 'Thiên nhiên'}</span>
                                </div>
                                <button
                                    onClick={() => onSelect(preset.id, preset.text)}
                                    disabled={isPending}
                                    className="prayer-btn px-4 py-1.5 rounded-full font-bold text-sm flex items-center gap-1 disabled:opacity-50 disabled:active:translate-y-0 cursor-pointer"
                                >
                                    <span>Cầu nguyện</span>
                                    <span className="material-symbols-outlined text-sm">volunteer_activism</span>
                                </button>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="flex flex-col gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="wood-card rounded-xl p-4 h-32 animate-pulse bg-white/50" />
                        ))}
                    </div>
                )}
            </div>

            <div className="absolute bottom-0 w-full h-20 bg-gradient-to-t from-[#dcedc1] via-[#dcedc1]/90 to-transparent z-20 pointer-events-none"></div>
        </div>
    );
}
