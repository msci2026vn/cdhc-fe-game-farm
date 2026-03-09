import React from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    playSound: (soundId: string) => void;
}

export default function MarketGuideModal({ isOpen, onClose, playSound }: Props) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => { playSound('ui_modal_close'); onClose(); }}>
            <div
                className="bg-[#fefae0] rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto p-5 border-2 border-[#8c6239] shadow-2xl"
                onClick={e => e.stopPropagation()}
                style={{ scrollbarWidth: 'none' }}
            >
                <h2 className="text-base font-bold text-[#5d4037] text-center mb-4">Hướng dẫn đọc giá nông sản</h2>

                <div className="mb-4">
                    <h3 className="font-bold text-sm text-[#5d4037] mb-1">Mục đích</h3>
                    <p className="text-sm text-[#5d4037]/80 leading-relaxed">
                        Theo dõi giá nông sản thế giới giúp bà con nông dân <strong>nắm bắt xu hướng thị trường</strong>,
                        chủ động trong sản xuất và mua bán nông sản. Khi giá thế giới tăng, giá trong nước thường tăng theo
                        sau 1-2 tuần.
                    </p>
                </div>

                <div className="mb-4">
                    <h3 className="font-bold text-sm text-[#5d4037] mb-1">Chỉ số xu hướng</h3>
                    <p className="text-sm text-[#5d4037]/80 leading-relaxed">
                        Chỉ số bắt đầu từ <strong>1000 điểm</strong>. Con số này phản ánh xu hướng chung của 5 mặt hàng nông sản:
                    </p>
                    <ul className="text-sm text-[#5d4037]/80 mt-1 ml-4 space-y-1">
                        <li><strong>Trên 1000</strong>: giá nông sản đang có xu hướng <span className="text-green-600 font-bold">TĂNG</span></li>
                        <li><strong>Dưới 1000</strong>: giá nông sản đang có xu hướng <span className="text-red-500 font-bold">GIẢM</span></li>
                        <li><strong>% bên cạnh</strong>: mức tăng/giảm so với hôm qua</li>
                    </ul>
                </div>

                <div className="mb-4">
                    <h3 className="font-bold text-sm text-[#5d4037] mb-1">5 mặt hàng nông sản</h3>
                    <p className="text-sm text-[#5d4037]/80 mb-2">Giá giao dịch trên sàn quốc tế (Mỹ):</p>
                    <div className="text-sm text-[#5d4037]/80 space-y-0.5">
                        <div>🌾 <strong>Lúa mì</strong> — sàn CBOT, Chicago</div>
                        <div>🌽 <strong>Ngô</strong> — sàn CBOT, Chicago</div>
                        <div>🧶 <strong>Bông vải</strong> — sàn ICE, New York</div>
                        <div>🍬 <strong>Đường</strong> — sàn ICE, New York</div>
                        <div>☕ <strong>Cà phê</strong> — sàn ICE, New York</div>
                    </div>
                    <p className="text-[10px] text-[#5d4037]/50 mt-2">
                        Đơn vị: cents (xu Mỹ) trên mỗi đơn vị hàng hóa.
                        Số % xanh = tăng so hôm qua. Số % đỏ = giảm so hôm qua.
                    </p>
                </div>

                <div className="mb-4">
                    <h3 className="font-bold text-sm text-[#5d4037] mb-1">Cách dự đoán</h3>
                    <ol className="text-sm text-[#5d4037]/80 ml-4 space-y-1 list-decimal">
                        <li>Xem giá và xu hướng hôm nay</li>
                        <li>Đoán <strong>ngày mai</strong> giá sẽ tăng hay giảm</li>
                        <li>Bấm <span className="text-green-600 font-bold">TĂNG</span> hoặc <span className="text-red-500 font-bold">GIẢM</span></li>
                        <li>Kết quả công bố lúc <strong>18:00 hàng ngày</strong></li>
                        <li>Mỗi ngày chỉ được dự đoán <strong>1 lần</strong></li>
                    </ol>
                </div>

                <div className="mb-4">
                    <h3 className="font-bold text-sm text-[#5d4037] mb-1">Thưởng phạt</h3>
                    <div className="text-sm text-[#5d4037]/80 space-y-0.5">
                        <div>Đoán đúng: <span className="text-green-600 font-bold">+200 OGN</span></div>
                        <div>Đoán sai: <span className="text-red-500 font-bold">-150 OGN</span></div>
                        <div>Đoán đúng liên tiếp (streak):</div>
                        <div className="ml-2 text-xs text-[#5d4037]/60">3 ngày: +100 | 5 ngày: +300 | 7 ngày: +500 | 10 ngày: +1,000 | 14 ngày: +2,000</div>
                    </div>
                </div>

                <div className="mb-4">
                    <h3 className="font-bold text-sm text-[#5d4037] mb-1">Mẹo cho nông dân</h3>
                    <div className="text-sm text-[#5d4037]/80 space-y-0.5">
                        <div>Giá <strong>cà phê</strong> phụ thuộc thời tiết Brazil, Việt Nam</div>
                        <div>Giá <strong>lúa mì</strong> ảnh hưởng bởi xung đột, thời tiết châu Âu</div>
                        <div><strong>Mùa thu hoạch</strong> → cung tăng → giá thường giảm</div>
                        <div><strong>Thiên tai, hạn hán</strong> → cung giảm → giá tăng mạnh</div>
                        <div>Giá thế giới tăng → giá VN thường tăng theo sau 1-2 tuần</div>
                    </div>
                </div>

                <button
                    onClick={() => { playSound('ui_click'); onClose(); }}
                    className="w-full py-3 bg-[#8c6239] text-[#fefae0] rounded-xl font-bold text-sm border-b-4 border-[#5d4037] active:border-b-0 active:translate-y-1 transition-all"
                >
                    Đã hiểu
                </button>
            </div>
        </div>
    );
}
