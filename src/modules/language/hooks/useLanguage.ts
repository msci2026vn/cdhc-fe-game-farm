import { useState, useCallback } from 'react';
import { Language, UseLanguageReturn } from '../types';
import {
  LANGUAGES,
  DEFAULT_LANGUAGE,
  STORAGE_KEY,
  FLAG_CDN_BASE,
} from '../config/languages';

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

  const changeLanguage = useCallback((lang: Language) => {
    setCurrentLang(lang);
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, lang.code);
  }, []);

  const getFlagUrl = useCallback((countryCode: string) => {
    return `${FLAG_CDN_BASE}/w80/${countryCode}.png`;
  }, []);

  return { currentLang, isOpen, setIsOpen, changeLanguage, getFlagUrl };
}
