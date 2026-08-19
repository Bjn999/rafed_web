'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar,
  Layers,
  Plus,
  Search,
  Filter,
  RefreshCw,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  LayoutGrid,
  Table as TableIcon,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import WbsTreeTable, { TreeWbsItem } from '@/components/wbs/WbsTreeTable';
import WbsCardsTree from '@/components/wbs/WbsCardsTree';
import WbsGanttView from '@/components/wbs/WbsGanttView';
import WbsItemModal, { WbsItemData } from '@/components/wbs/WbsItemModal';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface ProjectOption {
  id: number;
  name: string;
  code?: string;
  status: string;
  start_date?: string | null;
  end_date?: string | null;
}

interface WbsApiResponse {
  success: boolean;
  data: {
    tree: TreeWbsItem[];
    flat: WbsItemData[];
    summary: {
      total_items: number;
      completed_items: number;
      in_progress_items: number;
      delayed_items: number;
      overall_progress: number;
      total_estimated_cost: number;
      total_actual_cost: number;
    };
  };
}

export default function SchedulePage() {
  const { isAr } = useLanguage();
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get('projectId') ? Number(searchParams.get('projectId')) : null;

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(initialProjectId);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'milestones' | 'in_progress' | 'delayed'>('all');
  const [viewMode, setViewMode] = useState<'gantt' | 'table' | 'cards'>('gantt');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [parentItem, setParentItem] = useState<TreeWbsItem | null>(null);
  const [editingItem, setEditingItem] = useState<TreeWbsItem | null>(null);

  // Fetch Projects List
  const { data: projectsData, isLoading: loadingProjects } = useQuery<{ success: boolean; data: ProjectOption[] }>({
    queryKey: ['projectsList'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: ProjectOption[] }>('/projects');
      return res;
    },
  });

  const projects = Array.isArray(projectsData?.data) ? projectsData.data : [];

  // Auto select first project if none selected
  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Fetch WBS items for selected project
  const { data: wbsData, isLoading: loadingWbs, isError, refetch } = useQuery<WbsApiResponse>({
    queryKey: ['scheduleWbs', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) throw new Error('No project selected');
      const res = await api.get<WbsApiResponse>(`/projects/${selectedProjectId}/wbs`);
      return res;
    },
    enabled: !!selectedProjectId,
  });

  const treeData = Array.isArray(wbsData?.data?.tree) ? wbsData.data.tree : [];
  const flatData = Array.isArray(wbsData?.data?.flat) ? wbsData.data.flat : [];
  const summary = wbsData?.data?.summary || {
    total_items: 0,
    completed_items: 0,
    in_progress_items: 0,
    delayed_items: 0,
    overall_progress: 0,
    total_estimated_cost: 0,
    total_actual_cost: 0,
  };

  // Filter Items
  const filteredFlatItems = flatData.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || (item.code && item.code.includes(searchTerm));
    if (!matchesSearch) return false;

    if (filterType === 'milestones') return item.is_milestone;
    if (filterType === 'in_progress') return item.status === 'in_progress';
    if (filterType === 'delayed') return item.status === 'delayed';

    return true;
  });

  const milestonesCount = flatData.filter((item) => item.is_milestone).length;

  const handleOpenAddModal = (parent: TreeWbsItem | null = null) => {
    setEditingItem(null);
    setParentItem(parent);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: TreeWbsItem | WbsItemData) => {
    setParentItem(null);
    setEditingItem(item as TreeWbsItem);
    setIsModalOpen(true);
  };

  const activeProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/10">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              {isAr ? 'الأنشطة والخطة الزمنية' : 'Activities & Schedule Workspace'}
            </h1>
            <p className="text-xs text-slate-400 max-w-xl">
              {isAr ? 'عرض فسيح بكامل الشاشة لإدارة أنشطة الـ WBS، الاعتماديات والمعالم الرئيسية' : 'Full-screen workspace for WBS activities, dependencies, and milestones'}
            </p>
          </div>
        </div>

        {/* Project Selector & Add Button */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Project Selector Dropdown */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 min-w-[220px]">
            <FolderKanban className="w-4 h-4 text-indigo-400 shrink-0" />
            <select
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-white focus:outline-none w-full cursor-pointer"
            >
              {projects.length === 0 ? (
                <option value="">{isAr ? 'لا توجد مشاريع مجهزة' : 'No projects available'}</option>
              ) : (
                projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    {p.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {selectedProjectId && (
            <Link
              href={`/dashboard/projects/${selectedProjectId}`}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title={isAr ? 'الانتقال لتفاصيل المشروع' : 'Go to project details'}
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">{isAr ? 'تفاصيل المشروع' : 'Project Details'}</span>
            </Link>
          )}

          <button
            onClick={() => handleOpenAddModal(null)}
            disabled={!selectedProjectId}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إضافة بند / معلم' : 'Add Item / Milestone'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        
        {/* Total Activities */}
        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400">{isAr ? 'إجمالي الأنشطة' : 'Total Activities'}</p>
              <p className="text-lg font-bold text-white font-mono">{summary.total_items}</p>
            </div>
          </CardContent>
        </Card>

        {/* Milestones Count */}
        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold">◆</span>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400">{isAr ? 'المعالم الرئيسية' : 'Milestones'}</p>
              <p className="text-lg font-bold text-amber-400 font-mono">{milestonesCount}</p>
            </div>
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400">{isAr ? 'قيد التنفيذ' : 'In Progress'}</p>
              <p className="text-lg font-bold text-blue-400 font-mono">{summary.in_progress_items}</p>
            </div>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400">{isAr ? 'المكتملة' : 'Completed'}</p>
              <p className="text-lg font-bold text-emerald-400 font-mono">{summary.completed_items}</p>
            </div>
          </CardContent>
        </Card>

        {/* Progress Rate */}
        <Card className="bg-slate-900/60 border-slate-800 col-span-2 sm:col-span-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="w-full min-w-0">
              <p className="text-[11px] font-semibold text-slate-400">{isAr ? 'نسبة الإنجاز الكلية' : 'Overall Progress'}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-lg font-bold text-violet-400 font-mono">{summary.overall_progress}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Toolbar & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className={`w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 ${isAr ? 'right-3.5' : 'left-3.5'}`} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isAr ? 'البحث عن نشاط، شفرة أو معلم...' : 'Search activity, code or milestone...'}
            className={`w-full bg-slate-950 border border-slate-800 rounded-xl ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-all`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          
          {/* Quick Type Filter */}
          <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterType === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'الكل' : 'All'}
            </button>
            <button
              onClick={() => setFilterType('milestones')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                filterType === 'milestones' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              <span>◆</span>
              {isAr ? 'المعالم الرئيسية' : 'Milestones'}
            </button>
            <button
              onClick={() => setFilterType('in_progress')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterType === 'in_progress' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'قيد التنفيذ' : 'In Progress'}
            </button>
          </div>

          {/* View Mode Switches */}
          <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('gantt')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'gantt' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
              title={isAr ? 'مخطط جانت الزمني' : 'Gantt View'}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
              title={isAr ? 'جدول الأنشطة الهيكلي' : 'Table View'}
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'cards' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
              title={isAr ? 'عرض الكروت والتأطير' : 'Cards View'}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => refetch()}
            className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
            title={isAr ? 'تحديث' : 'Refresh'}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Schedule Content View */}
      {loadingWbs ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">{isAr ? 'جاري تحميل الجدولة الهندسية...' : 'Loading schedule workspace...'}</p>
        </div>
      ) : isError ? (
        <div className="p-8 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center text-rose-400 text-xs">
          {isAr ? 'حدث خطأ أثناء تحميل بيانات المشروع والجدولة.' : 'Failed to load schedule data.'}
        </div>
      ) : (
        <div className="w-full">
          {viewMode === 'gantt' && (
            <WbsGanttView
              items={filteredFlatItems}
              onEditItem={handleOpenEditModal}
              projectStartDate={activeProject?.start_date}
              projectEndDate={activeProject?.end_date}
            />
          )}

          {viewMode === 'table' && (
            <WbsTreeTable
              treeData={treeData}
              flatData={flatData}
              onAddSubItem={(parent) => handleOpenAddModal(parent)}
              onEditItem={(item) => handleOpenEditModal(item)}
              onRefresh={() => refetch()}
            />
          )}

          {viewMode === 'cards' && (
            <WbsCardsTree
              treeData={treeData}
              onAddSubItem={(parent) => handleOpenAddModal(parent)}
              onEditItem={(item) => handleOpenEditModal(item)}
              onRefresh={() => refetch()}
            />
          )}
        </div>
      )}

      {/* WBS Item Modal */}
      {selectedProjectId && (
        <WbsItemModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          projectId={selectedProjectId}
          parentItem={parentItem}
          editingItem={editingItem}
          flatItems={flatData}
          onSuccess={() => refetch()}
        />
      )}

    </div>
  );
}
