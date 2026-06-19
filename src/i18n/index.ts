import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import Storage from '../utils/storage';

import es from './locales/es.json';
import en from './locales/en.json';
import qu from './locales/qu.json';
import ay from './locales/ay.json';
import gn from './locales/gn.json';

const resources = {
  es: { translation: es },
  en: { translation: en },
  qu: { translation: qu },
  ay: { translation: ay },
  gn: { translation: gn },
};

// 1. Obtener idioma del dispositivo como fallback predeterminado
const locales = Localization.getLocales();
const deviceLanguage = locales && locales[0] ? locales[0].languageCode : 'es';

// 2. Inicializar i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: deviceLanguage || 'es',
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false, // React ya previene XSS
    },
  });

// 3. Función asíncrona para cargar el idioma guardado por el usuario
export const loadSavedLanguage = async () => {
  try {
    const savedLanguage = await Storage.getItem('user-language');
    if (savedLanguage && ['es', 'en', 'qu', 'ay', 'gn'].includes(savedLanguage)) {
      await i18n.changeLanguage(savedLanguage);
    }
  } catch (error) {
    console.error('Error cargando idioma guardado:', error);
  }
};

export default i18n;
