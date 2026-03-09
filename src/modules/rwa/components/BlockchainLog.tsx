import { useState } from 'react';
import { useBlockchainLogs, useBlockchainStats } from '@/shared/hooks/useBlockchain';
import { useTranslation } from 'react-i18next';

function truncateHash(hash: string | null, chars = 10): string {
  if (!hash) return '--';
  return hash.slice(0, chars + 2) + '...' + hash.slice(-4);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const statusConfig = {
  confirmed: { icon: '✅', label: t('rwa.blockchain_log.status_confirmed'), border: 'border-green-200', bg: 'bg-green-50' },
  submitted: { icon: '⏳', label: t('rwa.blockchain_log.status_processing'), border: 'border-yellow-200', bg: 'bg-yellow-50' },
  pending: { icon: '🕐', label: t('rwa.blockchain_log.status_pending'), border: 'border-gray-200', bg: 'bg-gray-50' },
  failed: { icon: '❌', label: t('rwa.blockchain_log.status_failed'), border: 'border-red-200', bg: 'bg-red-50' },
} as const;

function CopyButton({ text }: { text: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="text-gray-400 hover:text-gray-600 transition-colors text-xs"
      title={t('rwa.blockchain_log.copy')}
    >
      {copied ? '✓' : '📋'}
    </button>
  );
}

export default function BlockchainLog() {
  const { t } = useTranslation();
  const { data: logs, isLoading: logsLoading } = useBlockchainLogs(10);
  const { data: stats, isLoading: statsLoading } = useBlockchainStats();

  if (logsLoading && statsLoading) {
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 rounded w-48" />
          <div className="h-24 bg-gray-100 rounded-xl" />
          <div className="h-20 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm space-y-3">
      {/* Header */}
      <div>
        <h3 className="font-bold text-farm-brown-dark flex items-center gap-1.5">
          <span className="text-lg">⛓️</span> {t('rwa.blockchain_log.title')}
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Avalanche C-Chain &middot; {logs?.length ?? 0} batch{(logs?.length ?? 0) !== 1 ? 'es' : ''}
        </p>
      </div>

      {/* Batch list */}
      {logs && logs.length > 0 ? (
        <div className="space-y-2">
          {logs.map((log, i) => {
            const cfg = statusConfig[log.status] || statusConfig.pending;
            return (
              <div key={log.id} className={`rounded-xl border p-3 ${cfg.bg} ${cfg.border}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-gray-700">
                    {cfg.icon} Batch #{logs.length - i}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {formatDate(log.confirmedAt || log.batchedAt)}
                  </span>
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>{log.readingCount} readings &middot; Block {log.blockNumber?.toLocaleString() ?? '--'}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] text-gray-400">
                      {truncateHash(log.merkleRoot)}
                    </span>
                    {log.merkleRoot && <CopyButton text={log.merkleRoot} />}
                  </div>

                  {log.explorerUrl && (
                    <a
                      href={log.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs mt-1"
                    >
                      🔗 {t('rwa.blockchain_log.view_snowtrace')}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-3">{t('rwa.blockchain_log.no_batch')}</p>
      )}

      {/* Contract stats */}
      {stats && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 space-y-1.5">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
            📊 {t('rwa.blockchain_log.contract_stats')}
          </h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
            <span>Merkle roots:</span>
            <span className="font-semibold">{stats.rootCount}</span>
            <span>Readings on-chain:</span>
            <span className="font-semibold">{stats.totalReadingsOnChain}</span>
            <span>Deployer balance:</span>
            <span className="font-semibold">{parseFloat(stats.deployerBalance).toFixed(4)} AVAX</span>
          </div>
          {stats.explorerUrl && (
            <a
              href={stats.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs mt-1"
            >
              🔗 {t('rwa.blockchain_log.view_contract')}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
