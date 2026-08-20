'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import {
  User,
  ShieldCheck,
  CreditCard,
  Plus,
  Trash2,
  Edit,
  X,
  Lock,
  RefreshCw,
  Info
} from 'lucide-react';

interface PlanItem {
  id: number;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number;
  max_project_budget: number;
  max_users: number;
  project_credits_per_year: number;
  is_custom: boolean;
  features: string[];
}

export default function AdminSettingsPage() {
  const { user: authUser, updateProfile } = useAuth();
  const { t, isAr } = useLanguage();

  // Settings Inner Tabs
  const [settingsTab, setSettingsTab] = useState<'profile' | 'security' | 'plans'>('profile');

  // --- Profile Tab States ---
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileJobTitle, setProfileJobTitle] = useState('مسؤول النظام');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // --- Security Tab States ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // --- Plans Tab States ---
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);
  const [planName, setPlanName] = useState('');
  const [planPriceMonthly, setPlanPriceMonthly] = useState<number>(0);
  const [planPriceYearly, setPlanPriceYearly] = useState<number>(0);
  const [planMaxBudget, setPlanMaxBudget] = useState<number>(0);
  const [planMaxUsers, setPlanMaxUsers] = useState<number>(0);
  const [planCredits, setPlanCredits] = useState<number>(0);
  const [planFeatures, setPlanFeatures] = useState<string[]>([]);
  const [newFeatureText, setNewFeatureText] = useState('');
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  // Sync auth profile variables
  useEffect(() => {
    if (authUser && authUser.profile) {
      setProfileFirstName(authUser.profile.first_name || '');
      setProfileLastName(authUser.profile.last_name || '');
      setProfilePhone(authUser.profile.phone_number || '');
      setProfileJobTitle(authUser.profile.job_title || (isAr ? 'مسؤول النظام' : 'System Administrator'));
    }
  }, [authUser, isAr]);

  // Fetch standard plans list
  const { data: plansData, isLoading: plansLoading, refetch: refetchPlans } = useQuery({
    queryKey: ['admin-plans-management'],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        data: PlanItem[];
      }>('/plans');
      // Only show standard non-custom plans in global settings
      return response.data.filter((p) => !p.is_custom);
    },
    enabled: !!authUser && authUser.role === 'system_admin' && settingsTab === 'plans',
  });

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
        description: isAr ? 'تم حفظ تغييرات ملفك الشخصي بنجاح.' : 'Your profile changes were saved successfully.',
        type: 'success',
      });
    } catch (err: any) {
      toast.add({
        title: isAr ? 'خطأ في التحديث' : 'Update Error',
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
          new_password: newPassword,
          new_password_confirmation: confirmPassword,
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
        title: isAr ? 'خطأ في التحديث' : 'Update Error',
        description: err.response?.data?.message || err.message || (isAr ? 'فشل تحديث كلمة المرور.' : 'Failed to update password.'),
        type: 'error',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Setup Plan Form for Editing
  const openEditPlanModal = (plan: PlanItem) => {
    setSelectedPlan(plan);
    setPlanName(plan.name);
    setPlanPriceMonthly(plan.price_monthly);
    setPlanPriceYearly(plan.price_yearly);
    setPlanMaxBudget(plan.max_project_budget);
    setPlanMaxUsers(plan.max_users);
    setPlanCredits(plan.project_credits_per_year);
    setPlanFeatures(plan.features || []);
    setNewFeatureText('');
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setIsSavingPlan(true);
    try {
      const response = await api.put<{ success: boolean; message: string }>(
        `/system-admin/plans/${selectedPlan.id}`,
        {
          name: planName,
          price_monthly: planPriceMonthly,
          price_yearly: planPriceYearly,
          max_project_budget: planMaxBudget,
          max_users: planMaxUsers,
          project_credits_per_year: planCredits,
          features: planFeatures,
        }
      );

      if (response.success) {
        toast.add({
          title: isAr ? 'تم تحديث الباقة' : 'Plan Updated',
          description: isAr 
            ? `تم حفظ حدود وميزات باقة "${planName}" بنجاح.`
            : `Features and limits for plan "${planName}" have been saved successfully.`,
          type: 'success',
        });
        setSelectedPlan(null);
        refetchPlans();
      }
    } catch (err: any) {
      toast.add({
        title: isAr ? 'خطأ في التحديث' : 'Update Failed',
        description: err.message || (isAr ? 'فشل تحديث بيانات الباقة.' : 'Failed to update plan properties.'),
        type: 'error',
      });
    } finally {
      setIsSavingPlan(false);
    }
  };

  const addPlanFeature = () => {
    if (newFeatureText.trim()) {
      setPlanFeatures([...planFeatures, newFeatureText.trim()]);
      setNewFeatureText('');
    }
  };

  const removePlanFeature = (index: number) => {
    setPlanFeatures(planFeatures.filter((_, idx) => idx !== index));
  };

  const formatBudget = (budget: number) => {
    if (budget === 0) return isAr ? 'مفتوح (غير محدود)' : 'Unlimited';
    if (budget >= 1000000000) return isAr ? `${budget / 1000000000} مليار ريال` : `${budget / 1000000000} Billion SAR`;
    if (budget >= 1000000) return isAr ? `${budget / 1000000} مليون ريال` : `${budget / 1000000} Million SAR`;
    return isAr ? `${budget.toLocaleString('ar-SA')} ريال` : `SAR ${budget.toLocaleString('en-US')}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Inner Navigation Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setSettingsTab('profile')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all cursor-pointer ${
            settingsTab === 'profile'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-muted-foreground hover:text-slate-200'
          }`}
        >
          <User className={`w-4 h-4 ${isAr ? 'ml-1' : 'mr-1'}`} />
          {isAr ? 'الملف الشخصي' : 'Profile'}
        </button>

        <button
          onClick={() => setSettingsTab('security')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all cursor-pointer ${
            settingsTab === 'security'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-muted-foreground hover:text-slate-200'
          }`}
        >
          <Lock className={`w-4 h-4 ${isAr ? 'ml-1' : 'mr-1'}`} />
          {isAr ? 'الأمان والحماية' : 'Security & Protection'}
        </button>

        <button
          onClick={() => setSettingsTab('plans')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all cursor-pointer ${
            settingsTab === 'plans'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-muted-foreground hover:text-slate-200'
          }`}
        >
          <CreditCard className={`w-4 h-4 ${isAr ? 'ml-1' : 'mr-1'}`} />
          {isAr ? 'إدارة الباقات العامة' : 'Manage Subscription Plans'}
        </button>
      </div>

      {/* --- PROFILE SETTINGS TAB --- */}
      {settingsTab === 'profile' && (
        <Card className="border-border bg-card backdrop-blur text-foreground">
          <CardHeader className={isAr ? 'text-right' : 'text-left'}>
            <CardTitle className="text-lg">{isAr ? 'تحديث الملف الشخصي' : 'Update Profile'}</CardTitle>
            <CardDescription className="text-muted-foreground text-xs">{isAr ? 'تعديل معلوماتك الشخصية كمسؤول للنظام.' : 'Update your personal credentials as a system administrator.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl" dir={isAr ? 'rtl' : 'ltr'}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`space-y-1.5 ${isAr ? 'text-right' : 'text-left'}`}>
                  <label className="text-xs text-muted-foreground font-semibold">{isAr ? 'الاسم الأول' : 'First Name'}</label>
                  <input
                    type="text"
                    required
                    value={profileFirstName}
                    onChange={(e) => setProfileFirstName(e.target.value)}
                    className="w-full bg-background/80 border border-border focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none transition-all"
                  />
                </div>
                <div className={`space-y-1.5 ${isAr ? 'text-right' : 'text-left'}`}>
                  <label className="text-xs text-muted-foreground font-semibold">{isAr ? 'اسم العائلة' : 'Last Name'}</label>
                  <input
                    type="text"
                    required
                    value={profileLastName}
                    onChange={(e) => setProfileLastName(e.target.value)}
                    className="w-full bg-background/80 border border-border focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none transition-all"
                  />
                </div>
              </div>

              <div className={`space-y-1.5 ${isAr ? 'text-right' : 'text-left'}`}>
                <label className="text-xs text-muted-foreground font-semibold">{isAr ? 'رقم الهاتف' : 'Phone Number'}</label>
                <input
                  type="text"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full bg-background/80 border border-border focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none transition-all font-mono"
                  dir="ltr"
                />
              </div>

              <div className={`space-y-1.5 ${isAr ? 'text-right' : 'text-left'}`}>
                <label className="text-xs text-muted-foreground font-semibold">{isAr ? 'المسمى الوظيفي' : 'Job Title'}</label>
                <input
                  type="text"
                  required
                  value={profileJobTitle}
                  onChange={(e) => setProfileJobTitle(e.target.value)}
                  className="w-full bg-background/80 border border-border focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none transition-all"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={isSavingProfile}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-2.5 text-xs font-semibold cursor-pointer"
                >
                  {isSavingProfile ? (isAr ? 'جاري حفظ التغييرات...' : 'Saving changes...') : (isAr ? 'حفظ الملف الشخصي' : 'Save Profile')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* --- SECURITY SETTINGS TAB --- */}
      {settingsTab === 'security' && (
        <Card className="border-border bg-card backdrop-blur text-foreground">
          <CardHeader className={isAr ? 'text-right' : 'text-left'}>
            <CardTitle className="text-lg">{isAr ? 'تغيير كلمة المرور' : 'Change Password'}</CardTitle>
            <CardDescription className="text-muted-foreground text-xs">{isAr ? 'تحديث كلمة المرور الخاصة بحساب الإشراف الخاص بك.' : 'Update the security password for your system administrator account.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl" dir={isAr ? 'rtl' : 'ltr'}>
              <div className={`space-y-1.5 ${isAr ? 'text-right' : 'text-left'}`}>
                <label className="text-xs text-muted-foreground font-semibold">{isAr ? 'كلمة المرور الحالية' : 'Current Password'}</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-background/80 border border-border focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none transition-all font-mono"
                />
              </div>

              <div className={`space-y-1.5 ${isAr ? 'text-right' : 'text-left'}`}>
                <label className="text-xs text-muted-foreground font-semibold">{isAr ? 'كلمة المرور الجديدة' : 'New Password'}</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-background/80 border border-border focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none transition-all font-mono"
                />
              </div>

              <div className={`space-y-1.5 ${isAr ? 'text-right' : 'text-left'}`}>
                <label className="text-xs text-muted-foreground font-semibold">{isAr ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-background/80 border border-border focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none transition-all font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={isChangingPassword}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-2.5 text-xs font-semibold cursor-pointer"
                >
                  {isChangingPassword ? (isAr ? 'جاري تحديث كلمة المرور...' : 'Updating password...') : (isAr ? 'تحديث كلمة المرور' : 'Update Password')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* --- PLANS SETTINGS TAB --- */}
      {settingsTab === 'plans' && (
        <div className="space-y-6">
          <Card className="border-border bg-card backdrop-blur text-foreground">
            <CardHeader className={isAr ? 'text-right' : 'text-left'}>
              <CardTitle className="text-lg">{isAr ? 'أسعار وباقات النظام القياسية' : 'Standard Pricing Subscription Plans'}</CardTitle>
              <CardDescription className="text-muted-foreground text-xs">
                {isAr 
                  ? 'تعديل وتحديد الأسعار والحدود الافتراضية للباقات العامة في النظام.'
                  : 'Edit and manage default plan values, prices, limits and bounds for global users.'}
              </CardDescription>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className={`w-full ${isAr ? 'text-right' : 'text-left'} border-collapse text-xs`}>
                <thead>
                  <tr className="border-b border-border bg-card text-muted-foreground font-semibold">
                    <th className="px-6 py-3.5">{isAr ? 'اسم الباقة' : 'Plan Name'}</th>
                    <th className="px-6 py-3.5">{isAr ? 'السعر الشهري (ريال)' : 'Monthly Price (SAR)'}</th>
                    <th className="px-6 py-3.5">{isAr ? 'السعر السنوي (ريال)' : 'Annual Price (SAR)'}</th>
                    <th className="px-6 py-3.5 text-center">{isAr ? 'أعضاء الفريق' : 'Team Members'}</th>
                    <th className="px-6 py-3.5 text-center">{isAr ? 'المشاريع سنوياً' : 'Projects / Year'}</th>
                    <th className="px-6 py-3.5">{isAr ? 'حد الميزانية للمشروع' : 'Budget Limit / Project'}</th>
                    <th className="px-6 py-3.5 text-center">{isAr ? 'الإجراء' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {plansLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-muted-foreground">{isAr ? 'جاري تحميل الباقات...' : 'Loading plans list...'}</td>
                    </tr>
                  ) : plansData?.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-muted-foreground">{isAr ? 'لا توجد باقات قياسية معرفة في النظام.' : 'No standard plans defined.'}</td>
                    </tr>
                  ) : (
                    plansData?.map((plan) => (
                      <tr key={plan.id} className="hover:bg-muted transition-colors">
                        <td className="px-6 py-3.5 font-bold text-foreground">
                          {isAr 
                            ? (plan.slug === 'basic' ? 'الأساسية' :
                               plan.slug === 'professional' ? 'الاحترافية' :
                               plan.slug === 'business' ? 'الأعمال' :
                               plan.slug === 'enterprise' ? 'المؤسسات' :
                               plan.name)
                            : plan.name}
                        </td>
                        <td className="px-6 py-3.5 font-mono">
                          {plan.price_monthly.toLocaleString(isAr ? 'ar-SA' : 'en-US')} {isAr ? 'ريال' : 'SAR'}
                        </td>
                        <td className="px-6 py-3.5 font-mono">
                          {plan.price_yearly.toLocaleString(isAr ? 'ar-SA' : 'en-US')} {isAr ? 'ريال' : 'SAR'}
                        </td>
                        <td className="px-6 py-3.5 text-center font-bold font-mono">
                          {plan.max_users === -1 ? (isAr ? 'غير محدود' : 'Unlimited') : plan.max_users}
                        </td>
                        <td className="px-6 py-3.5 text-center font-bold font-mono">
                          {plan.project_credits_per_year === -1 ? (isAr ? 'غير محدود' : 'Unlimited') : plan.project_credits_per_year}
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-foreground">
                          {formatBudget(plan.max_project_budget)}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <Button
                            onClick={() => openEditPlanModal(plan)}
                            variant="ghost"
                            className="hover:bg-indigo-600/20 hover:text-indigo-300 text-indigo-400 px-2 py-1 h-7 rounded-lg transition-all cursor-pointer"
                          >
                            <Edit className={`w-3.5 h-3.5 ${isAr ? 'ml-1' : 'mr-1'}`} />
                            {isAr ? 'تعديل الخصائص' : 'Edit Features'}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* --- STANDARD PLAN EDIT MODAL --- */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm transition-all animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden text-right" dir={isAr ? 'rtl' : 'ltr'}>
            
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card sticky top-0 z-10">
              <h3 className="text-base font-bold text-foreground">
                {isAr ? 'تعديل باقة:' : 'Edit Plan:'} {isAr ? (selectedPlan.slug === 'basic' ? 'الأساسية' : selectedPlan.slug === 'professional' ? 'الاحترافية' : selectedPlan.slug === 'business' ? 'الأعمال' : selectedPlan.slug === 'enterprise' ? 'المؤسسات' : selectedPlan.name) : selectedPlan.name}
              </h3>
              <Button
                onClick={() => setSelectedPlan(null)}
                variant="ghost"
                className="hover:bg-muted text-muted-foreground hover:text-foreground p-2 rounded-xl h-8 w-8 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleUpdatePlan} className="overflow-y-auto p-6 space-y-4 flex-1">
              
              <div className={`space-y-1.5 ${isAr ? 'text-right' : 'text-left'}`}>
                <label className="text-xs text-muted-foreground font-semibold">{isAr ? 'اسم الباقة' : 'Plan Name'}</label>
                <input
                  type="text"
                  required
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full bg-background/80 border border-border focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`space-y-1.5 ${isAr ? 'text-right' : 'text-left'}`}>
                  <label className="text-xs text-muted-foreground font-semibold">{isAr ? 'السعر الشهري (ريال)' : 'Monthly Price (SAR)'}</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={planPriceMonthly}
                    onChange={(e) => setPlanPriceMonthly(parseFloat(e.target.value) || 0)}
                    className="w-full bg-background/80 border border-border focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none transition-all font-mono"
                  />
                </div>
                <div className={`space-y-1.5 ${isAr ? 'text-right' : 'text-left'}`}>
                  <label className="text-xs text-muted-foreground font-semibold">{isAr ? 'السعر السنوي (ريال)' : 'Annual Price (SAR)'}</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={planPriceYearly}
                    onChange={(e) => setPlanPriceYearly(parseFloat(e.target.value) || 0)}
                    className="w-full bg-background/80 border border-border focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={`space-y-1.5 ${isAr ? 'text-right' : 'text-left'}`}>
                  <label className="text-xs text-muted-foreground font-semibold flex flex-col font-sans">
                    <span>{isAr ? 'الحد الأقصى للمستخدمين' : 'Max Users Limit'}</span>
                    <span className="text-[9px] text-muted-foreground">{isAr ? '(-1 تعني غير محدود)' : '(-1 means unlimited)'}</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={planMaxUsers}
                    onChange={(e) => setPlanMaxUsers(parseInt(e.target.value) || 0)}
                    className="w-full bg-background/80 border border-border focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none transition-all font-mono"
                  />
                </div>
                <div className={`space-y-1.5 ${isAr ? 'text-right' : 'text-left'}`}>
                  <label className="text-xs text-muted-foreground font-semibold flex flex-col font-sans">
                    <span>{isAr ? 'رصيد المشاريع سنوياً' : 'Annual Project Credits'}</span>
                    <span className="text-[9px] text-muted-foreground">{isAr ? '(-1 تعني غير محدود)' : '(-1 means unlimited)'}</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={planCredits}
                    onChange={(e) => setPlanCredits(parseInt(e.target.value) || 0)}
                    className="w-full bg-background/80 border border-border focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none transition-all font-mono"
                  />
                </div>
                <div className={`space-y-1.5 ${isAr ? 'text-right' : 'text-left'}`}>
                  <label className="text-xs text-muted-foreground font-semibold flex flex-col font-sans">
                    <span>{isAr ? 'أقصى ميزانية للمشروع الواحد' : 'Max Project Budget'}</span>
                    <span className="text-[9px] text-muted-foreground">{isAr ? '(0 تعني غير محدود)' : '(0 means unlimited)'}</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={planMaxBudget}
                    onChange={(e) => setPlanMaxBudget(parseFloat(e.target.value) || 0)}
                    className="w-full bg-background/80 border border-border focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none transition-all font-mono"
                  />
                </div>
              </div>

              {/* Custom Features Manager */}
              <div className="space-y-2 pt-2">
                <label className="text-xs text-muted-foreground font-semibold">{isAr ? 'ميزات الباقة' : 'Plan Features'}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFeatureText}
                    onChange={(e) => setNewFeatureText(e.target.value)}
                    placeholder={isAr ? 'أضف ميزة جديدة لهذه الباقة...' : 'Add a new feature list...'}
                    className="flex-1 bg-background/80 border border-border focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-slate-650 outline-none transition-all"
                  />
                  <Button
                    type="button"
                    onClick={addPlanFeature}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 flex items-center justify-center cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto border border-border rounded-xl p-3 bg-background/40">
                  {planFeatures.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-1">{isAr ? 'لا توجد ميزات لهذه الباقة.' : 'No features defined.'}</p>
                  ) : (
                    planFeatures.map((feature, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-card border border-border rounded-lg px-3 py-1.5 text-xs">
                        <span className="text-slate-200">{feature}</span>
                        <button
                          type="button"
                          onClick={() => removePlanFeature(idx)}
                          className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => setSelectedPlan(null)}
                  variant="ghost"
                  className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl px-5 transition-all text-xs cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingPlan}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-2.5 text-xs font-semibold cursor-pointer"
                >
                  {isSavingPlan ? (isAr ? 'جاري حفظ التغييرات...' : 'Saving changes...') : (isAr ? 'حفظ الباقة القياسية' : 'Save Standard Plan')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
