'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { translations, supportedLanguages, defaultLang, TranslationKeys } from '@/lib/locales';
import { useUser } from '@/contexts/user-context';

type LanguageCode = 'ko' | 'en' | 'es' | 'ja';

type LanguageContextType = {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: TranslationKeys) => string;
  supportedLanguages: { code: string; name: string }[];
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getInitialLanguage = (): LanguageCode => {
    if (typeof window !== 'undefined') {
        const storedLang = localStorage.getItem('aura-lang');
        if (storedLang && ['ko', 'en', 'es', 'ja'].includes(storedLang)) {
            return storedLang as LanguageCode;
        }
    }
    return defaultLang;
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(getInitialLanguage);
  const { user, isLoaded } = useUser();

  useEffect(() => {
    // Once user data is loaded, prioritize user's preference.
    if (isLoaded && user?.language) {
      if (language !== user.language) {
        setLanguageState(user.language);
      }
    }
  }, [user, isLoaded, language]);

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
        localStorage.setItem('aura-lang', lang);
    }
  }, []);

  const t = useCallback((key: TranslationKeys): string => {
    const langDict = translations[language] || translations[defaultLang];
    return langDict[key] || key;
  }, [language]);

  const value = { language, setLanguage, t, supportedLanguages };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
