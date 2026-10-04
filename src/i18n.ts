import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ja from './locales/ja.json';
import en from './locales/en.json';

export const LANGUAGES = [
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' },
] as const;

const STORAGE_KEY = 'tablespec-lang';

function readSavedLanguage(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'ja';
  } catch {
    return 'ja';
  }
}

i18n.use(initReactI18next).init({
  resources: { en, ja },
  lng: readSavedLanguage(),
  fallbackLng: 'ja',
  interpolation: {
    escapeValue: false,
  },
});

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // ストレージが使えない環境では保存しない
  }
  document.documentElement.lang = lng;
});

document.documentElement.lang = i18n.language;

export default i18n;
