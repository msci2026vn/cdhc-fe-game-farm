import { useState, useEffect, useCallback } from 'react';
import { useConversionTiers, useConversionHistory, useConvert } from '@/shared/hooks/useConversion';
import type { ConversionDirection, ConversionTierStatus } from '@/shared/types/game-api.types';
import { formatOGN } from '@/shared/utils/format';
import { playSound } from '@/shared/audio';
import { useTranslation } from 'react-i18next';

// Tier display info (matches backend SEED_TO_OGN_TIERS / OGN_TO_SEED_TIERS)
const SEED_TO_OGN_DISPLAY = [
  { id: 1, from: '10,000 🌱', to: '9.50 OGN', minLevel: 5, fromAmount: 10_000 },
  { id: 2, from: '50,000 🌱', to: '47.50 OGN', minLevel: 10, fromAmount: 50_000 },
  { id: 3, from: '200,000 🌱', to: '190 OGN', minLevel: 20, fromAmount: 200_000 },
  { id: 4, from: '500,000 🌱', to: '475 OGN', minLevel: 30, fromAmount: 500_000 },
  { id: 5, from: '1,000,000 🌱', to: '950 OGN', minLevel: 50, fromAmount: 1_000_000 },
];

const OGN_TO_SEED_DISPLAY = [
  { id: 1, from: '10 OGN', to: '9,500 🌱', minLevel: 1, fromAmount: 10 },
  { id: 2, from: '50 OGN', to: '47,500 🌱', minLevel: 10, fromAmount: 50 },
  { id: 3, from: '200 OGN', to: '190,000 🌱', minLevel: 20, fromAmount: 200 },
  { id: 4, from: '500 OGN', to: '475,000 🌱', minLevel: 30, fromAmount: 500 },
  { id: 5, from: '1,000 OGN', to: '950,000 🌱', minLevel: 50, fromAmount: 1_000 },
];

interface ConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConversionModal({ isOpen, onClose }: ConversionModalProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ConversionDirection>('seed_to_ogn');
  const [confirmTier, setConfirmTier] = useState<{ direction: ConversionDirection; tierId: number } | null>(null);

  const { data: status, isLoading, refetch: refetchTiers } = useConversionTiers(isOpen);
  const { data: history, refetch: refetchHistory } = useConversionHistory(isOpen);
  const convert = useConvert();

  // Cooldown countdown
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (status?.cooldownRemaining && status.cooldownRemaining > 0) {
      setCooldown(status.cooldownRemaining);
    } else {
      setCooldown(0);
    }
  }, [status?.cooldownRemaining]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          refetchTiers();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown, refetchTiers]);

  const handleConvert = useCallback((direction: ConversionDirection, tierId: number) => {
    setConfirmTier({ direction, tierId });
    playSound('ui_tab');
  }, []);

  const executeConvert = useCallback(() => {
    if (!confirmTier || convert.isPending) return;
    convert.mutate(confirmTier, {
      onSettled: () => {
        setConfirmTier(null);
        refetchTiers();
        refetchHistory();
      },
    });
  }, [confirmTier, convert, refetchTiers, refetchHistory]);

  if (!isOpen) return null;

  const tierStatuses = status?.tiers ?? [];
  const seedBalance = status?.seedBalance ?? 0;
  const ognBalance = status?.ognBalance ?? 0;
  const playerLevel = status?.playerLevel ?? 0;
  const systemFrozen = status?.systemFrozen ?? false;
  const userFrozen = status?.userFrozen ?? false;
  const isFrozen = systemFrozen || userFrozen;

  const displayTiers = activeTab === 'seed_to_ogn' ? SEED_TO_OGN_DISPLAY : OGN_TO_SEED_DISPLAY;

  // Count daily conversions used (sum across all tiers)
  const dailyUsed = tierStatuses.reduce((sum, t) => sum + t.usedToday, 0);

  function getTierStatus(direction: ConversionDirection, tierId: number): ConversionTierStatus | undefined {
    return tierStatuses.find((t) => t.direction === direction && t.tierId === tierId);
  }

  function renderTierButton(
    direction: ConversionDirection,
    tierId: number,
    minLevel: number,
  ) {
    const ts = getTierStatus(direction, tierId);
    if (!ts) return <span className="text-[9px] text-gray-400">...</span>;

    if (!ts.unlocked) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
          🔒 Lv.{minLevel}
        </span>
      );
    }

    if (isFrozen) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-red-400 bg-red-50 px-2 py-1 rounded-lg">
          🚫 {t('stopped')}
        </span>
      );
    }

    if (cooldown > 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-orange-400 bg-orange-50 px-2 py-1 rounded-lg">
          ⏱️ {cooldown}s
        </span>
      );
    }

    if (!ts.canConvert && ts.remainingToday === 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
          ⏳ {t('out_of_turns')}
        </span>
      );
    }

    if (!ts.canConvert) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-lg">
          ⚠️ {direction === 'seed_to_ogn' ? t('missing_seed') : t('missing_ogn')}
        </span>
      );
    }

    return (
      <button
        onClick={() => handleConvert(direction, tierId)}
        disabled={convert.isPending}
        className="inline-flex items-center gap-0.5 text-[9px] font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-1.5 rounded-lg active:scale-95 transition-all shadow-sm disabled:opacity-50"
      >
        ✅ {t('convert_btn')}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-[430px] bg-[#FFF8F0] rounded-t-3xl animate-slide-up max-h-[85dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="font-heading text-lg font-bold text-[#5D4037]">🔄 {t('convert_seed_ogn_title')}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-bold active:bg-gray-300"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-6" style={{ scrollbarWidth: 'none' }}>
          {isLoading ? (
            <div className="text-center py-10">
              <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-gray-500 font-bold">{t('loading')}</p>
            </div>
          ) : (
            <>
              {/* Frozen banner */}
              {isFrozen && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
                  <p className="text-[10px] font-bold text-red-600 text-center">
                    🚫 {systemFrozen ? t('system_frozen_msg') : t('user_frozen_msg')}
                  </p>
                </div>
              )}

              {/* Balance display */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-white rounded-xl p-3 border border-[#E8D5C4] text-center">
                  <span className="text-lg block">🌱</span>
                  <span className="font-heading text-sm font-bold text-[#5D4037] block">{formatOGN(seedBalance)}</span>
                  <span className="text-[9px] font-semibold text-gray-400">{t('seed_label')}</span>
                </div>
                <div className="bg-white rounded-xl p-3 border border-[#E8D5C4] text-center">
                <div className="flex justify-center mb-1">
                  <img src="/icons/ogn_coin.png" alt="coin" className="w-6 h-6 object-contain" />
                </div>
                  <span className="font-heading text-sm font-bold text-[#5D4037] block">{ognBalance.toFixed(2)}</span>
                  <span className="text-[9px] font-semibold text-gray-400">OGN</span>
                </div>
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-[#E8D5C4] mb-3">
                <span className="text-[9px] font-bold text-gray-500">
                  ⏱️ Cooldown: {cooldown > 0 ? <span className="text-orange-500">{cooldown}s</span> : <span className="text-green-600">{t('ready')}</span>}
                </span>
                <span className="text-[9px] font-bold text-gray-500">
                  📊 Hôm nay: {dailyUsed}/15
                </span>
                <span className="text-[9px] font-bold text-gray-500">
                  ⭐ Lv.{playerLevel}
                </span>
              </div>

              {/* Tab toggle */}
              <div className="flex gap-1 mb-3">
                <button
                  onClick={() => { setActiveTab('seed_to_ogn'); playSound('ui_tab'); }}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${activeTab === 'seed_to_ogn'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                    : 'bg-white text-gray-500 border border-[#E8D5C4]'
                    }`}
                >
                  {t('seed_to_ogn_tab')}
                </button>
                <button
                  onClick={() => { setActiveTab('ogn_to_seed'); playSound('ui_tab'); }}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${activeTab === 'ogn_to_seed'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                    : 'bg-white text-gray-500 border border-[#E8D5C4]'
                    }`}
                >
                  {t('ogn_to_seed_tab')}
                </button>
              </div>

              {/* Tier list */}
              <div className="space-y-1.5 mb-4">
                {displayTiers.map((tier) => {
                  const ts = getTierStatus(activeTab, tier.id);
                  const isLocked = ts && !ts.unlocked;
                  return (
                    <div
                      key={tier.id}
                      className={`flex items-center gap-2 bg-white rounded-xl p-2.5 border transition-all ${isLocked ? 'opacity-50 border-gray-200' : 'border-[#E8D5C4]'
                        }`}
                    >
                      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-xs font-bold text-amber-700">
                        {tier.id}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-[#5D4037] leading-tight">
                          {tier.from} → {tier.to}
                        </p>
                        <p className="text-[8px] text-gray-400 font-semibold">
                          {t('fee_5_percent')} · Lv.{tier.minLevel}+
                          {ts && ts.unlocked && ts.remainingToday >= 0 && (
                            <> · {ts.remainingToday === -1 ? '' : `${ts.remainingToday} ${t('turns')}`}</>
                          )}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {renderTierButton(activeTab, tier.id, tier.minLevel)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rate info */}
              <div className="bg-amber-50 rounded-xl p-2.5 mb-4 border border-amber-100">
                <p className="text-[9px] text-amber-700 font-semibold text-center">
                  {t('rate_info')}
                </p>
              </div>

              {/* History */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 mb-1.5">{t('recent_history')}</p>
                {!history?.conversions?.length ? (
                  <div className="bg-white rounded-xl p-3 border border-[#E8D5C4] text-center">
                    <p className="text-[10px] text-gray-400">{t('no_transactions_yet')}</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {history.conversions.slice(0, 5).map((c) => (
                      <div key={c.id} className="flex items-center gap-2 bg-white rounded-lg px-2.5 py-2 border border-gray-100">
                        <span className="text-sm flex items-center">
                          🌱→<img src="/icons/ogn_coin.png" alt="coin" className="w-3.5 h-3.5 object-contain ml-0.5" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-[#5D4037]">
                            {c.direction === 'seed_to_ogn'
                              ? `${formatOGN(c.fromAmount)} Hạt → ${(c.toAmount / 100).toFixed(2)} OGN`
                              : `${(c.fromAmount / 100).toFixed(2)} OGN → ${formatOGN(c.toAmount)} Hạt`
                            }
                          </p>
                          <p className="text-[8px] text-gray-400">
                            {t('fee_label')} {c.direction === 'seed_to_ogn' ? formatOGN(c.feeAmount) + ' Hạt' : (c.feeAmount / 100).toFixed(2) + ' OGN'}
                          </p>
                        </div>
                        <span className="text-[8px] text-gray-400 font-semibold whitespace-nowrap">
                          {new Date(c.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Confirm overlay */}
        {confirmTier && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 rounded-t-3xl animate-fade-in" onClick={() => setConfirmTier(null)}>
            <div className="bg-white rounded-2xl p-5 max-w-[300px] w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="text-center">
                <div className="text-4xl mb-2">🔄</div>
                <h3 className="font-heading text-base font-bold mb-1">{t('confirm_convert_title')}</h3>
                {(() => {
                  const display = confirmTier.direction === 'seed_to_ogn'
                    ? SEED_TO_OGN_DISPLAY.find((t) => t.id === confirmTier.tierId)
                    : OGN_TO_SEED_DISPLAY.find((t) => t.id === confirmTier.tierId);
                  return (
                    <p className="text-sm text-gray-600 mb-4">
                      {display?.from} → {display?.to}
                      <br />
                      <span className="text-[10px] text-gray-400">{t('fee_calculated_note')}</span>
                    </p>
                  );
                })()}
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmTier(null)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-gray-500 bg-gray-100 active:bg-gray-200"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={executeConvert}
                    disabled={convert.isPending}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 active:scale-95 shadow-lg disabled:opacity-50"
                  >
                    {convert.isPending ? '...' : t('convert_now')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
