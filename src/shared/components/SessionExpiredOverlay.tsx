import React from 'react';
import { useUIStore } from '../stores/uiStore';
import { playSound } from '@/shared/audio';
import { useTranslation } from 'react-i18next';

export const SessionExpiredOverlay = () => {
    const isSessionExpired = useUIStore((s) => s.isSessionExpired);
    const { t } = useTranslation();

    if (!isSessionExpired) return null;

    const handleLoginRedirect = () => {
        playSound('ui_click');
        window.location.href = '/login';
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-fade-in">
            <div 
                className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-white/20 flex flex-col items-center text-center p-8 scale-in"
                style={{
                    background: 'linear-gradient(160deg, rgba(40,45,30,0.9) 0%, rgba(20,25,15,0.95) 100%)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.8), inset 0 0 20px rgba(255,255,255,0.05)',
                }}
            >
                {/* Decorative Icon */}
                <div className="w-20 h-20 mb-6 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30 animate-pulse">
                    <span className="text-4xl">🔐</span>
                </div>

                <h2 className="text-2xl font-black text-white mb-3 tracking-wide uppercase font-heading"
                    style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    {t('session_expired_title', { defaultValue: 'Phiên Hết Hạn' })}
                </h2>

                <p className="text-white/70 text-sm leading-relaxed mb-8 px-2">
                    {t('session_expired_desc', { defaultValue: 'Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại để tiếp tục hành trình.' })}
                </p>

                {/* Wooden Style Button */}
                <button
                    onClick={handleLoginRedirect}
                    className="w-full py-4 rounded-xl font-heading font-black text-white active:scale-95 transition-all shadow-lg relative overflow-hidden group"
                    style={{
                        background: "url('/assets/battle/frame_skill_bar.png')",
                        backgroundSize: '100% 100%',
                    }}
                >
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                    <span className="relative z-10 text-lg drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                        {t('relogin_button', { defaultValue: 'Đăng Nhập Lại' })}
                    </span>
                </button>
                
                {/* Subtle shine over the button */}
                <div className="absolute bottom-8 left-8 right-8 h-10 pointer-events-none opacity-20 bg-gradient-to-t from-white/20 to-transparent rounded-xl" />
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scale-in {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
                .scale-in {
                    animation: scale-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
            `}} />
        </div>
    );
};
