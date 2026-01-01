import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';

i18n
    .use(initReactI18next)
    .use(
        resourcesToBackend((language: string, namespace: string) =>
            import(`./locales/${language}.json`)
        )
    )
    .init({
        lng: 'en', // Default language
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // React already safes from xss
        },
        react: {
            useSuspense: false // Avoiding suspense for now to prevent hydration mismatches if not handled
        }
    });

export default i18n;
