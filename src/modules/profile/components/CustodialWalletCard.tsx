import { useState } from 'react';
import { useCustodialWallet } from '@/shared/hooks/useCustodialWallet';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';

export function CustodialWalletCard() {
  const {
    wallet,
    isLoading,
    hasWallet,
    refetch,
    sendTransaction,
    isSending,
    exportKey,
    isExporting,
  } = useCustodialWallet();

  const [copied, setCopied] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [withdrawTo, setWithdrawTo] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [exportedKey, setExportedKey] = useState('');

  const copyAddress = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      toast.success('Đã sao chép địa chỉ ví');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawTo || !withdrawAmount) return;
    try {
      const result = await sendTransaction({ to: withdrawTo, amount: withdrawAmount });
      toast.success(`Đã gửi ${withdrawAmount} AVAX\nTX: ${result.txHash.slice(0, 10)}...`);
      setShowWithdraw(false);
      setWithdrawTo('');
      setWithdrawAmount('');
    } catch {
      // Error handled in mutation onError
    }
  };

  const handleExport = async () => {
    try {
      const result = await exportKey();
      setExportedKey(result.privateKey);
    } catch {
      toast.error('Không thể export ví');
    }
  };

  const snowtraceUrl = wallet?.address
    ? `https://snowtrace.io/address/${wallet.address}`
    : null;

  // ─── Loading ───
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

  // ─── Chưa có wallet ───
  if (!hasWallet) {
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm">
        <h3 className="font-heading text-sm font-bold flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-base text-farm-green-dark">account_balance_wallet</span>
          Ví FARMVERSE
        </h3>
        <p className="text-[10px] text-gray-600 mb-3">
          Chưa có ví. Ví sẽ được tạo tự động khi bạn đăng nhập lại.
        </p>
        <p className="text-[9px] text-gray-400 text-center flex items-center justify-center gap-1">
          Miễn phí · <span className="bg-white/80 px-1 py-0.5 rounded flex items-center gap-1 text-farm-brown-dark font-bold"><img src="/icons/avalanche-avax-logo.png" alt="AVAX" className="w-2.5 h-2.5 object-contain" /> Avalanche C-Chain</span>
        </p>
      </div>
    );
  }

  // ─── Đã có wallet ───
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading text-sm font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-farm-green-dark">account_balance_wallet</span>
          Ví FARMVERSE
        </h3>
        <button onClick={() => refetch()} className="p-1 rounded-lg hover:bg-white/50 transition-colors" title="Làm mới">
          <span className="material-symbols-outlined text-sm text-gray-400 hover:text-farm-green-dark">refresh</span>
        </button>
      </div>

      {/* Address */}
      <div className="mb-3">
        <p className="text-[10px] text-gray-500 mb-1">Địa chỉ ví</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-lg bg-[#fefae0] px-3 py-2 text-xs text-farm-brown-dark font-mono truncate border border-[#e9c46a]">
            {wallet?.address}
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
            {parseFloat(wallet?.balance || '0').toFixed(6)} <span className="text-xs text-gray-500">AVAX</span>
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

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {/* Nạp tiền — Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <button className="flex flex-col items-center gap-1 p-3 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 active:scale-95 transition-all min-h-[56px]">
              <span className="material-symbols-outlined text-lg">download</span>
              <span className="text-[10px] font-bold">Nạp tiền</span>
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md w-[95vw] overflow-hidden bg-[#4A3629] border-2 border-[#8B5E3C] shadow-2xl p-0 gap-0">
            {/* Vân gỗ */}
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
              <div className="relative rounded-2xl bg-[#5D3A29] border-2 border-[#8B5E3C] shadow-inner p-5">
                <div className="relative z-10 flex flex-col items-center">
                  {/* QR Code */}
                  <div className="p-2 mb-5 rounded-[20px] bg-gradient-to-b from-white/20 to-transparent border border-white/10 shadow-lg">
                    <div className="bg-gradient-to-br from-[#1A3A34] to-[#122A25] p-6 rounded-xl flex items-center justify-center relative overflow-hidden h-[240px] w-[240px]">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-2xl rounded-full"></div>
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 blur-2xl rounded-full"></div>
                      <div className="bg-white p-2 rounded relative z-10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                        {wallet?.address ? (
                          <QRCodeCanvas
                            id="custodial-qr-canvas"
                            value={wallet.address}
                            size={220}
                            bgColor="#ffffff"
                            fgColor="#000000"
                            level="Q"
                            includeMargin={false}
                            imageSettings={{
                              src: '/icons/avalanche-avax-logo.png',
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

                  {/* Tải ảnh QR */}
                  <button
                    onClick={async () => {
                      const canvas = document.getElementById('custodial-qr-canvas') as HTMLCanvasElement;
                      if (!canvas) return;
                      try {
                        const pngUrl = canvas.toDataURL('image/png');
                        const downloadLink = document.createElement('a');
                        downloadLink.href = pngUrl;
                        downloadLink.download = 'farmverse-wallet-qr.png';
                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);
                        toast.success('Đã tải ảnh QR');
                      } catch {
                        toast.error('Có lỗi xảy ra khi tạo ảnh QR');
                      }
                    }}
                    className="mb-8 flex items-center gap-2 px-6 py-2.5 rounded-full bg-black/30 border border-[#8B5E3C] hover:bg-black/50 transition-all text-[#D4B483] hover:text-white text-sm font-semibold shadow-inner"
                  >
                    <span className="material-symbols-outlined text-lg">download</span>
                    Tải ảnh QR
                  </button>

                  {/* Địa chỉ */}
                  <div className="flex w-full items-center justify-between mb-2">
                    <label className="text-[11px] uppercase tracking-wider text-[#D4B483] font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">qr_code_2</span> ĐỊA CHỈ VÍ NHẬN
                    </label>
                  </div>
                  <div className="flex items-center bg-[#4A3629] rounded-lg border border-[#8B5E3C]/50 p-3 shadow-inner w-full">
                    <code className="text-white font-mono text-xs truncate select-all flex-1">{wallet?.address}</code>
                    <button onClick={copyAddress} className="ml-2 p-1.5 rounded bg-[#8B5E3C] hover:bg-[#A67C52] text-white transition-colors flex-shrink-0 shadow-sm border border-[#5D3A29]">
                      <span className="material-symbols-outlined text-lg leading-none">{copied ? 'check' : 'content_copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="rounded-xl bg-[#5D3A29]/80 border border-orange-500/30 p-4 flex gap-3 items-start text-left shadow-inner">
                <span className="material-symbols-outlined text-orange-400 mt-0.5 flex-shrink-0 text-xl">warning</span>
                <div>
                  <h4 className="text-orange-200 text-sm font-bold mb-1">Chọn đúng mạng: Avalanche C-Chain</h4>
                  <p className="text-orange-200/70 text-xs leading-snug">Gửi sai mạng sẽ mất tiền và không thể khôi phục.</p>
                </div>
              </div>

              {/* Sources */}
              <div>
                <p className="text-[#D4B483]/70 text-xs mb-3 flex items-center gap-2 before:content-[''] before:h-px before:w-6 before:bg-[#D4B483]/10 after:content-[''] after:h-px after:flex-1 after:bg-[#D4B483]/10">
                  Bạn có thể gửi AVAX từ
                </p>
                <div className="flex justify-between gap-2">
                  {[
                    { bg: 'bg-[#2A1F18]', border: 'border-[#5D3A29]', icon: <span className="text-yellow-400 font-bold text-xs">BIN</span>, name: 'Binance' },
                    { bg: 'bg-[#2A1F18]', border: 'border-[#5D3A29]', icon: <span className="text-white font-bold text-xs">OKX</span>, name: 'OKX' },
                    { bg: 'bg-[#2A1F18]', border: 'border-[#5D3A29]', icon: <span className="text-blue-400 font-bold text-[10px]">MEXC</span>, name: 'MEXC' },
                    { bg: 'bg-[#2A1F18]', border: 'border-[#5D3A29] p-[6px]', icon: <div className="w-full h-full bg-[url('https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg')] bg-contain bg-center bg-no-repeat"></div>, name: 'MetaMask' },
                    { bg: 'bg-[#2A1F18]', border: 'border-[#5D3A29]', icon: <span className="material-symbols-outlined text-white text-base">change_history</span>, name: 'Core' },
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5 w-1/5 group cursor-pointer">
                      <div className={`w-11 h-11 rounded-full ${item.bg} border inline-flex items-center justify-center ${item.border} transition-colors shadow-inner`}>
                        {item.icon}
                      </div>
                      <span className="text-[10px] text-[#D4B483]/80 font-medium">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="relative z-20 bg-black/40 px-6 py-4 border-t border-[#8B5E3C]/30 backdrop-blur-sm rounded-b-[10px]">
              <div className="flex items-center justify-between text-[#D4B483]/80 text-sm font-medium">
                <span>Số dư hiện tại:</span>
                <span className="text-white font-bold flex items-center gap-1">
                  {parseFloat(wallet?.balance || '0').toFixed(6)} AVAX
                  {Number(wallet?.balance || 0) === 0 && (
                    <span className="material-symbols-outlined text-red-500 text-base" title="Cần nạp thêm">error</span>
                  )}
                </span>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Rút tiền */}
        <button
          onClick={() => { setShowWithdraw(!showWithdraw); setShowExport(false); setExportedKey(''); }}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl border active:scale-95 transition-all min-h-[56px] ${
            showWithdraw ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
          }`}
        >
          <span className="material-symbols-outlined text-lg">upload</span>
          <span className="text-[10px] font-bold">Rút tiền</span>
        </button>

        {/* Export */}
        <button
          onClick={() => { setShowExport(!showExport); setShowWithdraw(false); setExportedKey(''); }}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl border active:scale-95 transition-all min-h-[56px] ${
            showExport ? 'bg-gray-200 border-gray-400 text-gray-700' : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
          }`}
        >
          <span className="material-symbols-outlined text-lg">key</span>
          <span className="text-[10px] font-bold">Export</span>
        </button>
      </div>

      {/* WITHDRAW PANEL */}
      {showWithdraw && (
        <div className="border-t border-[#e9c46a]/30 pt-3 space-y-3 animate-fade-in">
          <p className="text-xs text-gray-600 font-bold">Rút AVAX ra ví ngoài</p>
          <input
            type="text"
            placeholder="Địa chỉ nhận (0x...)"
            value={withdrawTo}
            onChange={(e) => setWithdrawTo(e.target.value)}
            className="w-full px-3 py-3 border border-[#e9c46a] rounded-xl text-xs font-mono bg-[#fefae0] focus:outline-none focus:ring-2 focus:ring-farm-green-dark/50"
          />
          <input
            type="number"
            placeholder="Số lượng AVAX"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            step="0.001"
            min="0"
            className="w-full px-3 py-3 border border-[#e9c46a] rounded-xl text-xs bg-[#fefae0] focus:outline-none focus:ring-2 focus:ring-farm-green-dark/50"
          />
          <button
            onClick={handleWithdraw}
            disabled={isSending || !withdrawTo || !withdrawAmount}
            className="w-full py-3 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-blue-500 to-blue-600 active:scale-[0.98] transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">send</span>
                Xác nhận rút tiền
              </>
            )}
          </button>
          <p className="text-[9px] text-gray-400 text-center">Phí gas sẽ được trừ từ số dư ví</p>
        </div>
      )}

      {/* EXPORT PANEL */}
      {showExport && (
        <div className="border-t border-[#e9c46a]/30 pt-3 space-y-3 animate-fade-in">
          {!exportedKey ? (
            <>
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2 items-start">
                <span className="material-symbols-outlined text-red-500 text-base mt-0.5 shrink-0">warning</span>
                <p className="text-xs text-red-600 leading-relaxed">
                  Private key cho phép toàn quyền truy cập ví. <strong>KHÔNG chia sẻ với ai.</strong>
                </p>
              </div>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full py-3 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-red-500 to-red-600 active:scale-[0.98] transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang lấy...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">visibility</span>
                    Hiện Private Key
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-600">Import vào MetaMask hoặc Trust Wallet:</p>
              <div className="bg-red-50 p-3 rounded-xl break-all text-[10px] font-mono border border-red-200 select-all">
                {exportedKey}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { navigator.clipboard.writeText(exportedKey); toast.success('Đã copy Private Key'); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-farm-brown bg-[#fefae0] border border-[#e9c46a] active:scale-95 transition-all flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                  Copy
                </button>
                <button
                  onClick={() => { setExportedKey(''); setShowExport(false); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-gray-500 bg-gray-100 border border-gray-200 active:scale-95 transition-all"
                >
                  Ẩn
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Snowtrace link */}
      {snowtraceUrl && (
        <a
          href={snowtraceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 font-bold mt-3"
        >
          <span className="material-symbols-outlined text-sm">open_in_new</span>
          Xem trên Snowtrace
        </a>
      )}
    </div>
  );
}
