'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import Link from 'next/link';
import {
  Building2,
  LogOut,
  User,
  ShieldCheck,
  LayoutDashboard,
  Database,
  Settings as SettingsIcon
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, isAr } = useLanguage();
  const { user: authUser, logout, isLoading: authLoading } = useAuth();

  // Router Protection
  useEffect(() => {
    if (!authLoading && (!authUser || authUser.role !== 'system_admin')) {
      router.push('/login');
    }
  }, [authUser, authLoading, router]);

  const handleLogoutClick = async () => {
    try {
      await logout();
      toast.add({
        title: 'تم تسجيل الخروج',
        description: 'تم إنهاء جلستك بنجاح. رافقتك السلامة!',
        type: 'success',
      });
      router.push('/login');
    } catch (error) {
      toast.add({
        title: 'خطأ',
        description: 'حدث خطأ أثناء محاولة تسجيل الخروج.',
        type: 'error',
      });
    }
  };

  if (authLoading || !authUser || authUser.role !== 'system_admin') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-medium">{isAr ? 'جاري التحقق من الصلاحيات والولوج...' : 'Verifying permissions and access...'}</p>
        </div>
      </div>
    );
  }

  const isLinkActive = (path: string) => {
    if (path === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(path);
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-row font-sans relative overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Decorative Background Blur */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] rounded-full bg-violet-600/5 blur-[100px] pointer-events-none -z-10" />

      {/* --- SIDEBAR LAYOUT --- */}
      <aside className={`w-64 bg-slate-900/60 ${isAr ? 'border-l' : 'border-r'} border-slate-800 backdrop-blur-xl shrink-0 flex flex-col justify-between p-6 z-30 sticky top-0 h-screen`}>
        <div className="space-y-8">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/20">
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-xl font-bold text-white tracking-wider block">{t('common.appName')}</span>
              <span className="text-[10px] text-indigo-400 block font-bold leading-none mt-0.5">{t('adminLayout.panelTitle')}</span>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="flex flex-col gap-1.5">
            <Link
              href="/admin"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isLinkActive('/admin') && !pathname.startsWith('/admin/tenants') && !pathname.startsWith('/admin/logs') && !pathname.startsWith('/admin/settings')
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              {t('adminLayout.menu.performance')}
            </Link>

            <Link
              href="/admin/tenants"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isLinkActive('/admin/tenants')
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-5 h-5" />
              {t('adminLayout.menu.tenants')}
            </Link>

            <Link
              href="/admin/logs"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isLinkActive('/admin/logs')
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <Database className="w-5 h-5" />
              {t('adminLayout.menu.logs')}
            </Link>

            <Link
              href="/admin/settings"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isLinkActive('/admin/settings')
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <SettingsIcon className="w-5 h-5" />
              {t('adminLayout.menu.settings')}
            </Link>
          </nav>
        </div>

        {/* Sidebar Footer User Card */}
        <div className="border-t border-slate-800/80 pt-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600/10 text-indigo-400 border border-indigo-500/10 rounded-xl flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className={`min-w-0 ${isAr ? 'text-right' : 'text-left'}`}>
              <p className="text-xs font-bold text-white truncate">
                {authUser.profile?.first_name || (isAr ? 'مسؤول' : 'System')} {authUser.profile?.last_name || (isAr ? 'النظام' : 'Admin')}
              </p>
              <p className="text-[10px] text-slate-500 truncate font-mono">{authUser.email}</p>
            </div>
          </div>

          <Button 
            onClick={handleLogoutClick}
            variant="outline" 
            className="w-full border-slate-800 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 text-slate-400 gap-2 px-4 rounded-xl transition-all h-10 text-xs cursor-pointer"
          >
            <LogOut className={`w-4 h-4 ${isAr ? 'ml-1' : 'mr-1'}`} />
            {t('common.logout')}
          </Button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Header */}
        <header className="border-b border-slate-900 bg-slate-950/40 backdrop-blur-md h-16 flex items-center justify-between px-8 shrink-0 z-20">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white tracking-wide">
              {pathname === '/admin' && t('adminLayout.headerTitles.performance')}
              {pathname.startsWith('/admin/tenants') && t('adminLayout.headerTitles.tenants')}
              {pathname.startsWith('/admin/logs') && t('adminLayout.headerTitles.logs')}
              {pathname.startsWith('/admin/settings') && t('adminLayout.headerTitles.settings')}
            </h2>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400 font-sans">
            <LanguageSelector />
            <span>
              {t('common.systemTime', {
                date: new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US')
              })}
            </span>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 p-8 space-y-6 overflow-y-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500 shrink-0">
          <p>{t('common.adminCopyright')}</p>
        </footer>
      </div>

    </div>
  );
}
