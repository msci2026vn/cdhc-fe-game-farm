import { useBlockchainStats } from '@/shared/hooks/useBlockchain';

interface BlockchainBadgeProps {
  size?: 'sm' | 'lg';
}

export default function BlockchainBadge({ size = 'sm' }: BlockchainBadgeProps) {
  const { data: stats, isLoading } = useBlockchainStats();

  if (isLoading || !stats) return null;

  if (size === 'sm') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
        ⛓️ Blockchain ✅
      </span>
    );
  }

  return (
    <div className="rounded-xl border border-green-200 bg-green-50/60 p-3 flex items-center gap-3">
      <div className="text-2xl">⛓️</div>
      <div>
        <p className="text-sm font-semibold text-green-700">
          Da xac thuc tren Blockchain
        </p>
        <p className="text-xs text-green-600/70">
          Avalanche C-Chain &middot; {stats.rootCount} batch &middot; {stats.totalReadingsOnChain} readings
        </p>
      </div>
    </div>
  );
}
