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
          <DialogContent className="max-w-[440px] w-[95vw] overflow-hidden bg-white/70 border-[1.5px] border-white/85 shadow-[0_2px_0_rgba(255,255,255,0.9)_inset,0_20px_60px_rgba(17,157,164,0.15),0_4px_16px_rgba(0,0,0,0.06)] backdrop-blur-xl p-0 gap-0 rounded-[24px] font-sans">
            {/* Top accent strip */}
            <div className="h-1 bg-gradient-to-r from-[#A8DCDF] via-[#119DA4] to-[#D4A017]"></div>

            {/* Header: Logo + Title + VIP badge */}
            <div className="px-6 pt-6 pb-[18px] flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E84142] to-[#B83233] flex items-center justify-center shrink-0 shadow-[0_4px_14px_rgba(232,65,66,0.35)]">
                <img src="/icons/avalanche-avax-logo.png" alt="AVAX" className="w-7 h-7 object-contain brightness-0 invert" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#5A8A6A] mb-[3px]">🌱 Organic Kingdom</div>
                <div className="font-serif text-[22px] font-black text-[#1A3A28] tracking-tight leading-none">
                  Deposit <span className="text-[#E84142]">AVAX</span>
                </div>
              </div>
              <div className="px-3 py-1.5 bg-gradient-to-br from-[#119DA4] to-[#0D7A80] rounded-full text-[10px] font-bold tracking-[0.1em] uppercase text-white shadow-[0_3px_10px_rgba(17,157,164,0.3)]">
                VIP
              </div>
            </div>

            {/* Network indicator */}
            <div className="mx-6 mb-5 px-3.5 py-2 bg-[#119DA4]/10 border border-[#119DA4]/25 rounded-full w-fit flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#4ADE80] shadow-[0_0_7px_#4ADE80] animate-pulse"></div>
              <div className="text-[11px] font-medium text-[#0D7A80] tracking-[0.03em]">Network: <strong className="font-bold">Avalanche C-Chain</strong></div>
            </div>

            {/* QR Code */}
            <div className="px-6 pb-5 flex flex-col items-center gap-3.5">
              <div className="p-3.5 bg-white rounded-[18px] shadow-[0_0_0_1.5px_rgba(17,157,164,0.2),0_8px_30px_rgba(17,157,164,0.16),0_2px_8px_rgba(0,0,0,0.06)] relative group">
                <div className="absolute top-[-1px] left-[-1px] w-4 h-4 border-l-2 border-t-2 border-[#119DA4] rounded-tl-[4px]"></div>
                <div className="absolute top-[-1px] right-[-1px] w-4 h-4 border-r-2 border-t-2 border-[#119DA4] rounded-tr-[4px]"></div>
                <div className="absolute bottom-[-1px] left-[-1px] w-4 h-4 border-l-2 border-b-2 border-[#119DA4] rounded-bl-[4px]"></div>
                <div className="absolute bottom-[-1px] right-[-1px] w-4 h-4 border-r-2 border-b-2 border-[#119DA4] rounded-br-[4px]"></div>

                {walletStatus?.address ? (
                  <QRCodeCanvas
                    id="qr-code-canvas"
                    value={walletStatus.address}
                    size={200}
                    bgColor={"#ffffff"}
                    fgColor={"#000000"}
                    level={"Q"}
                    includeMargin={false}
                    className="rounded-[6px] [image-rendering:pixelated]"
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
                  <div className="w-[200px] h-[200px] bg-gray-100 animate-pulse flex items-center justify-center text-gray-400 text-xs rounded-[6px]">Đang tải...</div>
                )}

                {/* Overlay nút tải ảnh QR khi hover */}
                <button
                  onClick={() => {
                    const sourceCanvas = document.getElementById("qr-code-canvas") as HTMLCanvasElement;
                    if (!sourceCanvas) {
                      toast.error('Không tìm thấy mã QR để tải về');
                      return;
                    }

                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    if (!ctx) return;

                    const width = 800;
                    const height = 1100;
                    canvas.width = width;
                    canvas.height = height;

                    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
                    bgGradient.addColorStop(0, "#1c1c1c");
                    bgGradient.addColorStop(1, "#0a0a0a");
                    ctx.fillStyle = bgGradient;
                    ctx.fillRect(0, 0, width, height);

                    const borderGradient = ctx.createLinearGradient(0, 0, width, height);
                    borderGradient.addColorStop(0, "#E6C27A");
                    borderGradient.addColorStop(0.5, "#B38728");
                    borderGradient.addColorStop(1, "#FCEABB");

                    ctx.lineWidth = 12;
                    ctx.strokeStyle = borderGradient;
                    ctx.strokeRect(30, 30, width - 60, height - 60);

                    ctx.lineWidth = 2;
                    ctx.strokeRect(45, 45, width - 90, height - 90);

                    ctx.textAlign = "center";
                    ctx.fillStyle = "#E6C27A";

                    ctx.font = "bold 54px Arial, sans-serif";
                    ctx.letterSpacing = "4px";
                    ctx.fillText("ORGANIC KINGDOM", width / 2, 140);

                    ctx.font = "italic 28px Arial, sans-serif";
                    ctx.fillStyle = "#A0A0A0";
                    ctx.letterSpacing = "2px";
                    ctx.fillText("VIP Player Access", width / 2, 190);

                    const drawRemaining = () => {
                      ctx.font = "bold 44px Arial, sans-serif";
                      ctx.fillStyle = "#ffffff";
                      ctx.letterSpacing = "1px";
                      ctx.fillText("DEPOSIT AVAX", width / 2, 330);

                      const qrSize = 460;
                      const qrX = (width - qrSize) / 2;
                      const qrY = 380;

                      ctx.fillStyle = "#ffffff";
                      ctx.fillRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40);

                      ctx.lineWidth = 4;
                      ctx.strokeStyle = borderGradient;
                      ctx.strokeRect(qrX - 25, qrY - 25, qrSize + 50, qrSize + 50);

                      ctx.drawImage(sourceCanvas, qrX, qrY, qrSize, qrSize);

                      ctx.fillStyle = "#E6C27A";
                      ctx.font = "bold 24px Arial, sans-serif";
                      ctx.letterSpacing = "2px";
                      ctx.fillText("YOUR WALLET ADDRESS", width / 2, qrY + qrSize + 70);

                      ctx.fillStyle = "#ffffff";
                      ctx.font = "30px monospace";
                      ctx.letterSpacing = "0px";
                      const address = walletStatus?.address || "";
                      ctx.fillText(address, width / 2, qrY + qrSize + 120);

                      ctx.fillStyle = "#ff4444";
                      ctx.font = "bold 26px Arial, sans-serif";
                      ctx.fillText("WARNING", width / 2, qrY + qrSize + 200);

                      ctx.fillStyle = "#A0A0A0";
                      ctx.font = "22px Arial, sans-serif";
                      ctx.fillText("Send ONLY Avalanche C-Chain tokens to this address.", width / 2, qrY + qrSize + 240);
                      ctx.fillText("Sending other tokens may result in permanent loss.", width / 2, qrY + qrSize + 270);

                      const pngUrl = canvas.toDataURL("image/png");
                      const downloadLink = document.createElement("a");
                      downloadLink.href = pngUrl;
                      downloadLink.download = "organic-kingdom-vip-deposit.png";
                      document.body.appendChild(downloadLink);
                      downloadLink.click();
                      document.body.removeChild(downloadLink);
                      toast.success("Đã tải ảnh QR VIP");
                    };

                    const avaxLogo = new Image();
                    avaxLogo.src = "/icons/avalanche-avax-logo.png";
                    avaxLogo.onload = () => {
                      ctx.drawImage(avaxLogo, width / 2 - 40, 220, 80, 80);
                      drawRemaining();
                    };
                    avaxLogo.onerror = () => {
                      drawRemaining();
                    }
                  }}
                  className="absolute inset-0 m-auto w-12 h-12 bg-[#119DA4]/90 rounded-full flex items-center justify-center text-white shadow-lg opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:scale-110 active:scale-95"
                  title="Tải thẻ QR VIP"
                >
                  <span className="material-symbols-outlined text-xl">download</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.12em] uppercase text-[#5A8A6A] before:content-[''] before:w-[18px] before:h-px before:bg-[#119DA4]/40 after:content-[''] after:w-[18px] after:h-px after:bg-[#119DA4]/40">
                Quét mã để gửi AVAX
              </div>
            </div>

            {/* Address Box */}
            <div className="px-6 pb-[18px]">
              <div className="text-[9px] font-bold tracking-[0.18em] uppercase text-[#5A8A6A] mb-1.5 pl-0.5 flex items-center gap-1">
                <span className="text-[#D4A017] material-symbols-outlined text-[12px] -rotate-45">key</span> ĐỊA CHỈ VÍ NHẬN
              </div>
              <div className="bg-white/80 border-[1.5px] border-[#119DA4]/20 rounded-xl p-3 shadow-[0_2px_10px_rgba(17,157,164,0.08)] flex items-center gap-2 relative">
                <code className="font-mono text-[12.5px] text-[#1A3A28] tracking-[0.03em] break-all leading-[1.65] select-all flex-1 pr-10">{walletStatus?.address}</code>
                <button
                  onClick={copyAddress}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white shadow-sm border border-[#119DA4]/10 text-[#119DA4] hover:bg-[#119DA4]/10 transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
                </button>
              </div>
            </div>

            {/* Warning Banner */}
            <div className="mx-6 mb-[18px] py-3 px-3.5 bg-[#FDE789]/35 border-y border-r border-[#D4A017]/30 border-l-[3px] border-l-[#D4A017] rounded-r-[10px] flex gap-2.5 items-start">
              <span className="material-symbols-outlined text-[15px] shrink-0 mt-px text-[#D4A017]">warning</span>
              <div>
                <h4 className="text-[11px] font-bold text-[#7A5500] mb-0.5">Chỉ gửi trên Avalanche C-Chain</h4>
                <p className="text-[10px] text-[#9A7010] leading-relaxed">Gửi sai mạng sẽ dẫn đến mất tiền vĩnh viễn và không thể hoàn lại.</p>
              </div>
            </div>

            {/* Sources */}
            <div className="px-6 pb-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-px bg-[#119DA4]/20"></div>
                <h4 className="text-[9px] font-bold tracking-[0.14em] uppercase text-[#5A8A6A] text-center shrink-0">CÓ THỂ GỬI TỪ</h4>
                <div className="flex-1 h-px bg-[#119DA4]/20"></div>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {[
                  { name: 'Binance' },
                  { name: 'OKX' },
                  { name: 'MEXC' },
                  { name: 'MetaMask' },
                  { name: 'Core Wallet' }
                ].map((item, i) => (
                  <div key={i} className="px-[13px] py-1.5 bg-white/70 border border-[#119DA4]/20 rounded-full text-[10px] font-semibold text-[#0D7A80] tracking-[0.04em] hover:bg-[#119DA4]/10 hover:border-[#119DA4]/40 transition-colors cursor-default">
                    {item.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-[#119DA4]/10 border-t border-[#119DA4]/15 mt-4 flex items-center justify-between">
              <div>
                <div className="font-serif text-[13px] font-bold text-[#0D7A80] tracking-[0.06em] flex items-center gap-1">
                  <span className="text-[11px] opacity-80">🌱</span> FARMVERSE
                </div>
                <div className="text-[9px] text-[#0D7A80]/70 mt-0.5 font-medium tracking-[0.04em]">
                  Organic Agriculture · DePIN · Avalanche
                </div>
              </div>

              <div className="flex items-center gap-1.5 py-1 px-2.5 pl-1.5 bg-[#E84142]/10 border border-[#E84142]/20 rounded-full shadow-sm">
                <div className="w-[18px] h-[18px] rounded-full bg-gradient-to-br from-[#E84142] to-[#B83233] flex items-center justify-center shrink-0">
                  <img src="/icons/avalanche-avax-logo.png" alt="" className="w-3 h-3 object-contain brightness-0 invert" />
                </div>
                <div className="text-[11px] font-bold text-[#E84142] tracking-[0.06em]">AVAX</div>
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
