import { CheckCircle, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { usePayPalCapture } from '../hooks/usePayPalCapture';

export default function TopupSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const method = searchParams.get('method');
  const paypalOrderId = searchParams.get('token');   // PayPal returns token = order ID
  const sessionId = searchParams.get('session_id');  // Stripe returns session_id

  const capture = usePayPalCapture();
  const capturedRef = useRef(false);

  // PayPal: auto-capture on mount
  useEffect(() => {
    if (method === 'paypal' && paypalOrderId && !capturedRef.current) {
      capturedRef.current = true;
      capture.mutate(paypalOrderId);
    }
  }, [method, paypalOrderId]);

  // PayPal: Capturing state
  if (method === 'paypal' && capture.isPending) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Dang xac nhan thanh toan...
            </h1>
            <p className="text-gray-500">
              Vui long doi trong giay lat. Dang xu ly thanh toan PayPal cua ban.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // PayPal: Capture error
  if (method === 'paypal' && capture.isError) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-b from-red-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-8">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Co loi xay ra
            </h1>
            <p className="text-gray-500 mb-4">
              Khong the xac nhan thanh toan. Vui long lien he ho tro.
            </p>
            <p className="text-xs text-red-400 mb-6">
              {capture.error?.message}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  capturedRef.current = false;
                  capture.reset();
                  if (paypalOrderId) capture.mutate(paypalOrderId);
                }}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
              >
                Thu lai
              </button>
              <button
                onClick={() => navigate('/farmverse/topup')}
                className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lai trang nap
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PayPal: Capture success OR Stripe success
  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />

          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Nap thanh cong!
          </h1>

          <p className="text-gray-500 mb-6">
            Thanh toan da duoc xac nhan. AVAX dang duoc chuyen vao vi FARMVERSE cua ban.
            Qua trinh thuong mat 1-2 phut.
          </p>

          {capture.isSuccess && capture.data && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-6">
              <p className="text-sm text-green-700 font-semibold">
                +{capture.data.avaxAmount} AVAX
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => navigate('/farmverse/topup')}
              className="w-full py-3 px-4 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lai trang nap
            </button>

            <button
              onClick={() => navigate('/farm')}
              className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
            >
              Ve trang chu
            </button>
          </div>

          {sessionId && (
            <p className="text-xs text-gray-400 mt-4">
              Ma giao dich: {sessionId.slice(0, 20)}...
            </p>
          )}

          {method === 'paypal' && paypalOrderId && (
            <p className="text-xs text-gray-400 mt-4">
              PayPal Order: {paypalOrderId.slice(0, 20)}...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
