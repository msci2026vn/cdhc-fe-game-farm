import { useEffect, useRef } from 'react';
import { LanguageSwitcherProps } from '../types';
import { LANGUAGES } from '../config/languages';
import { useLanguage } from '../hooks/useLanguage';

export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { currentLang, isOpen, setIsOpen, changeLanguage, getFlagUrl } =
    useLanguage();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, setIsOpen]);

  return (
    <div className={`lang-switcher ${className}`} ref={dropdownRef}>
      {/* Trigger - flag button */}
      <button
        className="lang-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Chọn ngôn ngữ"
        aria-expanded={isOpen}
      >
        <img
          src={getFlagUrl(currentLang.country)}
          alt={currentLang.name}
          className="lang-trigger-flag"
        />
        <span className="lang-trigger-code">
          {currentLang.code.toUpperCase()}
        </span>
        <svg
          className={`lang-chevron ${isOpen ? 'open' : ''}`}
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
        >
          <path
            d="M1 1L5 5L9 1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dropdown overlay + grid */}
      {isOpen && (
        <>
          <div className="lang-backdrop" onClick={() => setIsOpen(false)} />
          <div className="lang-dropdown">
            <div className="lang-dropdown-header">
              <span>🌐</span>
              <span>Ngôn ngữ / Language</span>
            </div>
            <div className="lang-grid">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  className={`lang-option ${currentLang.code === lang.code ? 'active' : ''}`}
                  onClick={() => changeLanguage(lang)}
                  title={lang.name}
                >
                  <img
                    src={getFlagUrl(lang.country)}
                    alt={lang.name}
                    className="lang-flag"
                    loading="lazy"
                  />
                  <span className="lang-name">{lang.nativeName}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Hidden Google Translate element - REQUIRED */}
      <div id="google_translate_element" style={{ display: 'none' }} />
    </div>
  );
}
