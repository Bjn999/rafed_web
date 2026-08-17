'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { Button } from '@/components/ui/button';
import { featuresList } from '@/lib/features-config';
import { 
  Building2, 
  LogOut, 
  ArrowLeft, 
  Menu, 
  X, 
  LayoutDashboard, 
  FolderKanban, 
  Users2, 
  ShieldCheck, 
  Smartphone, 
  Zap, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  Award,
  Layers,
  ArrowRight
} from 'lucide-react';

const iconMap = {
  FolderKanban: FolderKanban,
  Users2: Users2,
  Building2: Building2,
  ShieldCheck: ShieldCheck,
  Smartphone: Smartphone,
  Zap: Zap
};

const featureTranslations: Record<string, { title: string; desc: string; badge?: string }> = {
  'project-management': {
    title: 'Construction Project Management',
    desc: 'Plan, monitor, and execute your engineering and construction projects in one place with precise progress tracking.',
    badge: 'Core'
  },
  'multi-tenancy': {
    title: 'Enterprise Workspaces',
    desc: 'Get an independent, dedicated workspace for your company with custom domain routing for professional management.'
  },
  'team-collaboration': {
    title: 'Employees & Permissions',
    desc: 'Add team members, assign roles and permissions aligned with your company structure and responsibilities.'
  },
  'high-security': {
    title: 'Data Security & Backups',
    desc: 'Your project and company data is fully encrypted and protected with regular backups and precise access permissions.'
  },
  'responsive-design': {
    title: 'Fully Responsive Design',
    desc: 'Track projects and coordinate with your team from anywhere, whether in the office or on the construction site.',
    badge: 'Active'
  },
  'fast-performance': {
    title: 'Exceptional Performance',
    desc: 'A platform built with modern technologies to deliver blazing fast response times and clean user experience.'
  }
};

export default function HomePage() {
  const { user, profile, tenant, logout, isLoading } = useAuth();
  const { t, isAr } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dashboardUrl = user?.role === 'system_admin' ? '/admin' : '/dashboard';

  const handleLogoutClick = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] rounded-full bg-blue-600/5 blur-[100px] pointer-events-none -z-10" />

      {/* Header (Navbar) */}
      <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-indigo-600/20 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/30 group-hover:border-indigo-500/60 group-hover:bg-indigo-600/30 transition-all duration-300">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white tracking-wide group-hover:text-indigo-400 transition-colors">
                {t('common.appName')}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {isAr ? 'منصة إدارة المشاريع الهندسية والإنشائية' : 'Engineering & Construction Projects Management Platform'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              {t('nav.features')}
            </Link>
            <Link href="#about" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              {t('nav.about')}
            </Link>
            <Link href="#statistics" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              {t('nav.statistics')}
            </Link>
          </nav>

          {/* Authentication Actions */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSelector />
            
            {isLoading ? (
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            ) : user ? (
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-full px-3 py-1 font-medium">
                  {t('nav.helloUser', { name: profile?.first_name || (isAr ? 'المستخدم' : 'User') })}
                </span>
                <Link href={dashboardUrl}>
                  <Button variant="default" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 h-10 font-semibold gap-2 shadow-lg shadow-indigo-600/20 transition-all duration-300 cursor-pointer">
                    {t('common.dashboard')}
                    <ArrowLeft className={`w-4 h-4 ${isAr ? 'ml-1' : 'mr-1 rotate-180'}`} />
                  </Button>
                </Link>
                <Button 
                  onClick={handleLogoutClick}
                  variant="ghost" 
                  className="text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl px-3 h-10 gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl px-4 h-10 font-semibold transition-all cursor-pointer">
                    {t('nav.login')}
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="default" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 h-10 font-semibold gap-1.5 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 transition-all duration-300 cursor-pointer">
                    {t('nav.register')}
                    <Sparkles className="w-4 h-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <LanguageSelector />
            
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            ) : user && (
              <Link href="/dashboard">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 text-xs font-bold shadow-lg shadow-indigo-600/20 cursor-pointer">
                  {t('common.dashboard')}
                </Button>
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white bg-slate-900/60 rounded-xl border border-slate-800 transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-950 p-6 space-y-6 animate-in fade-in slide-in-from-top duration-200" dir={isAr ? 'rtl' : 'ltr'}>
            <nav className="flex flex-col gap-4">
              <Link 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-semibold text-slate-300 hover:text-white py-2 border-b border-slate-900"
              >
                {t('nav.features')}
              </Link>
              <Link 
                href="#about" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-semibold text-slate-300 hover:text-white py-2 border-b border-slate-900"
              >
                {t('nav.about')}
              </Link>
              <Link 
                href="#statistics" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-semibold text-slate-300 hover:text-white py-2"
              >
                {t('nav.statistics')}
              </Link>
            </nav>

            <div className="flex flex-col gap-3 pt-4 border-t border-slate-900">
              {isLoading ? null : user ? (
                <div className="space-y-3">
                  <div className="text-center text-sm text-slate-400 py-1 bg-slate-900 rounded-lg">
                    {t('nav.helloUser', { name: profile?.first_name || (isAr ? 'المستخدم' : 'User') })}
                  </div>
                  <Link href={dashboardUrl} className="w-full block" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold justify-center cursor-pointer">
                      {t('common.dashboard')}
                    </Button>
                  </Link>
                  <Button 
                    onClick={() => { handleLogoutClick(); setMobileMenuOpen(false); }}
                    variant="outline" 
                    className="w-full border-slate-800 text-slate-400 hover:text-white py-3 rounded-xl font-bold justify-center cursor-pointer"
                  >
                    {t('common.logout')}
                  </Button>
                </div>
              ) : (
                <>
                  <Link href="/login" className="w-full block" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full border-slate-800 text-slate-300 py-3 rounded-xl font-bold justify-center cursor-pointer">
                      {t('nav.login')}
                    </Button>
                  </Link>
                  <Link href="/register" className="w-full block" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold justify-center cursor-pointer">
                      {isAr ? 'بدء الاستخدام مجاناً' : 'Get Started For Free'}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">

        {/* Hero Section */}
        <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Hero Text */}
              <div className="lg:col-span-6 space-y-8 text-center lg:text-right">
                
                {/* Micro-Interaction Badge */}
                <div className="inline-flex items-center gap-2 bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs px-3.5 py-1.5 rounded-full font-semibold mx-auto lg:mx-0 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isAr ? 'المنصة الأولى لإدارة المشاريع الهندسية والإنشائية' : 'The Premier Engineering & Construction Platform'}</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
                  {isAr ? 'أدر مشاريعك الهندسية' : 'Manage Your Projects'} <br />
                  <span className="bg-gradient-to-l from-indigo-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
                    {isAr ? 'بذكاء وسرعة فائقة' : 'Smartly and Fast'}
                  </span>
                </h1>

                <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  {t('homepage.hero.desc')}
                </p>

                {/* Hero Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Link href={user ? dashboardUrl : "/register"} className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 h-12 text-base font-bold shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-95 transition-all duration-300 cursor-pointer">
                      {user ? t('common.dashboard') : t('homepage.hero.startBtn')}
                      <ArrowRight className={`w-5 h-5 mr-1 ml-0 ${isAr ? 'rotate-180' : ''}`} />
                    </Button>
                  </Link>
                  <Link href="#features" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-white rounded-xl px-6 h-12 text-base font-semibold cursor-pointer">
                      {isAr ? 'تصفح الميزات والخدمات' : 'Browse Features & Services'}
                    </Button>
                  </Link>
                </div>

                {/* Micro Stats */}
                <div className="pt-6 border-t border-slate-900 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0">
                  <div className="text-center lg:text-right">
                    <div className="text-2xl font-bold text-white">100%</div>
                    <div className="text-xs text-slate-400">{isAr ? 'سحابي وموثوق' : 'Cloud & Reliable'}</div>
                  </div>
                  <div className={`text-center lg:text-right ${isAr ? 'border-r' : 'border-l'} border-slate-900 pr-4 pl-4`}>
                    <div className="text-2xl font-bold text-indigo-400">24/7</div>
                    <div className="text-xs text-slate-400">{isAr ? 'متابعة مستمرة' : 'Continuous Tracking'}</div>
                  </div>
                  <div className={`text-center lg:text-right ${isAr ? 'border-r' : 'border-l'} border-slate-900 pr-4 pl-4`}>
                    <div className="text-2xl font-bold text-violet-400">{isAr ? 'أمان' : 'Secure'}</div>
                    <div className="text-xs text-slate-400">{isAr ? 'تشفير متكامل' : 'End-to-End Encryption'}</div>
                  </div>
                </div>

              </div>

              {/* Hero Image/Mockup */}
              <div className="lg:col-span-6 flex justify-center relative">
                
                {/* Glow Behind Mockup */}
                <div className="absolute inset-0 bg-indigo-600/20 rounded-3xl filter blur-3xl -z-10 transform scale-75" />

                {/* Dashboard CSS Mockup */}
                <div className="w-full max-w-lg border border-slate-800 bg-slate-900/60 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl transform hover:-translate-y-2 hover:shadow-indigo-500/10 transition-all duration-500">
                  {/* Browser top-bar */}
                  <div className="bg-slate-950/80 px-4 py-3 flex items-center justify-between border-b border-slate-800">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono select-none">
                      workspace.rafed.com/dashboard
                    </div>
                    <div className="w-4" />
                  </div>
                  
                  {/* Mock Content */}
                  <div className="p-5 sm:p-6 space-y-6 select-none">
                    
                    {/* Mock Welcome Banner */}
                    <div className="bg-gradient-to-r from-indigo-900/40 to-violet-900/40 border border-indigo-500/20 rounded-xl p-4 flex justify-between items-center">
                      <div className="space-y-1">
                        <div className="w-24 h-3 bg-indigo-200/30 rounded" />
                        <div className="w-40 h-2 bg-indigo-200/15 rounded" />
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Mock Stats Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 border border-slate-800 bg-slate-900/80 rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="w-16 h-2 bg-slate-700 rounded" />
                          <FolderKanban className="w-3.5 h-3.5 text-indigo-400" />
                        </div>
                        <div className="text-base font-bold text-white">4 / 5</div>
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="w-4/5 h-full bg-indigo-500" />
                        </div>
                      </div>

                      <div className="p-3 border border-slate-800 bg-slate-900/80 rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="w-16 h-2 bg-slate-700 rounded" />
                          <Users2 className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <div className="text-base font-bold text-white">2 / 3</div>
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="w-2/3 h-full bg-emerald-500" />
                        </div>
                      </div>
                    </div>

                    {/* Project Progress Mockup List */}
                    <div className="border border-slate-800 bg-slate-900/80 rounded-xl p-4 space-y-3.5">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <div className="w-20 h-2 bg-slate-600 rounded" />
                        <div className="w-8 h-2 bg-slate-700 rounded" />
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                            <div className="w-28 h-2 bg-slate-600 rounded" />
                          </div>
                          <span className="text-[10px] font-bold text-indigo-400">80%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <div className="w-20 h-2 bg-slate-600 rounded" />
                          </div>
                          <span className="text-[10px] font-bold text-emerald-400">100%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            <div className="w-24 h-2 bg-slate-600 rounded" />
                          </div>
                          <span className="text-[10px] font-bold text-amber-400">30%</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* Features & Services Section */}
        <section id="features" className="py-20 md:py-28 border-t border-slate-900 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <h2 className="text-xs font-bold tracking-wider text-indigo-400 uppercase">
                {isAr ? 'خدماتنا ومميزات المنصة' : 'Our Services & Platform Features'}
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold text-white">
                {t('homepage.features.title')}
              </p>
              <p className="text-slate-400 text-sm sm:text-base">
                {t('homepage.features.desc')}
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuresList.map((feature) => {
                const IconComponent = iconMap[feature.iconName] || FolderKanban;
                const localizedFeature = featureTranslations[feature.id];
                return (
                  <div 
                    key={feature.id}
                    className="group border border-slate-800/80 bg-slate-900/30 hover:bg-slate-900/60 p-6 sm:p-8 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-slate-700/80 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      
                      {/* Icon & Badge Container */}
                      <div className="flex justify-between items-start">
                        <div className="w-12 h-12 bg-indigo-600/10 text-indigo-400 border border-indigo-500/10 group-hover:border-indigo-500/30 group-hover:bg-indigo-600/20 rounded-xl flex items-center justify-center transition-all duration-300">
                          <IconComponent className="w-6 h-6" />
                        </div>
                        {feature.badge && (
                          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                            {isAr ? feature.badge : (localizedFeature?.badge || feature.badge)}
                          </span>
                        )}
                      </div>

                      {/* Title & Desc */}
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                          {isAr ? feature.title : (localizedFeature?.title || feature.title)}
                        </h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                          {isAr ? feature.description : (localizedFeature?.desc || feature.description)}
                        </p>
                      </div>

                    </div>
                    
                    {/* Learn More Link (Micro-Interaction) */}
                    <div className="pt-6 mt-4 border-t border-slate-900 flex items-center gap-1.5 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors cursor-pointer select-none">
                      <span>{isAr ? 'اكتشف المزيد' : 'Learn More'}</span>
                      <ChevronRight className={`w-3.5 h-3.5 group-hover:translate-x-[-3px] transition-transform ${isAr ? 'rotate-180' : ''}`} />
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* About System Section */}
        <section id="about" className="py-20 md:py-28 border-t border-slate-900 bg-slate-950/40 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Workspace Mockup Card (Left Side) */}
              <div className="lg:col-span-6 order-2 lg:order-1 flex justify-center relative">
                
                {/* Decorative glowing gradient behind */}
                <div className="absolute inset-0 bg-violet-600/15 rounded-3xl filter blur-3xl -z-10 transform scale-75" />

                {/* Workspace visual display */}
                <div className="w-full max-w-md border border-slate-800 bg-slate-950/80 rounded-2xl shadow-xl overflow-hidden p-6 space-y-6">
                  
                  {/* Workspace Title */}
                  <div className={`flex items-center gap-3 pb-4 border-b border-slate-900 ${isAr ? 'text-right' : 'text-left'}`}>
                    <div className="w-10 h-10 bg-violet-600/20 text-violet-400 rounded-lg flex items-center justify-center border border-violet-500/20">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{isAr ? 'مساحة عمل: شركة بناء العاصمة' : 'Workspace: Capital Construction Co.'}</div>
                      <div className="text-[10px] text-indigo-400 font-mono">bena-capital.rafed.com</div>
                    </div>
                  </div>

                  {/* Multi-Tenant Features breakdown */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800/60 text-xs">
                      <span className="text-slate-400 font-medium">{isAr ? 'حالة النطاق والمجال' : 'Domain & Subdomain Status'}</span>
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                        {isAr ? 'رابط مخصص ونشط' : 'Active Custom Domain'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800/60 text-xs">
                      <span className="text-slate-400 font-medium">{isAr ? 'تشفير قاعدة البيانات' : 'Database Encryption'}</span>
                      <span className="text-white flex items-center gap-1.5 font-bold">
                        <ShieldCheck className="w-4 h-4 text-indigo-400" />
                        {isAr ? 'AES-256 مشفر' : 'AES-256 Encrypted'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800/60 text-xs">
                      <span className="text-slate-400 font-medium">{isAr ? 'عدد الموظفين الفعّالين' : 'Active Employees Count'}</span>
                      <span className="text-indigo-400 font-bold">{isAr ? '8 مهندسين ومراقبين' : '8 Engineers & Supervisors'}</span>
                    </div>
                  </div>

                  {/* Graphical organization map */}
                  <div className={`pt-2 ${isAr ? 'text-right' : 'text-left'}`}>
                    <div className="text-xs font-semibold text-slate-400 mb-2">{isAr ? 'أدوار الفريق الموزعة:' : 'Assigned Team Roles:'}</div>
                    <div className="flex gap-2">
                      <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-1 rounded-lg font-bold">{isAr ? 'المالك' : 'Owner'}</span>
                      <span className="text-[10px] bg-violet-500/10 border border-violet-500/20 text-violet-400 px-2 py-1 rounded-lg font-bold">{isAr ? 'مدير مشاريع' : 'Project Manager'}</span>
                      <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-1 rounded-lg font-bold">{isAr ? 'مراقب ميداني' : 'Site Inspector'}</span>
                    </div>
                  </div>

                </div>

              </div>

              {/* About Text (Right Side) */}
              <div className="lg:col-span-6 order-1 lg:order-2 space-y-6 text-center lg:text-right">
                
                <div className="inline-flex items-center gap-1.5 bg-violet-950/60 border border-violet-500/30 text-violet-300 text-xs px-3.5 py-1.5 rounded-full font-semibold">
                  <Layers className="w-3.5 h-3.5 text-violet-400" />
                  <span>{isAr ? 'تعددية المستأجرين والأمان' : 'Multi-Tenancy & Security'}</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                  {isAr ? 'معمارية سحابية مستقلة لكل مؤسسة' : 'Isolated Cloud Architecture for Every Firm'}
                </h2>

                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  {t('homepage.about.desc')}
                </p>

                <div className={`space-y-4 pt-4 ${isAr ? 'text-right' : 'text-left'}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="w-4.5 h-4.5 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">{isAr ? 'عزل تام للمستأجرين (Tenant Isolation)' : 'Complete Tenant Isolation'}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {isAr 
                          ? 'كل شركة تمتلك هويتها الرقمية المستقلة تماماً مما يمنع تداخل البيانات نهائياً.' 
                          : 'Every firm has its own independent digital identity, completely preventing data overlap.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Building2 className="w-4.5 h-4.5 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">{isAr ? 'إمكانية ربط نطاق مخصص (Custom Domains)' : 'Custom Domains Support'}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {isAr 
                          ? 'يمكنك تشغيل مساحة عملك تحت اسم نطاق خاص بشركتك لتعزيز الهوية والاحترافية.' 
                          : 'You can operate your workspace under your own domain name to enhance brand authority.'}
                      </p>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* Statistics section */}
        <section id="statistics" className="py-16 md:py-24 border-t border-slate-900 bg-slate-950 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              
              <div className="p-6 border border-slate-900 bg-slate-900/20 rounded-2xl">
                <div className="text-4xl font-extrabold text-white tracking-tight">+500</div>
                <p className="text-xs text-slate-400 mt-2 font-medium">{isAr ? 'مشاريع تتم إدارتها بنجاح' : 'Projects managed successfully'}</p>
              </div>

              <div className="p-6 border border-slate-900 bg-slate-900/20 rounded-2xl">
                <div className="text-4xl font-extrabold text-indigo-400 tracking-tight">+120</div>
                <p className="text-xs text-slate-400 mt-2 font-medium">{isAr ? 'شركة بناء ومقاولة مسجلة' : 'Registered contracting firms'}</p>
              </div>

              <div className="p-6 border border-slate-900 bg-slate-900/20 rounded-2xl">
                <div className="text-4xl font-extrabold text-violet-400 tracking-tight">99.9%</div>
                <p className="text-xs text-slate-400 mt-2 font-medium">{isAr ? 'معدل تشغيل وضمان الخدمة' : 'Service uptime guarantee'}</p>
              </div>

              <div className="p-6 border border-slate-900 bg-slate-900/20 rounded-2xl">
                <div className="text-4xl font-extrabold text-emerald-400 tracking-tight">4.9/5</div>
                <p className="text-xs text-slate-400 mt-2 font-medium">{isAr ? 'تقييم رضا المهندسين والعملاء' : 'Client satisfaction rate'}</p>
              </div>

            </div>
          </div>
        </section>

        {/* CTA (Call To Action) Section */}
        <section className="py-20 md:py-28 border-t border-slate-900 relative overflow-hidden">
          
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/10 via-violet-900/10 to-blue-900/10 opacity-60" />
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              {isAr ? 'هل أنت جاهز لتنظيم وإدارة مشاريعك بشكل احترافي؟' : 'Ready to manage and organize your projects professionally?'}
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              {isAr 
                ? 'انضم إلى عشرات شركات المقاولات التي تتبع مشاريعها وأعمالها وتنسق مع موظفيها بكفاءة. لا يتطلب التسجيل سوى دقائق معدودة لتبدأ مساحة عملك الخاصة.' 
                : 'Join dozens of contracting companies that track their projects and coordinate with their employees efficiently. Registration takes only a few minutes to get your workspace.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href={user ? "/dashboard" : "/register"} className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 h-12 text-base font-bold shadow-lg shadow-indigo-600/30 cursor-pointer">
                  {user ? t('common.dashboard') : (isAr ? 'سجل حسابك المجاني الآن' : 'Register Your Free Account Now')}
                </Button>
              </Link>
              {!user && (
                <Link href="/login" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-white rounded-xl px-6 h-12 text-base font-semibold cursor-pointer">
                    {t('nav.login')}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Left side info */}
            <div className="md:col-span-6 text-center md:text-right space-y-3">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <div className="w-8 h-8 bg-indigo-600/20 text-indigo-400 rounded-lg flex items-center justify-center border border-indigo-500/20">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-base font-bold text-white">{t('common.appName')}</span>
              </div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto md:mx-0">
                {isAr 
                  ? 'منصة متكاملة لتأسيس مساحات العمل الهندسية وتسهيل المتابعة للمشاريع الهندسية والإنشائية.' 
                  : 'An integrated platform to establish engineering workspaces and facilitate follow-up for construction and engineering projects.'}
              </p>
            </div>

            {/* Right side navigation links */}
            <div className={`md:col-span-6 flex flex-wrap justify-center md:justify-end gap-6 text-xs text-slate-400`}>
              <Link href="#features" className="hover:text-white transition-colors">{t('nav.features')}</Link>
              <Link href="#about" className="hover:text-white transition-colors">{t('nav.about')}</Link>
              <Link href="#statistics" className="hover:text-white transition-colors">{t('nav.statistics')}</Link>
              <span className="text-slate-700">|</span>
              <span>© {new Date().getFullYear()} {isAr ? 'جميع الحقوق محفوظة لـ منصة رافد.' : 'All rights reserved for Rafed Platform.'}</span>
            </div>

          </div>
        </div>
      </footer>

    </div>
  );
}
