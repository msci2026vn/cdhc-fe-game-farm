import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useDeliveryProof } from '@/shared/hooks/useMyGarden';
import type { DeliverySlot } from '@/shared/types/game-api.types';
import { useTranslation } from 'react-i18next';

interface DeliveryDetailModalProps {
  open: boolean;
  onClose: () => void;
  slot: DeliverySlot | null;
  weekNumber: number;
}

function truncateHash(hash: string, chars = 6): string {
  if (hash.length <= chars * 2 + 4) return hash;
  return hash.slice(0, chars + 2) + '...' + hash.slice(-chars);
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard not available */ }
  };

  return (
    <button
      onClick={handleCopy}
      className="text-xs text-stone-400 hover:text-stone-600 transition-colors ml-1"
    >
      {copied ? `✓ ${t('common.success')}` : '📋'}
    </button>
  );
}

function formatDateTime(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString('vi-VN', {
    hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export default function DeliveryDetailModal({ open, onClose, slot, weekNumber }: DeliveryDetailModalProps) {
  const { t } = useTranslation();
  const { data: proof, isLoading } = useDeliveryProof(open && slot ? slot.id : null);

  if (!slot) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[400px] max-h-[85dvh] overflow-y-auto rounded-2xl bg-gradient-to-b from-green-50 to-white p-0 border-green-200">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 text-center">
          <DialogTitle className="text-lg font-bold text-green-800 flex items-center justify-center gap-2">
            <span>📦</span> {t('rwa.delivery_detail.title')}
          </DialogTitle>
          <p className="text-sm text-stone-500 mt-1">
            {t('rwa.delivery_detail.week')} {weekNumber}
          </p>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Delivery time + method */}
          <Section icon="✅" title={t("rwa.delivery_detail.delivery_info")}>
            <Row label={t("rwa.delivery_detail.time")} value={formatDateTime(slot.deliveredAt) ?? t('rwa.delivery_detail.status_received')} />
            {proof?.deliveryData && (
              <Row label={t("rwa.delivery_detail.method")} value={proof.isVerified ? t('rwa.delivery_detail.verified') : t('rwa.delivery_detail.pending_verify')} />
            )}
          </Section>

          {/* Recipient info */}
          {(slot.recipientName || slot.recipientPhone || slot.recipientAddress) && (
            <Section icon="👤" title={t("rwa.delivery_detail.recipient")}>
              {slot.recipientName && <Row label={t("rwa.delivery_detail.name")} value={slot.recipientName} />}
              {slot.recipientPhone && <Row label={t("rwa.delivery_detail.phone")} value={slot.recipientPhone} />}
              {slot.recipientAddress && <Row label={t("rwa.delivery_detail.address")} value={slot.recipientAddress} />}
              {slot.recipientNote && <Row label={t("rwa.delivery_detail.note")} value={slot.recipientNote} />}
            </Section>
          )}

          {/* Product info from proof */}
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" />
            </div>
          ) : proof?.deliveryData && (
            <Section icon="🌿" title={t("rwa.delivery_detail.product_info")}>
              <Row label={t("rwa.delivery_detail.product_info")} value={proof.deliveryData.product} />
              <Row label={t("rwa.delivery_detail.farm")} value={proof.deliveryData.farm} />
              {proof.deliveryData.harvestDate && (
                <Row label={t("rwa.delivery_detail.harvest_date")} value={formatDateTime(proof.deliveryData.harvestDate) ?? proof.deliveryData.harvestDate} />
              )}
            </Section>
          )}

          {/* Blockchain section */}
          {!isLoading && (
            <Section icon="🔗" title={t("rwa.delivery_detail.blockchain")}>
              {proof?.status === 'verified' && proof.blockchain ? (
                <div className="space-y-2">
                  {/* TX Hash */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-500">TX Hash:</span>
                    <div className="flex items-center">
                      <span className="text-xs font-mono text-stone-700">
                        {truncateHash(proof.blockchain.txHash)}
                      </span>
                      <CopyBtn text={proof.blockchain.txHash} />
                    </div>
                  </div>

                  {/* Delivery Hash */}
                  {proof.deliveryHash && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-stone-500">Hash:</span>
                      <div className="flex items-center">
                        <span className="text-xs font-mono text-stone-600">
                          {truncateHash(proof.deliveryHash)}
                        </span>
                        <CopyBtn text={proof.deliveryHash} />
                      </div>
                    </div>
                  )}

                  {/* Data integrity */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-500">Data Integrity:</span>
                    <span className={`text-xs font-semibold ${proof.blockchain.dataIntegrity ? 'text-green-600' : 'text-red-600'}`}>
                      {proof.blockchain.dataIntegrity ? '✅ Verified' : '❌ Failed'}
                    </span>
                  </div>

                  {/* On-chain status */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-500">On-Chain:</span>
                    <span className={`text-xs font-semibold ${proof.blockchain.onChainVerified ? 'text-green-600' : 'text-amber-600'}`}>
                      {proof.blockchain.onChainVerified ? '✅ Confirmed' : '⏳ Pending'}
                    </span>
                  </div>

                  {/* Snowtrace link */}
                  {proof.blockchain.explorerUrl && (
                    <a
                      href={proof.blockchain.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-xl border border-blue-200 transition-colors"
                    >
                      🔍 {t('rwa.delivery_detail.view_snowtrace')}
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                    </a>
                  )}
                </div>
              ) : proof?.status === 'pending_blockchain' ? (
                <div className="text-center py-2 space-y-1">
                  <p className="text-xs text-amber-600 font-medium">{t('rwa.delivery_detail.pending_blockchain')}</p>
                  <p className="text-[10px] text-stone-400">{t('rwa.delivery_detail.blockchain_note')}</p>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-xs text-stone-400">{t('rwa.delivery_detail.no_blockchain_data')}</p>
                </div>
              )}
            </Section>
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

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <span className="text-xs font-bold text-stone-600 uppercase tracking-wide">{title}</span>
      </div>
      <div className="bg-white/80 border border-stone-200 rounded-xl p-3 space-y-1.5">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs text-stone-500 shrink-0">{label}:</span>
      <span className="text-xs text-stone-700 text-right break-words">{value}</span>
    </div>
  );
}
