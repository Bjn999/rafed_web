'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building2,
  CheckCircle,
  Ban,
  Info
} from 'lucide-react';

interface TenantItem {
  id: string;
  name: string;
  domain: string;
  status: 'active' | 'suspended' | 'pending';
  users_count: number;
}

export default function AdminDashboardPage() {
  const { user: authUser } = useAuth();
  const { t, isAr } = useLanguage();

  // Fetch full tenants for stats calculations
  const { data: tenantsList, isLoading: tenantsLoading } = useQuery({
    queryKey: ['admin-tenants-stats'],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        data: {
          data: TenantItem[];
        };
      }>('/system-admin/tenants', { params: { per_page: '100' } });
      return response.data.data;
    },
    enabled: !!authUser && authUser.role === 'system_admin',
  });

  const totalTenants = tenantsList?.length || 0;
  const activeTenantsCount = tenantsList?.filter(t => t.status === 'active').length || 0;
  const suspendedTenantsCount = tenantsList?.filter(t => t.status === 'suspended').length || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-900/20 to-violet-900/20 border border-indigo-500/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[60px] pointer-events-none" />
        <h1 className={`text-2xl sm:text-3xl font-extrabold text-white ${isAr ? 'text-right' : 'text-left'}`}>
          {isAr ? 'أهلاً بك في منصة الإشراف على رافد 🛡️' : 'Welcome to Rafed Admin Portal 🛡️'}
        </h1>
        <p className={`text-slate-400 text-sm mt-2 max-w-3xl leading-relaxed ${isAr ? 'text-right' : 'text-left'}`}>
          {isAr 
            ? 'تتيح لك بوابة مسؤول النظام إدارة الشركات المشتركة بالكامل، وتحديث حالاتها، ومراقبة العمليات بشكل مباشر، وتعديل أسعار وباقات الاشتراك.'
            : 'The admin portal allows you to manage subscribed companies, update statuses, monitor operations in real-time, and modify plans and subscription rates.'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur text-white hover:border-slate-700 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">{isAr ? 'إجمالي الشركات' : 'Total Companies'}</CardTitle>
            <Building2 className="w-5 h-5 text-indigo-400" />
          </CardHeader>
          <CardContent className={isAr ? 'text-right' : 'text-left'}>
            <div className="text-3xl font-bold text-white font-sans">{tenantsLoading ? '...' : totalTenants}</div>
            <p className="text-xs text-slate-500 mt-1">{isAr ? 'كافة الحسابات المشتركة' : 'All registered tenants'}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur text-white hover:border-slate-700 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">{isAr ? 'الشركات الفعالة' : 'Active Companies'}</CardTitle>
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </CardHeader>
          <CardContent className={isAr ? 'text-right' : 'text-left'}>
            <div className="text-3xl font-bold text-emerald-400 font-sans">{tenantsLoading ? '...' : activeTenantsCount}</div>
            <p className="text-xs text-slate-500 mt-1">{isAr ? 'نشطة ولها ولوج كامل' : 'Active with full access'}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur text-white hover:border-slate-700 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">{isAr ? 'الشركات الموقوفة' : 'Suspended Companies'}</CardTitle>
            <Ban className="w-5 h-5 text-rose-400" />
          </CardHeader>
          <CardContent className={isAr ? 'text-right' : 'text-left'}>
            <div className="text-3xl font-bold text-rose-400 font-sans">{tenantsLoading ? '...' : suspendedTenantsCount}</div>
            <p className="text-xs text-slate-500 mt-1">{isAr ? 'تم تعطيلها إدارياً' : 'Suspended administratively'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Informative alert */}
      <div className={`bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 ${isAr ? 'text-right' : 'text-left'}`}>
        <h3 className="font-bold text-white flex items-center gap-2 mb-3">
          <Info className="w-5 h-5 text-indigo-400" />
          {isAr ? 'التحكم وحماية الحسابات' : 'Control & Accounts Protection'}
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed font-sans">
          {isAr 
            ? 'عند إيقاف أي شركة، سيتم حظر كافة العمليات والمستخدمين التابعين لتلك المساحة فورياً عن طريق البرمجيات الوسيطة للنظام. لمشاهدة تفاصيل الطلبات، يرجى تصفح قسم "سجلات النظام" من القائمة الجانبية.'
            : 'When a company is suspended, all operations and users belonging to that workspace are blocked instantly via middleware. To inspect requests, please browse the "System Logs" section in the sidebar.'}
        </p>
      </div>
    </div>
  );
}
