// ═══════════════════════════════════════════════════════════════
// AutoPlayShopSection — 2 tabs: Thuê OGN / Mua AVAX (B3)
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
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
  nameVi: string;
  algorithm: string;
  features: string[];
  color: string;
  gradient: string;
  icon: string;
}

const PACKAGES: PkgMeta[] = [
  {
    level: 2, name: 'Basic', nameVi: 'Thông minh', algorithm: 'Greedy',
    features: ['Weighted scoring', 'Situation awareness'],
    color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', icon: '🧠',
  },
  {
    level: 3, name: 'Advanced', nameVi: 'Nâng cao', algorithm: 'Cascade',
    features: ['Cascade simulation', 'Auto-dodge', 'Auto kỹ năng'],
    color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', icon: '⚡',
  },
  {
    level: 4, name: 'Pro', nameVi: 'Chuyên gia', algorithm: 'MCTS 30',
    features: ['Monte Carlo search', 'Auto-ULT timing', '30 simulations'],
    color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)', icon: '🎯',
  },
  {
    level: 5, name: 'Elite', nameVi: 'Tối thượng', algorithm: 'MCTS 80',
    features: ['80 simulations', 'Toàn bộ kỹ năng', 'Self-learning AI'],
    color: '#ec4899', gradient: 'linear-gradient(135deg, #ef4444, #ec4899, #8b5cf6)', icon: '🧠✨',
  },
];

const LEVEL_INFO: Record<number, { nameVi: string; icon: string; color: string }> = {
  1: { nameVi: 'Cơ bản', icon: '🤖', color: '#9ca3af' },
  2: { nameVi: 'Thông minh', icon: '🧠', color: '#3b82f6' },
  3: { nameVi: 'Nâng cao', icon: '⚡', color: '#8b5cf6' },
  4: { nameVi: 'Chuyên gia', icon: '🎯', color: '#f59e0b' },
  5: { nameVi: 'Tối thượng', icon: '🧠✨', color: '#ec4899' },
};

type BuyStep = 'options' | 'signing' | 'processing';

// ─── Main component ───────────────────────────────────────────────

export default function AutoPlayShopSection() {
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
        setBuyError(err.message || 'Thanh toán thất bại');
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
      setBuyError(err.message || 'Không thể chuẩn bị giao dịch');
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
          setBuyError(err.message || 'Lỗi xác nhận giao dịch');
          setBuyStep('options');
        },
      });
    } catch (err: any) {
      setBuyError(err.message || 'Lỗi Smart Wallet');
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
          setBuyError(err.message || 'Lỗi xác nhận giao dịch');
          setBuyStep('options');
        },
      });
    } catch (err: any) {
      setBuyError(err.message || 'Giao dịch thất bại');
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
        setBuyError(err.message || 'Xác minh thất bại');
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
        Đã mua vĩnh viễn ✅
      </div>
    );
    if (rented) return (
      <div className="w-full py-1.5 rounded-lg text-[10px] font-bold text-center"
        style={{ background: `${pkg.color}15`, color: pkg.color, border: `1px solid ${pkg.color}40` }}>
        Đang thuê ✅{daysUntilExpiry !== null ? ` (${daysUntilExpiry}d)` : ''}
      </div>
    );
    return (
      <button
        onClick={() => canAfford ? setConfirmRent(pkg) : toast.error('Không đủ OGN')}
        disabled={rent.isPending}
        className="w-full py-1.5 rounded-lg text-[10px] font-bold text-white transition-all active:scale-95 disabled:opacity-50"
        style={{ background: canAfford ? pkg.gradient : '#9ca3af' }}
      >
        {canAfford ? `Thuê 7 ngày` : 'Không đủ OGN'}
      </button>
    );
  };

  // ─── Buy card button ──────────────────────────────────────────────

  const BuyButton = ({ pkg }: { pkg: PkgMeta }) => {
    const owned = isPurchased(pkg.level);
    if (owned) return (
      <div className="w-full py-1.5 rounded-lg text-[10px] font-bold text-center bg-green-50 text-green-700 border border-green-200">
        Đã mua ✅
      </div>
    );
    const avaxPrice = prices?.buy[pkg.level] ?? '...';
    return (
      <button
        onClick={() => setBuyTarget(pkg)}
        className="w-full py-1.5 rounded-lg text-[10px] font-bold text-white transition-all active:scale-95"
        style={{ background: pkg.gradient }}
      >
        {avaxPrice} AVAX — Vĩnh viễn
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
          <span className="text-[9px] text-gray-400">{pkg.algorithm} — {pkg.nameVi}</span>
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
            🪙 {prices?.rent[pkg.level]?.toLocaleString() ?? '—'} OGN / tuần
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
            Đang dùng: Lv.{effectiveLevel} {currentInfo.nameVi} {currentInfo.icon}
            {rentedLevel && daysUntilExpiry !== null && (
              <span className="text-gray-400 font-normal"> · Thuê còn {daysUntilExpiry}d</span>
            )}
            {purchasedLevel && (
              <span className="text-gray-400 font-normal"> · Mua: Lv.{purchasedLevel}</span>
            )}
          </p>
        </div>
        {effectiveLevel >= 5 && (
          <button
            onClick={() => setShowLearning(!showLearning)}
            className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 active:scale-95 transition-transform"
          >
            {showLearning ? 'Hide' : '📚 AI Learning'}
          </button>
        )}
      </div>

      {/* Learning summary (Lv5 only) */}
      {showLearning && learningSummary && (
        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-700">Self-Learning Data</span>
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
            {t === 'rent' ? '🪙 Thuê OGN' : '💎 Mua AVAX'}
          </button>
        ))}
      </div>

      {/* OGN balance (rent tab) */}
      {tab === 'rent' && (
        <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-gray-500">
          OGN hiện có: 🪙 {ogn.toLocaleString()}
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
                <span className="text-gray-500">Trừ:</span>
                <span className="font-bold text-orange-600">
                  🪙 {(prices?.rent[confirmRent.level] ?? 0).toLocaleString()} OGN
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Thời hạn:</span>
                <span className="font-bold">7 ngày</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1.5">
                <span className="text-gray-500">OGN còn lại:</span>
                <span className="font-bold">
                  🪙 {(ogn - (prices?.rent[confirmRent.level] ?? 0)).toLocaleString()}
                </span>
              </div>
            </div>
            {rentedLevel && rentedLevel !== confirmRent.level && (
              <p className="text-[10px] text-amber-600 bg-amber-50 rounded-lg p-2 mb-3 text-center">
                ⚠️ Sẽ thay thế thuê Lv.{rentedLevel} hiện tại
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
                {rent.isPending ? '...' : '✅ Xác nhận'}
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
                <p className="text-[12px] text-gray-600">Đang xử lý thanh toán...</p>
              </div>
            )}

            {buyStep === 'signing' && userOpHash && (
              <div className="space-y-3">
                <p className="text-[11px] text-gray-600 text-center">
                  Xác thực vân tay để gửi {prices?.buy[buyTarget.level]} AVAX
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
                      Ví FARMVERSE ({parseFloat(custodialWallet.balance || '0').toFixed(4)} AVAX)
                    </button>
                    {parseFloat(custodialWallet.balance || '0') < parseFloat(prices?.buy[buyTarget.level] ?? '0') && (
                      <p className="text-[10px] text-red-500 text-center">Số dư ví không đủ</p>
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
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Đang chuẩn bị...</>
                    ) : (
                      <><span className="material-symbols-outlined text-base">fingerprint</span>Smart Wallet</>
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
                      Bước 1: Gửi {prices.buy[buyTarget.level]} AVAX đến:
                    </p>
                    <code className="block bg-white rounded p-2 break-all text-gray-600 font-mono">
                      {prices.receiverAddress}
                    </code>
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-bold text-gray-600 mb-1">Bước 2: Nhập Transaction Hash:</p>
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
                  {buy.isPending ? 'Đang xác nhận...' : 'Xác nhận giao dịch'}
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
