import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonVI from './locales/vi/common.json';
import commonEN from './locales/en/common.json';

// Tạm thời khai báo các resources ở đây.
// Khi dự án lớn lên, có thể tách riêng ra các file index.ts trong thư mục locales
const resources = {
    vi: {
        common: commonVI,
    },
    en: {
        common: commonEN,
    },
};

i18n
    // Phát hiện ngôn ngữ của người dùng (từ trình duyệt, localStorage, url...)
    .use(LanguageDetector)
    // Truyền đối tượng i18n vào react-i18next
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'vi', // Ngôn ngữ dự phòng nếu không tìm thấy chuỗi dịch
        debug: process.env.NODE_ENV === 'development',

        // Đặt namespace mặc định
        defaultNS: 'common',

        interpolation: {
            escapeValue: false, // React đã tự động escape chống XSS
        },

        // Cấu hình LanguageDetector để lưu trữ ngôn ngữ đang chọn
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        }
    });

export default i18n;
