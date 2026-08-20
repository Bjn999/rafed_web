'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { toast } from '@/components/ui/toast';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  FolderKanban,
  ArrowRight,
  Calendar,
  DollarSign,
  MapPin,
  User as UserIcon,
  HardHat,
  Briefcase,
  FileText,
  Clock,
  CheckCircle2,
  Users,
  CheckSquare,
  Layers,
  BarChart3,
  Mail,
  Phone,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  PauseCircle,
  Lock,
  Sparkles
} from 'lucide-react';
import DrawingsTab from '@/components/drawings/DrawingsTab';

interface ProjectItem {
  id: number;
  name: string;
  project_number: string;
  client_id?: number | null;
  contractor_id?: number | null;
  project_manager_id?: number | null;
  client_name?: string | null;
  contractor_name?: string | null;
  project_manager?: string | null;
  location?: string | null;
  contract_value?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
  budget: number;
  status: string;
  overall_progress?: number;
  created_at: string;
}

interface UserOption {
  id: number;
  email: string;
  role: string;
  profile?: {
    first_name: string;
    last_name: string;
    phone_number?: string;
    job_title?: string;
    specialization?: string;
  } | null;
}

interface WbsItemData {
  id: number;
  assigned_to?: number | null;
  assigned_user_id?: number | null;
  assigned_user?: UserOption | null;
}

interface IssueItemData {
  id: number;
  assigned_to_user_id?: number | null;
  assigned_to?: number | null;
}

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { isAr } = useLanguage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'drawings' | 'team'>('overview');

  // 7 Ordered Statuses with Icons & Gradient Pill Styles
  const STATUSES = [
    { key: 'planned', label: isAr ? 'مخطط له' : 'Planned', step: 1, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30', activeGradient: 'from-sky-600 to-indigo-600', icon: Calendar },
    { key: 'preparation', label: isAr ? 'قيد التحضير' : 'Preparation', step: 2, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30', activeGradient: 'from-violet-600 to-indigo-600', icon: Layers },
    { key: 'active', label: isAr ? 'نشط / قيد التنفيذ' : 'Active', step: 3, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', activeGradient: 'from-emerald-600 to-teal-600', icon: PlayCircle },
    { key: 'on_hold', label: isAr ? 'متوقف مؤقتاً' : 'On Hold', step: 4, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', activeGradient: 'from-amber-600 to-orange-600', icon: PauseCircle },
    { key: 'delayed', label: isAr ? 'متأخر' : 'Delayed', step: 5, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', activeGradient: 'from-rose-600 to-pink-600', icon: AlertTriangle },
    { key: 'completed', label: isAr ? 'مكتمل' : 'Completed', step: 6, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', activeGradient: 'from-indigo-600 to-blue-600', icon: CheckCircle2 },
    { key: 'closed', label: isAr ? 'مغلق' : 'Closed', step: 7, color: 'text-muted-foreground', bg: 'bg-slate-500/10', border: 'border-slate-500/30', activeGradient: 'from-slate-700 to-slate-800', icon: Lock },
  ];

  // Fetch project details
  const { data: project, isLoading, error } = useQuery<ProjectItem>({
    queryKey: ['projectDetails', id],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: ProjectItem }>(`/projects/${id}`);
      return response.data;
    },
    enabled: !!user && !!id,
  });

  // Fetch project WBS items for task counts
  const { data: wbsResponse } = useQuery({
    queryKey: ['projectWbsItems', id],
    queryFn: async () => {
      const res = await api.get<any>(`/projects/${id}/wbs`);
      return res;
    },
    enabled: !!user && !!id && activeTab === 'team',
  });

  const flatWbsItems: WbsItemData[] = Array.isArray(wbsResponse?.data?.flat)
    ? wbsResponse.data.flat
    : Array.isArray(wbsResponse?.data)
    ? wbsResponse.data
    : [];

  // Fetch project Punch List issues for issue counts
  const { data: issuesResponse } = useQuery({
    queryKey: ['projectIssues', id],
    queryFn: async () => {
      const res = await api.get<any>(`/projects/${id}/issues`);
      return res;
    },
    enabled: !!user && !!id && activeTab === 'team',
  });

  const issuesList: IssueItemData[] = Array.isArray(issuesResponse?.data)
    ? issuesResponse.data
    : Array.isArray(issuesResponse?.issues)
    ? issuesResponse.issues
    : [];

  // Fetch company users
  const { data: usersResponse } = useQuery({
    queryKey: ['companyUsersList'],
    queryFn: async () => {
      const res = await api.get<any>('/users');
      return res;
    },
    enabled: !!user && activeTab === 'team',
  });

  const companyUsers: UserOption[] = Array.isArray(usersResponse?.data) ? usersResponse.data : [];

  // Mutation for updating status
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      return api.patch(`/projects/${id}/status`, { status: newStatus });
    },
    onSuccess: (res: any) => {
      toast.add({
        title: isAr ? 'تم تحديث حالة المشروع' : 'Project Status Updated',
        description: res.message || (isAr ? 'تم تغيير حالة المشروع بنجاح.' : 'Status changed successfully.'),
        type: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['projectDetails', id] });
      queryClient.invalidateQueries({ queryKey: ['projectsList'] });
    },
    onError: (err: ApiError) => {
      toast.add({
        title: isAr ? 'فشل التحديث' : 'Update Failed',
        description: err.message || (isAr ? 'حدث خطأ أثناء تحديث حالة المشروع.' : 'An error occurred while updating status.'),
        type: 'error',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center py-20 text-slate-450 gap-2">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">{isAr ? 'جاري تحميل تفاصيل المشروع...' : 'Loading project details...'}</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center py-16 text-muted-foreground gap-4">
        <p className="text-sm font-semibold text-rose-455">
          {isAr ? 'حدث خطأ أثناء تحميل بيانات المشروع أو أن المشروع غير موجود.' : 'An error occurred while loading project details or it does not exist.'}
        </p>
        <button
          onClick={() => router.push('/dashboard/projects')}
          className="bg-indigo-600 text-white rounded-xl py-2 px-5 text-xs font-semibold flex items-center gap-2 cursor-pointer"
        >
          <ArrowRight className={`w-4 h-4 ${isAr ? 'ml-1' : 'mr-1 rotate-180'}`} />
          {isAr ? 'العودة للمشاريع' : 'Back to Projects'}
        </button>
      </div>
    );
  }

  const currentStatusObj = STATUSES.find(s => s.key === project.status) || STATUSES[0];

  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return isAr ? 'غير محدد' : 'Not specified';
    return isAr 
      ? `${Number(val).toLocaleString('ar-SA')} ريال`
      : `SAR ${Number(val).toLocaleString('en-US')}`;
  };

  const getRemainingBudget = () => {
    if (!project.contract_value) return 0;
    return project.contract_value - project.budget;
  };

  const getAssignedTasksCount = (userId: number) => {
    return flatWbsItems.filter(item => item.assigned_to === userId || item.assigned_user_id === userId).length;
  };

  const getAssignedIssuesCount = (userId: number) => {
    return issuesList.filter(issue => issue.assigned_to_user_id === userId || issue.assigned_to === userId).length;
  };

  const getUserName = (u?: UserOption | null, fallbackName?: string | null) => {
    if (u?.profile?.first_name || u?.profile?.last_name) {
      return `${u.profile.first_name || ''} ${u.profile.last_name || ''}`.trim();
    }
    return fallbackName || u?.email || (isAr ? 'غير محدد' : 'Not specified');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Navigation / Breadcrumb */}
      <div className={`flex items-center justify-between text-xs text-muted-foreground font-sans ${isAr ? 'text-right' : 'text-left'}`}>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/projects" className="hover:text-foreground transition-colors">{isAr ? 'المشاريع' : 'Projects'}</Link>
          <span>/</span>
          <span className="text-slate-200 truncate">{project.name}</span>
        </div>

        <Link
          href={`/dashboard/schedule?projectId=${project.id}`}
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl transition-all"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{isAr ? 'عرض خطة الأنشطة والجدول الزمني ↗' : 'View Activities & Timeline ↗'}</span>
        </Link>
      </div>

      {/* Project Banner Header */}
      <div className={`bg-gradient-to-r from-indigo-950/40 to-slate-900/40 border border-border rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden backdrop-blur-xl`}>
        <div className={`space-y-2 ${isAr ? 'text-right' : 'text-left'}`}>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground font-sans">
              {project.name}
            </h1>
            
            {/* Interactive Status Selector Dropdown */}
            <div className="relative inline-flex items-center">
              <select
                value={project.status}
                onChange={(e) => updateStatusMutation.mutate(e.target.value)}
                disabled={updateStatusMutation.isPending}
                className={`${currentStatusObj.color} ${currentStatusObj.bg} ${currentStatusObj.border} border text-[11px] px-3 py-1 rounded-full font-bold appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all pr-6`}
                title={isAr ? 'اضغط لتحديث حالة المشروع بسرعة' : 'Click to quickly update project status'}
              >
                {STATUSES.map((st) => (
                  <option key={st.key} value={st.key} className="bg-card text-foreground font-sans">
                    {st.label}
                  </option>
                ))}
              </select>
              <ChevronDown className={`w-3 h-3 ${currentStatusObj.color} absolute ${isAr ? 'left-2' : 'right-2'} pointer-events-none`} />
            </div>

          </div>
          <p className="text-xs text-muted-foreground font-mono">
            {isAr ? 'رقم المشروع الإجباري:' : 'Mandatory Project Number:'} <span className="font-bold text-slate-200">{project.project_number}</span>
          </p>
        </div>
        
        <button
          onClick={() => router.push('/dashboard/projects')}
          className="bg-slate-850 hover:bg-muted border border-border text-slate-200 rounded-xl py-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer self-stretch md:self-auto justify-center"
        >
          <ArrowRight className={`w-4 h-4 ${isAr ? 'ml-1' : 'mr-1 rotate-180'}`} />
          {isAr ? 'العودة إلى المشاريع' : 'Back to Projects'}
        </button>
      </div>

      {/* Tab Selector System (Removed Tasks Tab as requested) */}
      <div className="flex border-b border-border gap-1 sm:gap-2 pt-2 overflow-x-auto no-scrollbar whitespace-nowrap touch-scroll" dir={isAr ? 'rtl' : 'ltr'}>
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2.5 sm:py-3 px-3.5 sm:px-6 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer shrink-0 ${
            activeTab === 'overview'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-muted-foreground hover:text-slate-200'
          }`}
        >
          <FileText className={`w-4 h-4 inline-block ${isAr ? 'ml-1.5' : 'mr-1.5'} align-text-bottom`} />
          {isAr ? 'نظرة عامة' : 'Overview'}
        </button>
        
        <button
          onClick={() => setActiveTab('drawings')}
          className={`py-2.5 sm:py-3 px-3.5 sm:px-6 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer shrink-0 ${
            activeTab === 'drawings'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-muted-foreground hover:text-slate-200'
          }`}
        >
          <Layers className={`w-4 h-4 inline-block ${isAr ? 'ml-1.5' : 'mr-1.5'} align-text-bottom`} />
          {isAr ? 'المخططات والعيوب' : 'Drawings & Punch List'}
        </button>
        
        <button
          onClick={() => setActiveTab('team')}
          className={`py-2.5 sm:py-3 px-3.5 sm:px-6 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer shrink-0 ${
            activeTab === 'team'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-muted-foreground hover:text-slate-200'
          }`}
        >
          <Users className={`w-4 h-4 inline-block ${isAr ? 'ml-1.5' : 'mr-1.5'} align-text-bottom`} />
          {isAr ? 'فريق العمل' : 'Project Team'}
        </button>
      </div>

      {/* Tab Content Rendering */}
      <div className={`space-y-6 ${isAr ? 'text-right' : 'text-left'}`} dir={isAr ? 'rtl' : 'ltr'}>
        
        {activeTab === 'drawings' && (
          <DrawingsTab projectId={project.id} />
        )}

        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Overall Progress KPI & Milestones Lifecycle Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Overall Progress Percentage Card */}
              <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-950/30 to-slate-900/60 text-foreground relative overflow-hidden">
                <CardContent className="pt-6 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                        <BarChart3 className="w-4 h-4" />
                        {isAr ? 'نسبة الإنجاز الإجمالية' : 'Overall Completion Rate'}
                      </span>
                      <span className="text-2xl font-bold font-mono text-indigo-400">
                        {project.overall_progress ?? 0}%
                      </span>
                    </div>

                    <div className="w-full bg-background border border-border h-3.5 rounded-full overflow-hidden mt-4 relative">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-400 transition-all duration-700 rounded-full shadow-lg shadow-indigo-500/20"
                        style={{ width: `${project.overall_progress ?? 0}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed">
                    {isAr 
                      ? 'تم تحسيب نسبة الإنجاز تلقائياً بناءً على إنجاز البنود والأنشطة الهندسية المسجلة بالخطة الزمنية.'
                      : 'Progress calculated automatically based on completion of engineering activities in the WBS schedule.'}
                  </p>
                </CardContent>
              </Card>

              {/* Connected Chevron Arrow Pipeline (7 Ordered Statuses) */}
              <Card className="border-border bg-card text-foreground lg:col-span-2 shadow-xl">
                <CardContent className="pt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <p className="text-xs font-bold text-slate-200">
                        {isAr ? 'مسار مسار وحالات المشروع الإنشائي الـ 7' : '7 Project Lifecycle Arrow Pipeline'}
                      </p>
                    </div>
                    {updateStatusMutation.isPending ? (
                      <span className="text-xs text-indigo-400 animate-pulse">{isAr ? 'جاري تحديث الحالة...' : 'Updating status...'}</span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">
                        {isAr ? 'اضغط على أي سهم لتغيير حالة المشروع فوراً' : 'Click any arrow step to change status'}
                      </span>
                    )}
                  </div>
                  
                  {/* Connected Chevron Arrow Pipeline */}
                  <div className="overflow-x-auto no-scrollbar py-2">
                    <div className="flex items-center gap-1.5 min-w-[700px] w-full" dir={isAr ? 'rtl' : 'ltr'}>
                      {STATUSES.map((st, idx) => {
                        const isCurrent = currentStatusObj.step === st.step;
                        const isPassed = currentStatusObj.step > st.step;
                        const IconComp = st.icon;

                        return (
                          <React.Fragment key={st.key}>
                            <button
                              type="button"
                              onClick={() => updateStatusMutation.mutate(st.key)}
                              disabled={updateStatusMutation.isPending}
                              className={`group relative flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-bold transition-all duration-300 cursor-pointer border ${
                                isCurrent
                                  ? `bg-gradient-to-r ${st.activeGradient} text-foreground border-white/30 shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-500/50 scale-[1.03] z-10`
                                  : isPassed
                                  ? 'bg-card text-indigo-300 border-indigo-500/20 hover:bg-muted hover:border-indigo-500/40'
                                  : 'bg-background/60 text-muted-foreground border-border hover:bg-card hover:text-slate-200 hover:border-border'
                              }`}
                              title={isAr ? `تغيير حالة المشروع إلى: ${st.label}` : `Set status to: ${st.label}`}
                            >
                              {/* Step circle indicator */}
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                                isCurrent 
                                  ? 'bg-white text-slate-950 shadow-sm' 
                                  : isPassed 
                                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                                  : 'bg-muted text-muted-foreground group-hover:bg-slate-700'
                              }`}>
                                {st.step}
                              </div>

                              <IconComp className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-foreground' : st.color}`} />
                              
                              <span className="truncate whitespace-nowrap text-xs">{st.label}</span>

                              {/* Active Pulsing Indicator Badge */}
                              {isCurrent && (
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                                </span>
                              )}
                            </button>

                            {/* Arrow Connector between steps */}
                            {idx < STATUSES.length - 1 && (
                              <div className="shrink-0 text-slate-700">
                                {isAr ? (
                                  <ChevronLeft className={`w-4 h-4 ${isPassed ? 'text-indigo-400/60' : 'text-slate-700'}`} />
                                ) : (
                                  <ChevronRight className={`w-4 h-4 ${isPassed ? 'text-indigo-400/60' : 'text-slate-700'}`} />
                                )}
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Financial & Location Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Budget */}
              <Card className="border-border bg-card text-foreground font-sans">
                <CardContent className="pt-5 flex items-start gap-4">
                  <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-muted-foreground block font-bold">{isAr ? 'الميزانية المرصودة' : 'Allocated Budget'}</span>
                    <span className="text-base font-bold font-mono text-foreground block">{formatCurrency(project.budget)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Contract Value */}
              <Card className="border-border bg-card text-foreground font-sans">
                <CardContent className="pt-5 flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-muted-foreground block font-bold">{isAr ? 'قيمة العقد الإجمالية' : 'Total Contract Value'}</span>
                    <span className="text-base font-bold font-mono text-emerald-400 block">{formatCurrency(project.contract_value)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Profitability / Remaining */}
              <Card className="border-border bg-card text-foreground font-sans">
                <CardContent className="pt-5 flex items-start gap-4">
                  <div className="w-10 h-10 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-muted-foreground block font-bold">{isAr ? 'صافي الميزانية المتبقية' : 'Net Remaining Budget'}</span>
                    <span className="text-base font-bold font-mono text-foreground block">
                      {project.contract_value ? formatCurrency(getRemainingBudget()) : (isAr ? 'غير محدد' : 'Not specified')}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Location */}
              <Card className="border-border bg-card text-foreground font-sans">
                <CardContent className="pt-5 flex items-start gap-4">
                  <div className="w-10 h-10 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <span className="text-[10px] text-muted-foreground block font-bold">{isAr ? 'موقع المشروع' : 'Project Location'}</span>
                    <span className="text-xs font-semibold text-foreground block truncate">{project.location || (isAr ? 'غير محدد' : 'Not specified')}</span>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Timelines and Description Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Description */}
              <Card className="border-border bg-card lg:col-span-2 text-foreground">
                <CardHeader className="border-b border-border pb-4">
                  <CardTitle className="text-sm font-bold text-slate-200">{isAr ? 'وصف وأهداف المشروع' : 'Project Description & Goals'}</CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  {project.description ? (
                    <p className="text-sm text-foreground leading-relaxed font-sans whitespace-pre-line">
                      {project.description}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">{isAr ? 'لا يوجد وصف مضاف لهذا المشروع حالياً.' : 'No description is currently added to this project.'}</p>
                  )}
                </CardContent>
              </Card>

              {/* Right Column: Key Timelines & Stakeholders */}
              <div className="space-y-6">
                
                {/* Timeline */}
                <Card className="border-border bg-card text-foreground font-sans">
                  <CardHeader className="border-b border-border pb-3">
                    <CardTitle className="text-xs font-bold text-slate-350">{isAr ? 'الجدول الزمني' : 'Timeline'}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3.5 text-xs text-foreground">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">{isAr ? 'تاريخ البدء:' : 'Start Date:'}</span>
                      <span className="font-mono font-bold">
                        {project.start_date ? new Date(project.start_date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : (isAr ? 'غير محدد' : 'Not specified')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">{isAr ? 'تاريخ الانتهاء:' : 'Expected End:'}</span>
                      <span className="font-mono font-bold">
                        {project.end_date ? new Date(project.end_date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : (isAr ? 'غير محدد' : 'Not specified')}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Key Stakeholders */}
                <Card className="border-border bg-card text-foreground">
                  <CardHeader className="border-b border-border pb-3">
                    <CardTitle className="text-xs font-bold text-slate-350">{isAr ? 'أطراف المشروع الرئيسيون' : 'Key Project Parties'}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4 text-xs text-foreground">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-muted-foreground block">{isAr ? 'المالك / العميل' : 'Owner / Client'}</span>
                        <span className="font-bold text-foreground truncate block">{project.client_name || (isAr ? 'غير محدد' : 'Not specified')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                        <HardHat className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-muted-foreground block">{isAr ? 'المقاول المنفذ' : 'Main Contractor'}</span>
                        <span className="font-bold text-foreground truncate block">{project.contractor_name || (isAr ? 'غير محدد' : 'Not specified')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center shrink-0 border border-violet-500/20">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-muted-foreground block">{isAr ? 'مدير المشروع' : 'Project Manager'}</span>
                        <span className="font-bold text-foreground truncate block">{project.project_manager || (isAr ? 'غير محدد' : 'Not specified')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

              </div>

            </div>

          </div>
        )}

        {/* Tab 2: Project Team Tab (Rich Real Team Members & Stakeholders) */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            
            {/* Header Title Banner */}
            <div className="bg-card border border-border p-5 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  {isAr ? 'فريق عمل وأطراف المشروع الإنشائي' : 'Project Team Members & Stakeholders'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {isAr 
                    ? 'قائمة الموظفين والمهندسين وأطراف المشروع المسندين مع إحصائيات المهام والملاحظات المسندة.'
                    : 'List of assigned staff, engineers, and stakeholders with task and issue metrics.'}
                </p>
              </div>

              <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl font-mono">
                {isAr ? `إجمالي الأعضاء: ${companyUsers.length}` : `Total Members: ${companyUsers.length}`}
              </span>
            </div>

            {/* Team Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Primary Stakeholders Cards First */}
              {project.client_id && (
                (() => {
                  const clientMember = companyUsers.find(u => u.id === project.client_id);
                  const tasksCount = getAssignedTasksCount(project.client_id);
                  const issuesCount = getAssignedIssuesCount(project.client_id);
                  return (
                    <Card key={`stakeholder-client-${project.client_id}`} className="border-indigo-500/30 bg-indigo-950/20 text-white relative">
                      <CardContent className="pt-5 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl flex items-center justify-center font-bold text-base">
                              <Briefcase className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-foreground">{getUserName(clientMember, project.client_name)}</h4>
                              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                                {isAr ? 'المالك / العميل' : 'Client / Owner'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border pt-3">
                          {clientMember?.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate">{clientMember.email}</span>
                            </div>
                          )}
                          {clientMember?.profile?.phone_number && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span className="font-mono">{clientMember.profile.phone_number}</span>
                            </div>
                          )}
                        </div>

                        {/* Counts Metrics */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-xs">
                          <div className="bg-background/60 p-2.5 rounded-xl border border-border text-center">
                            <span className="text-[10px] text-muted-foreground block">{isAr ? 'المهام المسندة' : 'Assigned Tasks'}</span>
                            <span className="text-sm font-bold text-indigo-400 font-mono">{tasksCount}</span>
                          </div>
                          <div className="bg-background/60 p-2.5 rounded-xl border border-border text-center">
                            <span className="text-[10px] text-muted-foreground block">{isAr ? 'الملاحظات والعيوب' : 'Assigned Issues'}</span>
                            <span className="text-sm font-bold text-rose-400 font-mono">{issuesCount}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()
              )}

              {project.contractor_id && (
                (() => {
                  const contractorMember = companyUsers.find(u => u.id === project.contractor_id);
                  const tasksCount = getAssignedTasksCount(project.contractor_id);
                  const issuesCount = getAssignedIssuesCount(project.contractor_id);
                  return (
                    <Card key={`stakeholder-contractor-${project.contractor_id}`} className="border-emerald-500/30 bg-emerald-950/20 text-white relative">
                      <CardContent className="pt-5 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl flex items-center justify-center font-bold text-base">
                              <HardHat className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-foreground">{getUserName(contractorMember, project.contractor_name)}</h4>
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                {isAr ? 'المقاول الرئيسي' : 'Main Contractor'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border pt-3">
                          {contractorMember?.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate">{contractorMember.email}</span>
                            </div>
                          )}
                          {contractorMember?.profile?.phone_number && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span className="font-mono">{contractorMember.profile.phone_number}</span>
                            </div>
                          )}
                        </div>

                        {/* Counts Metrics */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-xs">
                          <div className="bg-background/60 p-2.5 rounded-xl border border-border text-center">
                            <span className="text-[10px] text-muted-foreground block">{isAr ? 'المهام المسندة' : 'Assigned Tasks'}</span>
                            <span className="text-sm font-bold text-indigo-400 font-mono">{tasksCount}</span>
                          </div>
                          <div className="bg-background/60 p-2.5 rounded-xl border border-border text-center">
                            <span className="text-[10px] text-muted-foreground block">{isAr ? 'الملاحظات والعيوب' : 'Assigned Issues'}</span>
                            <span className="text-sm font-bold text-rose-400 font-mono">{issuesCount}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()
              )}

              {project.project_manager_id && (
                (() => {
                  const pmMember = companyUsers.find(u => u.id === project.project_manager_id);
                  const tasksCount = getAssignedTasksCount(project.project_manager_id);
                  const issuesCount = getAssignedIssuesCount(project.project_manager_id);
                  return (
                    <Card key={`stakeholder-pm-${project.project_manager_id}`} className="border-violet-500/30 bg-violet-950/20 text-foreground relative">
                      <CardContent className="pt-5 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-violet-600/20 text-violet-400 border border-violet-500/30 rounded-xl flex items-center justify-center font-bold text-base">
                              <UserIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-foreground">{getUserName(pmMember, project.project_manager)}</h4>
                              <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
                                {isAr ? 'مدير المشروع' : 'Project Manager'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border pt-3">
                          {pmMember?.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate">{pmMember.email}</span>
                            </div>
                          )}
                          {pmMember?.profile?.phone_number && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span className="font-mono">{pmMember.profile.phone_number}</span>
                            </div>
                          )}
                        </div>

                        {/* Counts Metrics */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-xs">
                          <div className="bg-background/60 p-2.5 rounded-xl border border-border text-center">
                            <span className="text-[10px] text-muted-foreground block">{isAr ? 'المهام المسندة' : 'Assigned Tasks'}</span>
                            <span className="text-sm font-bold text-indigo-400 font-mono">{tasksCount}</span>
                          </div>
                          <div className="bg-background/60 p-2.5 rounded-xl border border-border text-center">
                            <span className="text-[10px] text-muted-foreground block">{isAr ? 'الملاحظات والعيوب' : 'Assigned Issues'}</span>
                            <span className="text-sm font-bold text-rose-400 font-mono">{issuesCount}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()
              )}

              {/* All Other Company Employees */}
              {companyUsers
                .filter(u => u.id !== project.client_id && u.id !== project.contractor_id && u.id !== project.project_manager_id)
                .map((member) => {
                  const tasksCount = getAssignedTasksCount(member.id);
                  const issuesCount = getAssignedIssuesCount(member.id);
                  return (
                    <Card key={`team-user-${member.id}`} className="border-border bg-card text-foreground">
                      <CardContent className="pt-5 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted text-foreground rounded-xl flex items-center justify-center font-bold text-sm">
                              {member.profile?.first_name?.charAt(0) || <UserIcon className="w-4 h-4" />}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-foreground">{getUserName(member)}</h4>
                              <span className="text-[10px] text-muted-foreground font-medium">
                                {member.profile?.job_title || member.role}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border pt-3">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{member.email}</span>
                          </div>
                          {member.profile?.phone_number && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span className="font-mono">{member.profile.phone_number}</span>
                            </div>
                          )}
                        </div>

                        {/* Counts Metrics */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-xs">
                          <div className="bg-background/60 p-2.5 rounded-xl border border-border text-center">
                            <span className="text-[10px] text-muted-foreground block">{isAr ? 'المهام المسندة' : 'Assigned Tasks'}</span>
                            <span className="text-sm font-bold text-indigo-400 font-mono">{tasksCount}</span>
                          </div>
                          <div className="bg-background/60 p-2.5 rounded-xl border border-border text-center">
                            <span className="text-[10px] text-muted-foreground block">{isAr ? 'الملاحظات والعيوب' : 'Assigned Issues'}</span>
                            <span className="text-sm font-bold text-rose-400 font-mono">{issuesCount}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
