import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustodialWallet } from '@/shared/hooks/useCustodialWallet';
import { useSecurityVerify } from '@/shared/hooks/useSecurityVerify';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { QRCodeCanvas } from 'qrcode.react';
import { PinInputModal } from './PinInputModal';
import { PinSetupModal } from './PinSetupModal';
import { useTranslation } from 'react-i18next';

export function CustodialWalletCard() {
  const { t } = useTranslation();
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
  const navigate = useNavigate();

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
      toast.success(t('address_copied'));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ══ Security-wrapped export ══
  const handleExport = async () => {
    const result = await security.verify();

    if (result.method === 'passkey' && result.verified) {
      try {
        const data = await exportKey({});
        setExportedKey(data.privateKey);
      } catch {
        toast.error(t('export_failed'));
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
      const data = await exportKey({});
      setExportedKey(data.privateKey);
    } catch {
      toast.error(t('export_failed'));
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
        toast.error(t('export_failed'));
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
      toast.success(t('pin_setup_success'));

      // Sau setup -> tiep tuc action bang PIN vua tao
      if (pinAction === 'export') {
        try {
          const data = await exportKey({ pin });
          setExportedKey(data.privateKey);
        } catch {
          toast.error(t('export_failed'));
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
      toast.error(err?.message || t('pin_setup_failed'));
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
          <span className="ml-2 text-sm text-farm-brown-dark/60">{t('loading_wallet')}</span>
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
          {t('farmverse_wallet')}
        </h3>
        <p className="text-[10px] text-gray-600 mb-3">
          {t('no_wallet_msg')}
        </p>
        <p className="text-[9px] text-gray-400 text-center flex items-center justify-center gap-1">
          {t('free')} · <span className="bg-white/80 px-1 py-0.5 rounded flex items-center gap-1 text-farm-brown-dark font-bold"><img src="/icons/avalanche-avax-logo.png" alt="AVAX" className="w-2.5 h-2.5 object-contain" /> Avalanche C-Chain</span>
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
          {t('farmverse_wallet')}
        </h3>
        <button onClick={() => refetch()} className="p-1 rounded-lg hover:bg-white/50 transition-colors" title="Làm mới">
          <span className="material-symbols-outlined text-sm text-gray-400 hover:text-farm-green-dark">refresh</span>
        </button>
      </div>

      {/* Address */}
      <div className="mb-3">
        <p className="text-[10px] text-gray-500 mb-1">{t('wallet_address')}</p>
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
          <p className="text-[10px] text-gray-500">{t('balance')}</p>
          <p className="text-base font-heading font-bold text-farm-brown-dark">
            {parseFloat(wallet?.balance || '0').toFixed(6)} <span className="text-xs text-gray-500">AVAX</span>
          </p>
        </div>
        <div className="text-right flex flex-col items-end">
          <p className="text-[10px] text-gray-500 mb-0.5">{t('network')}</p>
          <div className="flex items-center gap-1.5 bg-white/50 px-2 py-0.5 rounded-lg border border-white/20">
            <img src="/icons/avalanche-avax-logo.png" alt="AVAX" className="w-4 h-4 object-contain" />
            <p className="text-xs font-bold text-farm-brown-dark">Avalanche C-Chain</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {/* Nạp tiền — Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <button className="flex flex-col items-center gap-1 p-3 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 active:scale-95 transition-all min-h-[56px]">
              <span className="material-symbols-outlined text-lg">download</span>
              <span className="text-[10px] font-bold">{t('deposit')}</span>
            </button>
          </DialogTrigger>
          <DialogContent className="!w-[calc(100vw-24px)] !max-w-[380px] !p-0 !gap-0 !rounded-2xl !bg-[#3d2b1f] border !border-white/10 shadow-[0_25px_60px_-12px_rgba(0,0,0,0.7)] overflow-hidden">
            {/* Top gradient line */}
            <div className="h-1 w-full bg-gradient-to-r from-green-600 via-[#ec5b13] to-green-600 flex-shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
              <DialogTitle className="text-base font-bold tracking-tight text-white m-0 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-green-400">account_balance_wallet</span>
                {t('deposit_avax')}
              </DialogTitle>
              <DialogClose asChild>
                <button className="flex h-9 w-9 items-center justify-center rounded-full active:bg-white/10 transition-colors text-white/70">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </DialogClose>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: 'min(520px, calc(85dvh - 120px))' }}>
              <div className="px-4 pb-4 space-y-3">
                {/* QR Code block */}
                <div className="rounded-xl bg-[#5D3A29] border border-[#8B5E3C]/60 p-3">
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="bg-white p-2.5 rounded-xl shadow-lg">
                      {wallet?.address ? (
                        <QRCodeCanvas
                          id="custodial-qr-canvas"
                          value={wallet.address}
                          size={160}
                          bgColor="#ffffff"
                          fgColor="#000000"
                          level="Q"
                          includeMargin={false}
                          imageSettings={{
                            src: '/icons/avalanche-avax-logo.png',
                            x: undefined,
                            y: undefined,
                            height: 28,
                            width: 28,
                            excavate: true,
                          }}
                        />
                      ) : (
                        <div className="w-40 h-40 bg-gray-200 animate-pulse flex items-center justify-center text-gray-400 text-xs rounded-lg">{t('loading')}</div>
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
                          toast.success(t('qr_downloaded'));
                        } catch {
                          toast.error(t('qr_error'));
                        }
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#8B5E3C]/30 border border-[#8B5E3C] active:bg-[#8B5E3C]/60 transition-all text-[#D4B483] text-xs font-semibold min-h-[36px]"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      {t('download_qr')}
                    </button>
                  </div>
                </div>

                {/* Warning */}
                <div className="flex items-center justify-center gap-1.5 text-xs text-orange-200/90 bg-orange-900/25 py-2 px-3 rounded-xl border border-orange-500/25">
                  <span className="material-symbols-outlined text-sm text-orange-400 flex-shrink-0">warning</span>
                  <span>{t('send_only_avax_network')} <strong>Avalanche C-Chain</strong></span>
                </div>

                {/* Address */}
                <div className="bg-black/30 rounded-xl border border-[#8B5E3C]/40 p-3 flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-[#D4B483] uppercase tracking-wider font-semibold block mb-1">{t('receive_address')}</span>
                    <code className="text-white font-mono text-[11px] break-all leading-relaxed select-all">{wallet?.address}</code>
                  </div>
                  <button
                    onClick={copyAddress}
                    className="p-2.5 rounded-xl bg-[#8B5E3C] active:bg-[#A67C52] text-white transition-colors flex-shrink-0 shadow-sm border border-[#5D3A29] min-h-[40px] min-w-[40px] flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-base leading-none">{copied ? 'check' : 'content_copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer: balance */}
            <div className="bg-black/40 px-4 py-3 border-t border-white/5 flex items-center justify-between flex-shrink-0">
              <span className="text-slate-400 text-xs font-medium">{t('current_balance')}</span>
              <span className="text-white text-sm font-bold flex items-center gap-1.5">
                {parseFloat(wallet?.balance || '0').toFixed(6)} AVAX
                {Number(wallet?.balance || 0) === 0 && (
                  <span className="material-symbols-outlined text-red-400 text-base" title={t('deposit')}>error</span>
                )}
              </span>
            </div>

            {/* Radix default close override */}
            <DialogClose className="hidden" />
          </DialogContent>
        </Dialog>

        {/* Nạp thẻ (Visa) */}
        <button
          onClick={() => navigate('/farmverse/topup')}
          className="flex flex-col items-center gap-1 p-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 active:scale-95 transition-all min-h-[56px]"
        >
          <span className="material-symbols-outlined text-lg">credit_card</span>
          <span className="text-[10px] font-bold whitespace-nowrap">{t('topup_visa')}</span>
        </button>

        {/* Rút tiền */}
        <button
          onClick={() => { setShowWithdraw(!showWithdraw); setShowExport(false); setExportedKey(''); }}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl border active:scale-95 transition-all min-h-[56px] ${showWithdraw ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
            }`}
        >
          <span className="material-symbols-outlined text-lg">upload</span>
          <span className="text-[10px] font-bold">{t('withdraw')}</span>
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
          <p className="text-xs text-gray-600 font-bold">{t('withdraw_avax_out')}</p>
          <input
            type="text"
            placeholder={t('receive_address_placeholder')}
            value={withdrawTo}
            onChange={(e) => setWithdrawTo(e.target.value)}
            className="w-full px-3 py-3 border border-[#e9c46a] rounded-xl text-xs font-mono bg-[#fefae0] focus:outline-none focus:ring-2 focus:ring-farm-green-dark/50"
          />
          <input
            type="number"
            placeholder={t('amount_avax')}
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
                {security.isVerifying ? t('confirming') : t('sending')}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">send</span>
                {t('confirm_withdraw')}
              </>
            )}
          </button>
          <p className="text-[9px] text-gray-400 text-center">{t('gas_fee_deducted')}</p>
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
                  {t('private_key_warning')}
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
                    {security.isVerifying ? t('confirming') : t('fetching')}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">visibility</span>
                    {t('show_private_key')}
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-600">{t('import_metamask_msg')}</p>
              <div className="bg-red-50 p-3 rounded-xl break-all text-[10px] font-mono border border-red-200 select-all">
                {exportedKey}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { navigator.clipboard.writeText(exportedKey); toast.success(t('private_key_copied')); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-farm-brown bg-[#fefae0] border border-[#e9c46a] active:scale-95 transition-all flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                  {t('copy')}
                </button>
                <button
                  onClick={() => { setExportedKey(''); setShowExport(false); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-gray-500 bg-gray-100 border border-gray-200 active:scale-95 transition-all"
                >
                  {t('hide')}
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
            {t('wallet_security')}
          </span>
          <div className="flex gap-2">
            {securityStatus?.hasPin && (
              <span className="text-green-600 text-[10px] font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                {t('pin')}
              </span>
            )}
            {securityStatus?.hasPasskey && (
              <span className="text-green-600 text-[10px] font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                {t('fingerprint')}
              </span>
            )}
            {!securityStatus?.hasPin && !securityStatus?.hasPasskey && (
              <span className="text-orange-500 text-[10px] font-bold bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                {t('not_setup')}
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
          {t('view_on_snowtrace')}
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
