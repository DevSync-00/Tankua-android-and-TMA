import React, { createContext, useContext } from 'react';
import { translations } from '../config/translations';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const language = 'en';

  const changeLanguage = async () => {
    // Tankua is English-only for now. Keep this no-op so existing screens stay compatible.
  };

  const t = (key) => {
    return translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

