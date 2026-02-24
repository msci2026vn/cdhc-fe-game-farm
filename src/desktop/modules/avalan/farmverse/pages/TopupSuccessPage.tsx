import { CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function TopupSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />

          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Nạp thành công!
          </h1>

          <p className="text-gray-500 mb-6">
            Thanh toán đã được xác nhận. AVAX đang được chuyển vào ví FARMVERSE của bạn.
            Quá trình thường mất 1-2 phút.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/farmverse/topup')}
              className="w-full py-3 px-4 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại trang nạp
            </button>

            <button
              onClick={() => navigate('/farm')}
              className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
            >
              Về trang chủ
            </button>
          </div>

          {sessionId && (
            <p className="text-xs text-gray-400 mt-4">
              Mã giao dịch: {sessionId.slice(0, 20)}...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
