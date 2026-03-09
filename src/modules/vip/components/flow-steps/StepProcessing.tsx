import React from 'react';

interface Props {
    progress: number;
}

export function StepProcessing({ progress }: Props) {
    const steps = [
        { label: 'Tạo đơn hàng', done: progress >= 1 },
        { label: 'Gửi AVAX', done: progress >= 2 },
        { label: 'Chờ blockchain xác nhận (~5-10s)', done: progress >= 3 },
        { label: 'Xác minh giao dịch', done: progress >= 4 },
        { label: 'Kích hoạt VIP', done: progress >= 5 },
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
