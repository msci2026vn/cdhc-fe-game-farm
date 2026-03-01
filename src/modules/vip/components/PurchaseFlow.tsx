import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import type { VipPlan, VipOrder, VipVerifyResult } from '@/shared/types/game-api.types';
import { useVipStatus } from '@/shared/hooks/useVipStatus';
import { useVipPlans, useCreateVipOrder, useVerifyVipPayment } from '@/shared/hooks/useVipPayment';
import { useSmartWallet } from '@/shared/hooks/useSmartWallet';
import { useCustodialWallet } from '@/shared/hooks/useCustodialWallet';
import { gameApi } from '@/shared/api/game-api';
import {
  hasWalletExtension,
  sendViaWalletExtension,
  prepareSmartWalletOp,
  signAndSubmitSmartWalletOp,
} from '../utils/sendAvaxPayment';

// Flow steps
import { StepSelectPlan } from './flow-steps/StepSelectPlan';
import { StepConfirmPayment } from './flow-steps/StepConfirmPayment';
import { StepSigningWallet } from './flow-steps/StepSigningWallet';
import { StepProcessing } from './flow-steps/StepProcessing';
import { StepSuccess } from './flow-steps/StepSuccess';

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

  const isPending = createOrder.isPending || verifyPayment.isPending || isPreparing;

  // ─── Step 1: SELECT PLAN ───
  if (step === 'select') {
    return (
      <StepSelectPlan
        isLoading={isLoading}
        plans={plans}
        isVip={isVip}
        tier={tier}
        onSelectPlan={handleSelectPlan}
      />
    );
  }

  // ─── Step 2: CONFIRM ───
  if (step === 'confirm' && selectedPlan) {
    return (
      <StepConfirmPayment
        selectedPlan={selectedPlan}
        order={order}
        error={error}
        isPending={isPending}
        manualMode={manualMode}
        hasWallet={hasWallet}
        walletStatus={walletStatus}
        canPayWithSmartWallet={!!canPayWithSmartWallet}
        handlePrepareSmartWallet={handlePrepareSmartWallet}
        hasCustodialWallet={hasCustodialWallet}
        custodialWallet={custodialWallet}
        canPayWithCustodial={!!canPayWithCustodial}
        isPayingCustodial={isPayingCustodial}
        handlePayCustodial={handlePayCustodial}
        hasWalletExtension={hasWalletExtension}
        handlePurchaseWithExtension={handlePurchaseWithExtension}
        handleStartManual={handleStartManual}
        handleReset={handleReset}
        manualTxHash={manualTxHash}
        setManualTxHash={setManualTxHash}
        handleVerifyManual={handleVerifyManual}
        verifyPaymentIsPending={verifyPayment.isPending}
        copyToClipboard={copyToClipboard}
      />
    );
  }

  // ─── Step 2.5: SIGNING (Smart Wallet — countdown + fingerprint) ───
  if (step === 'signing' && selectedPlan) {
    return (
      <StepSigningWallet
        selectedPlan={selectedPlan}
        order={order}
        countdown={countdown}
        error={error}
        isPreparing={isPreparing}
        handleRePrepare={handleRePrepare}
        handleSignAndSubmit={handleSignAndSubmit}
        handleReset={handleReset}
        formatCountdown={formatCountdown}
      />
    );
  }

  // ─── Step 3: PROCESSING ───
  if (step === 'processing') {
    return <StepProcessing progress={progress} />;
  }

  // ─── Step 4: SUCCESS ───
  if (step === 'success' && result && selectedPlan) {
    return (
      <StepSuccess
        selectedPlan={selectedPlan}
        result={result}
        handleReset={handleReset}
        copyToClipboard={copyToClipboard}
      />
    );
  }

  return null;
}
