import { XCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TopupCancelPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />

          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Đã huỷ thanh toán
          </h1>

          <p className="text-gray-500 mb-6">
            Bạn đã huỷ quá trình nạp AVAX. Không có khoản phí nào bị trừ.
          </p>

          <button
            onClick={() => navigate('/farmverse/topup')}
            className="w-full py-3 px-4 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại chọn gói
          </button>
        </div>
      </div>
    </div>
  );
}
