import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { marketplaceApi, type MarketplaceTransaction } from '@/shared/api/api-marketplace';

const RARITY: Record<string, { color: string; label: string }> = {
  normal: { color: 'text-gray-400', label: 'Common' },
  hard: { color: 'text-amber-400', label: 'Rare' },
  extreme: { color: 'text-purple-400', label: 'Epic' },
  catastrophic: { color: 'text-red-400', label: 'Legendary' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

function TransactionCard({ tx }: { tx: MarketplaceTransaction }) {
  const isBuy = tx.role === 'buy';
  const r = RARITY[tx.boss_difficulty || 'hard'] || RARITY.hard;
  const price = parseFloat(tx.price_avax || '0');
  const fee = parseFloat(tx.fee_avax || '0');
  const feeRate = parseFloat(tx.fee_percent || '5');
  const received = parseFloat(tx.seller_receives_avax || '0');

  return (
    <div className={`rounded-xl border p-3 ${isBuy ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-orange-500/30 bg-orange-500/5'}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isBuy ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'}`}>
          {isBuy ? 'ĐÃ MUA' : 'ĐÃ BÁN'}
        </span>
        <span className="text-[10px] text-gray-500">{timeAgo(tx.created_at)}</span>
      </div>

      <div className="flex gap-3">
        {tx.image_url ? (
          <img
            src={tx.image_url}
            className="w-14 h-20 rounded-lg object-cover flex-shrink-0"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-14 h-20 rounded-lg bg-gray-800 flex items-center justify-center text-2xl flex-shrink-0">🎴</div>
        )}

        <div className="flex-1 min-w-0 text-xs space-y-1">
          <p className="text-white font-bold truncate">{tx.boss_name || `NFT #${tx.token_id}`}</p>
          <p className={`${r.color} font-medium`}>{r.label}</p>
          <p className="text-gray-400 truncate">
            {isBuy ? `Mua từ: ${tx.partner_name || '?'}` : `Bán cho: ${tx.partner_name || '?'}`}
          </p>

          <div className="space-y-0.5 pt-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Giá:</span>
              <span className="text-white font-mono">{price.toFixed(4)} AVAX</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Phí ({feeRate.toFixed(0)}%):</span>
              <span className="text-red-400 font-mono">-{fee.toFixed(6)} AVAX</span>
            </div>
            {!isBuy && (
              <div className="flex justify-between border-t border-gray-700/50 pt-0.5">
                <span className="text-gray-400">Bạn nhận:</span>
                <span className="text-emerald-400 font-mono font-bold">{received.toFixed(6)} AVAX</span>
              </div>
            )}
          </div>

          {tx.nft_tx_hash && (
            <a
              href={`https://snowscan.xyz/tx/${tx.nft_tx_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 text-[10px] hover:text-blue-300 inline-block pt-0.5"
            >
              Xem Snowscan (NFT) ↗
            </a>
          )}
          {!tx.nft_tx_hash && tx.payment_tx_hash && (
            <a
              href={`https://snowscan.xyz/tx/${tx.payment_tx_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 text-[10px] hover:text-blue-300 inline-block pt-0.5"
            >
              Xem Snowscan (payment) ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyTransactionList() {
  const [typeFilter, setTypeFilter] = useState<'all' | 'buy' | 'sell'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['marketplace', 'my-transactions', typeFilter],
    queryFn: () => marketplaceApi.getMyTransactions(typeFilter === 'all' ? undefined : typeFilter),
    staleTime: 30_000,
  });

  const transactions = data?.transactions || [];

  return (
    <div className="space-y-3">
      {/* Filter buttons */}
      <div className="flex gap-2">
        {(['all', 'buy', 'sell'] as const).map(f => (
          <button
            key={f}
            onClick={() => setTypeFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${typeFilter === f
                ? f === 'buy' ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
                  : f === 'sell' ? 'bg-orange-500/20 border border-orange-500/50 text-orange-400'
                    : 'bg-white/10 border border-white/20 text-white'
                : 'bg-gray-800/50 text-gray-500 hover:text-gray-300'
              }`}
          >
            {f === 'all' ? 'Tất cả' : f === 'buy' ? 'Đã mua' : 'Đã bán'}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-7 h-7 border-2 border-purple-400 border-t-transparent rounded-full" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="text-5xl">📋</div>
          <p className="text-gray-300 font-semibold">Chưa có giao dịch nào</p>
          <p className="text-gray-500 text-sm">Mua hoặc bán NFT để xem lịch sử</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map(tx => (
            <TransactionCard key={tx.id} tx={tx} />
          ))}
        </div>
      )}
    </div>
  );
}
