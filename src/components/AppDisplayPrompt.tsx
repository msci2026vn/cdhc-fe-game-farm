import React, { useState, useEffect } from 'react';
import { useAppDisplay } from '../hooks/useAppDisplay';

export const AppDisplayPrompt = () => {
    const {
        isPWA, isIOS,
        canInstallPWA, showFullscreenPrompt, showIOSGuide,
        installPWA, enterFullscreen, dismissFullscreen,
    } = useAppDisplay();

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
                <h2>Cài FARMVERSE</h2>
                <div className="ios-steps">
                    <div className="ios-step">
                        <span className="step-num">1</span>
                        <span>Nhấn nút <strong>⎙ Chia sẻ</strong> ở thanh dưới Safari</span>
                    </div>
                    <div className="ios-step">
                        <span className="step-num">2</span>
                        <span>Chọn <strong>"Thêm vào Màn hình chính"</strong></span>
                    </div>
                    <div className="ios-step">
                        <span className="step-num">3</span>
                        <span>Nhấn <strong>Thêm</strong> → mở icon FARMVERSE</span>
                    </div>
                </div>
                <button className="fs-no" onClick={() => setShow(false)}>Đóng</button>
            </div>
        </div>
    );

    // ─── PWA Install (Android) ────────────────────
    if (canInstallPWA) return (
        <div className="fs-backdrop">
            <div className="fs-popup">
                <div className="fs-icon">🌾</div>
                <h2>Cài FARMVERSE</h2>
                <p>Chơi như app thật — full màn hình, nhanh hơn, không cần mạng lần sau</p>

                <div className="pwa-benefits">
                    <div className="benefit">⚡<span>Nhanh hơn</span></div>
                    <div className="benefit">🖥️<span>Full màn hình</span></div>
                    <div className="benefit">📴<span>Offline</span></div>
                </div>

                <button className="fs-yes" onClick={async () => {
                    const ok = await installPWA();
                    if (!ok) setShow(false);
                }}>
                    📲 Cài Ngay — Miễn Phí
                </button>
                <button className="fs-no" onClick={() => {
                    localStorage.setItem('pwa_dismissed', 'true');
                    // Fallback: hỏi fullscreen thay thế
                    enterFullscreen();
                    setShow(false);
                }}>
                    Không cần, chơi luôn
                </button>
            </div>
        </div>
    );

    // ─── Fullscreen Fallback ──────────────────────
    if (showFullscreenPrompt) return (
        <div className="fs-backdrop">
            <div className="fs-popup">
                <div className="fs-icon">🎮</div>
                <h2>Chơi Toàn Màn Hình?</h2>
                <p>Ẩn thanh trình duyệt để board game hiển thị rộng hơn</p>

                <button className="fs-yes" onClick={() => {
                    enterFullscreen();
                    setShow(false);
                }}>
                    ⛶ Bật Toàn Màn Hình
                </button>
                <button className="fs-no" onClick={() => {
                    dismissFullscreen();
                    setShow(false);
                }}>
                    Thôi không cần
                </button>

                {/* Gợi iOS nếu cần */}
                {isIOS && (
                    <button className="fs-ios-hint" onClick={() => setIosGuide(true)}>
                        📱 iOS? Cài như app →
                    </button>
                )}
            </div>
        </div>
    );

    return null;
};
