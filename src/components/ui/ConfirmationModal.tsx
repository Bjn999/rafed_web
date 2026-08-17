'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import {
  X,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2
} from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type = 'info',
  isLoading = false,
}: ConfirmationModalProps) {
  const { isAr } = useLanguage();

  if (!isOpen) return null;

  // Colors and Icons configuration based on type
  const config = {
    danger: {
      icon: <AlertTriangle className="w-8 h-8 text-rose-500 animate-bounce" />,
      iconBg: 'bg-rose-500/10 border-rose-500/20',
      btnBg: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20',
      focusBorder: 'focus:border-rose-500',
    },
    warning: {
      icon: <AlertCircle className="w-8 h-8 text-amber-500" />,
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      btnBg: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20',
      focusBorder: 'focus:border-amber-500',
    },
    success: {
      icon: <CheckCircle2 className="w-8 h-8 text-emerald-500" />,
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      btnBg: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20',
      focusBorder: 'focus:border-emerald-500',
    },
    info: {
      icon: <Info className="w-8 h-8 text-indigo-400" />,
      iconBg: 'bg-indigo-500/10 border-indigo-500/20',
      btnBg: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20',
      focusBorder: 'focus:border-indigo-500',
    },
  }[type];

  const defaultCancelText = cancelText || (isAr ? 'إلغاء' : 'Cancel');
  const defaultConfirmText = confirmText || (isAr ? 'تأكيد' : 'Confirm');

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-[999] animate-in fade-in duration-200" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Modal Container */}
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200 focus:outline-none"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className={`absolute ${isAr ? 'left-4' : 'right-4'} top-4 p-2 text-slate-500 hover:text-slate-350 hover:bg-slate-800/50 rounded-xl transition-all cursor-pointer disabled:opacity-50`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content Box */}
        <div className={`flex flex-col items-center text-center mt-3 ${isAr ? 'text-right' : 'text-left'}`}>
          {/* Icon Wrapper */}
          <div className={`p-4 rounded-2xl border-2 mb-4 flex items-center justify-center ${config.iconBg}`}>
            {config.icon}
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-white mb-2 leading-tight">
            {title}
          </h3>

          {/* Description Message */}
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            {message}
          </p>
        </div>

        {/* Buttons Row */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-850">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full bg-slate-800 hover:bg-slate-700/80 text-slate-200 rounded-xl py-3 px-5 text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 border border-transparent hover:border-slate-700"
          >
            {defaultCancelText}
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full rounded-xl py-3 px-5 text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg ${config.btnBg} disabled:opacity-50`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 text-white animate-spin" />
                {isAr ? 'جاري التحميل...' : 'Loading...'}
              </>
            ) : (
              defaultConfirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
