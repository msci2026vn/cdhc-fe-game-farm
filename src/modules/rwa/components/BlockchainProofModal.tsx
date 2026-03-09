import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useDeliveryProof } from '@/shared/hooks/useMyGarden';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface BlockchainProofModalProps {
  open: boolean;
  onClose: () => void;
  slotId: string | null;
  weekNumber: number;
}

function truncateHash(hash: string, chars = 6): string {
  if (hash.length <= chars * 2 + 4) return hash;
  return hash.slice(0, chars + 2) + '...' + hash.slice(-chars);
}

function CopyBtn({ text }: { text: string }) {
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
      className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
    >
      {copied ? '✓' : '📋'}
    </button>
  );
}

export default function BlockchainProofModal({ open, onClose, slotId, weekNumber }: BlockchainProofModalProps) {
  const { t } = useTranslation();
  const { data: proof, isLoading } = useDeliveryProof(open ? slotId : null);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[380px] rounded-2xl bg-gradient-to-b from-blue-50 to-white p-0 border-blue-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 text-center">
          <DialogTitle className="text-lg font-bold text-blue-800 flex items-center justify-center gap-2">
            <span>🔗</span> {t('rwa.blockchain_proof.title')}
          </DialogTitle>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          )}

          {/* Not delivered */}
          {proof?.status === 'not_delivered' && (
            <div className="text-center py-6 space-y-2">
              <span className="text-3xl">📦</span>
              <p className="text-sm text-stone-600">{t('rwa.blockchain_proof.not_delivered')}</p>
              <p className="text-xs text-stone-400">{t('rwa.blockchain_proof.not_delivered_desc')}</p>
            </div>
          )}

          {/* Pending blockchain */}
          {proof?.status === 'pending_blockchain' && (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center space-y-1">
                <span className="text-2xl">⏳</span>
                <p className="text-sm font-medium text-amber-700">{t('rwa.blockchain_proof.pending_chain')}</p>
                <p className="text-xs text-amber-600">{t('rwa.blockchain_proof.pending_desc')}</p>
              </div>

              {proof.deliveryData && (
                <DeliveryInfo data={proof.deliveryData} weekNumber={weekNumber} />
              )}
            </div>
          )}

          {/* Verified on-chain */}
          {proof?.status === 'verified' && (
            <div className="space-y-3">
              {proof.deliveryData && (
                <DeliveryInfo data={proof.deliveryData} weekNumber={weekNumber} />
              )}

              {/* Blockchain proof */}
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-blue-200" />
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Blockchain Proof</span>
                <div className="h-px flex-1 bg-blue-200" />
              </div>

              {proof.blockchain && (
                <div className="bg-white border border-blue-200 rounded-xl p-3 space-y-2.5">
                  {/* TX Hash */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-500">TX Hash:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono text-stone-700">
                        {truncateHash(proof.blockchain.txHash)}
                      </span>
                      <CopyBtn text={proof.blockchain.txHash} />
                    </div>
                  </div>

                  {/* Delivery Hash */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-500">Delivery Hash:</span>
                    <span className="text-xs font-mono text-stone-600">
                      {truncateHash(proof.blockchain.deliveryHash)}
                    </span>
                  </div>

                  {/* Data integrity */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-500">Data Integrity:</span>
                    <span className={`text-xs font-semibold ${proof.blockchain.dataIntegrity ? 'text-green-600' : 'text-red-600'}`}>
                      {proof.blockchain.dataIntegrity ? '✅ Verified' : '❌ Failed'}
                    </span>
                  </div>

                  {/* On-Chain */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-500">On-Chain:</span>
                    <span className={`text-xs font-semibold ${proof.blockchain.onChainVerified ? 'text-green-600' : 'text-amber-600'}`}>
                      {proof.blockchain.onChainVerified ? '✅ Confirmed' : '⏳ Pending'}
                    </span>
                  </div>

                  {/* Snowtrace link */}
                  <a
                    href={proof.blockchain.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm rounded-xl border border-blue-200 transition-colors mt-2"
                  >
                    🔗 {t('rwa.delivery_detail.view_snowtrace')}
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium text-sm rounded-xl border border-stone-200 transition-colors"
          >
            Đóng
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeliveryInfo({ data, weekNumber }: {
  data: NonNullable<import('@/shared/types/game-api.types').DeliveryProof['deliveryData']>;
  weekNumber: number;
}) {
  return (
    <div className="bg-white/80 border border-stone-200 rounded-xl p-3 space-y-1.5">
      <div className="flex items-center gap-2 text-sm">
        <span>📦</span>
        <span className="font-medium text-stone-700">{t('rwa.blockchain_proof.box_week', { weekNumber })}</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span>✅</span>
        <span className="text-stone-600">
          {t('rwa.blockchain_proof.received_at')}{new Date(data.deliveredAt).toLocaleString('vi-VN', {
            hour: '2-digit', minute: '2-digit',
            day: '2-digit', month: '2-digit', year: 'numeric',
          })}
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span>🌿</span>
        <span className="text-stone-600">{data.product}</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span>🏡</span>
        <span className="text-stone-600">{data.farm}</span>
      </div>
      {data.recipientId && (
        <div className="flex items-center gap-2 text-sm">
          <span>👤</span>
          <span className="text-stone-600 font-mono text-xs">{data.recipientId}</span>
        </div>
      )}
    </div>
  );
}
