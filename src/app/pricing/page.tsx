'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { 
  Check, 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft,
  Building2, 
  FolderKanban, 
  Users2, 
  ShieldCheck, 
  Sparkles,
  PhoneCall
} from 'lucide-react';

interface Plan {
  id: number;
  name: string;
  slug: string;
  price_monthly: number | null;
  price_yearly: number | null;
  max_project_budget: number;
  max_users: number;
  project_credits_per_year: number;
  is_custom: boolean;
  features: string[];
}

export default function PricingPage() {
  const { user } = useAuth();
  const { t, isAr } = useLanguage();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isYearly, setIsYearly] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await api.get<{ success: boolean; data: Plan[] }>('/plans');
        if (response.success && response.data) {
          // Sort plans to match original sequence: basic, professional, business, enterprise, enterprise_plus
          const order = ['basic', 'professional', 'business', 'enterprise', 'enterprise_plus'];
          const sorted = [...response.data].sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));
          
          // Map plans to localize names and features if fetched dynamically
          const localized = sorted.map(plan => {
            if (isAr) return plan;
            
            // Localize name and features for English
            let name = plan.name;
            let features = plan.features;
            
            if (plan.slug === 'basic') {
              name = 'Basic';
              features = ['3 projects per year', 'Max project budget 10 Million SAR', '10 active users', 'Task management & tracking', 'Email support'];
            } else if (plan.slug === 'professional') {
              name = 'Professional';
              features = ['10 projects per year', 'Max project budget 100 Million SAR', '25 active users', 'Advanced task management & cashflow scheduling', 'System audit logs & history', '24/7 priority support'];
            } else if (plan.slug === 'business') {
              name = 'Business';
              features = ['20 projects per year', 'Max project budget 500 Million SAR', '50 active users', 'Accounting & financial reports integration', 'Analytical reports & KPIs', 'Dedicated account manager'];
            } else if (plan.slug === 'enterprise') {
              name = 'Enterprise';
              features = ['50 projects per year', 'Unlimited project budget', '100 active users', 'Custom domain support', 'Direct priority phone support', 'Custom API integrations'];
            }
            
            return { ...plan, name, features };
          });
          
          setPlans(localized);
        }
      } catch (err) {
        console.error('Error fetching plans, falling back to static plans', err);
        // Fallback plans if API fails
        setPlans([
          {
            id: 1,
            name: isAr ? 'الأساسية' : 'Basic',
            slug: 'basic',
            price_monthly: 399,
            price_yearly: 3990,
            max_project_budget: 10000000,
            max_users: 10,
            project_credits_per_year: 3,
            is_custom: false,
            features: isAr 
              ? ['3 مشاريع سنوياً', 'حد أقصى لميزانية المشروع 10 مليون ريال', '10 مستخدمين نشطين للنظام', 'إدارة المهام وتتبع الإنجاز', 'دعم فني عبر البريد الإلكتروني']
              : ['3 projects per year', 'Max project budget 10 Million SAR', '10 active users', 'Task management & tracking', 'Email support']
          },
          {
            id: 2,
            name: isAr ? 'الاحترافية' : 'Professional',
            slug: 'professional',
            price_monthly: 899,
            price_yearly: 8990,
            max_project_budget: 100000000,
            max_users: 25,
            project_credits_per_year: 10,
            is_custom: false,
            features: isAr 
              ? ['10 مشاريع سنوياً', 'حد أقصى لميزانية المشروع 100 مليون ريال', '25 مستخدم نشط للنظام', 'إدارة متقدمة للمهام وجدولة التدفق النقدي', 'سجلات مراقبة النظام والأنشطة', 'دعم فني سريع على مدار الساعة']
              : ['10 projects per year', 'Max project budget 100 Million SAR', '25 active users', 'Advanced task management & cashflow scheduling', 'System audit logs & history', '24/7 priority support']
          },
          {
            id: 3,
            name: isAr ? 'الأعمال' : 'Business',
            slug: 'business',
            price_monthly: 1799,
            price_yearly: 17990,
            max_project_budget: 500000000,
            max_users: 50,
            project_credits_per_year: 20,
            is_custom: false,
            features: isAr 
              ? ['20 مشروع سنوياً', 'حد أقصى لميزانية المشروع 500 مليون ريال', '50 مستخدم نشط للنظام', 'تكامل مع المحاسبة والتقارير المالية', 'تقارير تحليلية ومؤشرات الأداء', 'مدير حساب مخصص']
              : ['20 projects per year', 'Max project budget 500 Million SAR', '50 active users', 'Accounting & financial reports integration', 'Analytical reports & KPIs', 'Dedicated account manager']
          },
          {
            id: 4,
            name: isAr ? 'المؤسسات' : 'Enterprise',
            slug: 'enterprise',
            price_monthly: 3499,
            price_yearly: 34990,
            max_project_budget: 0,
            max_users: 100,
            project_credits_per_year: 50,
            is_custom: false,
            features: isAr 
              ? ['50 مشروع سنوياً', 'ميزانية مشاريع غير محدودة', '100 مستخدم نشط للنظام', 'ربط نطاق خاص (Custom Domain)', 'أولوية الدعم الفني المباشر', 'تكامل مخصص مع الأنظمة الداخلية (API)']
              : ['50 projects per year', 'Unlimited project budget', '100 active users', 'Custom domain support', 'Direct priority phone support', 'Custom API integrations']
          }
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchPlans();
  }, [isAr]);

  const formatBudget = (budget: number) => {
    if (budget === 0) return isAr ? 'غير محدود' : 'Unlimited';
    if (budget >= 1000000000) return isAr ? `${budget / 1000000000} مليار ريال` : `${budget / 1000000000} Billion SAR`;
    if (budget >= 1000000) return isAr ? `${budget / 1000000} مليون ريال` : `${budget / 1000000} Million SAR`;
    return isAr ? `${budget.toLocaleString('ar-SA')} ريال` : `${budget.toLocaleString('en-US')} SAR`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Decorative Background Blur */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[130px] pointer-events-none -z-10" />

      {/* Header Bar */}
      <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-600/20 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/20">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-wider">{t('common.appName')}</span>
            </Link>
          </div>
          
          <div>
            {user ? (
              <Link href="/dashboard">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-2.5 flex items-center gap-2 transition-all cursor-pointer">
                  <ArrowRight className={`w-4 h-4 ${isAr ? 'ml-1' : 'mr-1 rotate-180'}`} />
                  {t('common.dashboard')}
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="outline" className="border-slate-800 hover:bg-slate-800 hover:text-white text-slate-300 rounded-xl px-5 py-2.5 cursor-pointer">
                  {t('nav.login')}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Pricing Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        
        {/* Title and Intro */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs px-3.5 py-1.5 rounded-full font-semibold mb-2 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            {isAr ? 'باقات مرنة تناسب جميع أحجام الشركات' : 'Flexible plans for all company sizes'}
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {isAr ? 'باقات وأسعار منصة' : 'Plans & Pricing for'}{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">{t('common.appName')}</span>{' '}
            {isAr ? 'إدارة المشاريع' : 'Project Management'}
          </h1>
          <p className="text-slate-400 text-lg">
            {t('pricing.desc')}
          </p>
        </div>

        {/* Toggle Billing Cycle */}
        <div className="flex justify-center items-center gap-4">
          <span className={`text-sm font-semibold transition-colors duration-200 ${!isYearly ? 'text-white' : 'text-slate-400'}`}>
            {isAr ? 'الدفع الشهري' : 'Monthly'}
          </span>
          <button 
            onClick={() => setIsYearly(!isYearly)}
            className="w-16 h-9 bg-slate-800 hover:bg-slate-700 rounded-full p-1 transition-all relative flex items-center border border-slate-700 cursor-pointer"
            aria-label="Toggle billing cycle"
          >
            <div className={`w-7 h-7 bg-indigo-500 rounded-full shadow-md transition-all duration-300 transform ${isYearly ? (isAr ? '-translate-x-8' : 'translate-x-8') : 'translate-x-0'}`} />
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold transition-colors duration-200 ${isYearly ? 'text-white' : 'text-slate-400'}`}>
              {isAr ? 'الدفع السنوي' : 'Yearly'}
            </span>
            <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full">
              {isAr ? 'توفير 17%' : 'Save 17%'}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400">{isAr ? 'جاري تحميل الباقات المتوفرة...' : 'Loading available plans...'}</p>
          </div>
        ) : (
          /* Plans Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-stretch">
            {plans.map((plan) => {
              const isPopular = plan.slug === 'professional';
              const price = isYearly ? plan.price_yearly : plan.price_monthly;
              // Monthly equivalent for yearly price to show savings
              const monthlyEquivalent = isYearly && plan.price_yearly && plan.price_monthly
                ? Math.round(plan.price_yearly / 12)
                : plan.price_monthly;

              return (
                <div 
                  key={plan.id}
                  className={`flex flex-col rounded-3xl border transition-all duration-300 relative ${
                    isPopular 
                      ? 'border-indigo-500 bg-slate-900 shadow-xl shadow-indigo-500/5 lg:scale-105 lg:-translate-y-2 z-10' 
                      : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[11px] font-bold py-1 px-3.5 rounded-full uppercase tracking-wider shadow-md whitespace-nowrap">
                      {isAr ? 'الأكثر شعبية' : 'Most Popular'}
                    </div>
                  )}

                  {/* Header info */}
                  <div className="p-6 border-b border-slate-800/80 space-y-4">
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    
                    <div className="space-y-1">
                      {plan.is_custom ? (
                        <div className="text-2xl font-extrabold text-indigo-400 py-2">{isAr ? 'مخصص' : 'Custom'}</div>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-extrabold text-white">
                            {isYearly 
                              ? (plan.price_yearly ? (plan.price_yearly / 12).toFixed(0) : '')
                              : plan.price_monthly
                            }
                          </span>
                          <span className="text-slate-400 text-xs font-semibold">{isAr ? 'ريال / شهرياً' : 'SAR / Month'}</span>
                        </div>
                      )}
                      
                      {!plan.is_custom && isYearly && plan.price_yearly && (
                        <p className="text-[11px] text-emerald-400 font-medium font-sans">
                          {isAr 
                            ? `يُدفع سنوياً بقيمة ${plan.price_yearly.toLocaleString('ar-SA')} ريال`
                            : `Billed annually at SAR ${plan.price_yearly.toLocaleString('en-US')}`}
                        </p>
                      )}
                      
                      {!plan.is_custom && !isYearly && plan.price_monthly && (
                        <p className="text-[11px] text-slate-500 font-medium font-sans">
                          {isAr 
                            ? `يُدفع شهرياً بقيمة ${plan.price_monthly.toLocaleString('ar-SA')} ريال`
                            : `Billed monthly at SAR ${plan.price_monthly.toLocaleString('en-US')}`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Limits summary inside card */}
                  <div className="p-5 bg-slate-950/40 border-b border-slate-800/60 text-xs space-y-2 text-slate-300">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">{isAr ? 'ميزانية المشروع الأقصى:' : 'Max Project Budget:'}</span>
                      <span className="font-semibold text-white">{formatBudget(plan.max_project_budget)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">{isAr ? 'أقصى عدد مستخدمين:' : 'Max active users:'}</span>
                      <span className="font-semibold text-white">
                        {isAr 
                          ? `${plan.max_users.toLocaleString('ar-SA')} مستخدم` 
                          : `${plan.max_users.toLocaleString('en-US')} users`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">{isAr ? 'المشاريع السنوية:' : 'Annual Projects:'}</span>
                      <span className="font-semibold text-indigo-400">
                        {plan.project_credits_per_year > 0 
                          ? (isAr ? `${plan.project_credits_per_year} مشاريع` : `${plan.project_credits_per_year} projects`)
                          : (isAr ? 'حسب الطلب' : 'On Demand')
                        }
                      </span>
                    </div>
                  </div>

                  {/* Features list */}
                  <div className="p-6 flex-1 space-y-4">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{isAr ? 'ماذا تشمل هذه الباقة:' : 'What is included:'}</p>
                    <ul className="space-y-3 text-sm text-slate-300">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-xs leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Call to action */}
                  <div className="p-6 pt-0 mt-auto">
                    {plan.is_custom ? (
                      <Link href="mailto:sales@rafed.com?subject=طلب باقة مخصصة" className="block w-full">
                        <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-xl gap-2 py-3 text-xs font-semibold border border-slate-700 transition-all cursor-pointer">
                          <PhoneCall className={`w-4 h-4 ${isAr ? 'ml-1' : 'mr-1'}`} />
                          {isAr ? 'تواصل مع المبيعات' : 'Contact Sales'}
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/register?plan=${plan.slug}&cycle=${isYearly ? 'yearly' : 'monthly'}`} className="block w-full">
                        <Button className={`w-full rounded-xl py-3 text-xs font-semibold transition-all cursor-pointer ${
                          isPopular 
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20' 
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}>
                          {isAr ? 'اشترك الآن' : 'Subscribe Now'}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}

            {/* 5th Card: Custom Plan (Enterprise Plus) */}
            <div 
              className="flex flex-col rounded-3xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 transition-all duration-300 relative font-sans"
            >
              {/* Header info */}
              <div className="p-6 border-b border-slate-800/80 space-y-4">
                <h3 className="text-lg font-bold text-white">{isAr ? 'المؤسسات بلس' : 'Enterprise Plus'}</h3>
                
                <div className="space-y-1">
                  <div className="text-2xl font-extrabold text-indigo-400 py-2">{isAr ? 'مخصصة' : 'Custom'}</div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {isAr ? 'تواصل معنا للاتفاق على الميزات والأسعار' : 'Contact us for custom features & prices'}
                  </p>
                </div>
              </div>

              {/* Limits summary inside card */}
              <div className="p-5 bg-slate-950/40 border-b border-slate-800/60 text-xs space-y-2 text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{isAr ? 'ميزانية المشروع الأقصى:' : 'Max Project Budget:'}</span>
                  <span className="font-semibold text-white">{isAr ? 'حسب الطلب' : 'Custom'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{isAr ? 'أقصى عدد مستخدمين:' : 'Max active users:'}</span>
                  <span className="font-semibold text-white">{isAr ? 'حسب الطلب' : 'Custom'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{isAr ? 'المشاريع السنوية:' : 'Annual Projects:'}</span>
                  <span className="font-semibold text-indigo-400">{isAr ? 'حسب الطلب' : 'Custom'}</span>
                </div>
              </div>

              {/* Features list - empty placeholder message */}
              <div className="p-6 flex-1 flex flex-col justify-center items-center text-center space-y-2">
                <p className="text-xs text-slate-400 leading-relaxed px-2">
                  {isAr 
                    ? 'يتم تحديد الميزات والصلاحيات بشكل كامل ومخصص لشركتك بالتنسيق مع فريق المبيعات.' 
                    : 'Features and permissions are fully tailored and customized in coordination with our sales team.'}
                </p>
              </div>

              {/* Call to action */}
              <div className="p-6 pt-0 mt-auto">
                <Link href="mailto:sales@rafed.com?subject=طلب باقة مخصصة" className="block w-full">
                  <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-xl gap-2 py-3 text-xs font-semibold border border-slate-700 transition-all cursor-pointer">
                    <PhoneCall className={`w-4 h-4 ${isAr ? 'ml-1' : 'mr-1'}`} />
                    {isAr ? 'تواصل مع المبيعات' : 'Contact Sales'}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Pricing FAQ or Notes */}
        <div className="border-t border-slate-900 pt-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-2">
              <h4 className="font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                {isAr ? 'كيف يتم احتساب رصيد المشاريع (Credits)؟' : 'How are project credits calculated?'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed pr-6 pl-6">
                {isAr 
                  ? 'عند الاشتراك السنوي، يضاف كامل رصيد باقتك السنوي مباشرة في محفظتك. أما عند الاشتراك الشهري، فيتم توزيع الرصيد شهرياً (رصيد الباقة مقسّماً على 12) ويضاف تلقائياً مع كل تجديد شهري ناجح. عند إنشاء أي مشروع جديد، يستهلك النظام رصيداً واحداً (1 Credit) من حسابك.' 
                  : 'With an annual subscription, the full project credits are added directly to your wallet. For monthly subscriptions, credits are distributed monthly and added automatically upon renewal. Creating a project consumes 1 credit.'}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                {isAr ? 'ماذا يحدث إذا تجاوزت ميزانية مشروعي الحد المسموح به؟' : 'What happens if a project budget exceeds limits?'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed pr-6 pl-6">
                {isAr 
                  ? 'تضع كل باقة حداً أقصى للميزانية المسموحة للمشروع الواحد. إذا كانت ميزانية المشروع المدخلة أكبر من سعة باقتك، سيقوم النظام برفض الحفظ ومطالبتك بترقية باقتك للوصول لسعة أكبر.' 
                  : 'Each plan sets a maximum budget per project. If a project budget exceeds your plan limit, the system will prevent saving and prompt you to upgrade your plan.'}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                {isAr ? 'هل يمكنني ترقية أو تخفيض باقتي في أي وقت؟' : 'Can I upgrade or downgrade my plan at any time?'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed pr-6 pl-6">
                {isAr 
                  ? 'نعم، يمكنك ترقية باقتك فوراً من لوحة تحكم حسابك لزيادة عدد المستخدمين المتاح أو ميزانيات المشاريع، وسيتم ترحيل أرصدتك واستخدامها بناءً على الترقية الجديدة.' 
                  : 'Yes, you can upgrade your plan instantly from your dashboard to increase active user capacity or project budget limits. Credits will be carried over.'}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                {isAr ? 'ما هي قيود عدد المستخدمين؟' : 'What are active user limits?'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed pr-6 pl-6">
                {isAr 
                  ? 'تحدد كل باقة عدداً أقصى من المستخدمين النشطين الذين يمكن إضافتهم لمساحة العمل الخاصة بشركتك. لن يسمح النظام بدعوة أو إضافة مستخدم جديد إذا بلغت الحد الأقصى لباقة اشتراكك الحالية.' 
                  : 'Each plan defines a maximum number of active users for your workspace. The system will prevent inviting or adding new users once this limit is reached.'}
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} {isAr ? 'منصة رافد لإدارة المشاريع. جميع الحقوق محفوظة.' : 'Rafed Project Management Platform. All rights reserved.'}</p>
      </footer>
    </div>
  );
}
