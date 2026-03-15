import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/translation.json';
import he from './locales/he/translation.json';
import fr from './locales/fr/translation.json';
import ru from './locales/ru/translation.json';
import ar from './locales/ar/translation.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      he: { translation: he },
      fr: { translation: fr },
      ru: { translation: ru },
      ar: { translation: ar },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
