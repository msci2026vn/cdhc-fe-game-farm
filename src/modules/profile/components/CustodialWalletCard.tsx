import { useState } from 'react';
import { useCustodialWallet } from '@/shared/hooks/useCustodialWallet';
import { useSecurityVerify } from '@/shared/hooks/useSecurityVerify';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QRCodeCanvas } from 'qrcode.react';
import { PinInputModal } from './PinInputModal';
import { PinSetupModal } from './PinSetupModal';

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
    securityStatus,
    setPin: setPinApi,
    refetchSecurity,
  } = useCustodialWallet();

  const security = useSecurityVerify();

  const [copied, setCopied] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [withdrawTo, setWithdrawTo] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [exportedKey, setExportedKey] = useState('');
  const [pinAction, setPinAction] = useState<'export' | 'withdraw' | null>(null);

  const copyAddress = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      toast.success('Da sao chep dia chi vi');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ══ Security-wrapped export ══
  const handleExport = async () => {
    const result = await security.verify();

    if (result.method === 'passkey' && result.verified) {
      try {
        const data = await exportKey();
        setExportedKey(data.privateKey);
      } catch {
        toast.error('Khong the export vi');
      }
      return;
    }

    if (result.method === 'pin') {
      setPinAction('export');
      security.setShowPinInput(true);
      return;
    }

    if (result.method === 'setup-pin') {
      setPinAction('export');
      security.setShowPinSetup(true);
      return;
    }

    // method === 'none' (error fetching status) -> fallback to no-pin export
    try {
      const data = await exportKey();
      setExportedKey(data.privateKey);
    } catch {
      toast.error('Khong the export vi');
    }
  };

  // ══ Security-wrapped withdraw ══
  const handleWithdraw = async () => {
    if (!withdrawTo || !withdrawAmount) return;

    const result = await security.verify();

    if (result.method === 'passkey' && result.verified) {
      try {
        await sendTransaction({ to: withdrawTo, amount: withdrawAmount });
        setShowWithdraw(false);
        setWithdrawTo('');
        setWithdrawAmount('');
      } catch {
        // Error handled in mutation onError
      }
      return;
    }

    if (result.method === 'pin') {
      setPinAction('withdraw');
      security.setShowPinInput(true);
      return;
    }

    if (result.method === 'setup-pin') {
      setPinAction('withdraw');
      security.setShowPinSetup(true);
      return;
    }

    // method === 'none' -> fallback
    try {
      await sendTransaction({ to: withdrawTo, amount: withdrawAmount });
      setShowWithdraw(false);
      setWithdrawTo('');
      setWithdrawAmount('');
    } catch {
      // Error handled in mutation onError
    }
  };

  // ══ Handler: sau khi nhap PIN dung ══
  const handlePinSubmit = async (pin: string) => {
    const ok = await security.verifyPin(pin);
    if (!ok) return; // Error hien trong modal

    security.setShowPinInput(false);

    if (pinAction === 'export') {
      try {
        const data = await exportKey({ pin });
        setExportedKey(data.privateKey);
      } catch {
        toast.error('Export that bai');
      }
    }

    if (pinAction === 'withdraw') {
      try {
        await sendTransaction({ to: withdrawTo, amount: withdrawAmount, pin });
        setShowWithdraw(false);
        setWithdrawTo('');
        setWithdrawAmount('');
      } catch {
        // Error handled in mutation onError
      }
    }

    setPinAction(null);
  };

  // ══ Handler: setup PIN lan dau ══
  const handlePinSetup = async (pin: string) => {
    try {
      await setPinApi(pin);
      await refetchSecurity();
      security.setShowPinSetup(false);
      toast.success('Da cai ma PIN thanh cong!');

      // Sau setup -> tiep tuc action bang PIN vua tao
      if (pinAction === 'export') {
        try {
          const data = await exportKey({ pin });
          setExportedKey(data.privateKey);
        } catch {
          toast.error('Export that bai');
        }
      } else if (pinAction === 'withdraw') {
        try {
          await sendTransaction({ to: withdrawTo, amount: withdrawAmount, pin });
          setShowWithdraw(false);
          setWithdrawTo('');
          setWithdrawAmount('');
        } catch {
          // Error handled in mutation onError
        }
      }
      setPinAction(null);
    } catch (err: any) {
      toast.error(err?.message || 'Cai PIN that bai');
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
          <span className="ml-2 text-sm text-farm-brown-dark/60">Dang tai vi...</span>
        </div>
      </div>
    );
  }

  // ─── Chua co wallet ───
  if (!hasWallet) {
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm">
        <h3 className="font-heading text-sm font-bold flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-base text-farm-green-dark">account_balance_wallet</span>
          Vi FARMVERSE
        </h3>
        <p className="text-[10px] text-gray-600 mb-3">
          Chua co vi. Vi se duoc tao tu dong khi ban dang nhap lai.
        </p>
        <p className="text-[9px] text-gray-400 text-center flex items-center justify-center gap-1">
          Mien phi · <span className="bg-white/80 px-1 py-0.5 rounded flex items-center gap-1 text-farm-brown-dark font-bold"><img src="/icons/avalanche-avax-logo.png" alt="AVAX" className="w-2.5 h-2.5 object-contain" /> Avalanche C-Chain</span>
        </p>
      </div>
    );
  }

  // ─── Da co wallet ───
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading text-sm font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-farm-green-dark">account_balance_wallet</span>
          Vi FARMVERSE
        </h3>
        <button onClick={() => refetch()} className="p-1 rounded-lg hover:bg-white/50 transition-colors" title="Lam moi">
          <span className="material-symbols-outlined text-sm text-gray-400 hover:text-farm-green-dark">refresh</span>
        </button>
      </div>

      {/* Address */}
      <div className="mb-3">
        <p className="text-[10px] text-gray-500 mb-1">Dia chi vi</p>
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
          <p className="text-[10px] text-gray-500">So du</p>
          <p className="text-base font-heading font-bold text-farm-brown-dark">
            {parseFloat(wallet?.balance || '0').toFixed(6)} <span className="text-xs text-gray-500">AVAX</span>
          </p>
        </div>
        <div className="text-right flex flex-col items-end">
          <p className="text-[10px] text-gray-500 mb-0.5">Mang</p>
          <div className="flex items-center gap-1.5 bg-white/50 px-2 py-0.5 rounded-lg border border-white/20">
            <img src="/icons/avalanche-avax-logo.png" alt="AVAX" className="w-4 h-4 object-contain" />
            <p className="text-xs font-bold text-farm-brown-dark">Avalanche C-Chain</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {/* Nap tien — Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <button className="flex flex-col items-center gap-1 p-3 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 active:scale-95 transition-all min-h-[56px]">
              <span className="material-symbols-outlined text-lg">download</span>
              <span className="text-[10px] font-bold">Nap tien</span>
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md w-[340px] max-w-[95vw] overflow-hidden bg-farm-earth border border-white/10 shadow-2xl p-0 gap-0 rounded-xl">
            {/* Top gradient line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-green-600 via-primary to-green-600"></div>

            <div className="flex items-center justify-between px-5 pt-4 pb-0">
              <DialogTitle className="text-lg font-bold tracking-tight text-white m-0 flex items-center gap-2">
                <span className="material-symbols-outlined text-green-400">account_balance_wallet</span>
                Nạp AVAX
              </DialogTitle>
              {/* Note: Radix UI dialog automatically provides a Close button, but we wrap the content to hide its default styling in css, or just let Radix close it by clicking outside */}
            </div>

            <div className="px-5 py-4 space-y-4">
              <div className="relative rounded-lg bg-[#5D3A29] border border-[#8B5E3C] shadow-inner p-3 group">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] pointer-events-none"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="bg-white p-2 rounded-lg shadow-lg mb-3">
                    {wallet?.address ? (
                      <QRCodeCanvas
                        id="custodial-qr-canvas"
                        value={wallet.address}
                        size={192} // w-48
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
                      <div className="w-[192px] h-[192px] bg-gray-200 animate-pulse flex items-center justify-center text-gray-400 text-xs">Dang tai...</div>
                    )}
                  </div>
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
                        toast.success('Da tai anh QR');
                      } catch {
                        toast.error('Co loi xay ra khi tao anh QR');
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-wood-light/20 border border-[#8B5E3C] hover:bg-wood-light/40 transition-all text-[#D4B483] hover:text-white text-xs font-semibold"
                  >
                    <span className="material-symbols-outlined text-base">download</span>
                    Tải mã QR
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-xs text-orange-200/90 bg-orange-900/20 py-1.5 rounded border border-orange-500/20">
                <span className="material-symbols-outlined text-sm text-orange-400">warning</span>
                <span>Chỉ gửi qua mạng <strong>Avalanche C-Chain</strong></span>
              </div>

              <div className="bg-black/30 rounded border border-[#8B5E3C]/30 p-2 flex items-center gap-2 backdrop-blur-sm">
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <span className="text-[10px] text-[#D4B483] uppercase tracking-wider font-semibold mb-0.5">Địa chỉ ví nhận</span>
                  <code className="text-white font-mono text-xs truncate select-all">{wallet?.address}</code>
                </div>
                <button
                  onClick={copyAddress}
                  className="p-1.5 rounded bg-[#8B5E3C] hover:bg-[#A67C52] text-white transition-colors flex-shrink-0 shadow-sm border border-[#5D3A29]"
                >
                  <span className="material-symbols-outlined text-lg leading-none">{copied ? 'check' : 'content_copy'}</span>
                </button>
              </div>
            </div>

            <div className="bg-black/40 px-5 py-3 border-t border-white/5 backdrop-blur-sm flex items-center justify-between">
              <span className="text-slate-400 text-xs font-medium">Số dư hiện tại</span>
              <span className="text-white text-sm font-bold flex items-center gap-1">
                {parseFloat(wallet?.balance || '0').toFixed(6)} AVAX
                {Number(wallet?.balance || 0) === 0 && (
                  <span className="material-symbols-outlined text-red-500 text-base" title="Can nap them">error</span>
                )}
              </span>
            </div>

            {/* Decorative icons */}
            <div className="absolute -bottom-4 -right-4 opacity-5 pointer-events-none">
              <span className="material-symbols-outlined text-8xl text-green-400">agriculture</span>
            </div>
            <div className="absolute top-8 -left-4 opacity-5 pointer-events-none rotate-12">
              <span className="material-symbols-outlined text-6xl text-[#8B5E3C]">grass</span>
            </div>
          </DialogContent>
        </Dialog>

        {/* Rut tien */}
        <button
          onClick={() => { setShowWithdraw(!showWithdraw); setShowExport(false); setExportedKey(''); }}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl border active:scale-95 transition-all min-h-[56px] ${showWithdraw ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
            }`}
        >
          <span className="material-symbols-outlined text-lg">upload</span>
          <span className="text-[10px] font-bold">Rut tien</span>
        </button>

        {/* Export */}
        <button
          onClick={() => { setShowExport(!showExport); setShowWithdraw(false); setExportedKey(''); }}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl border active:scale-95 transition-all min-h-[56px] ${showExport ? 'bg-gray-200 border-gray-400 text-gray-700' : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
            }`}
        >
          <span className="material-symbols-outlined text-lg">key</span>
          <span className="text-[10px] font-bold">Export</span>
        </button>
      </div>

      {/* WITHDRAW PANEL */}
      {showWithdraw && (
        <div className="border-t border-[#e9c46a]/30 pt-3 space-y-3 animate-fade-in">
          <p className="text-xs text-gray-600 font-bold">Rut AVAX ra vi ngoai</p>
          <input
            type="text"
            placeholder="Dia chi nhan (0x...)"
            value={withdrawTo}
            onChange={(e) => setWithdrawTo(e.target.value)}
            className="w-full px-3 py-3 border border-[#e9c46a] rounded-xl text-xs font-mono bg-[#fefae0] focus:outline-none focus:ring-2 focus:ring-farm-green-dark/50"
          />
          <input
            type="number"
            placeholder="So luong AVAX"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            step="0.001"
            min="0"
            className="w-full px-3 py-3 border border-[#e9c46a] rounded-xl text-xs bg-[#fefae0] focus:outline-none focus:ring-2 focus:ring-farm-green-dark/50"
          />
          <button
            onClick={handleWithdraw}
            disabled={isSending || !withdrawTo || !withdrawAmount || security.isVerifying}
            className="w-full py-3 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-blue-500 to-blue-600 active:scale-[0.98] transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSending || security.isVerifying ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {security.isVerifying ? 'Dang xac nhan...' : 'Dang gui...'}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">send</span>
                Xac nhan rut tien
              </>
            )}
          </button>
          <p className="text-[9px] text-gray-400 text-center">Phi gas se duoc tru tu so du vi</p>
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
                  Private key cho phep toan quyen truy cap vi. <strong>KHONG chia se voi ai.</strong>
                </p>
              </div>
              <button
                onClick={handleExport}
                disabled={isExporting || security.isVerifying}
                className="w-full py-3 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-red-500 to-red-600 active:scale-[0.98] transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isExporting || security.isVerifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {security.isVerifying ? 'Dang xac nhan...' : 'Dang lay...'}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">visibility</span>
                    Hien Private Key
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-600">Import vao MetaMask hoac Trust Wallet:</p>
              <div className="bg-red-50 p-3 rounded-xl break-all text-[10px] font-mono border border-red-200 select-all">
                {exportedKey}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { navigator.clipboard.writeText(exportedKey); toast.success('Da copy Private Key'); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-farm-brown bg-[#fefae0] border border-[#e9c46a] active:scale-95 transition-all flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                  Copy
                </button>
                <button
                  onClick={() => { setExportedKey(''); setShowExport(false); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-gray-500 bg-gray-100 border border-gray-200 active:scale-95 transition-all"
                >
                  An
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Security Status */}
      <div className="border-t border-[#e9c46a]/30 pt-3 mt-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 text-xs flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">shield</span>
            Bao mat vi
          </span>
          <div className="flex gap-2">
            {securityStatus?.hasPin && (
              <span className="text-green-600 text-[10px] font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                PIN
              </span>
            )}
            {securityStatus?.hasPasskey && (
              <span className="text-green-600 text-[10px] font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                Van tay
              </span>
            )}
            {!securityStatus?.hasPin && !securityStatus?.hasPasskey && (
              <span className="text-orange-500 text-[10px] font-bold bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                Chua cai dat
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Snowtrace link */}
      {snowtraceUrl && (
        <a
          href={snowtraceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 font-bold mt-3"
        >
          <span className="material-symbols-outlined text-sm">open_in_new</span>
          Xem tren Snowtrace
        </a>
      )}

      {/* PIN Modals */}
      <PinInputModal
        open={security.showPinInput}
        onClose={() => { security.setShowPinInput(false); security.reset(); setPinAction(null); }}
        onSubmit={handlePinSubmit}
        error={security.pinError}
        attemptsRemaining={security.attemptsRemaining}
        blocked={security.blocked}
        isLoading={security.isVerifying}
      />

      <PinSetupModal
        open={security.showPinSetup}
        onClose={() => { security.setShowPinSetup(false); setPinAction(null); }}
        onSubmit={handlePinSetup}
        isLoading={false}
      />
    </div>
  );
}
