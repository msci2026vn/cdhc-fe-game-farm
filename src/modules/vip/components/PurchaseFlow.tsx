import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import type { VipPlan, VipOrder, VipVerifyResult } from '@/shared/types/game-api.types';
import { useVipStatus } from '@/shared/hooks/useVipStatus';
import { useVipPlans, useCreateVipOrder, useVerifyVipPayment } from '@/shared/hooks/useVipPayment';
import { useSmartWallet } from '@/shared/hooks/useSmartWallet';
import { useCustodialWallet } from '@/shared/hooks/useCustodialWallet';
import { gameApi } from '@/shared/api/game-api';
import { VipPlanCard } from './VipPlanCard';
import {
  hasWalletExtension,
  sendViaWalletExtension,
  prepareSmartWalletOp,
  signAndSubmitSmartWalletOp,
} from '../utils/sendAvaxPayment';

type Step = 'select' | 'confirm' | 'signing' | 'processing' | 'success';

function formatCountdown(seconds: number) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function PurchaseFlow() {
  const [step, setStep] = useState<Step>('select');
  const [selectedPlan, setSelectedPlan] = useState<VipPlan | null>(null);
  const [order, setOrder] = useState<VipOrder | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<VipVerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualTxHash, setManualTxHash] = useState('');

  // Smart wallet countdown state
  const [userOpHash, setUserOpHash] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiresAtRef = useRef<number>(0);

  const { plans, isVip, tier, isLoading: isStatusLoading } = useVipStatus();
  const { isLoading: isPlansLoading } = useVipPlans();
  const createOrder = useCreateVipOrder();
  const verifyPayment = useVerifyVipPayment();
  const { walletStatus, hasWallet } = useSmartWallet();
  const { wallet: custodialWallet, hasWallet: hasCustodialWallet } = useCustodialWallet();
  const [isPayingCustodial, setIsPayingCustodial] = useState(false);

  const isLoading = isStatusLoading || isPlansLoading;

  // Smart wallet has enough balance?
  const smartWalletBalance = parseFloat(walletStatus?.balance || '0');
  const canPayWithSmartWallet =
    hasWallet &&
    walletStatus?.address &&
    selectedPlan &&
    smartWalletBalance >= parseFloat(selectedPlan.priceAvax);

  // Custodial wallet has enough balance?
  const custodialBalance = parseFloat(custodialWallet?.balance || '0');
  const canPayWithCustodial =
    hasCustodialWallet &&
    custodialWallet?.address &&
    selectedPlan &&
    custodialBalance >= parseFloat(selectedPlan.priceAvax);

  // Custodial wallet payment handler
  const handlePayCustodial = async () => {
    if (!selectedPlan) return;
    setIsPayingCustodial(true);
    setError(null);

    try {
      // 1. Create order
      const newOrder = await createOrder.mutateAsync(selectedPlan.id);
      setOrder(newOrder);
      setStep('processing');
      setProgress(2);

      // 2. Pay via custodial wallet
      const payResult = await gameApi.payVipCustodial(newOrder.orderId);
      setProgress(3);

      // 3. Verify payment
      const verifyResult = await verifyPayment.mutateAsync({
        orderId: newOrder.orderId,
        txHash: payResult.txHash,
      });
      setProgress(4);

      setResult(verifyResult);
      setStep('success');
      toast.success('VIP đã kích hoạt!');
    } catch (err: any) {
      setError(err.message || 'Thanh toán thất bại');
      setStep('confirm');
    } finally {
      setIsPayingCustodial(false);
    }
  };

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const stopCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(null);
  }, []);

  const startCountdown = useCallback((expiresAtMs: number) => {
    stopCountdown();
    expiresAtRef.current = expiresAtMs;

    const tick = () => {
      const remaining = Math.max(0, Math.floor((expiresAtRef.current - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };

    tick(); // immediate first tick
    countdownRef.current = setInterval(tick, 1000);
  }, [stopCountdown]);

  // Step 1: Select plan
  const handleSelectPlan = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    setSelectedPlan(plan);
    setError(null);
    setStep('confirm');
  };

  // Smart Wallet: Prepare UserOp + start countdown
  const handlePrepareSmartWallet = async () => {
    if (!selectedPlan) return;
    setIsPreparing(true);
    setError(null);

    try {
      // 1. Create order
      const newOrder = await createOrder.mutateAsync(selectedPlan.id);
      setOrder(newOrder);

      // 2. Prepare UserOp
      const prepResult = await prepareSmartWalletOp(
        newOrder.receiverAddress,
        newOrder.amountAvax
      );

      setUserOpHash(prepResult.userOpHash);
      startCountdown(prepResult.expiresAt);
      setStep('signing');
    } catch (err: any) {
      setError(err.message || 'Không thể tạo giao dịch');
    } finally {
      setIsPreparing(false);
    }
  };

  // Smart Wallet: Re-prepare (when expired)
  const handleRePrepare = async () => {
    if (!order) return;
    setIsPreparing(true);
    setError(null);

    try {
      const prepResult = await prepareSmartWalletOp(
        order.receiverAddress,
        order.amountAvax
      );

      setUserOpHash(prepResult.userOpHash);
      startCountdown(prepResult.expiresAt);
      toast.success('Giao dịch đã được tạo lại');
    } catch (err: any) {
      setError(err.message || 'Không thể tạo lại giao dịch');
    } finally {
      setIsPreparing(false);
    }
  };

  // Smart Wallet: Sign with passkey + submit
  const handleSignAndSubmit = async () => {
    if (!userOpHash || !order) return;
    setStep('processing');
    setProgress(2);
    setError(null);
    stopCountdown();

    try {
      const txHash = await signAndSubmitSmartWalletOp(userOpHash);
      setProgress(3);

      // Verify payment
      const verifyResult = await verifyPayment.mutateAsync({
        orderId: order.orderId,
        txHash,
      });
      setProgress(4);

      setResult(verifyResult);
      setStep('success');
      toast.success('VIP đã kích hoạt!');
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('hủy') || msg.includes('denied') || msg.includes('User rejected')) {
        setError('Bạn đã hủy xác thực vân tay');
        setStep('signing'); // Go back to signing step, countdown still valid
        startCountdown(expiresAtRef.current); // Resume countdown
      } else if (msg.includes('hết hạn') || msg.includes('EXPIRED') || msg.includes('expired')) {
        setError('Giao dịch đã hết hạn. Bấm "Tạo lại" để thử lại.');
        setStep('signing');
        setCountdown(0);
      } else {
        setError(msg || 'Lỗi Smart Wallet');
        setStep('signing');
        startCountdown(expiresAtRef.current);
      }
    }
  };

  // Generic purchase handler (for MetaMask/Core only)
  const executePurchase = async (
    sendFn: (to: string, amount: string) => Promise<string>,
    label: string
  ) => {
    if (!selectedPlan) return;
    setStep('processing');
    setProgress(1);
    setError(null);

    try {
      // 1. Create order
      const newOrder = await createOrder.mutateAsync(selectedPlan.id);
      setOrder(newOrder);
      setProgress(2);

      // 2. Send AVAX
      const txHash = await sendFn(newOrder.receiverAddress, newOrder.amountAvax);
      setProgress(3);

      // 3. Verify payment
      const verifyResult = await verifyPayment.mutateAsync({
        orderId: newOrder.orderId,
        txHash,
      });
      setProgress(4);

      // 4. Done
      setResult(verifyResult);
      setStep('success');
      toast.success('VIP đã kích hoạt!');
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('User rejected') || msg.includes('denied') || msg.includes('hủy')) {
        setError('Bạn đã hủy giao dịch');
      } else {
        setError(msg || `Lỗi ${label}`);
      }
      setStep('confirm');
    }
  };

  // Payment handlers
  const handlePurchaseWithExtension = () =>
    executePurchase(sendViaWalletExtension, 'MetaMask/Core');

  // Manual flow: create order first
  const handleStartManual = async () => {
    if (!selectedPlan) return;
    setError(null);

    try {
      const newOrder = await createOrder.mutateAsync(selectedPlan.id);
      setOrder(newOrder);
      setManualMode(true);
    } catch (err: any) {
      setError(err.message || 'Không thể tạo đơn hàng');
    }
  };

  // Manual flow: verify txHash
  const handleVerifyManual = async () => {
    if (!order || !manualTxHash.trim()) return;
    setStep('processing');
    setProgress(3);
    setError(null);

    try {
      const verifyResult = await verifyPayment.mutateAsync({
        orderId: order.orderId,
        txHash: manualTxHash.trim(),
      });
      setProgress(4);
      setResult(verifyResult);
      setStep('success');
      toast.success('VIP đã kích hoạt!');
    } catch (err: any) {
      setError(err.message || 'Không thể xác nhận giao dịch');
      setStep('confirm');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép!');
  };

  const handleReset = () => {
    stopCountdown();
    setStep('select');
    setSelectedPlan(null);
    setOrder(null);
    setProgress(0);
    setResult(null);
    setError(null);
    setManualMode(false);
    setManualTxHash('');
    setUserOpHash(null);
  };

  // ─── Step 1: SELECT PLAN ───
  if (step === 'select') {
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-3 border-green-200 border-t-green-600 rounded-full animate-spin" />
        </div>
      );
    }

    if (!plans || plans.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 text-sm">
          Không có gói VIP nào.
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        {plans.map((plan) => (
          <VipPlanCard
            key={plan.id}
            plan={plan}
            onSelect={handleSelectPlan}
            isCurrentPlan={isVip && tier === plan.tier}
          />
        ))}
      </div>
    );
  }

  // ─── Step 2: CONFIRM ───
  if (step === 'confirm' && selectedPlan) {
    const isPending = createOrder.isPending || verifyPayment.isPending || isPreparing;

    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border-2 border-green-200 p-5 shadow-sm">
          <h3 className="font-heading font-bold text-lg text-farm-brown-dark mb-4">
            Xác nhận thanh toán
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Gói:</span>
              <span className="font-bold text-farm-brown-dark">{selectedPlan.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Giá:</span>
              <span className="font-bold text-green-700">{selectedPlan.priceAvax} AVAX</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Thời hạn:</span>
              <span className="font-bold text-farm-brown-dark">{selectedPlan.durationDays} ngày</span>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-500 mb-1">Gửi đến:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-xs bg-gray-100 px-3 py-2 rounded-lg truncate">
                  {selectedPlan.receiverAddress || '...'}
                </code>
                {selectedPlan.receiverAddress && (
                  <button
                    onClick={() => copyToClipboard(selectedPlan.receiverAddress)}
                    className="shrink-0 p-2 rounded-lg bg-gray-100 active:bg-gray-200 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                  </button>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Avalanche C-Chain ({selectedPlan.chainId || 43114})
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs text-amber-700">
              <span className="font-bold">Lưu ý:</span> Sau khi gửi AVAX, hệ thống tự xác nhận trên blockchain.
            </p>
          </div>

          {/* Payment methods */}
          {!manualMode ? (
            <div className="mt-4 space-y-2">
              {/* Option 1: Smart Wallet (highest priority) */}
              {hasWallet && walletStatus?.address && (
                <button
                  onClick={handlePrepareSmartWallet}
                  disabled={isPending || !canPayWithSmartWallet}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 active:from-green-800 active:to-emerald-800 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang chuẩn bị...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">fingerprint</span>
                      Gửi {selectedPlan.priceAvax} AVAX (Smart Wallet)
                    </>
                  )}
                </button>
              )}

              {/* Smart wallet balance info */}
              {hasWallet && walletStatus?.address && (
                <p className={`text-[10px] text-center ${canPayWithSmartWallet ? 'text-green-600' : 'text-red-500'}`}>
                  Số dư Smart Wallet: {walletStatus.balance || '0'} AVAX
                  {!canPayWithSmartWallet && ' (không đủ)'}
                </p>
              )}

              {/* Option 1.5: Custodial Wallet (Ví FARMVERSE) */}
              {hasCustodialWallet && custodialWallet?.address && (
                <button
                  onClick={handlePayCustodial}
                  disabled={isPending || isPayingCustodial || !canPayWithCustodial}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-farm-green-light to-farm-green-dark hover:from-green-700 hover:to-emerald-800 active:from-green-800 active:to-emerald-900 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPayingCustodial ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang thanh toán...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">account_balance_wallet</span>
                      Gửi {selectedPlan.priceAvax} AVAX (Ví FARMVERSE)
                    </>
                  )}
                </button>
              )}

              {/* Custodial wallet balance info */}
              {hasCustodialWallet && custodialWallet?.address && (
                <p className={`text-[10px] text-center ${canPayWithCustodial ? 'text-green-600' : 'text-red-500'}`}>
                  Số dư Ví FARMVERSE: {parseFloat(custodialWallet.balance || '0').toFixed(6)} AVAX
                  {!canPayWithCustodial && ' (không đủ)'}
                </p>
              )}

              {/* Option 2: MetaMask/Core */}
              {hasWalletExtension() && (
                <button
                  onClick={handlePurchaseWithExtension}
                  disabled={isPending}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm bg-green-600 hover:bg-green-700 active:bg-green-800 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">account_balance_wallet</span>
                      Gửi {selectedPlan.priceAvax} AVAX (MetaMask/Core)
                    </>
                  )}
                </button>
              )}

              {/* Option 3: Manual (always available) */}
              <button
                onClick={handleStartManual}
                disabled={isPending}
                className="w-full py-3 rounded-xl font-bold text-sm border-2 border-green-200 text-green-700 bg-green-50 hover:bg-green-100 active:bg-green-200 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isPending ? 'Đang tạo đơn...' : 'Gửi từ ví khác (Copy địa chỉ)'}
              </button>

              <button
                onClick={handleReset}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Quay lại
              </button>
            </div>
          ) : (
            /* Manual mode: show address + txHash input */
            <div className="mt-4 space-y-3">
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-xs font-bold text-green-700 mb-2">
                  Bước 1: Gửi {order?.amountAvax || selectedPlan.priceAvax} AVAX đến địa chỉ trên
                </p>
                <p className="text-xs text-green-600 mb-3">
                  Dùng MetaMask, Core Wallet, hoặc sàn giao dịch (Binance, OKX...)
                </p>
                <p className="text-xs font-bold text-green-700 mb-1">
                  Bước 2: Dán Transaction Hash (txHash) bên dưới
                </p>
                <input
                  type="text"
                  value={manualTxHash}
                  onChange={(e) => setManualTxHash(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 rounded-lg border border-green-300 bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <button
                onClick={handleVerifyManual}
                disabled={!manualTxHash.trim() || verifyPayment.isPending}
                className="w-full py-3 rounded-xl text-white font-bold text-sm bg-green-600 hover:bg-green-700 active:bg-green-800 transition-all shadow-md disabled:opacity-50"
              >
                {verifyPayment.isPending ? 'Đang xác nhận...' : 'Xác nhận giao dịch'}
              </button>

              <button
                onClick={() => {
                  setManualMode(false);
                  setManualTxHash('');
                }}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Quay lại
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Step 2.5: SIGNING (Smart Wallet — countdown + fingerprint) ───
  if (step === 'signing' && selectedPlan) {
    const isExpired = countdown !== null && countdown <= 0;

    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border-2 border-green-200 p-5 shadow-sm">
          <h3 className="font-heading font-bold text-lg text-farm-brown-dark mb-2">
            Xác thực thanh toán
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Gửi {order?.amountAvax || selectedPlan.priceAvax} AVAX qua Smart Wallet
          </p>

          {/* Countdown timer */}
          {countdown !== null && (
            <div className={`text-center p-3 rounded-xl mb-4 ${
              isExpired
                ? 'bg-red-50 border border-red-200'
                : countdown < 60
                  ? 'bg-amber-50 border border-amber-200'
                  : 'bg-gray-50 border border-gray-200'
            }`}>
              {isExpired ? (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-red-600">Giao dịch đã hết hạn</p>
                  <button
                    onClick={handleRePrepare}
                    disabled={isPreparing}
                    className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600 active:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isPreparing ? 'Đang tạo lại...' : 'Tạo lại giao dịch'}
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-[10px] text-gray-500 mb-1">Thời gian còn lại</p>
                  <p className={`text-2xl font-mono font-bold ${
                    countdown < 60 ? 'text-red-600' : 'text-farm-brown-dark'
                  }`}>
                    {formatCountdown(countdown)}
                  </p>
                  {countdown < 60 && (
                    <p className="text-[10px] text-red-500 mt-1">Sắp hết hạn!</p>
                  )}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Sign button */}
          {!isExpired && (
            <button
              onClick={handleSignAndSubmit}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 active:from-green-800 active:to-emerald-800 transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-xl">fingerprint</span>
              Xác thực vân tay để gửi
            </button>
          )}

          <button
            onClick={handleReset}
            className="w-full py-2 mt-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Hủy
          </button>
        </div>
      </div>
    );
  }

  // ─── Step 3: PROCESSING ───
  if (step === 'processing') {
    const steps = [
      { label: 'Tạo đơn hàng', done: progress >= 1 },
      { label: 'Gửi AVAX', done: progress >= 2 },
      { label: 'Xác nhận trên blockchain', done: progress >= 3 },
      { label: 'Kích hoạt VIP', done: progress >= 4 },
    ];

    return (
      <div className="bg-white rounded-2xl border-2 border-green-200 p-6 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 border-3 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-3" />
          <h3 className="font-heading font-bold text-lg text-farm-brown-dark">
            Đang xử lý...
          </h3>
        </div>

        <div className="space-y-3">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              {s.done ? (
                <span className="material-symbols-outlined text-green-600">check_circle</span>
              ) : i === progress ? (
                <div className="w-5 h-5 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-gray-300">radio_button_unchecked</span>
              )}
              <span
                className={`text-sm ${s.done ? 'text-green-700 font-bold' : i === progress ? 'text-farm-brown-dark font-medium animate-pulse' : 'text-gray-400'}`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Step 4: SUCCESS ───
  if (step === 'success' && result) {
    const expiresDate = result.subscription?.expiresAt
      ? new Date(result.subscription.expiresAt).toLocaleDateString('vi-VN')
      : '';

    return (
      <div className="bg-green-50 rounded-2xl border-2 border-green-200 p-6 shadow-sm text-center">
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="font-heading font-bold text-xl text-green-800 mb-2">Chúc mừng!</h3>
        <p className="text-sm text-green-700 mb-4">
          VIP <strong>{selectedPlan?.name}</strong> đã kích hoạt!
        </p>

        <div className="bg-white rounded-xl p-4 text-left space-y-2 mb-4 border border-green-200">
          {result.subscription?.tier && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tier:</span>
              <span className="font-bold capitalize text-green-700">{result.subscription.tier}</span>
            </div>
          )}
          {expiresDate && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Hết hạn:</span>
              <span className="font-bold text-farm-brown-dark">{expiresDate}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">OGN:</span>
            <span className="font-bold text-green-700">x{selectedPlan?.ognMultiplier}</span>
          </div>

          {result.txHash && (
            <div className="border-t border-gray-100 pt-2">
              <p className="text-xs text-gray-500 mb-1">TX Hash:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-[10px] bg-gray-100 px-2 py-1.5 rounded truncate">
                  {result.txHash}
                </code>
                <button
                  onClick={() => copyToClipboard(result.txHash)}
                  className="shrink-0 p-1.5 rounded bg-gray-100"
                >
                  <span className="material-symbols-outlined text-xs">content_copy</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {result.explorerUrl && (
          <a
            href={result.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mb-4"
          >
            <span className="material-symbols-outlined text-sm">open_in_new</span>
            Xem trên Snowtrace
          </a>
        )}

        <button
          onClick={handleReset}
          className="w-full py-3 rounded-xl text-white font-bold text-sm bg-green-600 hover:bg-green-700 transition-all shadow-md mt-2"
        >
          Hoàn tất
        </button>
      </div>
    );
  }

  return null;
}
