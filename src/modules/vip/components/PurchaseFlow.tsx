import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import type { VipPlan, VipOrder, VipVerifyResult } from '@/shared/types/game-api.types';
import { useVipStatus } from '@/shared/hooks/useVipStatus';
import { useVipPlans, useCreateVipOrder, useVerifyVipPayment } from '@/shared/hooks/useVipPayment';

import { useCustodialWallet } from '@/shared/hooks/useCustodialWallet';
import { gameApi } from '@/shared/api/game-api';
import {
  hasWalletExtension,
  sendViaWalletExtension,
} from '../utils/sendAvaxPayment';

// Flow steps
import { StepSelectPlan } from './flow-steps/StepSelectPlan';
import { StepConfirmPayment } from './flow-steps/StepConfirmPayment';

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



  const { plans, isVip, tier, isLoading: isStatusLoading } = useVipStatus();
  const { isLoading: isPlansLoading } = useVipPlans();
  const createOrder = useCreateVipOrder();
  const verifyPayment = useVerifyVipPayment();

  const { wallet: custodialWallet, hasWallet: hasCustodialWallet } = useCustodialWallet();
  const [isPayingCustodial, setIsPayingCustodial] = useState(false);

  const isLoading = isStatusLoading || isPlansLoading;



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

      // 2. Pay via custodial wallet (BE sends TX + waits receipt + activates VIP)
      const payResult = await gameApi.payVipCustodial(newOrder.orderId);
      setProgress(5);

      // payVipCustodial already verifies + activates — map to VipVerifyResult
      setResult({
        status: payResult.status,
        orderId: newOrder.orderId,
        txHash: payResult.txHash,
        subscription: (payResult as any).subscription,
        explorerUrl: (payResult as any).explorerUrl,
      } as any);
      setStep('success');
      toast.success('VIP đã kích hoạt!');
    } catch (err: any) {
      setError(err.message || 'Thanh toán thất bại');
      setStep('confirm');
    } finally {
      setIsPayingCustodial(false);
    }
  };



  // Step 1: Select plan
  const handleSelectPlan = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    setSelectedPlan(plan);
    setError(null);
    setStep('confirm');
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

      // 2. Send AVAX (sendFn now waits for TX to be mined)
      setProgress(2);
      const txHash = await sendFn(newOrder.receiverAddress, newOrder.amountAvax);
      setProgress(3); // TX mined

      // 3. Verify payment on backend
      setProgress(4);
      const verifyResult = await verifyPayment.mutateAsync({
        orderId: newOrder.orderId,
        txHash,
      });
      setProgress(5);

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
    setStep('select');
    setSelectedPlan(null);
    setOrder(null);
    setProgress(0);
    setResult(null);
    setError(null);
    setManualMode(false);
    setManualTxHash('');
  };

  const isPending = createOrder.isPending || verifyPayment.isPending;

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
