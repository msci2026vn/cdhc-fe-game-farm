import React from 'react';
import type { VipPlan, VipOrder } from '@/shared/types/game-api.types';

interface Props {
    selectedPlan: VipPlan;
    order: VipOrder | null;
    error: string | null;
    isPending: boolean;
    manualMode: boolean;
    hasWallet: boolean;
    walletStatus: any;
    canPayWithSmartWallet: boolean;
    handlePrepareSmartWallet: () => void;
    hasCustodialWallet: boolean;
    custodialWallet: any;
    canPayWithCustodial: boolean;
    isPayingCustodial: boolean;
    handlePayCustodial: () => void;
    hasWalletExtension: () => boolean;
    handlePurchaseWithExtension: () => void;
    handleStartManual: () => void;
    handleReset: () => void;
    manualTxHash: string;
    setManualTxHash: (hash: string) => void;
    handleVerifyManual: () => void;
    verifyPaymentIsPending: boolean;
    copyToClipboard: (text: string) => void;
}

export function StepConfirmPayment({
    selectedPlan,
    order,
    error,
    isPending,
    manualMode,
    hasWallet,
    walletStatus,
    canPayWithSmartWallet,
    handlePrepareSmartWallet,
    hasCustodialWallet,
    custodialWallet,
    canPayWithCustodial,
    isPayingCustodial,
    handlePayCustodial,
    hasWalletExtension,
    handlePurchaseWithExtension,
    handleStartManual,
    handleReset,
    manualTxHash,
    setManualTxHash,
    handleVerifyManual,
    verifyPaymentIsPending,
    copyToClipboard,
}: Props) {
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
                            disabled={!manualTxHash.trim() || verifyPaymentIsPending}
                            className="w-full py-3 rounded-xl text-white font-bold text-sm bg-green-600 hover:bg-green-700 active:bg-green-800 transition-all shadow-md disabled:opacity-50"
                        >
                            {verifyPaymentIsPending ? 'Đang xác nhận...' : 'Xác nhận giao dịch'}
                        </button>

                        <button
                            onClick={() => {
                                handleReset(); // Adjust logic if you want to partially step back, but reset works
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
