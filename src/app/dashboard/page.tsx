'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  FolderKanban,
  Users2,
  Activity,
  Calendar,
  DollarSign
} from 'lucide-react';

interface UsageStats {
  plan_name: string;
  billing_cycle: string;
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

interface ProjectItem {
  id: number;
  name: string;
  budget: number;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user, profile, tenant, isLoading } = useAuth();
  const { t, isAr } = useLanguage();

  // Fetch subscription usage using React Query (used for quick stats grid)
  const { data: usage, isLoading: usageLoading } = useQuery<UsageStats | null>({
    queryKey: ['subscriptionUsage'],
    queryFn: async () => {
      try {
        const response = await api.get<UsageStats>('/subscription/usage');
        return response;
      } catch (err) {
        console.error('Failed to fetch subscription usage stats', err);
        return null;
      }
    },
    enabled: !!user && user.role !== 'system_admin',
  });

  // Fetch Projects List using React Query
  const { data: projects, isLoading: projectsLoading } = useQuery<ProjectItem[]>({
    queryKey: ['dashboardProjectsList'],
    queryFn: async () => {
      try {
        const response = await api.get<{ success: boolean; data: ProjectItem[] }>('/projects');
        return response.data || [];
      } catch (err) {
        console.error('Failed to fetch projects list', err);
        return [];
      }
    },
    enabled: !!user && user.role !== 'system_admin',
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="font-medium text-sm">{isAr ? 'جاري تحميل بيانات لوحة التحكم...' : 'Loading dashboard data...'}</p>
      </div>
    );
  }

  const formatBudget = (budget: number) => {
    return isAr 
      ? `${Number(budget).toLocaleString('ar-SA')} ريال`
      : `SAR ${Number(budget).toLocaleString('en-US')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-1 rounded-full font-semibold">
            {isAr ? 'نشط' : 'Active'}
          </span>
        );
      case 'completed':
        return (
          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs px-2.5 py-1 rounded-full font-semibold">
            {isAr ? 'مكتمل' : 'Completed'}
          </span>
        );
      case 'on_hold':
        return (
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs px-2.5 py-1 rounded-full font-semibold">
            {isAr ? 'متوقف مؤقتاً' : 'On Hold'}
          </span>
        );
      default:
        return (
          <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 text-xs px-2.5 py-1 rounded-full font-semibold">
            {isAr ? 'قيد التخطيط' : 'Planning'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-900/30 to-violet-900/30 border border-indigo-500/20 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden backdrop-blur-xl">
        <div className="space-y-2">
          <h1 className={`text-2xl sm:text-3xl font-bold text-white ${isAr ? 'text-right' : 'text-left'}`}>
            {isAr ? 'أهلاً بك يا،' : 'Welcome,'} {profile?.first_name} {profile?.last_name} 👋
          </h1>
          <p className={`text-indigo-200/70 text-sm max-w-2xl ${isAr ? 'text-right' : 'text-left'}`}>
            {isAr 
              ? `تم إعداد حسابك بنجاح. أنت الآن مسؤول عن مساحة عمل شركة ${tenant?.name}. يمكنك البدء في تخطيط وجدولة مشاريعك ومتابعة مؤشرات الاستهلاك.`
              : `Your account has been configured successfully. You are in charge of ${tenant?.name || 'the company'}'s workspace. You can start planning and tracking your projects and resource consumption.`}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 self-stretch sm:self-auto w-full sm:w-auto">
          <Link href="/dashboard/projects?new=true">
            <div className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 px-5 text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 transition-all justify-center">
              <FolderKanban className={`w-4 h-4 ${isAr ? 'ml-1' : 'mr-1'}`} />
              {isAr ? 'إنشاء مشروع جديد' : 'Create New Project'}
            </div>
          </Link>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur text-white hover:border-slate-700 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">{isAr ? 'إجمالي المشاريع' : 'Total Projects'}</CardTitle>
            <FolderKanban className="w-4 h-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-sans">
              {usageLoading ? '...' : (usage ? `${usage.credits.used} / ${usage.credits.total}` : '0 / 0')}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {usage 
                ? (isAr ? `الرصيد المتبقي: ${usage.credits.remaining} مشاريع` : `Remaining projects: ${usage.credits.remaining}`) 
                : (isAr ? 'تحميل تفاصيل الباقة...' : 'Loading plan details...')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur text-white hover:border-slate-700 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">{isAr ? 'أعضاء الفريق' : 'Team Members'}</CardTitle>
            <Users2 className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-sans">
              {usageLoading ? '...' : (usage ? `${usage.users.current} / ${usage.users.max}` : '1 / 1')}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {usage 
                ? (isAr ? `المقاعد المتبقية: ${usage.users.remaining} مستخدم` : `Remaining seats: ${usage.users.remaining} users`) 
                : (isAr ? 'تحميل تفاصيل الباقة...' : 'Loading plan details...')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Table List */}
      <Card className="border-slate-800 bg-slate-900/50 backdrop-blur text-white">
        <CardHeader className="border-b border-slate-800 pb-4 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <FolderKanban className={`w-5 h-5 text-indigo-400 ${isAr ? 'ml-1' : 'mr-1'}`} />
              {isAr ? 'مشاريع المؤسسة والشركة' : 'Enterprise & Company Projects'}
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              {isAr ? 'قائمة تفصيلية بالمشاريع المشغلة والحدود الخاصة بميزانياتها وحالاتها الحالية' : 'Detailed list of running projects, their budgets limits, and current statuses'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {projectsLoading ? (
            <div className="flex flex-col items-center py-10 text-slate-450 gap-2">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">{isAr ? 'جاري تحميل قائمة المشاريع...' : 'Loading projects list...'}</p>
            </div>
          ) : !projects || projects.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-slate-400 gap-3">
              <div className="w-12 h-12 bg-slate-800/60 rounded-2xl border border-slate-700/50 flex items-center justify-center text-slate-500">
                <FolderKanban className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold">{isAr ? 'لا توجد مشاريع مضافة لمؤسستكم حالياً' : 'No projects have been added yet'}</p>
              <p className="text-xs text-slate-500">{isAr ? 'انقر على "إنشاء مشروع جديد" بالأعلى للبدء' : 'Click "Create New Project" above to get started'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className={`w-full ${isAr ? 'text-right' : 'text-left'} border-collapse text-sm`}>
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-950/20 text-slate-400 text-xs font-semibold">
                    <th className="px-6 py-4">{isAr ? 'اسم المشروع' : 'Project Name'}</th>
                    <th className="px-6 py-4">{isAr ? 'الميزانية المرصودة' : 'Allocated Budget'}</th>
                    <th className="px-6 py-4">{isAr ? 'تاريخ الإنشاء' : 'Created At'}</th>
                    <th className="px-6 py-4">{isAr ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {projects.map((project) => (
                    <tr key={project.id} className="hover:bg-slate-800/10 transition-colors">
                      <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full shrink-0" />
                        {project.name}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-indigo-400">
                        {formatBudget(project.budget)}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        <span className="flex items-center gap-1.5 font-sans">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {new Date(project.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(project.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
