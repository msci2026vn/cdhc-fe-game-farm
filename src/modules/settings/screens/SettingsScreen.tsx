import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gameApi } from '@/shared/api/game-api';
import { useSecurityVerify } from '@/shared/hooks/useSecurityVerify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PinSetupModal } from '@/modules/profile/components/PinSetupModal';
import { ChangePinModal } from '../components/ChangePinModal';
import { startRegistration } from '@simplewebauthn/browser';
import { toast } from 'sonner';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

export default function SettingsScreen() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showPinSetup, setShowPinSetup } = useSecurityVerify();
    const [showChangePin, setShowChangePin] = useState(false);
    const [pinError, setPinError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    // Fullscreen
    const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    const toggleFullscreen = useCallback(async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (err) {
            toast.error(t('browser_no_fullscreen_support'));
        }
    }, [t]);

    // Fetch security status
    const { data: securityStatus, isLoading } = useQuery({
        queryKey: ['security-status'],
        queryFn: async () => {
            try {
                const status = await gameApi.getSecurityStatus();
                return status;
            } catch (err) {
                console.error('Failed to get security status', err);
                return null;
            }
        },
        staleTime: 0,
    });

    // Setup PIN mutation
    const setupPinMutation = useMutation({
        mutationFn: (pin: string) => gameApi.setWalletPin(pin),
        onSuccess: () => {
            setShowPinSetup(false);
            toast.success(t('pin_setup_success'));
            queryClient.invalidateQueries({ queryKey: ['security-status'] });
        },
        onError: (error: any) => {
            setPinError(error.message || t('pin_setup_error'));
        }
    });

    // Change PIN mutation
    const changePinMutation = useMutation({
        mutationFn: ({ oldPin, newPin }: { oldPin: string, newPin: string }) => gameApi.changeWalletPin(oldPin, newPin),
        onSuccess: () => {
            setShowChangePin(false);
            toast.success(t('pin_change_success'));
            queryClient.invalidateQueries({ queryKey: ['security-status'] });
        },
        onError: (error: any) => {
            setPinError(error.message || t('pin_change_error'));
        }
    });

    const handleSetupPin = async (pin: string) => {
        setPinError('');
        await setupPinMutation.mutateAsync(pin);
    };

    const handleChangePinSubmit = async (oldPin: string, newPin: string) => {
        setPinError('');
        await changePinMutation.mutateAsync({ oldPin, newPin });
    };

    const registerPasskey = useCallback(async () => {
        if (securityStatus?.hasPasskey) {
            toast.info(t('biometric_already_registered'));
            return;
        }

        setIsProcessing(true);
        try {
            // 1. Get options from server
            const options = await gameApi.getPasskeyRegisterOptions();

            // 2. Pass options to browser authenticator
            const credential = await startRegistration({ optionsJSON: options });

            // 3. Send result back to server
            // Attaching friendly name as browser info
            (credential as any).friendlyName = `${navigator.platform} ${navigator.userAgent.split(' ')[0]}`;
            await gameApi.registerPasskey(credential);

            toast.success(t('biometric_register_success'));
            queryClient.invalidateQueries({ queryKey: ['security-status'] });
        } catch (err: any) {
            console.error('Passkey registration failed:', err);
            // Filter out user cancellation errors from showing as big errors
            if (err.name === 'NotAllowedError') {
                toast.error(t('registration_cancelled'));
            } else {
                toast.error(err.message || t('biometric_register_error'));
            }
        } finally {
            setIsProcessing(false);
        }
    }, [securityStatus?.hasPasskey, queryClient]);

    if (isLoading) {
        return (
            <div className="h-[100dvh] max-w-[430px] mx-auto relative bg-farm-vibe flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-farm-brown border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="bg-background-light min-h-[100dvh] text-farm-brown-dark font-body overflow-hidden select-none">
            <div className="max-w-[430px] mx-auto h-[100dvh] flex flex-col relative bg-farm-vibe shadow-2xl overflow-hidden">

                {/* Background Patterns */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                    <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-yellow-200 rounded-full blur-[60px]" />
                    <div className="absolute bottom-[-50px] left-[-50px] w-64 h-64 bg-green-200 rounded-full blur-[60px]" />
                </div>

                {/* Top Header */}
                <div className="relative z-30 px-4 pt-4 pb-2 flex justify-between items-center shrink-0 border-b-2 border-farm-brown/10 bg-white/40">
                    <button
                        onClick={() => navigate('/')}
                        className="bg-white/80 p-2 rounded-xl shadow-sm text-farm-brown-dark hover:bg-white transition-colors border border-farm-brown/20"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="font-heading font-black text-xl text-farm-brown-dark tracking-wide">
                        {t('settings')}
                    </div>
                    <div className="w-10" /> {/* Spacer for centering */}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto px-4 py-6 z-10 space-y-6">

                    {/* Section: Display */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-farm-brown/20 shadow-sm overflow-hidden">
                        <div className="bg-green-50 px-4 py-3 flex items-center gap-2 border-b-2 border-farm-brown/10">
                            <span className="material-symbols-outlined text-green-600">display_settings</span>
                            <h2 className="font-heading font-bold text-farm-brown-dark text-lg">{t('display')}</h2>
                        </div>

                        {/* Fullscreen toggle */}
                        <button
                            onClick={toggleFullscreen}
                            className="w-full px-4 py-4 flex items-center justify-between hover:bg-black/5 active:bg-black/10 transition-colors text-left border-b-2 border-farm-brown/5"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-green-600">
                                        {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                                    </span>
                                </div>
                                <div>
                                    <div className="font-bold text-farm-brown-dark">{t('fullscreen')}</div>
                                    <div className="text-xs text-gray-500">
                                        {isFullscreen ? t('enabled_click_to_disable') : t('click_to_enable_fullscreen')}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Toggle pill */}
                                <div
                                    className={`w-12 h-6 rounded-full transition-colors duration-300 flex items-center px-1 ${isFullscreen ? 'bg-green-500' : 'bg-gray-300'
                                        }`}
                                >
                                    <div
                                        className={`w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${isFullscreen ? 'translate-x-6' : 'translate-x-0'
                                            }`}
                                    />
                                </div>
                            </div>
                        </button>

                        {/* Language Switcher */}
                        <LanguageSwitcher />
                    </div>

                    {/* Section: Security Details */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-farm-brown/20 shadow-sm overflow-hidden">
                        <div className="bg-orange-50 px-4 py-3 flex items-center gap-2 border-b-2 border-farm-brown/10">
                            <span className="material-symbols-outlined text-orange-500">security</span>
                            <h2 className="font-heading font-bold text-farm-brown-dark text-lg">{t('security_settings')}</h2>
                        </div>

                        <div className="divide-y-2 divide-farm-brown/5">

                            {/* PIN Code Setting */}
                            <button
                                onClick={() => {
                                    if (securityStatus?.hasPin) {
                                        setShowChangePin(true);
                                    } else {
                                        setShowPinSetup(true);
                                    }
                                }}
                                className="w-full px-4 py-4 flex items-center justify-between hover:bg-black/5 active:bg-black/10 transition-colors text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-blue-600">dialpad</span>
                                    </div>
                                    <div>
                                        <div className="font-bold text-farm-brown-dark">{t('pin_code')}</div>
                                        <div className="text-xs text-gray-500">
                                            {securityStatus?.hasPin ? t('configured') : t('not_configured')}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {securityStatus?.hasPin ? (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md font-bold">{t('enabled')}</span>
                                    ) : (
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-bold">{t('disabled')}</span>
                                    )}
                                    <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                                </div>
                            </button>

                            {/* Passkey / Biometrics Setting */}
                            <button
                                onClick={registerPasskey}
                                disabled={isProcessing}
                                className="w-full px-4 py-4 flex items-center justify-between hover:bg-black/5 active:bg-black/10 transition-colors text-left disabled:opacity-70"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-purple-600">fingerprint</span>
                                    </div>
                                    <div>
                                        <div className="font-bold text-farm-brown-dark">{t('fingerprint_biometric')}</div>
                                        <div className="text-xs text-gray-500">
                                            {securityStatus?.hasPasskey ? t('linked') : t('use_touch_face_id')}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {securityStatus?.hasPasskey ? (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md font-bold">{t('enabled')}</span>
                                    ) : (
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-bold">{t('disabled')}</span>
                                    )}
                                    {isProcessing ? (
                                        <span className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                                    )}
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Section: Additional Settings (Placeholder) */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-farm-brown/20 shadow-sm overflow-hidden">
                        <div className="bg-blue-50 px-4 py-3 flex items-center gap-2 border-b-2 border-farm-brown/10">
                            <span className="material-symbols-outlined text-blue-500">info</span>
                            <h2 className="font-heading font-bold text-farm-brown-dark text-lg">{t('app_info')}</h2>
                        </div>
                        <div className="px-4 py-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-farm-brown-dark">{t('version')}</span>
                                <span className="text-sm text-gray-500 font-mono">v1.2.0</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-farm-brown-dark">{t('developer')}</span>
                                <span className="text-sm text-gray-500">Farmverse Team</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section: Logout */}
                <div className="pt-2 px-4 pb-6 mt-auto shrink-0 z-10 w-full mb-8">
                    <button
                        onClick={async () => {
                            if (loggingOut) return;
                            setLoggingOut(true);
                            await gameApi.logout();
                        }}
                        disabled={loggingOut}
                        className="w-full py-3 rounded-xl font-heading text-base font-bold text-red-600 bg-red-50 border border-red-200 active:scale-[0.98] active:bg-red-100 transition-all disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        {loggingOut ? t('logging_out') : t('logout')}
                    </button>
                </div>

            </div>

            <PinSetupModal
                open={showPinSetup}
                onClose={() => setShowPinSetup(false)}
                onSubmit={handleSetupPin}
                isLoading={setupPinMutation.isPending}
                error={pinError}
            />

            <ChangePinModal
                open={showChangePin}
                onClose={() => setShowChangePin(false)}
                onSubmit={handleChangePinSubmit}
                isLoading={changePinMutation.isPending}
                error={pinError}
            />
        </div>
    );
}
