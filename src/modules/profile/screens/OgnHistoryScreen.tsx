import { useNavigate } from 'react-router-dom';
import { useOgn } from '@/shared/hooks/usePlayerProfile';
import { useOgnHistory } from '@/shared/hooks/useOgnHistory';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { playSound } from '@/shared/audio';

const OgnHistoryScreen = () => {
    const navigate = useNavigate();
    const ognBalance = useOgn();
    const { data: transactions, isLoading, error, refetch } = useOgnHistory(50);

    // Group transactions by date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayTransactions = transactions?.filter(t => {
        const txDate = new Date(t.createdAt);
        return txDate >= today;
    }) || [];

    const yesterdayTransactions = transactions?.filter(t => {
        const txDate = new Date(t.createdAt);
        return txDate >= yesterday && txDate < today;
    }) || [];

    const olderTransactions = transactions?.filter(t => {
        const txDate = new Date(t.createdAt);
        return txDate < yesterday;
    }) || [];

    return (
        <div className="h-[100dvh] font-sans text-gray-800 antialiased overflow-hidden flex flex-col relative bg-[#FFF8E1]">
            {/* Header */}
            <div className="flex-shrink-0 wood-header-history sticky top-0 z-50 pt-safe pb-4 px-4 flex items-center justify-between">
                <button
                    onClick={() => { playSound('ui_back'); navigate(-1); }}
                    className="w-10 h-10 rounded-full bg-[#8B4513] border-2 border-[#E6D690] text-[#E6D690] shadow-wood-button active:translate-y-1 active:shadow-none transition-all flex items-center justify-center"
                >
                    <span className="material-icons-round">arrow_back</span>
                </button>
                <h1 className="text-xl font-black text-[#5D4037] drop-shadow-sm uppercase tracking-wide">Lịch sử OGN</h1>
                <button
                    onClick={() => { playSound('ui_click'); refetch(); }}
                    className="w-10 h-10 rounded-full bg-[#8B4513] border-2 border-[#E6D690] text-[#E6D690] shadow-wood-button active:translate-y-1 active:shadow-none transition-all flex items-center justify-center"
                >
                    <span className="material-icons-round">refresh</span>
                </button>
            </div>

            {/* Balance Card */}
            <div className="flex-shrink-0 px-4 py-4 bg-gradient-to-b from-[#FFF8E1] to-transparent z-10">
                <div className="relative w-full max-w-sm mx-auto">
                    <span className="material-icons-round absolute -top-4 -left-2 text-green-700/20 text-5xl transform -rotate-12">spa</span>
                    <span className="material-icons-round absolute -bottom-4 -right-2 text-green-700/20 text-5xl transform rotate-45">spa</span>
                    <div className="bg-[#FFFDF5] border-2 border-[#DEB887] rounded-3xl p-6 flex flex-col items-center justify-center shadow-lg relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIiBmaWxsPSJub25lIiBzdHJva2U9IiM4QjQ1MTMiIHN0cm9rZS13aWR0aD0iMSI+PHBhdGggZD0iTTAgMjBMMjAgME0xMCAyMEwyMCAxME0wIDEwTDEwIDA1IiBzdHJva2Utb3BhY2l0eT0iMC4yIi8+PC9zdmc+')]"></div>
                        <span className="text-[#8B4513] font-black text-xs uppercase tracking-widest mb-2 z-10 opacity-70">Số dư hiện tại</span>
                        <div className="flex items-center gap-3 z-10">
                            <div className="bg-yellow-100 p-2 rounded-full border-2 border-yellow-300 shadow-sm">
                                <span className="material-icons-round text-yellow-600 text-3xl">monetization_on</span>
                            </div>
                            <span className="text-5xl font-black text-[#5D4037] drop-shadow-sm">{ognBalance.toLocaleString()}</span>
                            <span className="text-sm font-black text-[#8B4513] mt-4">OGN</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-8 space-y-6">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="w-12 h-12 border-4 border-[#8B4513] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[#8B4513] font-bold text-sm">Đang tải...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <span className="material-icons-round text-red-500 text-5xl">error_outline</span>
                        <p className="text-red-600 font-bold text-sm">Lỗi tải dữ liệu</p>
                        <button
                            onClick={() => refetch()}
                            className="px-6 py-2 rounded-full bg-[#8B4513] text-[#E6D690] font-bold text-sm shadow-wood-button active:translate-y-1 active:shadow-none transition-all"
                        >
                            Thử lại
                        </button>
                    </div>
                ) : !transactions || transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <span className="material-icons-round text-[#8B4513] text-5xl opacity-50">receipt_long</span>
                        <p className="text-[#8B4513] font-bold text-sm opacity-70">Chưa có giao dịch nào</p>
                    </div>
                ) : (
                    <>
                        {/* Today */}
                        {todayTransactions.length > 0 && (
                            <div>
                                <h3 className="text-[#8B4513] font-black text-xs ml-2 mb-3 opacity-60 uppercase tracking-widest">Hôm nay</h3>
                                <div className="space-y-3">
                                    {todayTransactions.map((tx) => (
                                        <TransactionItem key={tx.id} {...tx} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Yesterday */}
                        {yesterdayTransactions.length > 0 && (
                            <div>
                                <h3 className="text-[#8B4513] font-black text-xs ml-2 mb-3 opacity-60 uppercase tracking-widest mt-4">Hôm qua</h3>
                                <div className="space-y-3">
                                    {yesterdayTransactions.map((tx) => (
                                        <TransactionItem key={tx.id} {...tx} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Older */}
                        {olderTransactions.length > 0 && (
                            <div>
                                <h3 className="text-[#8B4513] font-black text-xs ml-2 mb-3 opacity-60 uppercase tracking-widest mt-4">Cũ hơn</h3>
                                <div className="space-y-3">
                                    {olderTransactions.map((tx) => (
                                        <TransactionItem key={tx.id} {...tx} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Decorative fade at bottom */}
            <div className="fixed bottom-0 w-full h-24 bg-gradient-to-t from-[#FFF8E1] to-transparent pointer-events-none z-10"></div>
        </div>
    );
};

interface TransactionItemProps {
    amount: number;
    type: string;
    description: string;
    createdAt: string;
}

const TransactionItem = ({ amount, type, description, createdAt }: TransactionItemProps) => {
    const isPositive = amount >= 0;
    const amountStr = (amount >= 0 ? '+' : '') + amount;

    // Map transaction type to icon and color
    const getIconAndColor = (type: string) => {
        const map: Record<string, { icon: string; color: string; category: string }> = {
            'plant_seed': { icon: 'agriculture', color: 'red', category: 'Trồng' },
            'harvest_sell': { icon: 'spa', color: 'green', category: 'Bán' },
            'shop_buy': { icon: 'shopping_basket', color: 'red', category: 'Mua' },
            'boss_reward': { icon: 'military_tech', color: 'amber', category: 'Boss' },
            'quiz_reward': { icon: 'quiz', color: 'pink', category: 'Quiz' },
            'daily_login': { icon: 'card_giftcard', color: 'pink', category: 'Hệ thống' },
            'referral': { icon: 'people', color: 'blue', category: 'Giới thiệu' },
            'social_interact': { icon: 'favorite', color: 'pink', category: 'Xã hội' },
            'system': { icon: 'settings', color: 'blue', category: 'Hệ thống' },
        };
        return map[type] || { icon: 'receipt', color: 'blue', category: 'Khác' };
    };

    const { icon, color, category } = getIconAndColor(type);

    const iconColorMap: Record<string, string> = {
        green: 'bg-green-100 border-green-200 text-green-600',
        red: 'bg-red-50 border-red-100 text-red-500',
        amber: 'bg-amber-100 border-amber-200 text-amber-600',
        blue: 'bg-blue-50 border-blue-100 text-blue-500',
        pink: 'bg-pink-50 border-pink-100 text-pink-500',
    };

    const badgeColorMap: Record<string, string> = {
        green: 'bg-green-50 border-green-100 text-green-700',
        red: 'bg-red-50 border-red-100 text-red-700',
        amber: 'bg-amber-50 border-amber-100 text-amber-700',
        blue: 'bg-blue-50 border-blue-100 text-blue-700',
        pink: 'bg-pink-50 border-pink-100 text-pink-700',
    };

    const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: vi });

    return (
        <div className="parchment-card rounded-2xl p-4 flex items-center justify-between relative group active:scale-[0.98] transition-transform duration-200">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner shrink-0 border ${iconColorMap[color]}`}>
                    <span className="material-icons-round text-2xl">{icon}</span>
                </div>
                <div className="flex flex-col">
                    <span className="font-extrabold text-[#5D4037] text-base leading-tight">{description}</span>
                    <span className="text-[10px] font-bold text-[#8B4513] opacity-50 flex items-center gap-1 mt-1">
                        <span className="material-icons-round text-[12px]">schedule</span> {timeAgo}
                    </span>
                </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
                <span className={`font-black text-lg ${isPositive ? 'text-green-600' : 'text-red-500'}`}>{amountStr} OGN</span>
                <div className={`px-2.5 py-0.5 rounded-full border ${badgeColorMap[color]}`}>
                    <span className="text-[9px] font-black uppercase tracking-tighter">{category}</span>
                </div>
            </div>
        </div>
    );
};

export default OgnHistoryScreen;
