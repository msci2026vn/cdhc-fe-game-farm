import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
    const { t, i18n } = useTranslation();

    const handleLanguageChange = (lang: string) => {
        i18n.changeLanguage(lang);
    };

    return (
        <div className="w-full px-4 py-4 flex items-center justify-between hover:bg-black/5 active:bg-black/10 transition-colors text-left">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-orange-600">translate</span>
                </div>
                <div>
                    <div className="font-bold text-farm-brown-dark">{t('language_switcher_title')}</div>
                    <div className="text-xs text-gray-500">
                        {i18n.language === 'en' ? 'English (Tiếng Anh)' : 'Tiếng Việt (Vietnamese)'}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => handleLanguageChange('vi')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors ${i18n.language === 'vi'
                        ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                        : 'bg-gray-100 text-gray-500 border-2 border-transparent'
                        }`}
                >
                    🇻🇳 VN
                </button>
                <button
                    onClick={() => handleLanguageChange('en')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors ${i18n.language === 'en'
                        ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                        : 'bg-gray-100 text-gray-500 border-2 border-transparent'
                        }`}
                >
                    🇺🇸 EN
                </button>
            </div>
        </div>
    );
}
