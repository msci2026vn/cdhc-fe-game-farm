/**
 * useTranslationCache — Lưu và khôi phục ngôn ngữ Google Translate
 *
 * Google Translate dùng cookie `googtrans=/auto/en` để nhớ ngôn ngữ.
 * Hook này:
 * 1. Lắng nghe khi Google Translate thiết lập ngôn ngữ mới → lưu vào localStorage
 * 2. Khi app khởi động → đọc localStorage → tự set lại cookie `googtrans`
 *    để Google Translate tự áp dụng ngôn ngữ đã chọn trước đó.
 */

const STORAGE_KEY = 'gt_lang'; // localStorage key
const COOKIE_NAME = 'googtrans'; // Google Translate cookie

function getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string) {
    // Set at root path, no expiry = session — but we also save to localStorage
    document.cookie = `${name}=${value}; path=/`;
    // Some versions of GT also need the cookie on subdomain
    document.cookie = `${name}=${value}; path=/; domain=${window.location.hostname}`;
}

/** Restore previously selected language on page load */
export function restoreTranslation(): void {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    // Only restore if Google Translate hasn't already set a different lang
    const current = getCookie(COOKIE_NAME);
    if (current && current !== '/auto/auto') return; // GT already set something

    setCookie(COOKIE_NAME, saved);

    // Trigger Google Translate if available
    const tryTrigger = () => {
        const sel = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
        if (sel) {
            // Extract target lang, e.g. "/auto/en" → "en"
            const lang = saved.split('/').pop() ?? '';
            if (lang && lang !== 'auto' && lang !== 'vi') {
                sel.value = lang;
                sel.dispatchEvent(new Event('change'));
            }
        }
    };

    // Try after GT script loads
    setTimeout(tryTrigger, 1200);
    setTimeout(tryTrigger, 2500);
}

/** Watch for Google Translate language changes and save to localStorage */
export function watchTranslation(): () => void {
    const observer = new MutationObserver(() => {
        const cookie = getCookie(COOKIE_NAME);
        if (cookie && cookie !== '/auto/auto' && cookie !== '/auto/vi') {
            localStorage.setItem(STORAGE_KEY, cookie);
        }
    });

    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class', 'lang'],
    });

    // Also poll the cookie every 3s for 30s after load
    let ticks = 0;
    const interval = setInterval(() => {
        const cookie = getCookie(COOKIE_NAME);
        if (cookie && cookie !== '/auto/auto' && cookie !== '/auto/vi') {
            localStorage.setItem(STORAGE_KEY, cookie);
        }
        if (++ticks >= 10) clearInterval(interval);
    }, 3000);

    return () => {
        observer.disconnect();
        clearInterval(interval);
    };
}

/** React hook — call once in root App */
export function useTranslationCache(): void {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    (typeof window !== 'undefined') && (() => {
        // useEffect alternative for non-React call sites
    })();
}
