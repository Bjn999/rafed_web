'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
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
  Layers
} from 'lucide-react';
import DrawingsTab from '@/components/drawings/DrawingsTab';
import WbsTab from '@/components/wbs/WbsTab';

interface ProjectItem {
  id: number;
  name: string;
  project_number?: string | null;
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
  created_at: string;
}

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t, isAr } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'drawings' | 'team' | 'tasks'>('overview');

  const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string; step: number }> = {
    planned: { label: isAr ? 'مخطط له' : 'Planned', color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', step: 1 },
    preparation: { label: isAr ? 'قيد التحضير' : 'Preparation', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', step: 2 },
    active: { label: isAr ? 'نشط' : 'Active', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', step: 3 },
    on_hold: { label: isAr ? 'متوقف مؤقتاً' : 'On Hold', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', step: 4 },
    delayed: { label: isAr ? 'متأخر' : 'Delayed', color: 'text-rose-450', bg: 'bg-rose-500/10', border: 'border-rose-500/20', step: 3 },
    completed: { label: isAr ? 'مكتمل' : 'Completed', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', step: 5 },
    closed: { label: isAr ? 'مغلق' : 'Closed', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', step: 6 },
  };

  const STEPS = [
    { label: isAr ? 'التخطيط' : 'Planning', num: 1 },
    { label: isAr ? 'التحضير' : 'Preparation', num: 2 },
    { label: isAr ? 'التنفيذ' : 'Execution', num: 3 },
    { label: isAr ? 'الاستلام' : 'Handover', num: 5 },
    { label: isAr ? 'الإغلاق' : 'Closure', num: 6 },
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
      <div className="flex flex-col items-center py-16 text-slate-400 gap-4">
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

  const statusConfig = STATUS_MAP[project.status] || STATUS_MAP.planned;

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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Navigation / Breadcrumb */}
      <div className={`flex items-center gap-2 text-xs text-slate-400 font-sans ${isAr ? 'text-right' : 'text-left'}`}>
        <Link href="/dashboard/projects" className="hover:text-white transition-colors">{isAr ? 'المشاريع' : 'Projects'}</Link>
        <span>/</span>
        <span className="text-slate-200 truncate">{project.name}</span>
      </div>

      {/* Project Banner Header */}
      <div className={`bg-gradient-to-r from-indigo-950/40 to-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden backdrop-blur-xl`}>
        <div className={`space-y-2 ${isAr ? 'text-right' : 'text-left'}`}>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-white font-sans">
              {project.name}
            </h1>
            <span className={`${statusConfig.color} ${statusConfig.bg} ${statusConfig.border} border text-[10px] px-2.5 py-0.5 rounded-full font-bold`}>
              {statusConfig.label}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            {isAr ? 'رقم المشروع:' : 'Project Number:'} {project.project_number || `#PRJ-${project.id}`}
          </p>
        </div>
        
        <button
          onClick={() => router.push('/dashboard/projects')}
          className="bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl py-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer self-stretch md:self-auto justify-center"
        >
          <ArrowRight className={`w-4 h-4 ${isAr ? 'ml-1' : 'mr-1 rotate-180'}`} />
          {isAr ? 'العودة إلى المشاريع' : 'Back to Projects'}
        </button>
      </div>

      {/* Tab Selector System */}
      <div className="flex border-b border-slate-800 gap-1.5 pt-2" dir={isAr ? 'rtl' : 'ltr'}>
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-6 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === 'overview'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className={`w-4 h-4 inline-block ${isAr ? 'ml-2' : 'mr-2'} align-text-bottom`} />
          {isAr ? 'نظرة عامة' : 'Overview'}
        </button>
        <button
          onClick={() => setActiveTab('drawings')}
          className={`py-3 px-6 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === 'drawings'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className={`w-4 h-4 inline-block ${isAr ? 'ml-2' : 'mr-2'} align-text-bottom`} />
          {isAr ? 'المخططات والعيوب' : 'Drawings & Punch List'}
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`py-3 px-6 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === 'team'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className={`w-4 h-4 inline-block ${isAr ? 'ml-2' : 'mr-2'} align-text-bottom`} />
          {isAr ? 'فريق العمل' : 'Project Team'}
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`py-3 px-6 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === 'tasks'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckSquare className={`w-4 h-4 inline-block ${isAr ? 'ml-2' : 'mr-2'} align-text-bottom`} />
          {isAr ? 'المهام والمراحل' : 'Tasks & Milestones'}
        </button>
      </div>

      {/* Tab Content Rendering */}
      <div className={`space-y-6 ${isAr ? 'text-right' : 'text-left'}`} dir={isAr ? 'rtl' : 'ltr'}>
        
        {activeTab === 'drawings' && (
          <DrawingsTab projectId={project.id} />
        )}

        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Project Milestones Progress Bar */}
            <Card className="border-slate-800 bg-slate-900/30 text-white">
              <CardContent className="pt-6">
                <p className="text-xs font-bold text-slate-350 mb-6">{isAr ? 'مراحل تشغيل ومسار المشروع الإنشائي' : 'Operational Milestones & Project Progress Path'}</p>
                
                {/* Horizontal Progress */}
                <div className="relative flex justify-between items-center w-full max-w-4xl mx-auto pt-2 pb-6">
                  {/* Line Background */}
                  <div className="absolute left-0 right-0 top-[28px] h-0.5 bg-slate-800 -z-10" />
                  
                  {/* Completed Line Indicator */}
                  <div
                    className="absolute top-[28px] h-0.5 bg-indigo-500 transition-all duration-500 -z-10"
                    style={{
                      width: `${((statusConfig.step - 1) / (STEPS.length - 1)) * 100}%`,
                      [isAr ? 'right' : 'left']: 0
                    }}
                  />

                  {STEPS.map((step) => {
                    const isPassed = statusConfig.step >= step.num;
                    const isCurrent = statusConfig.step === step.num;
                    return (
                      <div key={step.num} className="flex flex-col items-center gap-2.5 relative">
                        <div
                          className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all ${
                            isPassed
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                              : 'bg-slate-950 border-slate-850 text-slate-500'
                          } ${isCurrent ? 'ring-4 ring-indigo-500/20 scale-110' : ''}`}
                        >
                          {isPassed && !isCurrent ? (
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          ) : (
                            step.num
                          )}
                        </div>
                        <span className={`text-xs font-bold ${isPassed ? 'text-slate-200' : 'text-slate-500'}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Financial & Location Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Budget */}
              <Card className="border-slate-800 bg-slate-900/30 text-white font-sans">
                <CardContent className="pt-5 flex items-start gap-4">
                  <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 block font-bold">{isAr ? 'الميزانية المرصودة' : 'Allocated Budget'}</span>
                    <span className="text-base font-bold font-mono text-white block">{formatCurrency(project.budget)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Contract Value */}
              <Card className="border-slate-800 bg-slate-900/30 text-white font-sans">
                <CardContent className="pt-5 flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 block font-bold">{isAr ? 'قيمة العقد الإجمالية' : 'Total Contract Value'}</span>
                    <span className="text-base font-bold font-mono text-emerald-400 block">{formatCurrency(project.contract_value)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Profitability / Remaining */}
              <Card className="border-slate-800 bg-slate-900/30 text-white font-sans">
                <CardContent className="pt-5 flex items-start gap-4">
                  <div className="w-10 h-10 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 block font-bold">{isAr ? 'صافي الميزانية المتبقية' : 'Net Remaining Budget'}</span>
                    <span className="text-base font-bold font-mono text-white block">
                      {project.contract_value ? formatCurrency(getRemainingBudget()) : (isAr ? 'غير حدد' : 'Not specified')}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Location */}
              <Card className="border-slate-800 bg-slate-900/30 text-white font-sans">
                <CardContent className="pt-5 flex items-start gap-4">
                  <div className="w-10 h-10 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 block font-bold">{isAr ? 'موقع المشروع' : 'Project Location'}</span>
                    <span className="text-xs font-semibold text-white block truncate">{project.location || (isAr ? 'غير محدد' : 'Not specified')}</span>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Timelines and Description Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Description */}
              <Card className="border-slate-800 bg-slate-900/40 lg:col-span-2 text-white">
                <CardHeader className="border-b border-slate-800/80 pb-4">
                  <CardTitle className="text-sm font-bold text-slate-200">{isAr ? 'وصف وأهداف المشروع' : 'Project Description & Goals'}</CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  {project.description ? (
                    <p className="text-sm text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                      {project.description}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 italic">{isAr ? 'لا يوجد وصف مضاف لهذا المشروع حالياً.' : 'No description is currently added to this project.'}</p>
                  )}
                </CardContent>
              </Card>

              {/* Right Column: Key Timelines & Stakeholders */}
              <div className="space-y-6">
                
                {/* Timeline */}
                <Card className="border-slate-800 bg-slate-900/40 text-white font-sans">
                  <CardHeader className="border-b border-slate-800/80 pb-3">
                    <CardTitle className="text-xs font-bold text-slate-350">{isAr ? 'الجدول الزمني' : 'Timeline'}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3.5 text-xs text-slate-300">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">{isAr ? 'تاريخ البدء:' : 'Start Date:'}</span>
                      <span className="font-mono font-bold">
                        {project.start_date ? new Date(project.start_date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : (isAr ? 'غير محدد' : 'Not specified')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">{isAr ? 'تاريخ الانتهاء:' : 'Expected End:'}</span>
                      <span className="font-mono font-bold">
                        {project.end_date ? new Date(project.end_date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : (isAr ? 'غير محدد' : 'Not specified')}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Stakeholders */}
                <Card className="border-slate-800 bg-slate-900/40 text-white">
                  <CardHeader className="border-b border-slate-800/80 pb-3">
                    <CardTitle className="text-xs font-bold text-slate-350">{isAr ? 'أطراف المشروع' : 'Project Parties & Stakeholders'}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4 text-xs text-slate-300">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-500 block">{isAr ? 'المالك / العميل' : 'Owner / Client'}</span>
                        <span className="font-bold text-white truncate block">{project.client_name || (isAr ? 'غير محدد' : 'Not specified')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                        <HardHat className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-500 block">{isAr ? 'المقاول المنفذ' : 'Main Contractor'}</span>
                        <span className="font-bold text-white truncate block">{project.contractor_name || (isAr ? 'غير محدد' : 'Not specified')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center shrink-0 border border-violet-500/20">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-500 block">{isAr ? 'مدير المشروع' : 'Project Manager'}</span>
                        <span className="font-bold text-white truncate block">{project.project_manager || (isAr ? 'غير محدد' : 'Not specified')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

              </div>

            </div>

          </div>
        )}

        {/* Tab 2: Team Work (Placeholder) */}
        {activeTab === 'team' && (
          <Card className="border-slate-800 bg-slate-900/30 text-white text-center py-12">
            <CardContent className="space-y-4 flex flex-col items-center">
              <div className="w-12 h-12 bg-slate-900/80 text-slate-500 border border-slate-800 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold">{isAr ? 'أعضاء وفريق عمل المشروع' : 'Project Team Members'}</h3>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed mx-auto text-center">
                {isAr 
                  ? 'هذه التبويبة ستمكنك قريباً من إسناد الموظفين والمهندسين من قائمة الموظفين وتحديد صلاحياتهم داخل المشروع الحالي.'
                  : 'This tab will allow you to assign engineers and staff from the employee list and control their permissions within this project.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tab 3: Tasks & WBS Activities */}
        {activeTab === 'tasks' && (
          <WbsTab projectId={project.id} />
        )}

      </div>

    </div>
  );
}
