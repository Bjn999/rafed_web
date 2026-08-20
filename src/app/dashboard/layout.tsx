'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { ThemeToggle } from '@/components/ThemeToggle';
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
  Users2,
  Menu,
  Calendar,
  X,
  AlertCircle,
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, isAr } = useLanguage();
  const { user: authUser, tenant, logout, isLoading: authLoading } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showProfileIncompleteModal, setShowProfileIncompleteModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Handle Subscription Alert Modal (Once per day)
  useEffect(() => {
    if (authUser?.subscription_alert?.show_alert) {
      const today = new Date().toISOString().split('T')[0];
      const lastSeen = localStorage.getItem('last_subscription_alert_date');
      if (lastSeen !== today) {
        setShowSubscriptionModal(true);
        localStorage.setItem('last_subscription_alert_date', today);
      }
    }
  }, [authUser]);

  // Handle Incomplete Profile Modal
  useEffect(() => {
    if (authUser && authUser.role === 'company_admin' && tenant?.is_profile_completed === false) {
      setShowProfileIncompleteModal(true);
    } else {
      setShowProfileIncompleteModal(false);
    }
  }, [authUser, tenant]);

  // Router Protection & Suspension Check
  useEffect(() => {
    if (!authLoading) {
      if (!authUser) {
        router.push('/login');
      } else if (authUser.role === 'system_admin') {
        router.push('/admin');
      } else if (tenant?.status === 'suspended') {
        toast.add({
          title: isAr ? 'انتهى الاشتراك' : 'Subscription Expired',
          description: isAr ? 'انتهت فترة السماح لاشتراكك وتم إيقاف الحساب. يرجى التواصل مع الدعم أو تجديد الاشتراك.' : 'Your subscription grace period has ended and the account is suspended.',
          type: 'error',
        });
        logout().then(() => router.push('/login'));
      }
    }
  }, [authUser, authLoading, router, tenant, logout, isAr, t]);

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
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium">{isAr ? 'جاري التحقق من الصلاحيات والولوج...' : 'Verifying permissions and access...'}</p>
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

  const navLinks = (
    <nav className="flex flex-col gap-1.5">
      <Link
        href="/dashboard"
        className={`w-full flex items-center gap-3 py-3 rounded-xl text-sm font-semibold transition-all ${
          isCollapsed ? 'md:justify-center md:px-0 px-4' : 'px-4'
        } ${
          isLinkActive('/dashboard') &&
          !pathname.startsWith('/dashboard/settings') &&
          !pathname.startsWith('/dashboard/projects') &&
          !pathname.startsWith('/dashboard/employees')
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/10'
            : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
        }`}
      >
        <LayoutDashboard className="w-5 h-5 shrink-0" />
        {(!isCollapsed || isMobileOpen) && <span className="animate-in fade-in duration-300">{t('dashboardLayout.menu.performance')}</span>}
      </Link>

      <Link
        href="/dashboard/projects"
        className={`w-full flex items-center gap-3 py-3 rounded-xl text-sm font-semibold transition-all ${
          isCollapsed ? 'md:justify-center md:px-0 px-4' : 'px-4'
        } ${
          isLinkActive('/dashboard/projects')
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/10'
            : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
        }`}
      >
        <FolderKanban className="w-5 h-5 shrink-0" />
        {(!isCollapsed || isMobileOpen) && <span className="animate-in fade-in duration-300">{t('dashboardLayout.menu.projects')}</span>}
      </Link>

      <Link
        href="/dashboard/schedule"
        className={`w-full flex items-center gap-3 py-3 rounded-xl text-sm font-semibold transition-all ${
          isCollapsed ? 'md:justify-center md:px-0 px-4' : 'px-4'
        } ${
          isLinkActive('/dashboard/schedule')
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/10'
            : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
        }`}
      >
        <Calendar className="w-5 h-5 shrink-0" />
        {(!isCollapsed || isMobileOpen) && <span className="animate-in fade-in duration-300">{isAr ? 'الأنشطة والخطة الزمنية' : 'Activities & Schedule'}</span>}
      </Link>

      <Link
        href="/dashboard/employees"
        className={`w-full flex items-center gap-3 py-3 rounded-xl text-sm font-semibold transition-all ${
          isCollapsed ? 'md:justify-center md:px-0 px-4' : 'px-4'
        } ${
          isLinkActive('/dashboard/employees')
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/10'
            : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
        }`}
      >
        <Users2 className="w-5 h-5 shrink-0" />
        {(!isCollapsed || isMobileOpen) && <span className="animate-in fade-in duration-300">{t('dashboardLayout.menu.employees')}</span>}
      </Link>

      <Link
        href="/dashboard/settings"
        className={`w-full flex items-center gap-3 py-3 rounded-xl text-sm font-semibold transition-all ${
          isCollapsed ? 'md:justify-center md:px-0 px-4' : 'px-4'
        } ${
          isLinkActive('/dashboard/settings')
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/10'
            : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
        }`}
      >
        <SettingsIcon className="w-5 h-5 shrink-0" />
        {(!isCollapsed || isMobileOpen) && <span className="animate-in fade-in duration-300">{t('dashboardLayout.menu.settings')}</span>}
      </Link>
    </nav>
  );

  return (
    <div className="h-screen bg-background text-foreground flex flex-row font-sans relative overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Decorative Background Blur */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] rounded-full bg-purple-600/5 blur-[100px] pointer-events-none -z-10" />

      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* --- DESKTOP & MOBILE SIDEBAR LAYOUT --- */}
      <aside 
        className={`fixed md:sticky top-0 bottom-0 h-screen ${
          isAr ? 'right-0 border-l' : 'left-0 border-r'
        } ${
          isMobileOpen ? 'translate-x-0 w-72 z-50' : `${isAr ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0'} ${isCollapsed ? 'w-20' : 'w-64'} z-30`
        } bg-sidebar/95 md:bg-sidebar/60 border-sidebar-border backdrop-blur-xl shrink-0 flex flex-col justify-between p-4 transition-all duration-300 ease-in-out`}
      >
        <div className="space-y-8">
          
          {/* Logo Brand & Collapse Toggle */}
          <div className={`flex items-center justify-between ${isCollapsed && !isMobileOpen ? 'flex-col gap-4' : 'flex-row'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 text-primary rounded-2xl flex items-center justify-center border border-primary/20 shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              {(!isCollapsed || isMobileOpen) && (
                <div className="animate-in fade-in duration-300">
                  <span className="text-xl font-bold text-sidebar-foreground tracking-wider block">{t('common.appName')}</span>
                  <span className="text-[10px] text-muted-foreground block font-bold truncate max-w-[130px] leading-none mt-0.5">{tenant?.name || t('dashboardLayout.workspace')}</span>
                </div>
              )}
            </div>
            
            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-2 hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground border border-transparent hover:border-border transition-all duration-200 cursor-pointer"
            >
              {isCollapsed ? (isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />) : (isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />)}
            </button>

            {/* Mobile Drawer Close Button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden p-2 hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation links */}
          {navLinks}
        </div>

        {/* Sidebar Footer User Dropdown */}
        <div className="border-t border-border pt-4 relative" ref={dropdownRef}>
          {/* Dropdown Popover */}
          {isDropdownOpen && (
            <div className={`absolute bottom-16 ${isCollapsed && !isMobileOpen ? 'right-0 w-44' : 'right-0 left-0'} bg-popover border border-border rounded-xl p-2 shadow-2xl animate-in slide-in-from-bottom-2 duration-200 z-50`}>
              <Link 
                href="/dashboard/settings?tab=profile" 
                onClick={() => setIsDropdownOpen(false)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all ${isAr ? 'text-right' : 'text-left'}`}
              >
                <User className={`w-4 h-4 text-primary ${isAr ? 'ml-2' : 'mr-2'}`} />
                {t('dashboardLayout.dropdown.profile')}
              </Link>
              
              <div className="h-px bg-border my-1" />
              
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

          {/* User Button Container */}
          <div className="relative">
            {/* Floating Alert Icon */}
            {authUser?.subscription_alert?.show_alert && (
              <div className="absolute -top-3 right-0 left-0 flex justify-center z-10">
                <div className="group relative">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full shadow-lg cursor-pointer animate-bounce ${authUser.subscription_alert.status === 'grace_period' ? 'bg-rose-500 text-white shadow-rose-500/40' : 'bg-amber-500 text-white shadow-amber-500/40'}`}>
                    <AlertCircle className="w-3.5 h-3.5" />
                  </div>
                  {/* Tooltip */}
                  <div className={`absolute bottom-full mb-2 ${isCollapsed && !isMobileOpen ? 'left-8' : (isAr ? 'right-0' : 'left-0')} w-48 bg-popover text-foreground text-xs font-semibold p-2 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none border ${authUser.subscription_alert.status === 'grace_period' ? 'border-rose-500/50' : 'border-amber-500/50'}`}>
                    {authUser.subscription_alert.status === 'grace_period' 
                      ? (isAr ? 'اشتراكك منتهي! في فترة السماح' : 'Subscription expired! Grace period')
                      : (isAr ? 'تجديد الاشتراك قريب' : 'Renewal approaching')}
                  </div>
                </div>
              </div>
            )}

            {/* User Button */}
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`w-full flex items-center hover:bg-secondary border border-transparent hover:border-border rounded-xl transition-all duration-200 cursor-pointer group ${
              isCollapsed && !isMobileOpen ? 'justify-center p-2' : 'justify-between p-2.5'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 bg-primary/10 text-primary border border-primary/10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                {authUser.profile?.first_name?.charAt(0) || <User className="w-4 h-4" />}
              </div>
              {(!isCollapsed || isMobileOpen) && (
                <div className={`min-w-0 animate-in fade-in duration-300 ${isAr ? 'text-right' : 'text-left'}`}>
                  <p className="text-xs font-bold text-foreground truncate">
                    {authUser.profile?.first_name || (isAr ? 'المستخدم' : 'User')} {authUser.profile?.last_name || ''}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate font-mono mt-0.5">{authUser.email}</p>
                </div>
              )}
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground animate-in fade-in duration-300" />
            )}
            </button>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA (Scrollable) --- */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Header (Sticky) */}
        <header className="border-b border-border bg-background/80 backdrop-blur-md h-16 flex items-center justify-between px-4 sm:px-6 md:px-8 sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all border border-border"
              aria-label="Open Mobile Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <h2 className="text-base sm:text-lg font-bold text-foreground tracking-wide truncate max-w-[200px] sm:max-w-none">
              {pathname === '/dashboard' && t('dashboardLayout.headerTitles.performance')}
              {pathname === '/dashboard/projects' && t('dashboardLayout.headerTitles.projects')}
              {pathname.startsWith('/dashboard/projects/') && t('dashboardLayout.headerTitles.projectDetails')}
              {pathname === '/dashboard/schedule' && (isAr ? 'الأنشطة والخطة الزمنية' : 'Activities & Schedule Workspace')}
              {pathname === '/dashboard/employees' && t('dashboardLayout.headerTitles.employees')}
              {pathname.startsWith('/dashboard/settings') && t('dashboardLayout.headerTitles.settings')}
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 text-xs text-muted-foreground font-sans">
            <ThemeToggle />
            <LanguageSelector />
            <span className="hidden sm:inline">
              {t('common.systemTime', {
                date: new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US')
              })}
            </span>
          </div>
        </header>

        {/* Content Wrapper (Only this scrolls) */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 space-y-6 overflow-y-auto relative">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-background py-3 sm:py-4 text-center text-[10px] sm:text-xs text-muted-foreground shrink-0 px-4">
          <p>{t('common.platformCopyright')}</p>
        </footer>
      </div>

      {/* Subscription Alert Modal */}
      {showSubscriptionModal && authUser?.subscription_alert && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
            <div className={`p-6 ${authUser.subscription_alert.status === 'grace_period' ? 'bg-rose-500/10 border-b border-rose-500/20' : 'bg-amber-500/10 border-b border-amber-500/20'}`}>
              <div className="flex justify-between items-start">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${authUser.subscription_alert.status === 'grace_period' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  <AlertCircle className="w-6 h-6" />
                </div>
                <button onClick={() => setShowSubscriptionModal(false)} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <h3 className="text-xl font-bold text-foreground mt-4">
                {authUser.subscription_alert.status === 'grace_period' 
                  ? (isAr ? `انتهى اشتراكك ${authUser.subscription_alert.billing_cycle === 'monthly' ? 'الشهري' : 'السنوي'}!` : `Your ${authUser.subscription_alert.billing_cycle === 'monthly' ? 'monthly' : 'annual'} subscription expired!`)
                  : (isAr ? 'اقترب موعد تجديد الاشتراك' : 'Subscription renewal is approaching')}
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              <p className="text-muted-foreground text-sm leading-relaxed">
                {authUser.subscription_alert.status === 'grace_period'
                  ? (isAr 
                    ? `أنت الآن في فترة السماح. يرجى مسارعة تجديد الاشتراك لتجنب إيقاف الحساب. متبقي ${authUser.subscription_alert.billing_cycle === 'monthly' ? Math.ceil(authUser.subscription_alert.days_left * 24) + ' ساعة' : Math.ceil(authUser.subscription_alert.days_left) + ' يوم'} فقط على إيقاف الخدمة.`
                    : `You are in the grace period. Please hurry to renew your subscription to avoid account suspension. Only ${authUser.subscription_alert.billing_cycle === 'monthly' ? Math.ceil(authUser.subscription_alert.days_left * 24) + ' hours' : Math.ceil(authUser.subscription_alert.days_left) + ' days'} left.`)
                  : (isAr 
                    ? `يرجى العلم بأن اشتراكك ${authUser.subscription_alert.billing_cycle === 'monthly' ? 'الشهري' : 'السنوي'} سينتهي بعد ${Math.ceil(authUser.subscription_alert.days_left)} يوم. نرجو تجديد الاشتراك لضمان استمرار الخدمة بلا انقطاع.`
                    : `Please be aware that your ${authUser.subscription_alert.billing_cycle === 'monthly' ? 'monthly' : 'annual'} subscription will expire in ${Math.ceil(authUser.subscription_alert.days_left)} days. Renew now to ensure uninterrupted service.`)}
              </p>
              
              <div className="flex gap-3">
                <Button onClick={() => setShowSubscriptionModal(false)} className="flex-1 font-bold py-2.5 rounded-xl cursor-pointer">
                  {isAr ? 'تجديد الاشتراك الآن' : 'Renew Subscription Now'}
                </Button>
                <Button onClick={() => setShowSubscriptionModal(false)} variant="outline" className="flex-1 rounded-xl cursor-pointer">
                  {isAr ? 'تذكيري لاحقاً' : 'Remind me later'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Incomplete Profile Alert Modal */}
      {showProfileIncompleteModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
            <div className="p-6 bg-indigo-500/10 border-b border-indigo-500/20">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-indigo-500/20 text-indigo-400">
                  <Building2 className="w-6 h-6" />
                </div>
                <button onClick={() => setShowProfileIncompleteModal(false)} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <h3 className="text-xl font-bold text-foreground mt-4">
                {isAr ? 'أكمل بيانات شركتك الأساسية' : 'Complete Your Company Details'}
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              <p className="text-muted-foreground text-sm leading-relaxed">
                {isAr 
                  ? 'مرحباً بك! يرجى إكمال بيانات شركتك الهامة مثل (رقم السجل التجاري، الرقم الضريبي، وعنوان الفوترة) لضمان إصدار الفواتير بشكل صحيح ولتجنب توقف بعض الخدمات.'
                  : 'Welcome! Please complete your important company details (CR Number, Tax Number, and Billing Address) to ensure correct invoicing and prevent service interruption.'}
              </p>
              
              <div className="flex gap-3">
                <Link href="/dashboard/settings?tab=company" className="flex-1 block">
                  <Button onClick={() => setShowProfileIncompleteModal(false)} className="w-full font-bold py-2.5 rounded-xl cursor-pointer">
                    {isAr ? 'إكمال البيانات الآن' : 'Complete Details Now'}
                  </Button>
                </Link>
                <Button onClick={() => setShowProfileIncompleteModal(false)} variant="outline" className="flex-1 rounded-xl cursor-pointer">
                  {isAr ? 'تذكيري لاحقاً' : 'Remind me later'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
