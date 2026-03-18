import { Language } from '../types';

export const LANGUAGES: Language[] = [
  { code: 'vi', country: 'vn', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'en', country: 'us', name: 'English', nativeName: 'English' },
  { code: 'ko', country: 'kr', name: 'Korean', nativeName: '한국어' },
  { code: 'ja', country: 'jp', name: 'Japanese', nativeName: '日本語' },
  { code: 'zh-TW', country: 'tw', name: 'Traditional Chinese', nativeName: '繁體中文' },
  { code: 'zh-CN', country: 'cn', name: 'Simplified Chinese', nativeName: '简体中文' },
  { code: 'hi', country: 'in', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ru', country: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'pt', country: 'br', name: 'Portuguese', nativeName: 'Português' },
  { code: 'es', country: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'de', country: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'fr', country: 'fr', name: 'French', nativeName: 'Français' },
];

export const DEFAULT_LANGUAGE = LANGUAGES[0];

export const STORAGE_KEY = 'cdhc-language';

export const FLAG_CDN_BASE = 'https://flagcdn.com';
