// ═══════════════════════════════════════════════════════════════
// AutoPlayShopSection — 2 tabs: Thuê OGN / Mua AVAX (B3)
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { autoPlayApi } from '@/shared/api/api-autoplay';
import { useAutoPlayLevel } from '@/shared/hooks/useAutoPlayLevel';
import { useAutoPlayRent } from '@/shared/hooks/useAutoPlayRent';
import { useAutoPlayBuy } from '@/shared/hooks/useAutoPlayBuy';
import { useOgn } from '@/shared/hooks/usePlayerProfile';
import { useCustodialWallet } from '@/shared/hooks/useCustodialWallet';
import { useSmartWallet } from '@/shared/hooks/useSmartWallet';
import { getLearningSummary, resetWeights } from '@/shared/autoplay/auto-learner';
import {
  hasWalletExtension,
  sendViaWalletExtension,
  prepareSmartWalletOp,
  signAndSubmitSmartWalletOp,
} from '@/modules/vip/utils/sendAvaxPayment';

// ─── Constants ───────────────────────────────────────────────────

interface PkgMeta {
  level: number;
  name: string;
  nameKey: string;
  algorithm: string;
  features: string[];
  color: string;
  gradient: string;
  icon: string;
}

const PACKAGES: PkgMeta[] = [
  {
    level: 2, name: 'Basic', nameKey: 'autoplay_smart', algorithm: 'Greedy',
    features: ['Weighted scoring', 'Situation awareness'],
    color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', icon: '🧠',
  },
  {
    level: 3, name: 'Advanced', nameKey: 'autoplay_advanced', algorithm: 'Cascade',
    features: ['Cascade simulation', 'Auto-dodge', 'Auto skill'],
    color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', icon: '⚡',
  },
  {
    level: 4, name: 'Pro', nameKey: 'autoplay_expert', algorithm: 'MCTS 30',
    features: ['Monte Carlo search', 'Auto-ULT timing', '30 simulations'],
    color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)', icon: '🎯',
  },
  {
    level: 5, name: 'Elite', nameKey: 'autoplay_ultimate', algorithm: 'MCTS 80',
    features: ['80 simulations', 'All skills', 'Self-learning AI'],
    color: '#ec4899', gradient: 'linear-gradient(135deg, #ef4444, #ec4899, #8b5cf6)', icon: '🧠✨',
  },
];

const LEVEL_INFO: Record<number, { nameKey: string; icon: string; color: string }> = {
  1: { nameKey: 'autoplay_basic', icon: '🤖', color: '#9ca3af' },
  2: { nameKey: 'autoplay_smart', icon: '🧠', color: '#3b82f6' },
  3: { nameKey: 'autoplay_advanced', icon: '⚡', color: '#8b5cf6' },
  4: { nameKey: 'autoplay_expert', icon: '🎯', color: '#f59e0b' },
  5: { nameKey: 'autoplay_ultimate', icon: '🧠✨', color: '#ec4899' },
};

type BuyStep = 'options' | 'signing' | 'processing';

// ─── Main component ───────────────────────────────────────────────

export default function AutoPlayShopSection() {
  const { t } = useTranslation();
  const {
    effectiveLevel, purchasedLevel, rentedLevel, daysUntilExpiry,
  } = useAutoPlayLevel();

  const { data: prices } = useQuery({
    queryKey: ['auto-play-prices'],
    queryFn: () => autoPlayApi.getPrices(),
    staleTime: 10 * 60 * 1000,
  });

  const ogn = useOgn();
  const rent = useAutoPlayRent();
  const buy = useAutoPlayBuy();
  const { wallet: custodialWallet, hasWallet: hasCustodialWallet } = useCustodialWallet();
  const { walletStatus, hasWallet: hasSmartWallet } = useSmartWallet();

  const [tab, setTab] = useState<'rent' | 'buy'>('rent');
  const [showLearning, setShowLearning] = useState(false);

  // Rent confirm dialog
  const [confirmRent, setConfirmRent] = useState<PkgMeta | null>(null);

  // Buy modal state
  const [buyTarget, setBuyTarget] = useState<PkgMeta | null>(null);
  const [buyStep, setBuyStep] = useState<BuyStep>('options');
  const [buyError, setBuyError] = useState<string | null>(null);
  const [manualTxHash, setManualTxHash] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [userOpHash, setUserOpHash] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);

  const currentInfo = LEVEL_INFO[effectiveLevel] ?? LEVEL_INFO[1];
  const learningSummary = showLearning ? getLearningSummary() : null;

  // ─── Rent flow ───────────────────────────────────────────────────

  const handleConfirmRent = () => {
    if (!confirmRent) return;
    rent.mutate(confirmRent.level, {
      onSuccess: () => setConfirmRent(null),
      onError: () => setConfirmRent(null),
    });
  };

  // ─── Buy flow ────────────────────────────────────────────────────

  const closeBuyModal = () => {
    setBuyTarget(null);
    setBuyStep('options');
    setBuyError(null);
    setManualTxHash('');
    setShowManual(false);
    setUserOpHash(null);
    setIsPreparing(false);
  };

  const handleBuyCustodial = async () => {
    if (!buyTarget) return;
    setBuyStep('processing');
    setBuyError(null);
    buy.mutate({ level: buyTarget.level }, {
      onSuccess: () => closeBuyModal(),
      onError: (err: any) => {
        setBuyError(err.message || t('payment_failed'));
        setBuyStep('options');
      },
    });
  };

  const handleBuySmartWallet = async () => {
    if (!buyTarget || !prices?.receiverAddress) return;
    setIsPreparing(true);
    setBuyError(null);
    try {
      const avaxAmount = prices.buy[buyTarget.level] ?? '0.015';
      const prep = await prepareSmartWalletOp(prices.receiverAddress, avaxAmount);
      setUserOpHash(prep.userOpHash);
      setBuyStep('signing');
    } catch (err: any) {
      setBuyError(err.message || t('prepare_tx_error'));
    } finally {
      setIsPreparing(false);
    }
  };

  const handleSignSmartWallet = async () => {
    if (!buyTarget || !userOpHash) return;
    setBuyStep('processing');
    setBuyError(null);
    try {
      const txHash = await signAndSubmitSmartWalletOp(userOpHash);
      buy.mutate({ level: buyTarget.level, txHash }, {
        onSuccess: () => closeBuyModal(),
        onError: (err: any) => {
          setBuyError(err.message || t('verify_tx_error'));
          setBuyStep('options');
        },
      });
    } catch (err: any) {
      setBuyError(err.message || t('smart_wallet_error'));
      setBuyStep('options');
    }
  };

  const handleBuyExtension = async () => {
    if (!buyTarget || !prices?.receiverAddress) return;
    setBuyStep('processing');
    setBuyError(null);
    try {
      const avaxAmount = prices.buy[buyTarget.level] ?? '0.015';
      const txHash = await sendViaWalletExtension(prices.receiverAddress, avaxAmount);
      buy.mutate({ level: buyTarget.level, txHash }, {
        onSuccess: () => closeBuyModal(),
        onError: (err: any) => {
          setBuyError(err.message || t('verify_tx_error'));
          setBuyStep('options');
        },
      });
    } catch (err: any) {
      setBuyError(err.message || t('tx_failed'));
      setBuyStep('options');
    }
  };

  const handleVerifyManual = () => {
    if (!buyTarget || !manualTxHash.trim()) return;
    setBuyStep('processing');
    setBuyError(null);
    buy.mutate({ level: buyTarget.level, txHash: manualTxHash.trim() }, {
      onSuccess: () => closeBuyModal(),
      onError: (err: any) => {
        setBuyError(err.message || t('verify_failed'));
        setBuyStep('options');
      },
    });
  };

  // ─── Card helpers ─────────────────────────────────────────────────

  const isPurchased = (lv: number) => purchasedLevel !== null && purchasedLevel >= lv;
  const isRented = (lv: number) => rentedLevel === lv;

  // ─── Rent card button ─────────────────────────────────────────────

  const RentButton = ({ pkg }: { pkg: PkgMeta }) => {
    const owned = isPurchased(pkg.level);
    const rented = isRented(pkg.level);
    const ognCost = prices?.rent[pkg.level] ?? 0;
    const canAfford = ogn >= ognCost;

    if (owned) return (
      <div className="w-full py-1.5 rounded-lg text-[10px] font-bold text-center bg-green-50 text-green-700 border border-green-200">
        {t('purchased_permanently')}
      </div>
    );
    if (rented) return (
      <div className="w-full py-1.5 rounded-lg text-[10px] font-bold text-center"
        style={{ background: `${pkg.color}15`, color: pkg.color, border: `1px solid ${pkg.color}40` }}>
        {t('renting_status', { daysText: daysUntilExpiry !== null ? ` (${daysUntilExpiry}d)` : '' })}
      </div>
    );
    return (
      <button
        onClick={() => canAfford ? setConfirmRent(pkg) : toast.error(t('not_enough_ogn'))}
        disabled={rent.isPending}
        className="w-full py-1.5 rounded-lg text-[10px] font-bold text-white transition-all active:scale-95 disabled:opacity-50"
        style={{ background: canAfford ? pkg.gradient : '#9ca3af' }}
      >
        {canAfford ? t('rent_7_days') : t('not_enough_ogn')}
      </button>
    );
  };

  // ─── Buy card button ──────────────────────────────────────────────

  const BuyButton = ({ pkg }: { pkg: PkgMeta }) => {
    const owned = isPurchased(pkg.level);
    if (owned) return (
      <div className="w-full py-1.5 rounded-lg text-[10px] font-bold text-center bg-green-50 text-green-700 border border-green-200">
        {t('purchased_status')}
      </div>
    );
    const avaxPrice = prices?.buy[pkg.level] ?? '...';
    return (
      <button
        onClick={() => setBuyTarget(pkg)}
        className="w-full py-1.5 rounded-lg text-[10px] font-bold text-white transition-all active:scale-95"
        style={{ background: pkg.gradient }}
      >
        {t('price_permanent', { price: avaxPrice })}
      </button>
    );
  };

  // ─── Package card ─────────────────────────────────────────────────

  const PkgCard = ({ pkg, renderBtn }: { pkg: PkgMeta; renderBtn: (p: PkgMeta) => React.ReactNode }) => {
    const isActive = effectiveLevel === pkg.level;
    return (
      <div
        className="rounded-xl p-3 relative overflow-hidden transition-all"
        style={{
          background: isActive ? `${pkg.color}08` : 'white',
          boxShadow: isActive
            ? `0 0 0 2px ${pkg.color}, 0 4px 15px ${pkg.color}30`
            : '0 2px 8px rgba(0,0,0,0.07)',
        }}
      >
        {isActive && (
          <span className="absolute top-1.5 right-1.5 text-sm leading-none"
            style={{ filter: `drop-shadow(0 0 4px ${pkg.color})` }}>✅</span>
        )}
        <div className="text-center mb-2">
          <span className="text-2xl block mb-0.5">{pkg.icon}</span>
          <span className="font-heading text-sm font-bold block" style={{ color: pkg.color }}>
            Lv.{pkg.level} {pkg.name}
          </span>
          <span className="text-[9px] text-gray-400">{pkg.algorithm} — {t(pkg.nameKey)}</span>
        </div>
        <ul className="space-y-0.5 mb-2.5">
          {pkg.features.map((f, i) => (
            <li key={i} className="text-[9px] text-gray-600 flex items-start gap-1">
              <span className="text-green-500 mt-px">+</span>{f}
            </li>
          ))}
        </ul>
        {tab === 'rent' && (
          <div className="text-center text-[9px] text-gray-400 mb-1.5">
            {t('rent_price_per_week', { price: prices?.rent[pkg.level]?.toLocaleString() ?? '—' })}
          </div>
        )}
        {renderBtn(pkg)}
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div className="space-y-3">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-base font-bold text-farm-brown-dark flex items-center gap-1.5">
            {currentInfo.icon} Auto-Play AI
          </h2>
          <p className="text-[11px] font-bold mt-0.5" style={{ color: currentInfo.color }}>
            {t('current_using', { level: effectiveLevel, name: t(currentInfo.nameKey), icon: currentInfo.icon })}
            {rentedLevel && daysUntilExpiry !== null && (
              <span className="text-gray-400 font-normal"> {t('rent_remaining_days', { days: daysUntilExpiry })}</span>
            )}
            {purchasedLevel && (
              <span className="text-gray-400 font-normal"> {t('purchased_level_info', { level: purchasedLevel })}</span>
            )}
          </p>
        </div>
        {effectiveLevel >= 5 && (
          <button
            onClick={() => setShowLearning(!showLearning)}
            className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 active:scale-95 transition-transform"
          >
            {showLearning ? '{t('hide')}' : '{t('ai_learning_btn')}'}
          </button>
        )}
      </div>

      {/* Learning summary (Lv5 only) */}
      {showLearning && learningSummary && (
        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-700">{t('self_learning_data')}</span>
            <button
              onClick={() => { resetWeights(); setShowLearning(false); }}
              className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-500 active:scale-95 transition-transform"
            >
              Reset
            </button>
          </div>
          {Object.entries(learningSummary).map(([arch, data]) => (
            <div key={arch} className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-gray-700 capitalize">{arch.replace('_', ' ')}</span>
              <span className="text-gray-500">{data.wins}W/{data.losses}L</span>
              <span className="text-gray-600 font-mono">{data.insights}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl">
        {(['rent', 'buy'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all"
            style={tab === t ? {
              background: 'white',
              color: '#4b5563',
              boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
            } : { color: '#9ca3af' }}
          >
            {t === 'rent' ? t('rent_ogn_tab') : t('buy_avax_tab')}
          </button>
        ))}
      </div>

      {/* OGN balance (rent tab) */}
      {tab === 'rent' && (
        <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-gray-500">
          {t('current_ogn_balance', { balance: ogn.toLocaleString() })}
        </div>
      )}

      {/* Package cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {PACKAGES.map(pkg => (
          <PkgCard
            key={pkg.level}
            pkg={pkg}
            renderBtn={tab === 'rent'
              ? (p) => <RentButton pkg={p} />
              : (p) => <BuyButton pkg={p} />}
          />
        ))}
      </div>

      {/* ── RENT CONFIRM DIALOG ──────────────────────────────────────── */}
      {confirmRent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => setConfirmRent(null)}
        >
          <div
            className="w-full max-w-[300px] bg-white rounded-2xl p-5 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-heading font-bold text-base text-farm-brown-dark mb-3 text-center">
              Xác nhận thuê Auto AI
            </h3>
            <div className="text-center mb-4">
              <span className="text-3xl block">{confirmRent.icon}</span>
              <p className="font-bold mt-1" style={{ color: confirmRent.color }}>
                Lv.{confirmRent.level} {confirmRent.name}
              </p>
              <p className="text-[10px] text-gray-500">{confirmRent.nameVi}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 mb-4 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-500">{t('deduct_label')}</span>
                <span className="font-bold text-orange-600">
                  🪙 {(prices?.rent[confirmRent.level] ?? 0).toLocaleString()} OGN
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('duration_label')}</span>
                <span className="font-bold">{t('duration_7_days')}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1.5">
                <span className="text-gray-500">{t('remaining_ogn_label')}</span>
                <span className="font-bold">
                  🪙 {(ogn - (prices?.rent[confirmRent.level] ?? 0)).toLocaleString()}
                </span>
              </div>
            </div>
            {rentedLevel && rentedLevel !== confirmRent.level && (
              <p className="text-[10px] text-amber-600 bg-amber-50 rounded-lg p-2 mb-3 text-center">
                {t('replace_renting_warning', { level: rentedLevel })}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmRent(null)}
                className="flex-1 py-2.5 rounded-xl text-[12px] font-bold border border-gray-200 text-gray-600 active:scale-95 transition-transform"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmRent}
                disabled={rent.isPending}
                className="flex-1 py-2.5 rounded-xl text-[12px] font-bold text-white active:scale-95 transition-transform disabled:opacity-50"
                style={{ background: confirmRent.gradient }}
              >
                {rent.isPending ? '...' : t('confirm_btn_action')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BUY MODAL ─────────────────────────────────────────────────── */}
      {buyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={buyStep === 'processing' ? undefined : closeBuyModal}
        >
          <div
            className="w-full max-w-[320px] bg-white rounded-2xl p-5 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-heading font-bold text-base text-farm-brown-dark mb-1 text-center">
              Mua Auto AI vĩnh viễn
            </h3>
            <p className="text-center text-[11px] text-gray-500 mb-4">
              <span style={{ color: buyTarget.color }}>{buyTarget.icon} Lv.{buyTarget.level} {buyTarget.name}</span>
              {' '}— {prices?.buy[buyTarget.level] ?? '?'} AVAX
            </p>

            {buyError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-600">
                {buyError}
              </div>
            )}

            {buyStep === 'processing' && (
              <div className="text-center py-6">
                <div className="w-10 h-10 border-3 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-[12px] text-gray-600">{t('processing_payment')}</p>
              </div>
            )}

            {buyStep === 'signing' && userOpHash && (
              <div className="space-y-3">
                <p className="text-[11px] text-gray-600 text-center">
                  {t('fingerprint_auth_prompt', { amount: prices?.buy[buyTarget.level] })}
                </p>
                <button
                  onClick={handleSignSmartWallet}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                >
                  <span className="material-symbols-outlined text-base">fingerprint</span>
                  Xác thực vân tay
                </button>
                <button onClick={() => setBuyStep('options')} className="w-full py-2 text-[11px] text-gray-500">
                  Quay lại
                </button>
              </div>
            )}

            {buyStep === 'options' && !showManual && (
              <div className="space-y-2">
                {/* Custodial wallet */}
                {hasCustodialWallet && custodialWallet?.address && (
                  <>
                    <button
                      onClick={handleBuyCustodial}
                      disabled={buy.isPending}
                      className="w-full py-3 rounded-xl text-white font-bold text-[12px] flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                    >
                      <span className="material-symbols-outlined text-base">account_balance_wallet</span>
                      {t('farmverse_wallet', { balance: parseFloat(custodialWallet.balance || '0').toFixed(4) })}
                    </button>
                    {parseFloat(custodialWallet.balance || '0') < parseFloat(prices?.buy[buyTarget.level] ?? '0') && (
                      <p className="text-[10px] text-red-500 text-center">{t('insufficient_wallet_balance')}</p>
                    )}
                  </>
                )}

                {/* Smart wallet */}
                {hasSmartWallet && walletStatus?.address && prices?.receiverAddress && (
                  <button
                    onClick={handleBuySmartWallet}
                    disabled={isPreparing}
                    className="w-full py-3 rounded-xl text-white font-bold text-[12px] flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                  >
                    {isPreparing ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('preparing_status')}</>
                    ) : (
                      <><span className="material-symbols-outlined text-base">fingerprint</span>{t('smart_wallet_btn')}</>
                    )}
                  </button>
                )}

                {/* MetaMask/Core */}
                {hasWalletExtension() && prices?.receiverAddress && (
                  <button
                    onClick={handleBuyExtension}
                    className="w-full py-3 rounded-xl text-white font-bold text-[12px] flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    style={{ background: '#f97316' }}
                  >
                    <span className="material-symbols-outlined text-base">account_balance_wallet</span>
                    MetaMask / Core
                  </button>
                )}

                {/* Manual */}
                <button
                  onClick={() => setShowManual(true)}
                  className="w-full py-2.5 rounded-xl text-[11px] font-bold border-2 border-gray-200 text-gray-600 active:scale-95 transition-transform"
                >
                  Gửi từ ví khác (nhập txHash)
                </button>

                <button onClick={closeBuyModal} className="w-full py-2 text-[11px] text-gray-400">
                  Hủy
                </button>
              </div>
            )}

            {buyStep === 'options' && showManual && (
              <div className="space-y-3">
                {prices?.receiverAddress && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-[10px]">
                    <p className="font-bold text-green-700 mb-1">
                      {t('manual_step1', { amount: prices.buy[buyTarget.level] })}
                    </p>
                    <code className="block bg-white rounded p-2 break-all text-gray-600 font-mono">
                      {prices.receiverAddress}
                    </code>
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-bold text-gray-600 mb-1">{t('manual_step2')}</p>
                  <input
                    type="text"
                    value={manualTxHash}
                    onChange={e => setManualTxHash(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
                <button
                  onClick={handleVerifyManual}
                  disabled={!manualTxHash.trim() || buy.isPending}
                  className="w-full py-2.5 rounded-xl text-white font-bold text-[12px] active:scale-95 transition-transform disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                >
                  {buy.isPending ? t('verifying_status') : t('verify_tx_btn')}
                </button>
                <button
                  onClick={() => setShowManual(false)}
                  className="w-full py-2 text-[11px] text-gray-400"
                >
                  Quay lại
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
