import { useState } from 'react';
import { useSmartWallet } from '@/shared/hooks/useSmartWallet';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Copy } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

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

        <p className="text-[9px] text-gray-400 text-center mt-2 flex items-center justify-center gap-1">
          Miễn phí gas · <span className="bg-white/80 px-1 py-0.5 rounded flex items-center gap-1 text-farm-brown-dark font-bold"><img src="/icons/avalanche-avax-logo.png" alt="AVAX" className="w-2.5 h-2.5 object-contain" /> Avalanche C-Chain</span> · ERC-4337
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
        <div className="text-right flex flex-col items-end">
          <p className="text-[10px] text-gray-500 mb-0.5">Mạng</p>
          <div className="flex items-center gap-1.5 bg-white/50 px-2 py-0.5 rounded-lg border border-white/20">
            <img src="/icons/avalanche-avax-logo.png" alt="AVAX" className="w-4 h-4 object-contain" />
            <p className="text-xs font-bold text-farm-brown-dark">Avalanche C-Chain</p>
          </div>
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
          <DialogContent className="max-w-md w-[95vw] overflow-hidden bg-[#4A3629] border-2 border-[#8B5E3C] shadow-2xl p-0 gap-0">
            {/* Tạo nền vân gỗ thuần CSS */}
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,transparent_50%,rgba(255,255,255,.05)_50%)] bg-[length:4px_100%] z-0 pointer-events-none"></div>
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(transparent_50%,rgba(0,0,0,.1)_50%)] bg-[length:100%_4px] z-0 pointer-events-none"></div>

            <DialogHeader className="px-6 pt-6 pb-2 relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white shadow-inner">
                  <img src="/icons/avalanche-avax-logo.png" alt="AVAX" className="w-6 h-6 object-contain brightness-0 invert" />
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight text-white m-0">Nạp AVAX vào ví</DialogTitle>
              </div>
            </DialogHeader>
            <div className="px-6 pb-2 text-center relative z-10">
              <p className="text-[#D4B483] text-sm leading-relaxed">
                Gửi AVAX tới địa chỉ bên dưới. Hãy chọn đúng mạng <span className="text-white font-semibold">Avalanche C-Chain</span>.
              </p>
            </div>
            <div className="px-6 space-y-5 pb-6 relative z-10">
              <div className="relative rounded-2xl bg-[#5D3A29] border-2 border-[#8B5E3C] shadow-inner p-5 group">
                <div className="relative z-10 flex flex-col items-center">
                  {/* Khung viền bọc QR */}
                  <div className="p-2 mb-5 rounded-[20px] bg-gradient-to-b from-white/20 to-transparent border border-white/10 shadow-lg">
                    <div className="bg-gradient-to-br from-[#1A3A34] to-[#122A25] p-6 rounded-xl flex items-center justify-center relative overflow-hidden h-[240px] w-[240px]">
                      {/* Hiệu ứng ánh sáng nghệ thuật sau lưng QR */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-2xl rounded-full"></div>
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 blur-2xl rounded-full"></div>

                      <div className="bg-white p-2 rounded relative z-10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                        {walletStatus?.address ? (
                          <QRCodeCanvas
                            id="qr-code-canvas"
                            value={walletStatus.address}
                            size={220}
                            bgColor={"#ffffff"}
                            fgColor={"#000000"}
                            level={"Q"}
                            includeMargin={false}
                            imageSettings={{
                              src: "/icons/avalanche-avax-logo.png",
                              x: undefined,
                              y: undefined,
                              height: 32,
                              width: 32,
                              excavate: true,
                            }}
                          />
                        ) : (
                          <div className="w-[180px] h-[180px] bg-gray-200 animate-pulse flex items-center justify-center text-gray-400 text-xs">Đang tải...</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const canvas = document.getElementById("qr-code-canvas") as HTMLCanvasElement;
                      if (canvas) {
                        const pngUrl = canvas.toDataURL("image/png");
                        const downloadLink = document.createElement("a");
                        downloadLink.href = pngUrl;
                        downloadLink.download = "avax-wallet-qr.png";
                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);
                      } else {
                        toast.error('Không tìm thấy mã QR để tải về');
                      }
                    }}
                    className="mb-8 flex items-center gap-2 px-6 py-2.5 rounded-full bg-black/30 border border-[#8B5E3C] hover:bg-black/50 transition-all text-[#D4B483] hover:text-white text-sm font-semibold group-hover:border-[#D4B483]/50 shadow-inner"
                  >
                    <span className="material-symbols-outlined text-lg">download</span>
                    Tải ảnh QR
                  </button>

                  <div className="flex w-full items-center justify-between mb-2">
                    <label className="text-[11px] uppercase tracking-wider text-[#D4B483] font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">qr_code_2</span> ĐỊA CHỈ VÍ NHẬN
                    </label>
                  </div>
                  <div className="flex items-center bg-[#4A3629] rounded-lg border border-[#8B5E3C]/50 p-3 shadow-inner w-full">
                    <code className="text-white font-mono text-xs truncate select-all flex-1">{walletStatus?.address}</code>
                    <button onClick={copyAddress} className="ml-2 p-1.5 rounded bg-[#8B5E3C] hover:bg-[#A67C52] text-white transition-colors flex-shrink-0 shadow-sm border border-[#5D3A29]">
                      <span className="material-symbols-outlined text-lg leading-none">{copied ? 'check' : 'content_copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-[#5D3A29]/80 border border-orange-500/30 p-4 flex gap-3 items-start text-left shadow-inner">
                <span className="material-symbols-outlined text-orange-400 mt-0.5 flex-shrink-0 text-xl">warning</span>
                <div>
                  <h4 className="text-orange-200 text-sm font-bold mb-1">Chọn đúng mạng: Avalanche C-Chain</h4>
                  <p className="text-orange-200/70 text-xs leading-snug">Gửi sai mạng sẽ mất tiền và không thể khôi phục.</p>
                </div>
              </div>

              <div>
                <p className="text-[#D4B483]/70 text-xs mb-3 flex items-center gap-2 before:content-[''] before:h-px before:w-6 before:bg-[#D4B483]/10 after:content-[''] after:h-px after:flex-1 after:bg-[#D4B483]/10">
                  Bạn có thể gửi AVAX từ
                </p>
                <div className="flex justify-between gap-2">
                  {[
                    { bg: 'bg-[#2A1F18]', border: 'border-[#5D3A29]', hoverBorder: 'group-hover:border-yellow-500/50', icon: <span className="text-yellow-400 font-bold text-xs">BIN</span>, name: 'Binance' },
                    { bg: 'bg-[#2A1F18]', border: 'border-[#5D3A29]', hoverBorder: 'group-hover:border-white/50', icon: <span className="text-white font-bold text-xs">OKX</span>, name: 'OKX' },
                    { bg: 'bg-[#2A1F18]', border: 'border-[#5D3A29]', hoverBorder: 'group-hover:border-blue-400/50', icon: <span className="text-blue-400 font-bold text-[10px]">MEXC</span>, name: 'MEXC' },
                    { bg: 'bg-[#2A1F18]', border: 'border-[#5D3A29] p-[6px]', hoverBorder: 'group-hover:border-orange-500/50', icon: <div className="w-full h-full bg-[url('https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg')] bg-contain bg-center bg-no-repeat"></div>, name: 'MetaMask' },
                    { bg: 'bg-[#2A1F18]', border: 'border-[#5D3A29]', hoverBorder: 'group-hover:border-red-500/50', icon: <span className="material-symbols-outlined text-white text-base">change_history</span>, name: 'Core' }
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5 w-1/5 group cursor-pointer">
                      <div className={`w-11 h-11 rounded-full ${item.bg} border inline-flex items-center justify-center ${item.border} ${item.hoverBorder} transition-colors shadow-inner`}>
                        {item.icon}
                      </div>
                      <span className="text-[10px] text-[#D4B483]/80 group-hover:text-[#D4B483] font-medium">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative z-20 bg-black/40 px-6 py-4 border-t border-[#8B5E3C]/30 backdrop-blur-sm rounded-b-[10px]">
              <div className="flex items-center justify-between text-[#D4B483]/80 text-sm font-medium">
                <span>Số dư hiện tại:</span>
                <span className="text-white font-bold flex items-center gap-1">
                  {walletStatus?.balance || '0'} AVAX
                  {Number(walletStatus?.balance || 0) === 0 && (
                    <span className="material-symbols-outlined text-red-500 text-base" title="Cần nạp thêm">error</span>
                  )}
                </span>
              </div>
            </div>

            <div className="absolute -bottom-6 -right-6 opacity-5 pointer-events-none z-0">
              <span className="material-symbols-outlined text-9xl text-green-400">agriculture</span>
            </div>
            <div className="absolute top-10 -left-6 opacity-5 pointer-events-none rotate-12 z-0">
              <span className="material-symbols-outlined text-8xl text-wood-light">grass</span>
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
