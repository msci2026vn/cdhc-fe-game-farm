import { useWalletAuth, type WalletId } from '@/shared/hooks/useWalletAuth';

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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget && !isLoading) onClose(); }}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-[400px] shadow-2xl animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h3 className="font-heading text-base font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
            {mode === 'login' ? 'Chọn ví đăng nhập' : 'Chọn ví liên kết'}
          </h3>
          {!isLoading && (
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>

        <p className="px-4 text-[11px] text-muted-foreground mb-3">
          {mode === 'login'
            ? 'Chọn ví để đăng nhập vào FARMVERSE qua Avalanche C-Chain.'
            : 'Chọn ví để liên kết với tài khoản của bạn.'}
        </p>

        {/* Loading overlay */}
        {isLoading && (
          <div className="mx-4 mb-3 flex items-center gap-3 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin flex-shrink-0" />
            <span className="text-xs font-bold text-blue-700">{loadingText}</span>
          </div>
        )}

        {/* Wallet options */}
        <div className="px-4 pb-2 space-y-2">
          {detectedWallets.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => handleSelect(wallet.id)}
              disabled={isLoading || (!wallet.installed && wallet.id !== 'walletconnect')}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 active:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
            >
              <span className="text-2xl w-9 h-9 flex items-center justify-center flex-shrink-0">
                {wallet.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold">{wallet.name}</span>
                  {wallet.installed && (
                    <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-200">
                      Đã cài
                    </span>
                  )}
                </div>
                {!wallet.installed && wallet.id !== 'walletconnect' && (
                  <span className="text-[10px] text-muted-foreground">Chưa cài đặt</span>
                )}
                {wallet.id === 'walletconnect' && (
                  <span className="text-[10px] text-muted-foreground">Quét QR hoặc deep link</span>
                )}
              </div>
              {wallet.installed || wallet.id === 'walletconnect' ? (
                <span className="material-symbols-outlined text-gray-400 text-base">chevron_right</span>
              ) : (
                <a
                  href={wallet.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors whitespace-nowrap"
                >
                  Tải về
                </a>
              )}
            </button>
          ))}
        </div>

        {/* Error */}
        {state.error && (
          <div className="mx-4 mb-2 flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl">
            <span className="flex-1 text-[11px] font-bold text-red-600">{state.error}</span>
            <button onClick={clearError} className="text-red-400 hover:text-red-600 flex-shrink-0 text-sm">✕</button>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
          <p className="text-[10px] text-center text-muted-foreground">
            Mạng: <span className="font-bold">Avalanche C-Chain</span> &middot; SIWE (EIP-4361)
          </p>
        </div>
      </div>
    </div>
  );
}
