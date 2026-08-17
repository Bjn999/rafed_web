'use client';

import React, { useState, useEffect, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import Link from 'next/link';
import {
  Building2,
  Database,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Info,
  SlidersHorizontal,
  Ban,
  CheckCircle,
  FileText,
  CreditCard,
  Plus,
  Trash2,
  ArrowRight,
  RefreshCw,
  X,
  ClipboardCopy,
  ClipboardCheck
} from 'lucide-react';

interface TenantItem {
  id: string;
  name: string;
  domain: string;
  status: 'active' | 'suspended' | 'pending';
  users_count: number;
  created_at: string;
  subscription?: {
    billing_cycle: string;
    starts_at: string;
    ends_at: string;
    status: string;
    plan?: {
      id: number;
      name: string;
      slug: string;
      price_monthly: number | null;
      price_yearly: number | null;
      max_project_budget: number;
      max_users: number;
      project_credits_per_year: number;
      is_custom: boolean;
      features: string[] | null;
    };
  };
}

interface SystemLogItem {
  id: number;
  tenant_id: string | null;
  user_id: number | null;
  endpoint: string;
  method: string;
  payload: any;
  response: any;
  status_code: number;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  tenant?: {
    name: string;
  };
  user?: {
    email: string;
    profile?: {
      first_name: string;
      last_name: string;
    };
  };
}

export default function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const tenantId = resolvedParams.id;

  const { user: authUser } = useAuth();
  const { t, isAr } = useLanguage();
  const queryClient = useQueryClient();

  // Custom Plan states
  const [isCustomizingPlan, setIsCustomizingPlan] = useState(false);
  const [showConfirmCustomize, setShowConfirmCustomize] = useState(false);
  const [detailPlanName, setDetailPlanName] = useState('');
  const [detailPlanPriceMonthly, setDetailPlanPriceMonthly] = useState<number>(0);
  const [detailPlanPriceYearly, setDetailPlanPriceYearly] = useState<number>(0);
  const [detailPlanMaxBudget, setDetailPlanMaxBudget] = useState<number>(0);
  const [detailPlanMaxUsers, setDetailPlanMaxUsers] = useState<number>(0);
  const [detailPlanCredits, setDetailPlanCredits] = useState<number>(0);
  const [detailPlanFeatures, setDetailPlanFeatures] = useState<string[]>([]);
  const [detailNewFeatureText, setDetailNewFeatureText] = useState('');
  const [isSavingDetailPlan, setIsSavingDetailPlan] = useState(false);

  // General Log modal states
  const [selectedLog, setSelectedLog] = useState<SystemLogItem | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [updatingTenantId, setUpdatingTenantId] = useState<string | null>(null);

  // Fetch Tenant Details
  const { data: tenantDetails, isLoading: tenantDetailsLoading, refetch: refetchTenantDetails } = useQuery({
    queryKey: ['admin-tenant-details', tenantId],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        data: {
          tenant: TenantItem & {
            subscriptions: any[];
            project_credit?: any;
          };
          stats: {
            users_count: number;
            projects_count: number;
          };
        };
      }>(`/system-admin/tenants/${tenantId}`);
      return response.data;
    },
    enabled: !!authUser && authUser.role === 'system_admin',
  });

  // Fetch Logs for specific tenant
  const [tenantLogPage, setTenantLogPage] = useState(1);
  const { data: tenantLogsData, isLoading: tenantLogsLoading } = useQuery({
    queryKey: ['admin-tenant-logs', tenantId, tenantLogPage],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        data: {
          data: SystemLogItem[];
          current_page: number;
          last_page: number;
          total: number;
        };
      }>('/system-admin/logs', {
        params: {
          tenant_id: tenantId,
          page: tenantLogPage.toString(),
        }
      });
      return response.data;
    },
    enabled: !!authUser && authUser.role === 'system_admin',
  });

  // Sync edit form states when details load
  useEffect(() => {
    if (tenantDetails && tenantDetails.tenant.subscription?.plan) {
      const plan = tenantDetails.tenant.subscription.plan;
      setDetailPlanName(plan.name || '');
      setDetailPlanPriceMonthly(plan.price_monthly || 0);
      setDetailPlanPriceYearly(plan.price_yearly || 0);
      setDetailPlanMaxBudget(plan.max_project_budget || 0);
      setDetailPlanMaxUsers(plan.max_users || 0);
      setDetailPlanCredits(plan.project_credits_per_year || 0);
      setDetailPlanFeatures(plan.features || []);
      setDetailNewFeatureText('');
    }
  }, [tenantDetails]);

  // Handlers
  const handleToggleTenantStatus = async (tenant: TenantItem) => {
    setUpdatingTenantId(tenant.id);
    const newStatus = tenant.status === 'active' ? 'suspended' : 'active';
    try {
      const response = await api.put<{ success: boolean; message: string }>(
        `/system-admin/tenants/${tenant.id}/status`,
        { status: newStatus }
      );

      if (response.success) {
        toast.add({
          title: isAr ? 'تم تحديث الحالة' : 'Status Updated',
          description: isAr 
            ? `تم تغيير حالة شركة "${tenant.name}" إلى ${newStatus === 'active' ? 'نشط' : 'معطل'} بنجاح.`
            : `Company "${tenant.name}" status changed to ${newStatus === 'active' ? 'Active' : 'Suspended'} successfully.`,
          type: 'success',
        });
        queryClient.invalidateQueries({ queryKey: ['admin-tenant-details', tenantId] });
      }
    } catch (error) {
      toast.add({
        title: isAr ? 'خطأ في التحديث' : 'Update Failed',
        description: isAr ? 'فشل تغيير حالة الشركة. الرجاء المحاولة مرة أخرى.' : 'Failed to switch company status. Please try again.',
        type: 'error',
      });
    } finally {
      setUpdatingTenantId(null);
    }
  };

  const handleCustomizePlan = async () => {
    setIsCustomizingPlan(true);
    try {
      const response = await api.post<{ success: boolean; message: string }>(
        `/system-admin/tenants/${tenantId}/customize-plan`
      );
      if (response.success) {
        toast.add({
          title: isAr ? 'تم تخصيص الباقة' : 'Plan Customized',
          description: isAr ? 'تم تحويل الشركة إلى باقة مخصصة بنجاح. يمكنك الآن تعديل خصائصها أدناه.' : 'Plan converted to custom plan. You can edit features below.',
          type: 'success',
        });
        refetchTenantDetails();
      }
    } catch (err: any) {
      toast.add({
        title: isAr ? 'خطأ' : 'Error',
        description: err.message || (isAr ? 'فشل تحويل الباقة لمخصصة.' : 'Failed to switch plan to customized.'),
        type: 'error',
      });
    } finally {
      setIsCustomizingPlan(false);
    }
  };

  const handleUpdateDetailPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantDetails || !tenantDetails.tenant.subscription?.plan) return;
    const planId = tenantDetails.tenant.subscription.plan.id;
    setIsSavingDetailPlan(true);
    try {
      const response = await api.put<{ success: boolean; message: string }>(
        `/system-admin/plans/${planId}`,
        {
          name: detailPlanName,
          price_monthly: detailPlanPriceMonthly,
          price_yearly: detailPlanPriceYearly,
          max_project_budget: detailPlanMaxBudget,
          max_users: detailPlanMaxUsers,
          project_credits_per_year: detailPlanCredits,
          features: detailPlanFeatures,
        }
      );

      if (response.success) {
        toast.add({
          title: isAr ? 'تم حفظ التخصيص' : 'Customization Saved',
          description: isAr ? 'تم تحديث ميزات وحدود الباقة المخصصة للشركة بنجاح.' : 'Custom limits updated successfully.',
          type: 'success',
        });
        refetchTenantDetails();
      }
    } catch (err: any) {
      toast.add({
        title: isAr ? 'خطأ في الحفظ' : 'Save Error',
        description: err.message || (isAr ? 'تعذر تحديث الباقة المخصصة.' : 'Could not save customized parameters.'),
        type: 'error',
      });
    } finally {
      setIsSavingDetailPlan(false);
    }
  };

  const addDetailFeature = () => {
    if (detailNewFeatureText.trim()) {
      setDetailPlanFeatures([...detailPlanFeatures, detailNewFeatureText.trim()]);
      setDetailNewFeatureText('');
    }
  };

  const removeDetailFeature = (index: number) => {
    setDetailPlanFeatures(detailPlanFeatures.filter((_, idx) => idx !== index));
  };

  const handleCopy = (text: any, type: 'payload' | 'response') => {
    const stringified = typeof text === 'object' ? JSON.stringify(text, null, 2) : text;
    navigator.clipboard.writeText(stringified || '');
    if (type === 'payload') {
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    } else {
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2000);
    }
    toast.add({
      title: isAr ? 'تم النسخ' : 'Copied',
      description: isAr ? 'تم نسخ محتوى البيانات إلى الحافظة بنجاح.' : 'Data successfully copied to clipboard.',
      type: 'success',
    });
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat(isAr ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch (e) {
      return dateStr;
    }
  };

  const getMethodBadgeClass = (m: string) => {
    switch (m.toUpperCase()) {
      case 'GET': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'POST': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'PUT': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'DELETE': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getStatusBadgeClass = (code: number) => {
    if (code >= 200 && code < 300) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (code >= 400 && code < 500) return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    if (code >= 500) return 'bg-red-500/10 text-red-400 border-red-500/20';
    return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  };

  const getTenantStatusBadgeClass = (status: string) => {
    if (status === 'active') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (status === 'suspended') return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  };

  const getTenantStatusLabel = (status: string) => {
    if (status === 'active') return isAr ? 'نشط' : 'Active';
    if (status === 'suspended') return isAr ? 'موقوف' : 'Suspended';
    return isAr ? 'معلق' : 'Pending';
  };

  const formatBudget = (budget: number) => {
    if (budget === 0) return isAr ? 'مفتوح (غير محدود)' : 'Unlimited';
    if (budget >= 1000000000) return isAr ? `${budget / 1000000000} مليار ريال` : `${budget / 1000000000} Billion SAR`;
    if (budget >= 1000000) return isAr ? `${budget / 1000000} مليون ريال` : `${budget / 1000000} Million SAR`;
    return isAr ? `${budget.toLocaleString('ar-SA')} ريال` : `SAR ${budget.toLocaleString('en-US')}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Header / Back Action */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
        <div className="flex items-center gap-3">
          <Link href="/admin/tenants">
            <Button
              variant="ghost"
              className="text-slate-400 hover:text-white hover:bg-slate-800 gap-1.5 rounded-xl px-3 h-9 cursor-pointer transition-all"
            >
              <ArrowRight className={`w-4 h-4 ${isAr ? 'ml-1' : 'mr-1 rotate-180'}`} />
              {isAr ? 'العودة للشركات' : 'Back to Companies'}
            </Button>
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <div className={isAr ? 'text-right' : 'text-left'}>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              {tenantDetailsLoading ? (isAr ? 'جاري التحميل...' : 'Loading...') : tenantDetails?.tenant.name}
              {tenantDetails && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getTenantStatusBadgeClass(tenantDetails.tenant.status)}`}>
                  {getTenantStatusLabel(tenantDetails.tenant.status)}
                </span>
              )}
            </h1>
            {!tenantDetailsLoading && tenantDetails && (
              <p className="text-xs text-slate-500 font-mono mt-0.5">{tenantDetails.tenant.domain}</p>
            )}
          </div>
        </div>

        {tenantDetails && (
          <Button
            onClick={() => handleToggleTenantStatus(tenantDetails.tenant)}
            disabled={updatingTenantId === tenantDetails.tenant.id}
            variant="outline"
            className={`text-xs px-4 py-2 rounded-xl transition-all gap-1.5 cursor-pointer ${
              tenantDetails.tenant.status === 'active'
                ? 'border-rose-500/20 hover:border-rose-500 hover:bg-rose-500/10 text-rose-400'
                : 'border-emerald-500/20 hover:border-emerald-500 hover:bg-emerald-500/10 text-emerald-400'
            }`}
          >
            {updatingTenantId === tenantDetails.tenant.id ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : tenantDetails.tenant.status === 'active' ? (
              <>
                <Ban className="w-4 h-4" />
                {isAr ? 'إيقاف تفعيل الشركة' : 'Suspend Company'}
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                {isAr ? 'تفعيل الشركة' : 'Activate Company'}
              </>
            )}
          </Button>
        )}
      </div>

      {tenantDetailsLoading ? (
        <div className="flex justify-center py-24">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : !tenantDetails ? (
        <Card className="border-slate-800 bg-slate-900/40 p-6 text-center text-slate-400">
          {isAr ? 'تعذر تحميل تفاصيل الشركة المطلوبة.' : 'Failed to load requested company details.'}
        </Card>
      ) : (
        <>
          {/* Stats summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-slate-800 bg-slate-900/40 text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-slate-400">{isAr ? 'أعضاء الفريق' : 'Team Members'}</CardTitle>
                <Building2 className="w-5 h-5 text-indigo-400" />
              </CardHeader>
              <CardContent className={isAr ? 'text-right' : 'text-left'}>
                <div className="text-2xl font-bold font-sans">
                  {tenantDetails.stats.users_count} {isAr ? 'مستخدمين' : 'users'}
                </div>
                <p className="text-xs text-slate-500 mt-1">{isAr ? 'العدد الإجمالي للمستخدمين المسجلين' : 'Total registered personnel users'}</p>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/40 text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-slate-400">{isAr ? 'المشاريع المنشأة' : 'Created Projects'}</CardTitle>
                <FileText className="w-5 h-5 text-emerald-400" />
              </CardHeader>
              <CardContent className={isAr ? 'text-right' : 'text-left'}>
                <div className="text-2xl font-bold font-sans">
                  {tenantDetails.stats.projects_count} {isAr ? 'مشاريع' : 'projects'}
                </div>
                <p className="text-xs text-slate-500 mt-1">{isAr ? 'المشاريع المفعلة تحت مساحة العمل' : 'Active projects assigned in workspace'}</p>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/40 text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-slate-400">{isAr ? 'الباقة الحالية' : 'Current Plan'}</CardTitle>
                <CreditCard className="w-5 h-5 text-indigo-400" />
              </CardHeader>
              <CardContent className={isAr ? 'text-right' : 'text-left'}>
                <div className="text-lg font-bold">
                  {tenantDetails.tenant.subscription?.plan ? (
                    isAr 
                      ? (tenantDetails.tenant.subscription.plan.slug === 'basic' ? 'الأساسية' :
                         tenantDetails.tenant.subscription.plan.slug === 'professional' ? 'الاحترافية' :
                         tenantDetails.tenant.subscription.plan.slug === 'business' ? 'الأعمال' :
                         tenantDetails.tenant.subscription.plan.slug === 'enterprise' ? 'المؤسسات' :
                         tenantDetails.tenant.subscription.plan.name)
                      : tenantDetails.tenant.subscription.plan.name
                  ) : (
                    isAr ? 'بدون باقة مفعلة' : 'No active plan subscription'
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1.5 font-mono">
                  {tenantDetails.tenant.subscription ? (
                    isAr 
                      ? <>الدورة: {tenantDetails.tenant.subscription.billing_cycle === 'monthly' ? 'شهري' : 'سنوي'} | الحالة: {tenantDetails.tenant.subscription.status}</>
                      : <>Cycle: {tenantDetails.tenant.subscription.billing_cycle === 'monthly' ? 'Monthly' : 'Annual'} | Status: {tenantDetails.tenant.subscription.status}</>
                  ) : (
                    isAr ? 'يرجى تخصيص باقة أو تفعيل اشتراك' : 'Isolate plan configurations'
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Customize Plan Editor */}
          <Card className="border-slate-800 bg-slate-900/40 text-white">
            <CardHeader className={isAr ? 'text-right' : 'text-left'}>
              <CardTitle className="text-lg flex items-center gap-2">
                <SlidersHorizontal className={`w-5 h-5 text-indigo-400 ${isAr ? 'ml-1' : 'mr-1'}`} />
                {isAr ? 'باقة التخصيص والميزات للشركة' : 'Plan Customization & Boundaries'}
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                {isAr 
                  ? 'تعديل أسعار وحدود الباقة أو تفعيل باقة مخصصة للشركة (Enterprise Plus) بحدود معينة'
                  : 'Modify plan pricing and boundaries or switch workspace to a custom (Enterprise Plus) plan.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tenantDetails.tenant.subscription?.plan?.is_custom ? (
                <form onSubmit={handleUpdateDetailPlan} className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
                  <div className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-2xl mb-4 flex items-center gap-3">
                    <Info className={`w-5 h-5 text-indigo-400 shrink-0 ${isAr ? 'ml-1' : 'mr-1'}`} />
                    <p className={`text-xs text-slate-300 leading-relaxed ${isAr ? 'text-right' : 'text-left'}`}>
                      {isAr 
                        ? <>هذه الشركة تعمل حالياً بموجب <strong>باقة مخصصة (Enterprise Plus)</strong>. أي تعديل في الحقول أدناه سيطبق فورياً وبشكل حصري على هذه الشركة فقط.</>
                        : <>This company is currently running under a <strong>Customized Plan (Enterprise Plus)</strong>. Edits below apply instantly and exclusively to this workspace only.</>}
                    </p>
                  </div>

                  <div className={`space-y-1.5 ${isAr ? 'text-right' : 'text-left'}`}>
                    <label className="text-xs text-slate-400 font-semibold">{isAr ? 'اسم الباقة المخصصة' : 'Custom Plan Name'}</label>
                    <input
                      type="text"
                      required
                      value={detailPlanName}
                      onChange={(e) => setDetailPlanName(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={`space-y-1.5 ${isAr ? 'text-right' : 'text-left'}`}>
                      <label className="text-xs text-slate-400 font-semibold">{isAr ? 'السعر الشهري المخصص (ريال)' : 'Custom Monthly Price (SAR)'}</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={detailPlanPriceMonthly}
                        onChange={(e) => setDetailPlanPriceMonthly(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition-all font-mono"
                      />
                    </div>
                    <div className={`space-y-1.5 ${isAr ? 'text-right' : 'text-left'}`}>
                      <label className="text-xs text-slate-400 font-semibold">{isAr ? 'السعر السنوي المخصص (ريال)' : 'Custom Annual Price (SAR)'}</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={detailPlanPriceYearly}
                        onChange={(e) => setDetailPlanPriceYearly(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className={`space-y-1.5 ${isAr ? 'text-right' : 'text-left'}`}>
                      <label className="text-xs text-slate-400 font-semibold flex flex-col">
                        <span>{isAr ? 'الحد الأقصى للمستخدمين' : 'Max Team Users'}</span>
                        <span className="text-[9px] text-slate-500">{isAr ? '(-1 تعني غير محدود)' : '(-1 means unlimited)'}</span>
                      </label>
                      <input
                        type="number"
                        required
                        value={detailPlanMaxUsers}
                        onChange={(e) => setDetailPlanMaxUsers(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition-all font-mono"
                      />
                    </div>
                    <div className={`space-y-1.5 ${isAr ? 'text-right' : 'text-left'}`}>
                      <label className="text-xs text-slate-400 font-semibold flex flex-col">
                        <span>{isAr ? 'رصيد المشاريع سنوياً' : 'Annual Project Credits'}</span>
                        <span className="text-[9px] text-slate-500">{isAr ? '(-1 تعني غير محدود)' : '(-1 means unlimited)'}</span>
                      </label>
                      <input
                        type="number"
                        required
                        value={detailPlanCredits}
                        onChange={(e) => setDetailPlanCredits(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition-all font-mono"
                      />
                    </div>
                    <div className={`space-y-1.5 ${isAr ? 'text-right' : 'text-left'}`}>
                      <label className="text-xs text-slate-400 font-semibold flex flex-col">
                        <span>{isAr ? 'أقصى ميزانية للمشروع الواحد' : 'Max Budget Per Project'}</span>
                        <span className="text-[9px] text-slate-500">{isAr ? '(0 تعني غير محدود)' : '(0 means unlimited)'}</span>
                      </label>
                      <input
                        type="number"
                        required
                        value={detailPlanMaxBudget}
                        onChange={(e) => setDetailPlanMaxBudget(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Custom Features Manager */}
                  <div className="space-y-2 pt-2">
                    <label className="text-xs text-slate-400 font-semibold">{isAr ? 'ميزات الباقة المخصصة' : 'Custom Feature Lists'}</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={detailNewFeatureText}
                        onChange={(e) => setDetailNewFeatureText(e.target.value)}
                        placeholder={isAr ? 'أضف ميزة جديدة مخصصة لهذه الشركة...' : 'Add a custom feature flag...'}
                        className="flex-1 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-650 outline-none transition-all"
                      />
                      <Button
                        type="button"
                        onClick={addDetailFeature}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-1.5 max-h-36 overflow-y-auto border border-slate-800/80 rounded-xl p-3 bg-slate-950/40">
                      {detailPlanFeatures.length === 0 ? (
                        <p className="text-xs text-slate-500 italic text-center py-1">{isAr ? 'لا توجد ميزات مخصصة حالياً.' : 'No custom features added yet.'}</p>
                      ) : (
                        detailPlanFeatures.map((feature, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-slate-900 border border-slate-800/60 rounded-lg px-3 py-1.5 text-xs">
                            <span className="text-slate-200">{feature}</span>
                            <button
                              type="button"
                              onClick={() => removeDetailFeature(idx)}
                              className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      disabled={isSavingDetailPlan}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-2.5 text-xs font-semibold cursor-pointer"
                    >
                      {isSavingDetailPlan 
                        ? (isAr ? 'جاري حفظ التخصيص...' : 'Saving parameters...') 
                        : (isAr ? 'حفظ خصائص الباقة المخصصة' : 'Save Custom Plan')}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="py-6 flex flex-col items-center text-center space-y-4 max-w-xl mx-auto">
                  <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl flex items-center justify-center">
                    <SlidersHorizontal className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-white text-base">{isAr ? 'تحويل مساحة العمل لباقة مخصصة (Enterprise Plus)' : 'Convert Workspace to Custom Plan (Enterprise Plus)'}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {isAr 
                        ? 'الشركة حالياً تعمل بباقة قياسية مشتركة. يمكنك فصلها وإنشاء باقة مخصصة بالكامل لها بأسعار وحدود وعدد مستخدمين مخصص يتم التحكم فيه بشكل منفصل.'
                        : 'This workspace is currently running on a standard subscription plan. You can isolate it and provision custom user boundaries and parameters exclusively.'}
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowConfirmCustomize(true)}
                    disabled={isCustomizingPlan}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-2 text-xs font-semibold cursor-pointer gap-2"
                  >
                    {isCustomizingPlan ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <SlidersHorizontal className="w-4 h-4" />
                        {isAr ? 'تخصيص الباقة (Enterprise Plus)' : 'Customize Subscription Plan'}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscription History Section */}
          <Card className="border-slate-800 bg-slate-900/40 text-white overflow-hidden">
            <CardHeader className={`border-b border-slate-800/60 ${isAr ? 'text-right' : 'text-left'}`}>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className={`w-4 h-4 text-indigo-400 ${isAr ? 'ml-1' : 'mr-1'}`} />
                {isAr ? 'سجل اشتراكات الشركة' : 'Company Subscriptions Ledger'}
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">{isAr ? 'كافة الاشتراكات التاريخية والنشطة وحالتها في النظام' : 'Audit logs of active and past plan subscriptions'}</CardDescription>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className={`w-full ${isAr ? 'text-right' : 'text-left'} border-collapse`}>
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-xs font-semibold font-sans">
                    <th className="px-6 py-3">{isAr ? 'الباقة' : 'Plan Name'}</th>
                    <th className="px-6 py-3 text-center">{isAr ? 'دورة الدفع' : 'Billing Cycle'}</th>
                    <th className="px-6 py-3">{isAr ? 'تاريخ البدء' : 'Start Date'}</th>
                    <th className="px-6 py-3">{isAr ? 'تاريخ الانتهاء' : 'End Date'}</th>
                    <th className="px-6 py-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs">
                  {!tenantDetails.tenant.subscriptions || tenantDetails.tenant.subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500 italic">
                        {isAr ? 'لا يوجد سجل اشتراكات لهذه الشركة.' : 'No plan records found.'}
                      </td>
                    </tr>
                  ) : (
                    tenantDetails.tenant.subscriptions.map((sub: any) => (
                      <tr key={sub.id} className="hover:bg-slate-800/10 transition-colors">
                        <td className="px-6 py-3 font-semibold text-white">
                          {sub.plan ? (
                            isAr 
                              ? (sub.plan.slug === 'basic' ? 'الأساسية' :
                                 sub.plan.slug === 'professional' ? 'الاحترافية' :
                                 sub.plan.slug === 'business' ? 'الأعمال' :
                                 sub.plan.slug === 'enterprise' ? 'المؤسسات' :
                                 sub.plan.name)
                              : sub.plan.name
                          ) : (
                            isAr ? 'باقة محذوفة' : 'Deleted plan'
                          )}
                          {sub.plan?.is_custom && (
                            <span className={`${isAr ? 'mr-1.5' : 'ml-1.5'} bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] px-1.5 py-0.2 rounded font-semibold`}>
                              {isAr ? 'مخصصة' : 'Custom'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-center">
                          {sub.billing_cycle === 'monthly' ? (isAr ? 'شهري' : 'Monthly') : (isAr ? 'سنوي' : 'Annual')}
                        </td>
                        <td className="px-6 py-3 font-mono text-slate-400">
                          {sub.starts_at ? formatTime(sub.starts_at) : '—'}
                        </td>
                        <td className="px-6 py-3 font-mono text-slate-400">
                          {sub.ends_at ? formatTime(sub.ends_at) : '—'}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            sub.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : sub.status === 'cancelled'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {sub.status === 'active' && (isAr ? 'نشط' : 'Active')}
                            {sub.status === 'trialing' && (isAr ? 'تجريبي' : 'Trialing')}
                            {sub.status === 'expired' && (isAr ? 'منتهي' : 'Expired')}
                            {sub.status === 'cancelled' && (isAr ? 'ملغي' : 'Cancelled')}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Company Logs Table */}
          <Card className="border-slate-800 bg-slate-900/40 text-white overflow-hidden">
            <CardHeader className={`border-b border-slate-800/60 ${isAr ? 'text-right' : 'text-left'}`}>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className={`w-4 h-4 text-indigo-400 ${isAr ? 'ml-1' : 'mr-1'}`} />
                {isAr ? 'سجل العمليات للشركة (Activity Log)' : 'Workspace Activity Log'}
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">{isAr ? 'تتبع حركات ومسارات مستخدمي هذه الشركة فقط' : 'Track and audit actions performed by users inside this workspace only'}</CardDescription>
            </CardHeader>
            <div className="overflow-x-auto min-h-[200px]">
              <table className={`w-full ${isAr ? 'text-right' : 'text-left'} border-collapse`}>
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-xs font-semibold">
                    <th className="px-6 py-3">{isAr ? 'التاريخ والوقت' : 'Timestamp'}</th>
                    <th className="px-6 py-3">{isAr ? 'المستخدم' : 'Executing User'}</th>
                    <th className="px-6 py-3">{isAr ? 'الميثود' : 'Method'}</th>
                    <th className="px-6 py-3">{isAr ? 'المسار' : 'Endpoint URL'}</th>
                    <th className="px-6 py-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                    <th className="px-6 py-3 text-center">{isAr ? 'الإجراء' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs">
                  {tenantLogsLoading ? (
                    Array.from({ length: 3 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="px-6 py-3"><div className="h-4 bg-slate-800 rounded w-28" /></td>
                        <td className="px-6 py-3"><div className="h-4 bg-slate-800 rounded w-24" /></td>
                        <td className="px-6 py-3"><div className="h-4 bg-slate-800 rounded w-10" /></td>
                        <td className="px-6 py-3"><div className="h-4 bg-slate-800 rounded w-32" /></td>
                        <td className="px-6 py-3"><div className="h-4 bg-slate-800 rounded w-8 mx-auto" /></td>
                        <td className="px-6 py-3"><div className="h-8 bg-slate-800 rounded w-16 mx-auto" /></td>
                      </tr>
                    ))
                  ) : !tenantLogsData || tenantLogsData.data.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500 italic font-medium">
                        {isAr ? 'لا توجد عمليات مسجلة لهذه الشركة.' : 'No activity logs found.'}
                      </td>
                    </tr>
                  ) : (
                    tenantLogsData.data.map((log: SystemLogItem) => (
                      <tr key={log.id} className="hover:bg-slate-800/10 transition-colors">
                        <td className="px-6 py-3 font-mono text-slate-400">{formatTime(log.created_at)}</td>
                        <td className="px-6 py-3">
                          {log.user ? (
                            <div className={isAr ? 'text-right' : 'text-left'}>
                              <span className="font-semibold text-white block">{log.user.profile?.first_name} {log.user.profile?.last_name}</span>
                              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{log.user.email}</span>
                            </div>
                          ) : (
                            <span className="text-slate-550 italic">{isAr ? 'زائر' : 'Guest'}</span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getMethodBadgeClass(log.method)}`}>
                            {log.method}
                          </span>
                        </td>
                        <td className="px-6 py-3 font-mono text-indigo-300 max-w-[150px] truncate" title={log.endpoint}>
                          {log.endpoint}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getStatusBadgeClass(log.status_code)}`}>
                            {log.status_code}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <Button
                            onClick={() => setSelectedLog(log)}
                            variant="ghost"
                            className="hover:bg-indigo-600/20 hover:text-indigo-300 text-indigo-400 text-[10px] px-2 py-1 h-7 rounded-lg transition-all cursor-pointer border border-transparent hover:border-indigo-500/20"
                          >
                            <Eye className={`w-3.5 h-3.5 ${isAr ? 'ml-1' : 'mr-1'}`} />
                            {isAr ? 'عرض التفاصيل' : 'View Details'}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Tenant Logs Pagination */}
            {tenantLogsData && tenantLogsData.last_page > 1 && (
              <div className="border-t border-slate-800 bg-slate-900/30 px-6 py-3 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {isAr 
                    ? `صفحة ${tenantLogPage} من ${tenantLogsData.last_page} (إجمالي ${tenantLogsData.total} سجل)`
                    : `Page ${tenantLogPage} of ${tenantLogsData.last_page} (Total ${tenantLogsData.total} logs)`}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    onClick={() => setTenantLogPage((prev) => Math.max(prev - 1, 1))}
                    disabled={tenantLogPage === 1}
                    variant="outline"
                    className="border-slate-800 hover:bg-slate-800 text-slate-300 p-1.5 h-7 w-7 rounded-lg transition-all disabled:opacity-30 cursor-pointer"
                  >
                    {isAr ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                  </Button>
                  <Button
                    onClick={() => setTenantLogPage((prev) => Math.min(prev + 1, tenantLogsData.last_page))}
                    disabled={tenantLogPage === tenantLogsData.last_page}
                    variant="outline"
                    className="border-slate-800 hover:bg-slate-800 text-slate-300 p-1.5 h-7 w-7 rounded-lg transition-all disabled:opacity-30 cursor-pointer"
                  >
                    {isAr ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      {/* --- LOG DETAILS MODAL --- */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm transition-all animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl shadow-indigo-500/5 max-h-[85vh] flex flex-col overflow-hidden transform scale-100 transition-all">
            
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getMethodBadgeClass(selectedLog.method)}`}>
                  {selectedLog.method}
                </span>
                <div className={isAr ? 'text-right' : 'text-left'}>
                  <h3 className="text-sm font-bold text-white font-mono">{selectedLog.endpoint}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{formatTime(selectedLog.created_at)}</p>
                </div>
              </div>
              <Button
                onClick={() => setSelectedLog(null)}
                variant="ghost"
                className="hover:bg-slate-800 text-slate-400 hover:text-white p-2 rounded-xl h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className={`p-6 overflow-y-auto space-y-6 flex-1 ${isAr ? 'text-right' : 'text-left'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-slate-950/40 border border-slate-800/60 p-4 rounded-2xl">
                  <span className="text-xs text-slate-500 block mb-1">{isAr ? 'الشركة' : 'Company / Scope'}</span>
                  <span className="font-bold text-white block text-sm">
                    {selectedLog.tenant ? selectedLog.tenant.name : (isAr ? 'مسؤول النظام' : 'System Administrator')}
                  </span>
                </div>
                <div className="bg-slate-950/40 border border-slate-800/60 p-4 rounded-2xl">
                  <span className="text-xs text-slate-500 block mb-1">{isAr ? 'المستخدم المنفذ' : 'Executed User'}</span>
                  <span className="font-semibold text-white block text-sm">
                    {selectedLog.user ? `${selectedLog.user.profile?.first_name} ${selectedLog.user.profile?.last_name}` : (isAr ? 'زائر غير مسجل' : 'Anonymous Guest')}
                  </span>
                  <span className="text-xs text-slate-400 block font-mono mt-0.5">{selectedLog.user?.email || '—'}</span>
                </div>
                <div className="bg-slate-950/40 border border-slate-800/60 p-4 rounded-2xl">
                  <span className="text-xs text-slate-500 block mb-1">{isAr ? 'حالة الطلب' : 'Response Status'}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-bold border mt-1 ${getStatusBadgeClass(selectedLog.status_code)}`}>
                    {selectedLog.status_code}
                  </span>
                </div>
                <div className="bg-slate-950/40 border border-slate-800/60 p-4 rounded-2xl">
                  <span className="text-xs text-slate-500 block mb-1">{isAr ? 'بيانات الاتصال' : 'Connection IP'}</span>
                  <span className="text-sm font-semibold text-white block font-mono">{selectedLog.ip_address || '—'}</span>
                  <span className="text-xs text-slate-400 block truncate mt-0.5" title={selectedLog.user_agent || ''}>
                    {selectedLog.user_agent || '—'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold">{isAr ? 'بيانات الطلب المرسلة (Request Payload)' : 'Request Payload Data'}</span>
                  {selectedLog.payload && Object.keys(selectedLog.payload).length > 0 && (
                    <Button
                      onClick={() => handleCopy(selectedLog.payload, 'payload')}
                      variant="ghost"
                      className="text-indigo-400 hover:text-indigo-300 hover:bg-slate-800/50 h-7 text-xs px-2.5 rounded-lg cursor-pointer"
                    >
                      {copiedPayload ? <ClipboardCheck className="w-3.5 h-3.5" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
                      <span className={`${isAr ? 'mr-1' : 'ml-1'}`}>{copiedPayload ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ JSON' : 'Copy JSON')}</span>
                    </Button>
                  )}
                </div>
                <pre className="bg-slate-950 p-4 rounded-2xl overflow-auto text-xs font-mono text-left max-h-56 border border-slate-800/70" dir="ltr">
                  {selectedLog.payload && Object.keys(selectedLog.payload).length > 0
                    ? JSON.stringify(selectedLog.payload, null, 2)
                    : (isAr ? '// لا توجد بيانات مرسلة' : '// Empty Payload')}
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold">{isAr ? 'استجابة الخادم المستلمة (Response)' : 'Server Response (JSON)'}</span>
                  {selectedLog.response && (
                    <Button
                      onClick={() => handleCopy(selectedLog.response, 'response')}
                      variant="ghost"
                      className="text-indigo-400 hover:text-indigo-300 hover:bg-slate-800/50 h-7 text-xs px-2.5 rounded-lg cursor-pointer"
                    >
                      {copiedResponse ? <ClipboardCheck className="w-3.5 h-3.5" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
                      <span className={`${isAr ? 'mr-1' : 'ml-1'}`}>{copiedResponse ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ JSON' : 'Copy JSON')}</span>
                    </Button>
                  )}
                </div>
                <pre className="bg-slate-950 p-4 rounded-2xl overflow-auto text-xs font-mono text-left max-h-60 border border-slate-800/70" dir="ltr">
                  {selectedLog.response
                    ? JSON.stringify(selectedLog.response, null, 2)
                    : (isAr ? '// لا توجد استجابة' : '// No Response')}
                </pre>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/40 flex justify-end">
              <Button
                onClick={() => setSelectedLog(null)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 transition-all text-xs cursor-pointer"
              >
                {isAr ? 'إغلاق النافذة' : 'Close'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRM CUSTOMIZE PLAN MODAL --- */}
      {showConfirmCustomize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm transition-all animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 text-right">
            <h3 className="text-base font-bold text-white mb-2">{isAr ? 'تأكيد تخصيص الباقة' : 'Confirm Plan Customization'}</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              {isAr 
                ? 'هل أنت متأكد من رغبتك في فصل هذه الشركة عن الباقة القياسية وإنشاء باقة مخصصة (Enterprise Plus) لها؟'
                : 'Are you sure you want to isolate this company from standard plans and configure a dedicated (Enterprise Plus) plan for it?'}
            </p>
            <div className="flex justify-end gap-2 font-sans">
              <Button
                type="button"
                onClick={() => setShowConfirmCustomize(false)}
                variant="ghost"
                className="hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl px-4 text-xs cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowConfirmCustomize(false);
                  handleCustomizePlan();
                }}
                disabled={isCustomizingPlan}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 text-xs font-semibold cursor-pointer"
              >
                {isCustomizingPlan ? (isAr ? 'جاري التحويل...' : 'Converting...') : (isAr ? 'نعم، قم بالتخصيص' : 'Yes, Customize Plan')}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
