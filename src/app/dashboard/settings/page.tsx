'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Lock,
  CreditCard,
  Building2,
  ArrowUpRight,
  Edit2,
  Mail,
  Phone,
  Briefcase,
  X,
  FileText
} from 'lucide-react';

interface UsageStats {
  plan_name: string;
  billing_cycle: string;
  starts_at?: string;
  ends_at?: string;
  credits: {
    total: number;
    used: number;
    remaining: number;
  };
  users: {
    max: number;
    current: number;
    remaining: number;
  };
  max_project_budget: number;
}

type TabType = 'profile' | 'security' | 'company' | 'subscription';

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: authUser, tenant, updateProfile, refreshProfile, isLoading: authLoading } = useAuth();
  const { t, isAr } = useLanguage();

  // Tab State with LocalStorage Fallback
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('dashboard_settings_tab');
      if (savedTab === 'profile' || savedTab === 'security' || savedTab === 'company' || savedTab === 'subscription') {
        return savedTab as TabType;
      }
    }
    return 'profile';
  });

  // --- Profile Tab States ---
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileJobTitle, setProfileJobTitle] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // --- Security Tab States ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // --- Company Details Tab States ---
  const [companyName, setCompanyName] = useState('');
  const [companyNameEn, setCompanyNameEn] = useState('');
  const [companyCr, setCompanyCr] = useState('');
  const [companyTax, setCompanyTax] = useState('');
  const [companyBilling, setCompanyBilling] = useState('');
  const [isSavingCompany, setIsSavingCompany] = useState(false);

  // Sync query parameter with state & localStorage
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'profile' || tab === 'security' || tab === 'company' || tab === 'subscription') {
      // Role protection check: if tab is company and user is not company_admin, default to profile
      if (tab === 'company' && authUser?.role !== 'company_admin') {
        setActiveTab('profile');
      } else {
        setActiveTab(tab as TabType);
        localStorage.setItem('dashboard_settings_tab', tab);
      }
    } else {
      // If no tab in URL, check if there is a saved tab in localStorage
      const savedTab = localStorage.getItem('dashboard_settings_tab');
      if (savedTab && (savedTab === 'profile' || savedTab === 'security' || savedTab === 'company' || savedTab === 'subscription')) {
        if (savedTab === 'company' && authUser?.role !== 'company_admin') {
          // skip
        } else {
          setActiveTab(savedTab as TabType);
          router.replace(`/dashboard/settings?tab=${savedTab}`);
          return;
        }
      }
      // Fallback
      router.replace(`/dashboard/settings?tab=${activeTab}`);
    }
  }, [searchParams, authUser, router, activeTab]);

  // Sync auth profile variables
  useEffect(() => {
    if (authUser && authUser.profile) {
      setProfileFirstName(authUser.profile.first_name || '');
      setProfileLastName(authUser.profile.last_name || '');
      setProfilePhone(authUser.profile.phone_number || '');
      setProfileJobTitle(authUser.profile.job_title || '');
    }
    if (tenant) {
      setCompanyName(tenant.name || '');
      setCompanyNameEn(tenant.name_en || '');
      setCompanyCr(tenant.commercial_registration || '');
      setCompanyTax(tenant.tax_number || '');
      setCompanyBilling(tenant.billing_details || '');
    }
  }, [authUser, tenant]);

  // Fetch subscription usage using React Query
  const { data: usage, isLoading: usageLoading } = useQuery<UsageStats | null>({
    queryKey: ['subscriptionUsageSettings'],
    queryFn: async () => {
      try {
        const response = await api.get<UsageStats>('/subscription/usage');
        return response;
      } catch (err) {
        console.error('Failed to fetch subscription usage stats', err);
        return null;
      }
    },
    enabled: !!authUser && authUser.role !== 'system_admin' && activeTab === 'subscription',
  });

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    localStorage.setItem('dashboard_settings_tab', tab);
    router.push(`/dashboard/settings?tab=${tab}`);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await updateProfile({
        first_name: profileFirstName,
        last_name: profileLastName,
        phone_number: profilePhone,
        job_title: profileJobTitle,
      });
      toast.add({
        title: isAr ? 'تم تحديث الملف الشخصي' : 'Profile Updated',
        description: isAr ? 'تم حفظ تغييرات ملفك الشخصي بنجاح.' : 'Profile changes have been saved successfully.',
        type: 'success',
      });
      setIsEditModalOpen(false); // Close Modal
    } catch (err: any) {
      toast.add({
        title: isAr ? 'خطأ في التحديث' : 'Update Failed',
        description: err.message || (isAr ? 'فشل حفظ الملف الشخصي.' : 'Failed to save profile changes.'),
        type: 'error',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.add({
        title: isAr ? 'عدم تطابق' : 'Mismatch',
        description: isAr ? 'كلمة المرور الجديدة وتأكيدها غير متطابقتين.' : 'New password and confirmation do not match.',
        type: 'error',
      });
      return;
    }
    setIsChangingPassword(true);
    try {
      const response = await api.put<{ success: boolean; message: string }>(
        '/profile/password',
        {
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: confirmPassword,
        }
      );
      if (response.success) {
        toast.add({
          title: isAr ? 'تم تغيير كلمة المرور' : 'Password Changed',
          description: isAr ? 'تم تحديث كلمة المرور الخاصة بك بنجاح.' : 'Your password has been successfully updated.',
          type: 'success',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      toast.add({
        title: isAr ? 'خطأ في التحديث' : 'Update Failed',
        description: err.response?.data?.message || err.message || (isAr ? 'فشل تحديث كلمة المرور.' : 'Failed to update password.'),
        type: 'error',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast.add({
        title: isAr ? 'خطأ في المدخلات' : 'Input Error',
        description: isAr ? 'يرجى كتابة اسم الشركة.' : 'Please enter company name.',
        type: 'error',
      });
      return;
    }
    setIsSavingCompany(true);
    try {
      const response = await api.put<{ success: boolean; message: string }>(
        '/profile/tenant',
        {
          name: companyName,
          name_en: companyNameEn,
          commercial_registration: companyCr,
          tax_number: companyTax,
          billing_details: companyBilling,
        }
      );
      if (response.success) {
        toast.add({
          title: isAr ? 'تم تحديث بيانات الشركة' : 'Company Data Updated',
          description: isAr ? 'تم حفظ بيانات وتعديلات الشركة بنجاح.' : 'Company data saved successfully.',
          type: 'success',
        });
        refreshProfile(); // Refetch user/tenant data from layout
      }
    } catch (err: any) {
      toast.add({
        title: isAr ? 'خطأ في التحديث' : 'Update Failed',
        description: err.response?.data?.message || err.message || (isAr ? 'فشل تحديث بيانات الشركة.' : 'Failed to update company details.'),
        type: 'error',
      });
    } finally {
      setIsSavingCompany(false);
    }
  };

  const formatBudget = (budget: number) => {
    if (budget === 0) return isAr ? 'مفتوح (غير محدود)' : 'Unlimited';
    if (budget >= 1000000000) return isAr ? `${budget / 1000000000} مليار ريال` : `${budget / 1000000000} Billion SAR`;
    if (budget >= 1000000) return isAr ? `${budget / 1000000} مليون ريال` : `${budget / 1000000} Million SAR`;
    return isAr ? `${budget.toLocaleString('ar-SA')} ريال` : `SAR ${budget.toLocaleString('en-US')}`;
  };

  const isCompanyAdmin = authUser?.role === 'company_admin';

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="font-medium text-sm">{isAr ? 'جاري تحميل الإعدادات...' : 'Loading settings...'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Inner Navigation Tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto no-scrollbar whitespace-nowrap touch-scroll gap-1" dir={isAr ? 'rtl' : 'ltr'}>
        <button
          onClick={() => handleTabChange('profile')}
          className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-3 border-b-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
            activeTab === 'profile'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className={`w-4 h-4 ${isAr ? 'ml-1' : 'mr-1'}`} />
          {isAr ? 'الملف الشخصي' : 'Profile'}
        </button>

        <button
          onClick={() => handleTabChange('security')}
          className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-3 border-b-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
            activeTab === 'security'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className={`w-4 h-4 ${isAr ? 'ml-1' : 'mr-1'}`} />
          {isAr ? 'الأمان والحماية' : 'Security'}
        </button>

        {isCompanyAdmin && (
          <button
            onClick={() => handleTabChange('company')}
            className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-3 border-b-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
              activeTab === 'company'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className={`w-4 h-4 ${isAr ? 'ml-1' : 'mr-1'}`} />
            {isAr ? 'بيانات الشركة' : 'Company Details'}
          </button>
        )}

        <button
          onClick={() => handleTabChange('subscription')}
          className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-3 border-b-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
            activeTab === 'subscription'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className={`w-4 h-4 ${isAr ? 'ml-1' : 'mr-1'}`} />
          {isAr ? 'اشتراك الشركة' : 'Subscription'}
        </button>
      </div>

      {/* --- PROFILE TAB (Read Only + Edit Modal) --- */}
      {activeTab === 'profile' && (
        <div className={`space-y-6 ${isAr ? 'text-right' : 'text-left'}`} dir={isAr ? 'rtl' : 'ltr'}>
          <Card className="border-slate-800 bg-slate-900/40 text-white max-w-2xl">
            <CardHeader className={`flex flex-row justify-between items-center pb-4 border-b border-slate-800/60`}>
              <div className="space-y-1">
                <CardTitle className="text-lg">{isAr ? 'بيانات الملف الشخصي' : 'Profile Information'}</CardTitle>
                <CardDescription className="text-slate-450 text-xs">{isAr ? 'عرض تفاصيل الحساب والمسمى الوظيفي الخاص بك' : 'View account credentials and system job titles'}</CardDescription>
              </div>
              <Button
                onClick={() => setIsEditModalOpen(true)}
                className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer animate-in fade-in duration-300"
              >
                <Edit2 className={`w-3.5 h-3.5 ${isAr ? 'ml-1' : 'mr-1'}`} />
                {isAr ? 'تعديل البيانات' : 'Edit Profile'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-right" dir={isAr ? 'rtl' : 'ltr'}>
                
                <div className={`space-y-1 ${isAr ? 'text-right' : 'text-left'}`}>
                  <span className="text-xs text-slate-450 block font-semibold">{isAr ? 'الاسم بالكامل' : 'Full Name'}</span>
                  <div className="flex items-center gap-2 text-slate-105 bg-slate-950/40 border border-slate-800/40 px-4 py-2.5 rounded-xl text-sm font-medium">
                    <User className={`w-4 h-4 text-indigo-400/80 ${isAr ? 'ml-1' : 'mr-1'} shrink-0`} />
                    <span>{authUser?.profile?.first_name} {authUser?.profile?.last_name}</span>
                  </div>
                </div>

                <div className={`space-y-1 ${isAr ? 'text-right' : 'text-left'}`}>
                  <span className="text-xs text-slate-455 block font-semibold">{isAr ? 'البريد الإلكتروني' : 'Email Address'}</span>
                  <div className="flex items-center gap-2 text-slate-105 bg-slate-950/40 border border-slate-800/40 px-4 py-2.5 rounded-xl text-sm font-mono font-medium">
                    <Mail className={`w-4 h-4 text-indigo-400/80 ${isAr ? 'ml-1' : 'mr-1'} shrink-0`} />
                    <span className="truncate">{authUser?.email}</span>
                  </div>
                </div>

                <div className={`space-y-1 ${isAr ? 'text-right' : 'text-left'}`}>
                  <span className="text-xs text-slate-455 block font-semibold">{isAr ? 'رقم الجوال' : 'Phone Number'}</span>
                  <div className={`flex items-center gap-2 text-slate-105 bg-slate-950/40 border border-slate-800/40 px-4 py-2.5 rounded-xl text-sm font-medium`} dir="ltr">
                    <Phone className="w-4 h-4 text-indigo-400/80 shrink-0 mr-1" />
                    <span>{authUser?.profile?.phone_number || (isAr ? 'غير محدد' : 'Not specified')}</span>
                  </div>
                </div>

                <div className={`space-y-1 ${isAr ? 'text-right' : 'text-left'}`}>
                  <span className="text-xs text-slate-455 block font-semibold">{isAr ? 'المسمى الوظيفي' : 'Job Title'}</span>
                  <div className="flex items-center gap-2 text-slate-105 bg-slate-950/40 border border-slate-800/40 px-4 py-2.5 rounded-xl text-sm font-medium">
                    <Briefcase className={`w-4 h-4 text-indigo-400/80 ${isAr ? 'ml-1' : 'mr-1'} shrink-0`} />
                    <span>{authUser?.profile?.job_title || (isAr ? 'غير محدد' : 'Not specified')}</span>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* EDIT PROFILE MODAL */}
          {isEditModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-250">
              <div 
                className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
                dir={isAr ? 'rtl' : 'ltr'}
              >
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                  <h3 className="text-lg font-bold text-white">{isAr ? 'تعديل بيانات الملف الشخصي' : 'Edit Profile Details'}</h3>
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="text-slate-400 hover:text-slate-200 transition-all p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleUpdateProfile} className={`space-y-4 pt-2 ${isAr ? 'text-right' : 'text-left'}`}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-semibold">{isAr ? 'الاسم الأول' : 'First Name'}</label>
                      <input
                        type="text"
                        required
                        value={profileFirstName}
                        onChange={(e) => setProfileFirstName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-semibold">{isAr ? 'الاسم الأخير' : 'Last Name'}</label>
                      <input
                        type="text"
                        required
                        value={profileLastName}
                        onChange={(e) => setProfileLastName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-semibold">{isAr ? 'رقم الجوال' : 'Phone Number'}</label>
                    <input
                      type="text"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none text-white"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-semibold">{isAr ? 'المسمى الوظيفي' : 'Job Title'}</label>
                    <input
                      type="text"
                      value={profileJobTitle}
                      onChange={(e) => setProfileJobTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/80 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditModalOpen(false)}
                      className="border-slate-800 hover:bg-slate-800 hover:text-white text-slate-400 rounded-xl px-5"
                    >
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSavingProfile}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 font-semibold"
                    >
                      {isSavingProfile ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ التغييرات' : 'Save Changes')}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- SECURITY TAB --- */}
      {activeTab === 'security' && (
        <Card className="border-slate-800 bg-slate-900/40 text-white max-w-2xl">
          <CardHeader className={`${isAr ? 'text-right' : 'text-left'}`}>
            <CardTitle className="text-lg">{isAr ? 'تغيير كلمة المرور' : 'Change Password'}</CardTitle>
            <CardDescription className="text-slate-400">{isAr ? 'تحديث كلمة مرور الحساب لضمان أمان معلوماتك' : 'Update account password to maintain your profile security'}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
              <div className={`space-y-1.5 ${isAr ? 'text-right' : 'text-left'}`}>
                <label className="text-xs text-slate-400 font-semibold">{isAr ? 'كلمة المرور الحالية' : 'Current Password'}</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className={`space-y-1.5 ${isAr ? 'text-right' : 'text-left'}`}>
                <label className="text-xs text-slate-400 font-semibold">{isAr ? 'كلمة المرور الجديدة' : 'New Password'}</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className={`space-y-1.5 ${isAr ? 'text-right' : 'text-left'}`}>
                <label className="text-xs text-slate-400 font-semibold">{isAr ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={isChangingPassword}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 px-6 font-semibold"
                >
                  {isChangingPassword ? (isAr ? 'جاري التحديث...' : 'Updating...') : (isAr ? 'تحديث كلمة المرور' : 'Update Password')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* --- COMPANY DETAILS TAB --- */}
      {activeTab === 'company' && isCompanyAdmin && (
        <Card className="border-slate-800 bg-slate-900/40 text-white max-w-2xl">
          <CardHeader className={`${isAr ? 'text-right' : 'text-left'}`}>
            <CardTitle className="text-lg">{isAr ? 'بيانات الشركة والمؤسسة' : 'Company & Organization Details'}</CardTitle>
            <CardDescription className="text-slate-400">{isAr ? 'تعديل معلومات الهوية والمستندات والفوترة الخاصة بمؤسستك' : 'Edit registry, VAT numbers, identity records, and billing settings'}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateCompany} className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`space-y-1.5 ${isAr ? 'text-right' : 'text-left'}`}>
                  <label className="text-xs text-slate-400 font-semibold">{isAr ? 'اسم الشركة (عربي)' : 'Company Name (Arabic)'}</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className={`space-y-1.5 ${isAr ? 'text-right' : 'text-left'}`}>
                  <label className="text-xs text-slate-400 font-semibold">{isAr ? 'اسم الشركة (إنجليزي)' : 'Company Name (English)'}</label>
                  <input
                    type="text"
                    value={companyNameEn}
                    onChange={(e) => setCompanyNameEn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`space-y-1.5 ${isAr ? 'text-right' : 'text-left'}`}>
                  <label className="text-xs text-slate-400 font-semibold">{isAr ? 'رقم السجل التجاري' : 'CR Registration Number'}</label>
                  <input
                    type="text"
                    value={companyCr}
                    onChange={(e) => setCompanyCr(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none font-mono text-left"
                    dir="ltr"
                  />
                </div>

                <div className={`space-y-1.5 ${isAr ? 'text-right' : 'text-left'}`}>
                  <label className="text-xs text-slate-400 font-semibold">{isAr ? 'الرقم الضريبي (TIN / VAT)' : 'Tax Number (TIN / VAT)'}</label>
                  <input
                    type="text"
                    value={companyTax}
                    onChange={(e) => setCompanyTax(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className={`space-y-1.5 ${isAr ? 'text-right' : 'text-left'}`}>
                <label className="text-xs text-slate-400 font-semibold">{isAr ? 'بيانات وعنوان الفوترة' : 'Billing Details & Address'}</label>
                <textarea
                  value={companyBilling}
                  onChange={(e) => setCompanyBilling(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                  placeholder={isAr ? 'مثال: الرياض، حي السليمانية، مبنى رقم 45 - الرمز البريدي 12243' : 'e.g. Riyadh, Sulimaniyah District, Bldg 45 - Zip 12243'}
                />
              </div>

              <div className={`space-y-1.5 ${isAr ? 'text-right' : 'text-left'}`}>
                <label className="text-xs text-slate-400 font-semibold">{isAr ? 'رابط النطاق (Domain) المشغل' : 'Workspace Domain Link'}</label>
                <input
                  type="text"
                  disabled
                  value={tenant?.domain || ''}
                  className="w-full bg-slate-950/40 border border-slate-900 text-slate-500 rounded-xl px-4 py-2.5 text-sm cursor-not-allowed font-mono text-left"
                  dir="ltr"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  {isAr 
                    ? '* رابط النطاق مخصص وثابت للمؤسسة ولا يمكن تعديله إلا من خلال مسؤول النظام العام.' 
                    : '* Domain handles are fixed for the enterprise and can only be updated by system super-admins.'}
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={isSavingCompany}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 px-6 font-semibold"
                >
                  {isSavingCompany ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ التغييرات' : 'Save Changes')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* --- SUBSCRIPTION TAB --- */}
      {activeTab === 'subscription' && (
        <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
          {usageLoading ? (
            <div className="flex flex-col items-center py-10 text-slate-400 gap-2">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">{isAr ? 'جاري تحميل بيانات الاشتراك...' : 'Loading subscription details...'}</p>
            </div>
          ) : usage ? (
            <div className="space-y-6">
              
              {/* Main Usage panel (Moved from dashboard) */}
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 space-y-6 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[60px] pointer-events-none" />
                <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/50 pb-4`}>
                  <div className={`space-y-1 ${isAr ? 'text-right' : 'text-left'}`}>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <CreditCard className={`w-4 h-4 text-indigo-400 ${isAr ? 'ml-1' : 'mr-1'}`} />
                      {isAr ? 'مستوى استهلاك باقة الاشتراك والحدود المتاحة' : 'Subscription usage levels & limits'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {isAr ? 'متابعة حية لرصيد مشاريع شركتك ومقاعد الموظفين النشطين' : 'Realtime tracking of project credits and active user seats'}
                    </p>
                  </div>
                  <Link href="/pricing">
                    <Button variant="outline" className="border-indigo-500/20 hover:border-indigo-500 hover:bg-indigo-600/10 text-indigo-400 hover:text-white rounded-xl text-xs py-2 px-3.5 flex items-center gap-1.5 transition-all">
                      {isAr ? 'ترقية الباقة الحالية' : 'Upgrade Plan'}
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Projects Credit Progress */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-slate-300">{isAr ? 'رصيد المشاريع المتبقي' : 'Remaining Project Credits'}</span>
                      <span className="text-indigo-400 font-mono font-bold">
                        {isAr 
                          ? `متبقي ${usage.credits.remaining} من أصل ${usage.credits.total} مشاريع`
                          : `${usage.credits.remaining} of ${usage.credits.total} projects remaining`}
                      </span>
                    </div>
                    
                    {/* Progress Bar Container */}
                    <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                        style={{ width: `${usage.credits.total > 0 ? Math.min(100, (usage.credits.used / usage.credits.total) * 100) : 0}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>{isAr ? `تم استهلاك ${usage.credits.used} مشاريع` : `${usage.credits.used} projects used`}</span>
                      <span>{isAr ? 'نسبة الاستهلاك' : 'Usage ratio'} {usage.credits.total > 0 ? ((usage.credits.used / usage.credits.total) * 100).toFixed(0) : 0}%</span>
                    </div>
                  </div>

                  {/* Active Users Progress */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-slate-300">{isAr ? 'مقاعد الموظفين النشطين' : 'Active User Seats'}</span>
                      <span className="text-emerald-400 font-mono font-bold">
                        {isAr 
                          ? `تم استخدام ${usage.users.current} من ${usage.users.max} مستخدم`
                          : `${usage.users.current} of ${usage.users.max} users used`}
                      </span>
                    </div>
                    
                    {/* Progress Bar Container */}
                    <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                        style={{ width: `${usage.users.max > 0 ? Math.min(100, (usage.users.current / usage.users.max) * 100) : 0}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>{isAr ? `متبقي ${usage.users.remaining} مقاعد شاغرة` : `${usage.users.remaining} seats remaining`}</span>
                      <span>{isAr ? 'نسبة الامتلاء' : 'Occupancy ratio'} {usage.users.max > 0 ? ((usage.users.current / usage.users.max) * 100).toFixed(0) : 0}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed subscription parameters card */}
              <Card className="border-slate-800 bg-slate-900/40 text-white max-w-2xl">
                <CardHeader className={`${isAr ? 'text-right' : 'text-left'}`}>
                  <CardTitle className="text-sm font-semibold">{isAr ? 'تفاصيل الباقة والحدود المتاحة' : 'Plan Details & Limits'}</CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-slate-800/60 pt-0 text-sm">
                  <div className="py-3 flex justify-between items-center">
                    <span className="text-slate-400 font-medium">{isAr ? 'الباقة الحالية' : 'Current Plan'}</span>
                    <span className="font-bold text-indigo-400 text-base">
                      {usage.plan_name === 'basic' ? (isAr ? 'الأساسية' : 'Basic') :
                       usage.plan_name === 'professional' ? (isAr ? 'الاحترافية' : 'Professional') :
                       usage.plan_name === 'business' ? (isAr ? 'الأعمال' : 'Business') :
                       usage.plan_name === 'enterprise' ? (isAr ? 'المؤسسات' : 'Enterprise') :
                       usage.plan_name}
                    </span>
                  </div>
                  <div className="py-3 flex justify-between items-center">
                    <span className="text-slate-400 font-medium">{isAr ? 'دورة الفوترة' : 'Billing Cycle'}</span>
                    <span className="font-semibold">{usage.billing_cycle === 'yearly' ? (isAr ? 'دورة فوترة سنوية' : 'Annual Billing') : (isAr ? 'دورة فوترة شهرية' : 'Monthly Billing')}</span>
                  </div>
                  <div className="py-3 flex justify-between items-center">
                    <span className="text-slate-400 font-medium">{isAr ? 'الحد الأقصى لميزانية المشروع الواحد' : 'Max Budget Per Project'}</span>
                    <span className="font-bold text-emerald-400 text-base">{formatBudget(usage.max_project_budget)}</span>
                  </div>
                  {usage.starts_at && (
                    <div className="py-3 flex justify-between items-center">
                      <span className="text-slate-400 font-medium">{isAr ? 'تاريخ بدء الاشتراك' : 'Subscription Start Date'}</span>
                      <span className="font-semibold">{new Date(usage.starts_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</span>
                    </div>
                  )}
                  {usage.ends_at && (
                    <div className="py-3 flex justify-between items-center">
                      <span className="text-slate-400 font-medium">{isAr ? 'تاريخ انتهاء الاشتراك' : 'Subscription Expiry Date'}</span>
                      <span className="font-semibold text-rose-400">{new Date(usage.ends_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 p-8 text-center text-slate-400 rounded-2xl">
              {isAr ? 'لا توجد معلومات اشتراك متاحة حالياً. يرجى مراجعة الدعم الفني.' : 'No subscription details are currently available. Please contact support.'}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
