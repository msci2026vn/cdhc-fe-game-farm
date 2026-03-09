import { useState, useEffect } from 'react'

export const useAppDisplay = () => {
    const [installPrompt, setInstallPrompt] = useState<any>(null)
    const [isFullscreen, setIsFullscreen] = useState(false)

    const isPWA = window.matchMedia('(display-mode: fullscreen)').matches
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
    const fsDecided = localStorage.getItem('fs_decided') === 'true'
    const pwaDismissed = localStorage.getItem('pwa_dismissed') === 'true'

    // Bắt sự kiện cài PWA (Android Chrome)
    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, [])

    // Track fullscreen state
    useEffect(() => {
        const onChange = () => setIsFullscreen(!!document.fullscreenElement)
        document.addEventListener('fullscreenchange', onChange)
        return () => document.removeEventListener('fullscreenchange', onChange)
    }, [])

    // Auto fullscreen khi đã ghi nhớ preference
    useEffect(() => {
        if (isPWA || !fsDecided) return
        if (localStorage.getItem('fs_pref') === 'true') {
            document.documentElement.requestFullscreen?.().catch(() => { })
        }
    }, [isPWA, fsDecided])

    const installPWA = async () => {
        if (!installPrompt) return false
        installPrompt.prompt()
        const { outcome } = await installPrompt.userChoice
        setInstallPrompt(null)
        return outcome === 'accepted'
    }

    const enterFullscreen = () => {
        document.documentElement.requestFullscreen?.().catch(() => { })
        localStorage.setItem('fs_decided', 'true')
        localStorage.setItem('fs_pref', 'true')
    }

    const dismissFullscreen = () => {
        localStorage.setItem('fs_decided', 'true')
        localStorage.setItem('fs_pref', 'false')
    }

    return {
        isPWA,
        isIOS,
        isFullscreen,
        canInstallPWA: !!installPrompt && !pwaDismissed,
        showFullscreenPrompt: !isPWA && !installPrompt && !isIOS && !fsDecided,
        showIOSGuide: isIOS && !isPWA,
        installPWA,
        enterFullscreen,
        dismissFullscreen,
    }
}
