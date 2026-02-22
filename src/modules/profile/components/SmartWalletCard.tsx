import { useState } from 'react';
import { useSmartWallet } from '@/shared/hooks/useSmartWallet';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Copy } from 'lucide-react';

export function SmartWalletCard() {
  const {
    walletStatus,
    hasPasskey,
    hasWallet,
    isLoading,
    isCreating,
    setupSmartWallet,
    isRegisteringPasskey,
    isCreatingWallet,
  } = useSmartWallet();

  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (walletStatus?.address) {
      navigator.clipboard.writeText(walletStatus.address);
      setCopied(true);
      toast.success('Đã sao chép địa chỉ ví');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const snowtraceUrl = walletStatus?.address
    ? `https://snowtrace.io/address/${walletStatus.address}`
    : null;

  if (isLoading) {
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm">
        <div className="flex items-center justify-center py-4">
          <div className="w-5 h-5 border-2 border-farm-green-dark/30 border-t-farm-green-dark rounded-full animate-spin" />
          <span className="ml-2 text-sm text-farm-brown-dark/60">Đang tải ví...</span>
        </div>
      </div>
    );
  }

  // ─── Chưa có wallet: Hiện nút tạo ───
  if (!hasWallet) {
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm">
        <h3 className="font-heading text-sm font-bold flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-base text-farm-green-dark">account_balance_wallet</span>
          Ví Thông Minh
        </h3>
        <p className="text-[10px] text-gray-600 mb-3">
          Tạo ví blockchain bằng vân tay. Không cần MetaMask, không cần seed phrase.
        </p>

        <div className="flex items-center gap-2 text-xs mb-3">
          {hasPasskey ? (
            <span className="flex items-center gap-1 text-green-600 font-bold">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              Passkey đã tạo
            </span>
          ) : (
            <span className="flex items-center gap-1 text-gray-500">
              <span className="material-symbols-outlined text-sm">fingerprint</span>
              Chưa có Passkey — sẽ tạo cùng lúc
            </span>
          )}
        </div>

        <button
          onClick={setupSmartWallet}
          disabled={isCreating}
          className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-farm-green-light to-farm-green-dark active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
        >
          {isCreating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {isRegisteringPasskey ? 'Đang tạo Passkey...' :
                isCreatingWallet ? 'Đang tạo ví...' :
                  'Đang xử lý...'}
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-base">fingerprint</span>
              {hasPasskey ? 'Tạo Ví Thông Minh' : 'Quét vân tay & Tạo Ví'}
            </>
          )}
        </button>

        <p className="text-[9px] text-gray-400 text-center mt-2">
          Miễn phí gas · Avalanche C-Chain · ERC-4337
        </p>
      </div>
    );
  }

  // ─── Đã có wallet: Hiện thông tin ───
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading text-sm font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-farm-green-dark">account_balance_wallet</span>
          Ví Thông Minh
        </h3>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${walletStatus?.isDeployed
            ? 'bg-green-100 text-green-700 border border-green-200'
            : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
          }`}>
          {walletStatus?.isDeployed ? 'Đã kích hoạt' : 'Chưa kích hoạt'}
        </span>
      </div>

      {/* Address */}
      <div className="mb-3">
        <p className="text-[10px] text-gray-500 mb-1">Địa chỉ ví</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-lg bg-[#fefae0] px-3 py-2 text-xs text-farm-brown-dark font-mono truncate border border-[#e9c46a]">
            {walletStatus?.address}
          </code>
          <button
            onClick={copyAddress}
            className="shrink-0 p-2 rounded-lg bg-[#fefae0] border border-[#e9c46a] active:scale-95 transition-transform"
          >
            <span className={`material-symbols-outlined text-sm ${copied ? 'text-green-600' : 'text-farm-brown-dark'}`}>
              {copied ? 'check' : 'content_copy'}
            </span>
          </button>
        </div>
      </div>

      {/* Balance + Network */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] text-gray-500">Số dư</p>
          <p className="text-base font-heading font-bold text-farm-brown-dark">
            {walletStatus?.balance || '0'} <span className="text-xs text-gray-500">AVAX</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-500">Mạng</p>
          <p className="text-xs font-bold text-farm-brown-dark">Avalanche C-Chain</p>
        </div>
      </div>

      {/* Nút Nạp tiền */}
      <div className="mb-3">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full h-10 rounded-xl border-[#e9c46a] text-farm-brown-dark hover:bg-[#fefae0]">
              <Download className="mr-2 h-4 w-4" />
              Nạp tiền vào ví
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm w-[95vw] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Nạp AVAX vào ví</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">

              {/* Hướng dẫn */}
              <p className="text-sm text-gray-600 border-b pb-3">
                Gửi <strong>AVAX</strong> tới địa chỉ bên dưới. Hãy chọn đúng mạng <strong>Avalanche C-Chain</strong>.
              </p>

              {/* Address box + Copy */}
              <div className="rounded-xl overflow-hidden bg-gray-50 border border-gray-200">
                <div className="px-3 py-2 bg-gray-100/50 border-b border-gray-200">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Địa chỉ ví của bạn</p>
                </div>
                <div className="p-3 flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono break-all text-gray-900 leading-tight">
                    {walletStatus?.address}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={copyAddress}
                    className="shrink-0 h-8 w-8 hover:bg-gray-200/50"
                  >
                    <Copy className={`h-4 w-4 ${copied ? 'text-green-500' : 'text-gray-500'}`} />
                  </Button>
                </div>
              </div>

              {/* Mạng */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  Chọn đúng mạng: Avalanche C-Chain
                </p>
                <p className="text-xs text-amber-700/80 mt-1 pl-5">
                  Gửi sai mạng sẽ mất tiền và không thể khôi phục.
                </p>
              </div>

              {/* Hỗ trợ từ đâu */}
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium">Bạn có thể gửi AVAX từ:</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Binance', 'OKX', 'MEXC', 'MetaMask', 'Core Wallet'].map((name) => (
                    <span
                      key={name}
                      className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-medium text-gray-600 border border-gray-200"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Số dư hiện tại */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                <span className="text-sm font-medium text-gray-500">Số dư hiện tại</span>
                <span className="text-base font-bold text-gray-900">
                  {walletStatus?.balance || '0'} <span className="text-xs text-gray-500 font-normal">AVAX</span>
                </span>
              </div>

            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Snowtrace link */}
      {snowtraceUrl && (
        <a
          href={snowtraceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 font-bold"
        >
          <span className="material-symbols-outlined text-sm">open_in_new</span>
          Xem trên Snowtrace
        </a>
      )}

      {!walletStatus?.isDeployed && (
        <p className="text-[9px] text-gray-400 mt-2">
          Ví sẽ tự kích hoạt khi bạn thực hiện giao dịch đầu tiên (miễn phí gas).
        </p>
      )}
    </div>
  );
}
