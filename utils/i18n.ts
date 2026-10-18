import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en/translation.json';

// English only. Strings still go through t() so the text lives in one JSON file.
i18n
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en } },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already handles XSS
    },
  });

export default i18n;
