import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import ru from './locales/ru.json';
import es from './locales/es.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';
import ar from './locales/ar.json';
import kk from './locales/kk.json';
import nl from './locales/nl.json';
import cs from './locales/cs.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
      es: { translation: es },
      de: { translation: de },
      fr: { translation: fr },
      zh: { translation: zh },
      ja: { translation: ja },
      ar: { translation: ar },
      kk: { translation: kk },
      nl: { translation: nl },
      cs: { translation: cs },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
