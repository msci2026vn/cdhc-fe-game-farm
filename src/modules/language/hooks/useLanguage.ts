import { useState, useEffect, useRef, useCallback } from 'react';
import { Language, UseLanguageReturn } from '../types';
import {
  LANGUAGES,
  DEFAULT_LANGUAGE,
  STORAGE_KEY,
  FLAG_CDN_BASE,
  INCLUDED_LANGUAGES,
} from '../config/languages';

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

export function useLanguage(): UseLanguageReturn {
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const found = LANGUAGES.find(l => l.code === saved);
      if (found) return found;
    }
    return DEFAULT_LANGUAGE;
  });
  const [isOpen, setIsOpen] = useState(false);
  const isInitialized = useRef(false);

  // Load Google Translate script once
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    window.googleTranslateElementInit = () => {
      if (window.google?.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'vi',
            includedLanguages: INCLUDED_LANGUAGES,
            autoDisplay: false,
          },
          'google_translate_element'
        );
      }
    };

    if (!document.querySelector('script[src*="translate.google.com"]')) {
      const script = document.createElement('script');
      script.src =
        '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    } else if (window.google?.translate) {
      window.googleTranslateElementInit();
    }
  }, []);

  // Auto-restore saved language after Google Translate loads
  useEffect(() => {
    if (currentLang.code === DEFAULT_LANGUAGE.code) return;

    const tryRestore = () => {
      const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (select) {
        select.value = currentLang.code;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    };

    // Retry a few times since Google Translate loads async
    if (!tryRestore()) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (tryRestore() || attempts >= 20) clearInterval(interval);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [currentLang.code]);

  const changeLanguage = useCallback((lang: Language) => {
    setCurrentLang(lang);
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, lang.code);

    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (select) {
      select.value = lang.code;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      const domain = window.location.hostname;
      document.cookie = `googtrans=/vi/${lang.code}; path=/`;
      document.cookie = `googtrans=/vi/${lang.code}; path=/; domain=${domain}`;
      setTimeout(() => window.location.reload(), 100);
    }
  }, []);

  const getFlagUrl = useCallback((countryCode: string) => {
    return `${FLAG_CDN_BASE}/w80/${countryCode}.png`;
  }, []);

  return { currentLang, isOpen, setIsOpen, changeLanguage, getFlagUrl };
}
