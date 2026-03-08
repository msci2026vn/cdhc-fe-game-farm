import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSmartWallet } from '@/shared/hooks/useSmartWallet';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Copy } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { useTranslation } from 'react-i18next';

export function SmartWalletCard() {
  const { t } = useTranslation();
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

  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (walletStatus?.address) {
      navigator.clipboard.writeText(walletStatus.address);
      setCopied(true);
      toast.success(t('address_copied'));
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
          <span className="ml-2 text-sm text-farm-brown-dark/60">{t('loading_wallet')}</span>
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
          {t('smart_wallet')}
        </h3>
        <p className="text-[10px] text-gray-600 mb-3">
          {t('smart_wallet_desc')}
        </p>

        <div className="flex items-center gap-2 text-xs mb-3">
          {hasPasskey ? (
            <span className="flex items-center gap-1 text-green-600 font-bold">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              {t('passkey_created')}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-gray-500">
              <span className="material-symbols-outlined text-sm">fingerprint</span>
              {t('no_passkey_msg')}
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
              {isRegisteringPasskey ? t('creating_passkey') :
                isCreatingWallet ? t('creating_wallet') :
                  t('processing')}
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-base">fingerprint</span>
              {hasPasskey ? t('create_smart_wallet') : t('scan_fingerprint_create')}
            </>
          )}
        </button>

        <p className="text-[9px] text-gray-400 text-center mt-2 flex items-center justify-center gap-1">
          {t('free_gas')} · <span className="bg-white/80 px-1 py-0.5 rounded flex items-center gap-1 text-farm-brown-dark font-bold"><img src="/icons/avalanche-avax-logo.png" alt="AVAX" className="w-2.5 h-2.5 object-contain" /> Avalanche C-Chain</span> · ERC-4337
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
          {t('smart_wallet')}
        </h3>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${walletStatus?.isDeployed
          ? 'bg-green-100 text-green-700 border border-green-200'
          : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
          }`}>
          {walletStatus?.isDeployed ? t('activated') : t('not_activated')}
        </span>
      </div>

      {/* Address */}
      <div className="mb-3">
        <p className="text-[10px] text-gray-500 mb-1">{t('wallet_address')}</p>
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
          <p className="text-[10px] text-gray-500">{t('balance')}</p>
          <p className="text-base font-heading font-bold text-farm-brown-dark">
            {walletStatus?.balance || '0'} <span className="text-xs text-gray-500">AVAX</span>
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

      {/* Nút Nạp tiền */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full h-10 rounded-xl border-[#e9c46a] text-farm-brown-dark hover:bg-[#fefae0]">
              <Download className="mr-2 h-4 w-4" />
              {t('deposit_to_wallet')}
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
                <DialogTitle className="text-xl font-bold tracking-tight text-white m-0">{t('deposit_avax_to_wallet')}</DialogTitle>
              </div>
            </DialogHeader>
            <div className="px-6 pb-2 text-center relative z-10">
              <p className="text-[#D4B483] text-sm leading-relaxed">
                {t('send_avax_instruction')} <span className="text-white font-semibold">Avalanche C-Chain</span>.
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
                          <div className="w-[180px] h-[180px] bg-gray-200 animate-pulse flex items-center justify-center text-gray-400 text-xs">{t('loading')}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      const element = document.getElementById('vip-card-template');
                      if (!element) {
                        toast.error(t('vip_template_not_found'));
                        return;
                      }

                      try {
                        const toastId = toast.loading(t('initializing_vip_card'));

                        await document.fonts.ready;

                        const canvas = await html2canvas(element, {
                          scale: 2, // Tăng chất lượng ảnh
                          backgroundColor: null,
                          useCORS: true,
                          logging: false,
                        });

                        const pngUrl = canvas.toDataURL("image/png");
                        const downloadLink = document.createElement("a");
                        downloadLink.href = pngUrl;
                        downloadLink.download = "organic-kingdom-vip-deposit.png";
                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);
                        toast.success(t('vip_qr_downloaded'), { id: toastId });
                      } catch (err) {
                        toast.error(t('qr_error'));
                        console.error(err);
                      }
                    }}
                    className="mb-8 flex items-center gap-2 px-6 py-2.5 rounded-full bg-black/30 border border-[#8B5E3C] hover:bg-black/50 transition-all text-[#D4B483] hover:text-white text-sm font-semibold group-hover:border-[#D4B483]/50 shadow-inner"
                  >
                    <span className="material-symbols-outlined text-lg">download</span>
                    {t('download_qr_image')}
                  </button>

                  <div className="flex w-full items-center justify-between mb-2">
                    <label className="text-[11px] uppercase tracking-wider text-[#D4B483] font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">qr_code_2</span> {t('receive_address_upper')}
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
                  <h4 className="text-orange-200 text-sm font-bold mb-1">{t('choose_correct_network')}</h4>
                  <p className="text-orange-200/70 text-xs leading-snug">{t('wrong_network_warning')}</p>
                </div>
              </div>

              <div>
                <p className="text-[#D4B483]/70 text-xs mb-3 flex items-center gap-2 before:content-[''] before:h-px before:w-6 before:bg-[#D4B483]/10 after:content-[''] after:h-px after:flex-1 after:bg-[#D4B483]/10">
                  {t('can_send_avax_from')}
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
                <span>{t('current_balance_upper')}:</span>
                <span className="text-white font-bold flex items-center gap-1">
                  {walletStatus?.balance || '0'} AVAX
                  {Number(walletStatus?.balance || 0) === 0 && (
                    <span className="material-symbols-outlined text-red-500 text-base" title={t('deposit')}>error</span>
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

        {/* Nút Nạp Visa */}
        <Button
          variant="outline"
          onClick={() => navigate('/farmverse/topup')}
          className="w-full h-10 rounded-xl border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
        >
          <span className="material-symbols-outlined mr-2 text-[18px]">credit_card</span>
          {t('topup_visa')}
        </Button>
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
          {t('view_on_snowtrace')}
        </a>
      )}

      {!walletStatus?.isDeployed && (
        <p className="text-[9px] text-gray-400 mt-2">
          {t('wallet_auto_activate_msg')}
        </p>
      )}

      {/* Mẫu HTML ẩn dùng để tạo hình ảnh Thẻ VIP. Được đặt offscreen */}
      <div className="absolute top-[-9999px] left-[-9999px] z-[-1] pointer-events-none">
        <div id="vip-card-template" className="w-[440px] bg-[#f8fcfc] border-[1.5px] border-white/85 shadow-[0_2px_0_rgba(255,255,255,0.9)_inset,0_20px_60px_rgba(17,157,164,0.15),0_4px_16px_rgba(0,0,0,0.06)] p-0 flex flex-col gap-0 rounded-[24px] overflow-hidden font-sans relative">
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
            <div className="w-2 h-2 rounded-full bg-[#4ADE80] shadow-[0_0_7px_#4ADE80]"></div>
            <div className="text-[11px] font-medium text-[#0D7A80] tracking-[0.03em]">Network: <strong className="font-bold">Avalanche C-Chain</strong></div>
          </div>

          {/* QR Code */}
          <div className="px-6 pb-5 flex flex-col items-center gap-3.5">
            <div className="p-3.5 bg-white rounded-[18px] shadow-[0_0_0_1.5px_rgba(17,157,164,0.2),0_8px_30px_rgba(17,157,164,0.16),0_2px_8px_rgba(0,0,0,0.06)] relative">
              <div className="absolute top-[-1px] left-[-1px] w-4 h-4 border-l-2 border-t-2 border-[#119DA4] rounded-tl-[4px]"></div>
              <div className="absolute top-[-1px] right-[-1px] w-4 h-4 border-r-2 border-t-2 border-[#119DA4] rounded-tr-[4px]"></div>
              <div className="absolute bottom-[-1px] left-[-1px] w-4 h-4 border-l-2 border-b-2 border-[#119DA4] rounded-bl-[4px]"></div>
              <div className="absolute bottom-[-1px] right-[-1px] w-4 h-4 border-r-2 border-b-2 border-[#119DA4] rounded-br-[4px]"></div>

              {walletStatus?.address ? (
                <QRCodeCanvas
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
                <div className="w-[200px] h-[200px] bg-gray-100 flex items-center justify-center text-gray-400 text-xs rounded-[6px]">{t('loading')}</div>
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.12em] uppercase text-[#5A8A6A] before:content-[''] before:w-[18px] before:h-px before:bg-[#119DA4]/40 after:content-[''] after:w-[18px] after:h-px after:bg-[#119DA4]/40">
              {t('scan_to_send_avax')}
            </div>
          </div>

          {/* Address Box */}
          <div className="px-6 pb-[18px]">
            <div className="text-[9px] font-bold tracking-[0.18em] uppercase text-[#5A8A6A] mb-1.5 pl-0.5 flex items-center gap-1">
              <span className="text-[#D4A017] material-symbols-outlined text-[12px] -rotate-45">key</span> {t('receive_address_upper')}
            </div>
            <div className="bg-white/80 border-[1.5px] border-[#119DA4]/20 rounded-xl p-3 shadow-[0_2px_10px_rgba(17,157,164,0.08)] flex items-center gap-2 relative">
              <code className="font-mono text-[12.5px] text-[#1A3A28] tracking-[0.03em] break-all leading-[1.65] flex-1 pr-2">{walletStatus?.address}</code>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="mx-6 mb-[18px] py-3 px-3.5 bg-[#FDE789]/35 border-y border-r border-[#D4A017]/30 border-l-[3px] border-l-[#D4A017] rounded-r-[10px] flex gap-2.5 items-start">
            <span className="material-symbols-outlined text-[15px] shrink-0 mt-px text-[#D4A017]">warning</span>
            <div>
              <h4 className="text-[11px] font-bold text-[#7A5500] mb-0.5">{t('send_only_on_avax')}</h4>
              <p className="text-[10px] text-[#9A7010] leading-relaxed">{t('wrong_network_loss_warning')}</p>
            </div>
          </div>

          {/* Sources */}
          <div className="px-6 pb-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px bg-[#119DA4]/20"></div>
              <h4 className="text-[9px] font-bold tracking-[0.14em] uppercase text-[#5A8A6A] text-center shrink-0">{t('can_send_from')}</h4>
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
                <div key={i} className="px-[13px] py-1.5 bg-white/70 border border-[#119DA4]/20 rounded-full text-[10px] font-semibold text-[#0D7A80] tracking-[0.04em]">
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
        </div>
      </div>
    </div>
  );
}
