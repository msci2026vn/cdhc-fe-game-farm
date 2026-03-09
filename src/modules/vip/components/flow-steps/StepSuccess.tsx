import React from 'react';
import type { VipPlan, VipVerifyResult } from '@/shared/types/game-api.types';

interface Props {
    selectedPlan: VipPlan;
    result: VipVerifyResult;
    handleReset: () => void;
    copyToClipboard: (text: string) => void;
}

export function StepSuccess({ selectedPlan, result, handleReset, copyToClipboard }: Props) {
    const expiresDate = result.subscription?.expiresAt
        ? new Date(result.subscription.expiresAt).toLocaleDateString('vi-VN')
        : '';

    return (
        <div className="bg-green-50 rounded-2xl border-2 border-green-200 p-6 shadow-sm text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="font-heading font-bold text-xl text-green-800 mb-2">Chúc mừng!</h3>
            <p className="text-sm text-green-700 mb-4">
                VIP <strong>{selectedPlan.name}</strong> đã kích hoạt!
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
                    <span className="font-bold text-green-700">x{selectedPlan.ognMultiplier}</span>
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
