import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/shared/api/api-utils';

// ── Types ──

interface WalletStatus {
  id: string;
  name: string;
  address: string;
  role: string;
  needsGas: boolean;
  balance: string;
  balanceUsd: number;
  status: 'critical' | 'low' | 'ok';
  thresholdCritical: number;
  thresholdLow: number;
  lastChecked: string;
  explorerUrl: string;
}

interface WalletSummary {
  totalSystemWallets: number;
  criticalCount: number;
  lowCount: number;
  avaxPriceUsd: number;
  custodialWallets: number;
  custodialActive: number;
  smartWallets: number;
  lastUpdated: string;
}

interface Transaction {
  hash: string;
  type: 'in' | 'out';
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  timestamp: string;
  status: 'success' | 'failed';
  method: string;
  explorerUrl: string;
}

// ── API helpers ──

const fetchWithAuth = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

// ── Components ──

function StatusBadge({ status }: { status: string }) {
  const colors = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    low: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    ok: 'bg-green-500/20 text-green-400 border-green-500/30',
  };
  const icons = { critical: '\u{1F534}', low: '\u{1F7E1}', ok: '\u2705' };
  const cls = colors[status as keyof typeof colors] || colors.ok;
  const icon = icons[status as keyof typeof icons] || '';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${cls}`}>
      {icon} {status.toUpperCase()}
    </span>
  );
}

function WalletCard({ wallet, onViewTxs }: { wallet: WalletStatus; onViewTxs: () => void }) {
  const shortAddr = `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`;
  return (
    <div className={`rounded-xl border p-4 ${
      wallet.status === 'critical' ? 'border-red-500/40 bg-red-950/20' :
      wallet.status === 'low' ? 'border-yellow-500/30 bg-yellow-950/10' :
      'border-white/10 bg-white/5'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm text-white">{wallet.name}</h3>
        <StatusBadge status={wallet.status} />
      </div>
      <p className="text-2xl font-bold text-white mb-0.5">
        {Number(wallet.balance).toFixed(4)} <span className="text-sm text-white/50">AVAX</span>
      </p>
      <p className="text-xs text-white/40 mb-2">~${wallet.balanceUsd} USD</p>
      <p className="text-xs text-white/30 font-mono mb-1" title={wallet.address}>{shortAddr}</p>
      <p className="text-xs text-white/40 mb-3">{wallet.role}</p>
      <div className="flex gap-2">
        <a
          href={wallet.explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          Snowscan
        </a>
        {wallet.needsGas && (
          <button onClick={onViewTxs} className="text-xs text-white/50 hover:text-white/80">
            Transactions
          </button>
        )}
      </div>
    </div>
  );
}

function TransactionList({ walletId }: { walletId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'wallet-txs', walletId],
    queryFn: () => fetchWithAuth(`${API_BASE_URL}/api/admin-v2/wallets/${walletId}/transactions`),
    enabled: !!walletId,
  });

  if (isLoading) return <div className="text-white/40 text-sm p-4">Loading transactions...</div>;

  const txs: Transaction[] = data?.transactions || [];
  if (txs.length === 0) {
    return <div className="text-white/40 text-sm p-4">{data?.note || 'No transactions found'}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-white/40 border-b border-white/10">
            <th className="text-left p-2">Hash</th>
            <th className="text-left p-2">Type</th>
            <th className="text-right p-2">Value</th>
            <th className="text-left p-2">Method</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">Time</th>
          </tr>
        </thead>
        <tbody>
          {txs.map((tx) => (
            <tr key={tx.hash} className="border-b border-white/5 hover:bg-white/5">
              <td className="p-2">
                <a href={tx.explorerUrl} target="_blank" rel="noopener noreferrer"
                  className="text-blue-400 font-mono hover:text-blue-300">
                  {tx.hash.slice(0, 8)}...
                </a>
              </td>
              <td className="p-2">
                <span className={tx.type === 'in' ? 'text-green-400' : 'text-red-400'}>
                  {tx.type === 'in' ? 'IN' : 'OUT'}
                </span>
              </td>
              <td className="p-2 text-right font-mono text-white/70">
                {tx.type === 'in' ? '+' : '-'}{Number(tx.value).toFixed(4)}
              </td>
              <td className="p-2 text-white/60">{tx.method}</td>
              <td className="p-2">
                {tx.status === 'success'
                  ? <span className="text-green-400">OK</span>
                  : <span className="text-red-400">FAIL</span>
                }
              </td>
              <td className="p-2 text-white/40">{new Date(tx.timestamp).toLocaleString('vi-VN')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Screen ──

export default function AdminWalletMonitorScreen() {
  const qc = useQueryClient();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'wallets'],
    queryFn: () => fetchWithAuth(`${API_BASE_URL}/api/admin-v2/wallets`),
    refetchInterval: 60_000, // Auto-refresh every 1 min
  });

  const wallets: WalletStatus[] = data?.wallets || [];
  const summary: WalletSummary | null = data?.summary || null;

  const handleManualCheck = async () => {
    setChecking(true);
    try {
      await fetchWithAuth(`${API_BASE_URL}/api/admin-v2/wallets/check`);
      qc.invalidateQueries({ queryKey: ['admin', 'wallets'] });
    } catch { /* ignore */ }
    setChecking(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white/40">Loading wallet monitor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] p-6">
        <div className="text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          Failed to load wallets: {(error as Error).message}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 sm:p-6">
      {/* Alert Banner */}
      {summary && summary.criticalCount > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center gap-3">
          <span className="text-lg">{'\u{1F6A8}'}</span>
          <span className="text-red-300 text-sm font-medium">
            {summary.criticalCount} wallet(s) CRITICAL — NFT mint, marketplace, auction may FAIL!
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">{'\u{1F4BC}'} Wallet Monitor</h1>
          {summary && (
            <p className="text-xs text-white/40 mt-1">
              {summary.criticalCount > 0 && <span className="text-red-400 mr-2">{'\u{1F534}'} {summary.criticalCount} Critical</span>}
              {summary.lowCount > 0 && <span className="text-yellow-400 mr-2">{'\u{1F7E1}'} {summary.lowCount} Low</span>}
              <span className="text-green-400">{'\u2705'} {summary.totalSystemWallets - summary.criticalCount - summary.lowCount} OK</span>
              <span className="ml-3 text-white/30">AVAX ${summary.avaxPriceUsd}</span>
            </p>
          )}
        </div>
        <button
          onClick={handleManualCheck}
          disabled={checking}
          className="px-3 py-1.5 text-xs rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 transition-colors"
        >
          {checking ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      {/* System Wallets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {wallets.map((w) => (
          <WalletCard
            key={w.id}
            wallet={w}
            onViewTxs={() => setSelectedWallet(selectedWallet === w.id ? null : w.id)}
          />
        ))}
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
            <p className="text-2xl font-bold">{summary.custodialActive}</p>
            <p className="text-xs text-white/40">Custodial Wallets</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
            <p className="text-2xl font-bold">{summary.smartWallets}</p>
            <p className="text-xs text-white/40">Smart Wallets</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
            <p className="text-2xl font-bold">${summary.avaxPriceUsd}</p>
            <p className="text-xs text-white/40">AVAX Price</p>
          </div>
        </div>
      )}

      {/* Transaction History Panel */}
      {selectedWallet && (
        <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              Transactions — {wallets.find((w) => w.id === selectedWallet)?.name}
            </h2>
            <button onClick={() => setSelectedWallet(null)} className="text-xs text-white/40 hover:text-white/70">
              Close
            </button>
          </div>
          <TransactionList walletId={selectedWallet} />
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-center text-xs text-white/20">
        Last updated: {summary?.lastUpdated ? new Date(summary.lastUpdated).toLocaleString('vi-VN') : '—'}
        {' | '}Auto-refresh: 1 min | Cron: 30 min
      </div>
    </div>
  );
}
