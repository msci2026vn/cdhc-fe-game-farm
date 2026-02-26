export interface Language {
  code: string;
  country: string;
  name: string;
  nativeName: string;
}

export interface LanguageSwitcherProps {
  className?: string;
}

export interface UseLanguageReturn {
  currentLang: Language;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  changeLanguage: (lang: Language) => void;
  getFlagUrl: (countryCode: string) => string;
}
