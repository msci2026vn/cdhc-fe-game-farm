import { useWalletAuth, type WalletId } from '@/shared/hooks/useWalletAuth';
import clsx from 'clsx';

interface WalletSelectModalProps {
  mode: 'login' | 'link';
  onSuccess: () => void;
  onClose: () => void;
}

export function WalletSelectModal({ mode, onSuccess, onClose }: WalletSelectModalProps) {
  const {
    detectedWallets,
    loginWithWallet,
    linkWallet,
    state,
    isLoading,
    clearError,
  } = useWalletAuth();

  const handleSelect = async (walletId: WalletId) => {
    try {
      if (mode === 'login') {
        await loginWithWallet(walletId);
      } else {
        await linkWallet(walletId);
      }
      onSuccess();
    } catch {
      // Error already set in state
    }
  };

  const loadingText = state.isConnecting
    ? 'Kết nối ví...'
    : state.isSigning
      ? 'Chờ ký xác thực...'
      : state.isVerifying
        ? 'Xác thực on-chain...'
        : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget && !isLoading) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>

      {/* Modal Container */}
      <div
        className="relative w-[92vw] max-w-[420px] drop-shadow-2xl animate-slide-up bg-[length:100%_100%] bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/assets/login/login-khung-vi.png')", minHeight: '440px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${mode === 'login' ? 'bg-[#ec5b13]/20 border border-[#ec5b13]/30' : 'bg-[#ec5b13]/20 border border-[#ec5b13]/30 p-1.5'}`}>
              <img src="/icons/avalanche-avax-logo.png" alt="AVAX" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              {mode === 'login' ? 'Chọn ví đăng nhập' : 'Chọn ví liên kết'}
            </h2>
          </div>
          {!isLoading && (
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        {/* Subtitle */}
        <div className="px-6 pb-6">
          <p className="text-slate-300 text-sm leading-relaxed">
            {mode === 'login' ? (
              <>Chọn ví để đăng nhập vào <span className="text-[#ec5b13] font-bold">FARMVERSE</span> qua mạng Avalanche C-Chain.</>
            ) : (
              <>Chọn ví để liên kết với tài khoản <span className="text-[#ec5b13] font-bold">FARMVERSE</span> của bạn.</>
            )}
          </p>
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="mx-6 mb-4 flex items-center justify-center gap-3 px-4 py-3 bg-[#ec5b13]/10 border border-[#ec5b13]/20 rounded-xl">
            <div className="w-5 h-5 border-2 border-[#ec5b13]/30 border-t-[#ec5b13] rounded-full animate-spin flex-shrink-0" />
            <span className="text-sm font-bold text-[#ec5b13]">{loadingText}</span>
          </div>
        )}

        {/* Error overlay */}
        {state.error && (
          <div className="mx-6 mb-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <span className="flex-1 text-[11px] font-bold text-red-400">{state.error}</span>
            <button onClick={clearError} className="text-red-400 hover:text-red-300 flex-shrink-0 text-sm p-1">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        )}

        {/* Wallet Options List */}
        <div className="px-4 pb-6 space-y-3 relative z-10">
          {detectedWallets.map((wallet) => {
            const isInstalled = wallet.installed || wallet.id === 'walletconnect';

            return isInstalled ? (
              <button
                key={wallet.id}
                onClick={() => handleSelect(wallet.id)}
                disabled={isLoading}
                className="w-full group flex items-center justify-between p-4 rounded-lg bg-[#2d4c1e]/40 border border-green-500/20 hover:border-[#ec5b13]/50 hover:bg-[#2d4c1e]/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-white/5 p-2 flex items-center justify-center overflow-hidden relative">
                    {wallet.id === 'walletconnect' ? (
                      <span className="material-symbols-outlined text-[#3b99fc] text-3xl">qr_code_scanner</span>
                    ) : (
                      <span className="text-2xl w-9 h-9 flex items-center justify-center flex-shrink-0">
                        {wallet.icon}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-white font-semibold flex items-center gap-2">
                      <span className="text-base truncate max-w-[140px] sm:max-w-[200px]">{wallet.name}</span>
                      {wallet.installed && (
                        <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-[10px] uppercase tracking-wider text-green-400 font-bold border border-green-500/30 flex-shrink-0">
                          Đã cài
                        </span>
                      )}
                    </div>
                    {wallet.id === 'walletconnect' ? (
                      <p className="text-slate-400 text-xs mt-0.5">Quét mã QR</p>
                    ) : (
                      <p className="text-slate-400 text-xs mt-0.5">Tiện ích trình duyệt</p>
                    )}
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-500 group-hover:text-[#ec5b13] transition-colors">chevron_right</span>
              </button>
            ) : (
              <div
                key={wallet.id}
                className={clsx(
                  "w-full flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5 transition-all",
                  isLoading ? "opacity-50 pointer-events-none" : ""
                )}
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="h-12 w-12 rounded-lg bg-white/5 p-2 flex flex-shrink-0 items-center justify-center overflow-hidden grayscale opacity-60">
                    <span className="text-2xl w-9 h-9 flex items-center justify-center">
                      {wallet.icon}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-slate-300 font-semibold flex items-center gap-2">
                      <span className="text-base truncate">{wallet.name}</span>
                      {!wallet.isDeepLink && (
                        <span className="text-slate-500 text-[10px] font-normal flex-shrink-0 italic">Chưa cài đặt</span>
                      )}
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5 truncate">
                      {wallet.isDeepLink ? 'Mở trong ứng dụng' : 'Dành cho Avalanche'}
                    </p>
                  </div>
                </div>
                <a
                  href={wallet.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="bg-[#ec5b13] hover:bg-[#ec5b13]/80 text-white text-xs font-bold px-4 py-2 rounded-lg flex-shrink-0 ml-2 transition-colors shadow-lg shadow-[#ec5b13]/20 whitespace-nowrap"
                >
                  {wallet.isDeepLink ? 'Mở App' : 'Tải về'}
                </a>
              </div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="bg-black/30 px-6 py-4 border-t border-white/5 relative z-10">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 text-[11px] text-slate-400 uppercase tracking-widest font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
              <img src="/icons/avalanche-avax-logo.png" alt="AVAX" className="w-3.5 h-3.5 object-contain" />
              Mạng: Avalanche C-Chain
            </div>
            <div className="text-[10px] text-slate-500">
              Bảo mật bởi SIWE (EIP-4361)
            </div>
          </div>
        </div>

        {/* Decorative Leaf Pattern */}
        <div className="absolute -bottom-6 -right-6 opacity-10 pointer-events-none">
          <span className="material-symbols-outlined text-8xl text-green-400">eco</span>
        </div>
        <div className="absolute -top-6 -left-6 opacity-10 pointer-events-none rotate-180">
          <span className="material-symbols-outlined text-8xl text-green-400">potted_plant</span>
        </div>
      </div>
    </div>
  );
}
