import { useNavigate } from 'react-router-dom';
import { useVipStatus } from '../../../shared/hooks/useVipStatus';

export function VipBadge() {
    const navigate = useNavigate();
    const { isVip, tier, ognMultiplier, daysRemaining, isLoading } = useVipStatus();

    if (isLoading) {
        return (
            <div className="animate-pulse bg-amber-50 rounded-xl p-4 border border-amber-200">
                <div className="h-4 bg-amber-200 rounded w-24" />
            </div>
        );
    }

    // ─── Free User ───
    if (!isVip) {
        return (
            <div className="bg-gradient-to-r from-stone-50 to-stone-100 rounded-xl p-4 border border-stone-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">🌱</span>
                        <div>
                            <p className="font-semibold text-stone-700 text-sm">Nông dân tập sự</p>
                            <p className="text-xs text-stone-500">OGN x1 • Miễn phí</p>
                        </div>
                    </div>
                    <span className="px-2 py-1 bg-stone-200 text-stone-600 text-xs font-medium rounded-full">
                        Free
                    </span>
                </div>
                <button
                    onClick={() => navigate('/vip/purchase')}
                    className="w-full mt-3 py-2 rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700 active:bg-green-800 transition-all shadow-md active:scale-[0.98]"
                >
                    Nâng cấp VIP
                </button>
            </div>
        );
    }

    // ─── VIP User ───
    const tierConfig = {
        standard: {
            emoji: '⭐',
            label: 'VIP Standard',
            sublabel: 'Nông dân chuyên nghiệp',
            gradient: 'from-amber-50 to-yellow-50',
            border: 'border-amber-300',
            badge: 'bg-amber-400 text-white',
            text: 'text-amber-800',
        },
        premium: {
            emoji: '👑',
            label: 'VIP Premium',
            sublabel: 'Nông dân huyền thoại',
            gradient: 'from-purple-50 to-pink-50',
            border: 'border-purple-300',
            badge: 'bg-purple-500 text-white',
            text: 'text-purple-800',
        },
    };

    const config = tierConfig[tier as keyof typeof tierConfig] ?? tierConfig.standard;

    return (
        <div className={`bg-gradient-to-r ${config.gradient} rounded-xl p-4 border ${config.border}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{config.emoji}</span>
                    <div>
                        <p className={`font-semibold text-sm ${config.text}`}>{config.sublabel}</p>
                        <p className="text-xs text-stone-500">
                            OGN x{ognMultiplier} • Còn {daysRemaining} ngày
                        </p>
                    </div>
                </div>
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${config.badge}`}>
                    {config.label}
                </span>
            </div>
            {daysRemaining <= 7 && (
                <button
                    onClick={() => navigate('/vip/purchase')}
                    className="w-full mt-3 py-2 rounded-xl text-xs font-bold text-amber-700 bg-amber-100 border border-amber-300 hover:bg-amber-200 transition-all active:scale-[0.98]"
                >
                    Gia hạn VIP
                </button>
            )}
        </div>
    );
}
