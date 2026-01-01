import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations directly to ensure they're available during SSR
import en from './locales/en.json';

i18n
    .use(initReactI18next)
    .init({
        lng: 'en', // Default language
        fallbackLng: 'en',
        resources: {
            en: {
                translation: en
            }
        },
        interpolation: {
            escapeValue: false, // React already safes from xss
        },
        react: {
            useSuspense: false // Avoiding suspense for now to prevent hydration mismatches if not handled
        }
    });

export default i18n;
