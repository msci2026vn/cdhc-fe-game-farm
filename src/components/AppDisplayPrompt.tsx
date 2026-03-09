import React, { useState, useEffect } from 'react';
import { useAppDisplay } from '../hooks/useAppDisplay';
import { useTranslation, Trans } from 'react-i18next';

export const AppDisplayPrompt = () => {
    const {
        isPWA, isIOS,
        canInstallPWA, showFullscreenPrompt, showIOSGuide,
        installPWA, enterFullscreen, dismissFullscreen,
    } = useAppDisplay();
    const { t } = useTranslation();

    const [show, setShow] = useState(false);
    const [iosGuide, setIosGuide] = useState(false);

    useEffect(() => {
        if (isPWA) return;
        const t = setTimeout(() => {
            if (canInstallPWA || showFullscreenPrompt || showIOSGuide) setShow(true);
        }, 1200); // delay 1.2s sau khi load
        return () => clearTimeout(t);
    }, [canInstallPWA, showFullscreenPrompt, showIOSGuide, isPWA]);

    if (!show) return null;

    // ─── iOS Guide ───────────────────────────────
    if (isIOS && iosGuide) return (
        <div className="fs-backdrop" onClick={() => setShow(false)}>
            <div className="fs-popup" onClick={e => e.stopPropagation()}>
                <div className="fs-icon">📱</div>
                <h2>{t('install_farmverse')}</h2>
                <div className="ios-steps">
                    <div className="ios-step">
                        <span className="step-num">1</span>
                        <span><Trans i18nKey="ios_install_step1">Nhấn nút <strong>⎙ Chia sẻ</strong> ở thanh dưới Safari</Trans></span>
                    </div>
                    <div className="ios-step">
                        <span className="step-num">2</span>
                        <span><Trans i18nKey="ios_install_step2">Chọn <strong>"Thêm vào Màn hình chính"</strong></Trans></span>
                    </div>
                    <div className="ios-step">
                        <span className="step-num">3</span>
                        <span><Trans i18nKey="ios_install_step3">Nhấn <strong>Thêm</strong> → mở icon FARMVERSE</Trans></span>
                    </div>
                </div>
                <button className="fs-no" onClick={() => setShow(false)}>{t('close')}</button>
            </div>
        </div>
    );

    // ─── PWA Install (Android) ────────────────────
    if (canInstallPWA) return (
        <div className="fs-backdrop">
            <div className="fs-popup">
                <div className="fs-icon">🌾</div>
                <h2>{t('install_farmverse')}</h2>
                <p>{t('pwa_benefits_desc')}</p>

                <div className="pwa-benefits">
                    <div className="benefit">⚡<span>{t('faster')}</span></div>
                    <div className="benefit">🖥️<span>{t('fullscreen')}</span></div>
                    <div className="benefit">📴<span>{t('offline')}</span></div>
                </div>

                <button className="fs-yes" onClick={async () => {
                    const ok = await installPWA();
                    if (!ok) setShow(false);
                }}>
                    📲 {t('install_now_free')}
                </button>
                <button className="fs-no" onClick={() => {
                    localStorage.setItem('pwa_dismissed', 'true');
                    // Fallback: hỏi fullscreen thay thế
                    enterFullscreen();
                    setShow(false);
                }}>
                    {t('no_thanks_play_now')}
                </button>
            </div>
        </div>
    );

    // ─── Fullscreen Fallback ──────────────────────
    if (showFullscreenPrompt) return (
        <div className="fs-backdrop">
            <div className="fs-popup">
                <div className="fs-icon">🎮</div>
                <h2>{t('play_fullscreen_q')}</h2>
                <p>{t('fullscreen_desc')}</p>

                <button className="fs-yes" onClick={() => {
                    enterFullscreen();
                    setShow(false);
                }}>
                    ⛶ {t('enable_fullscreen')}
                </button>
                <button className="fs-no" onClick={() => {
                    dismissFullscreen();
                    setShow(false);
                }}>
                    {t('no_thanks')}
                </button>

                {/* Gợi iOS nếu cần */}
                {isIOS && (
                    <button className="fs-ios-hint" onClick={() => setIosGuide(true)}>
                        📱 iOS? {t('install_like_app')} →
                    </button>
                )}
            </div>
        </div>
    );

    return null;
};
