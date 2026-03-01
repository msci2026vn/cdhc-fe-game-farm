import React from 'react';
import type { VipPlan, VipOrder } from '@/shared/types/game-api.types';

interface Props {
    selectedPlan: VipPlan;
    order: VipOrder | null;
    countdown: number | null;
    error: string | null;
    isPreparing: boolean;
    handleRePrepare: () => void;
    handleSignAndSubmit: () => void;
    handleReset: () => void;
    formatCountdown: (seconds: number) => string;
}

export function StepSigningWallet({
    selectedPlan,
    order,
    countdown,
    error,
    isPreparing,
    handleRePrepare,
    handleSignAndSubmit,
    handleReset,
    formatCountdown
}: Props) {
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
                    <div className={`text-center p-3 rounded-xl mb-4 ${isExpired
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
                                <p className={`text-2xl font-mono font-bold ${countdown < 60 ? 'text-red-600' : 'text-farm-brown-dark'
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
