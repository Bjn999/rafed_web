'use client';

import React, { useEffect, useState, useRef } from 'react';
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
  LayoutDashboard,
  Settings as SettingsIcon,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Users2
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, isAr } = useLanguage();
  const { user: authUser, tenant, logout, isLoading: authLoading } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Router Protection
  useEffect(() => {
    if (!authLoading) {
      if (!authUser) {
        router.push('/login');
      } else if (authUser.role === 'system_admin') {
        router.push('/admin');
      }
    }
  }, [authUser, authLoading, router]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  if (authLoading || !authUser || authUser.role === 'system_admin') {
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
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(path);
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-row font-sans relative overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Decorative Background Blur */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] rounded-full bg-violet-600/5 blur-[100px] pointer-events-none -z-10" />

      {/* --- SIDEBAR LAYOUT --- */}
      <aside 
        className={`${
          isCollapsed ? 'w-20' : 'w-64'
        } bg-slate-900/60 ${isAr ? 'border-l' : 'border-r'} border-slate-800 backdrop-blur-xl shrink-0 flex flex-col justify-between p-4 z-30 sticky top-0 h-screen transition-all duration-300 ease-in-out`}
      >
        <div className="space-y-8">
          
          {/* Logo Brand & Collapse Toggle */}
          <div className={`flex items-center justify-between ${isCollapsed ? 'flex-col gap-4' : 'flex-row'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/20 shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              {!isCollapsed && (
                <div className="animate-in fade-in duration-300">
                  <span className="text-xl font-bold text-white tracking-wider block">{t('common.appName')}</span>
                  <span className="text-[10px] text-indigo-400 block font-bold truncate max-w-[130px] leading-none mt-0.5">{tenant?.name || t('dashboardLayout.workspace')}</span>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 hover:bg-slate-800/60 rounded-xl text-slate-400 hover:text-white border border-transparent hover:border-slate-800 transition-all duration-200 cursor-pointer"
            >
              {isCollapsed ? (isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />) : (isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />)}
            </button>
          </div>

          {/* Navigation links */}
          <nav className="flex flex-col gap-1.5">
            <Link
              href="/dashboard"
              className={`w-full flex items-center gap-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                isCollapsed ? 'justify-center px-0' : 'px-4'
              } ${
                isLinkActive('/dashboard') &&
                !pathname.startsWith('/dashboard/settings') &&
                !pathname.startsWith('/dashboard/projects') &&
                !pathname.startsWith('/dashboard/employees')
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="animate-in fade-in duration-300">{t('dashboardLayout.menu.performance')}</span>}
            </Link>

            <Link
              href="/dashboard/projects"
              className={`w-full flex items-center gap-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                isCollapsed ? 'justify-center px-0' : 'px-4'
              } ${
                isLinkActive('/dashboard/projects')
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <FolderKanban className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="animate-in fade-in duration-300">{t('dashboardLayout.menu.projects')}</span>}
            </Link>

            <Link
              href="/dashboard/employees"
              className={`w-full flex items-center gap-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                isCollapsed ? 'justify-center px-0' : 'px-4'
              } ${
                isLinkActive('/dashboard/employees')
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <Users2 className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="animate-in fade-in duration-300">{t('dashboardLayout.menu.employees')}</span>}
            </Link>

            <Link
              href="/dashboard/settings"
              className={`w-full flex items-center gap-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                isCollapsed ? 'justify-center px-0' : 'px-4'
              } ${
                isLinkActive('/dashboard/settings')
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <SettingsIcon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="animate-in fade-in duration-300">{t('dashboardLayout.menu.settings')}</span>}
            </Link>
          </nav>
        </div>

        {/* Sidebar Footer User Dropdown */}
        <div className="border-t border-slate-800/80 pt-4 relative" ref={dropdownRef}>
          {/* Dropdown Popover */}
          {isDropdownOpen && (
            <div className={`absolute bottom-16 ${isCollapsed ? 'right-0 w-44' : 'right-0 left-0'} bg-slate-900 border border-slate-800 rounded-xl p-2 shadow-2xl animate-in slide-in-from-bottom-2 duration-200 z-50`}>
              <Link 
                href="/dashboard/settings?tab=profile" 
                onClick={() => setIsDropdownOpen(false)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all ${isAr ? 'text-right' : 'text-left'}`}
              >
                <User className={`w-4 h-4 text-indigo-400 ${isAr ? 'ml-2' : 'mr-2'}`} />
                {t('dashboardLayout.dropdown.profile')}
              </Link>
              
              <div className="h-px bg-slate-800 my-1" />
              
              <button 
                onClick={() => {
                  setIsDropdownOpen(false);
                  handleLogoutClick();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all cursor-pointer ${isAr ? 'text-right' : 'text-left'}`}
              >
                <LogOut className={`w-4 h-4 ${isAr ? 'ml-2' : 'mr-2'}`} />
                {t('dashboardLayout.dropdown.logout')}
              </button>
            </div>
          )}

          {/* User Button */}
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`w-full flex items-center hover:bg-slate-800/40 border border-transparent hover:border-slate-800/50 rounded-xl transition-all duration-200 cursor-pointer group ${
              isCollapsed ? 'justify-center p-2' : 'justify-between p-2.5'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 bg-indigo-600/10 text-indigo-400 border border-indigo-500/10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                {authUser.profile?.first_name?.charAt(0) || <User className="w-4 h-4" />}
              </div>
              {!isCollapsed && (
                <div className={`min-w-0 animate-in fade-in duration-300 ${isAr ? 'text-right' : 'text-left'}`}>
                  <p className="text-xs font-bold text-white truncate">
                    {authUser.profile?.first_name || (isAr ? 'المستخدم' : 'User')} {authUser.profile?.last_name || ''}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate font-mono mt-0.5">{authUser.email}</p>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-300 animate-in fade-in duration-300" />
            )}
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA (Scrollable) --- */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Header (Sticky) */}
        <header className="border-b border-slate-900 bg-slate-950/40 backdrop-blur-md h-16 flex items-center justify-between px-8 sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white tracking-wide">
              {pathname === '/dashboard' && t('dashboardLayout.headerTitles.performance')}
              {pathname === '/dashboard/projects' && t('dashboardLayout.headerTitles.projects')}
              {pathname.startsWith('/dashboard/projects/') && t('dashboardLayout.headerTitles.projectDetails')}
              {pathname === '/dashboard/employees' && t('dashboardLayout.headerTitles.employees')}
              {pathname.startsWith('/dashboard/settings') && t('dashboardLayout.headerTitles.settings')}
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

        {/* Content Wrapper (Only this scrolls) */}
        <main className="flex-1 p-8 space-y-6 overflow-y-auto relative">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500 shrink-0">
          <p>{t('common.platformCopyright')}</p>
        </footer>
      </div>

    </div>
  );
}
