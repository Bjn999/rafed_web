'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Globe, ChevronDown, Check } from 'lucide-react';

export function LanguageSelector() {
  const { language, setLanguage, isAr } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const selectLanguage = (lang: 'ar' | 'en') => {
    setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-right" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-foreground hover:text-foreground bg-card hover:bg-muted border border-border hover:border-indigo-500/30 rounded-xl transition-all duration-200 cursor-pointer shadow-sm select-none"
      >
        <Globe className="w-4 h-4 text-indigo-400" />
        <span>{isAr ? 'العربية' : 'English'}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute ${isAr ? 'left-0' : 'right-0'} mt-2 w-40 bg-card border border-border rounded-2xl p-1.5 shadow-2xl animate-in slide-in-from-top-2 fade-in duration-200 z-50 backdrop-blur-xl`}
        >
          <button
            onClick={() => selectLanguage('ar')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
              isAr
                ? 'bg-indigo-600/10 text-indigo-400'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <span>العربية (العربية)</span>
            {isAr && <Check className="w-3.5 h-3.5" />}
          </button>
          
          <button
            onClick={() => selectLanguage('en')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
              !isAr
                ? 'bg-indigo-600/10 text-indigo-400'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <span>English (English)</span>
            {!isAr && <Check className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}
