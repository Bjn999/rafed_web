'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { translations } from '@/lib/translations';

type Language = 'ar' | 'en';
type Direction = 'rtl' | 'ltr';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  dir: Direction;
  t: (key: string, variables?: Record<string, string | number>) => string;
  isAr: boolean;
  isEn: boolean;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Read default language from cookies, default to 'ar'
  const [language, setLanguageState] = useState<Language>('ar');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLocale = Cookies.get('NEXT_LOCALE') as Language;
    if (savedLocale === 'ar' || savedLocale === 'en') {
      setLanguageState(savedLocale);
    }
    setMounted(true);
  }, []);

  const dir: Direction = language === 'ar' ? 'rtl' : 'ltr';

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    
    // Save language specifically for the current domain (tenant-specific)
    Cookies.set('NEXT_LOCALE', lang, { expires: 365 });
    
    // Update HTML element dir & lang directly
    if (typeof window !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }
  };

  // Sync document element attributes on mount & language change
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
  }, [language, mounted]);

  const t = (key: string, variables?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // return key as fallback if translation not found
      }
    }
    
    if (typeof value !== 'string') {
      return key;
    }

    if (variables) {
      let result = value;
      Object.entries(variables).forEach(([k, v]) => {
        result = result.replace(new RegExp(`{${k}}`, 'g'), String(v));
        result = result.replace(new RegExp(`:${k}`, 'g'), String(v));
      });
      return result;
    }

    return value;
  };

  const isAr = language === 'ar';
  const isEn = language === 'en';

  // Prevent flash of unlocalized content by returning layout container or checking mounted
  return (
    <LanguageContext.Provider value={{ language, setLanguage, dir, t, isAr, isEn }}>
      <div dir={dir} className={mounted ? '' : 'invisible'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
