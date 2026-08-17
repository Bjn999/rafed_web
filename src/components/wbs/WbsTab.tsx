'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import {
  FolderTree,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign,
  PieChart,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  BarChart3,
  Layers,
} from 'lucide-react';
import WbsTreeTable, { TreeWbsItem } from './WbsTreeTable';
import WbsCardsTree from './WbsCardsTree';
import WbsGanttView from './WbsGanttView';
import WbsItemModal, { WbsItemData } from './WbsItemModal';

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

interface WbsTabProps {
  projectId: number;
}

export default function WbsTab({ projectId }: WbsTabProps) {
  const { isAr } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'gantt'>('cards');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [parentItem, setParentItem] = useState<TreeWbsItem | null>(null);
  const [editingItem, setEditingItem] = useState<TreeWbsItem | null>(null);

  const { data, isLoading, isError, refetch } = useQuery<WbsApiResponse>({
    queryKey: ['wbsTree', projectId],
    queryFn: async () => {
      const res = await api.get<WbsApiResponse>(`/projects/${projectId}/wbs`);
      return res;
    },
    enabled: !!projectId,
  });

  const wbsData = data?.data;
  const treeItems = wbsData?.tree || [];
  const flatItems = wbsData?.flat || [];
  const summary = wbsData?.summary || {
    total_items: 0,
    completed_items: 0,
    in_progress_items: 0,
    delayed_items: 0,
    overall_progress: 0,
    total_estimated_cost: 0,
    total_actual_cost: 0,
  };

  const handleOpenCreateRoot = () => {
    setParentItem(null);
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenAddSubItem = (parent: TreeWbsItem) => {
    setParentItem(parent);
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: TreeWbsItem | WbsItemData) => {
    setEditingItem(item as TreeWbsItem);
    setParentItem(null);
    setIsModalOpen(true);
  };

  // Filter tree nodes recursively if search term or status filter is set
  const filterTree = (nodes: TreeWbsItem[]): TreeWbsItem[] => {
    const result: TreeWbsItem[] = [];
    for (const node of nodes) {
      const matchesSearch =
        !searchTerm ||
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (node.code && node.code.includes(searchTerm));

      const matchesStatus = statusFilter === 'all' || node.status === statusFilter;

      const filteredChildren = node.children_recursive ? filterTree(node.children_recursive) : [];
      const hasMatchingChildren = filteredChildren.length > 0;

      if ((matchesSearch && matchesStatus) || hasMatchingChildren) {
        result.push({
          ...node,
          children_recursive: filteredChildren,
        });
      }
    }
    return result;
  };

  const displayTree = (searchTerm || statusFilter !== 'all') ? filterTree(treeItems) : treeItems;

  const formatCurrency = (val: number) => {
    return isAr ? `${val.toLocaleString('ar-SA')} ر.س` : `SAR ${val.toLocaleString('en-US')}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center py-20 text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold">{isAr ? 'جاري تحميل جدول الأنشطة والمهام (WBS)...' : 'Loading Work Breakdown Structure...'}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center py-12 text-slate-400 gap-3">
        <p className="text-sm font-semibold text-rose-400">{isAr ? 'حدث خطأ في استرجاع هيكل تقسيم الأعمال.' : 'Error loading WBS data.'}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          {isAr ? 'إعادة المحاولة' : 'Retry'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Tasks & Overall Progress */}
        <Card className="border-slate-800 bg-slate-900/40 text-white">
          <CardContent className="pt-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <PieChart className="w-5 h-5" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <span className="text-[10px] text-slate-400 block font-bold">{isAr ? 'نسبة الإنجاز الإجمالية' : 'Overall Completion'}</span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold font-mono text-indigo-400">{summary.overall_progress}%</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {summary.completed_items}/{summary.total_items} {isAr ? 'بند' : 'items'}
                </span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800 mt-1">
                <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${summary.overall_progress}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estimated Budget */}
        <Card className="border-slate-800 bg-slate-900/40 text-white">
          <CardContent className="pt-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 block font-bold">{isAr ? 'إجمالي التكلفة المقدرة' : 'Total Estimated Budget'}</span>
              <span className="text-base font-bold font-mono text-white block">{formatCurrency(summary.total_estimated_cost)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Actual Expenses */}
        <Card className="border-slate-800 bg-slate-900/40 text-white">
          <CardContent className="pt-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 block font-bold">{isAr ? 'إجمالي المنصرف الفعلي' : 'Total Actual Cost'}</span>
              <span className="text-base font-bold font-mono text-emerald-400 block">{formatCurrency(summary.total_actual_cost)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Delayed & Active */}
        <Card className="border-slate-800 bg-slate-900/40 text-white">
          <CardContent className="pt-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 block font-bold">{isAr ? 'حالة الأنشطة والتنفيذ' : 'Activities Status'}</span>
              <div className="flex items-center gap-3 pt-1 text-xs">
                <span className="text-indigo-400 font-bold font-mono">{summary.in_progress_items} {isAr ? 'قيد التنفيذ' : 'Active'}</span>
                <span className="text-slate-600">|</span>
                <span className="text-rose-400 font-bold font-mono">{summary.delayed_items} {isAr ? 'متأخر' : 'Delayed'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/50 p-4 border border-slate-800 rounded-2xl">
        
        {/* Left Side: View Switcher + Search & Filter */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          
          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{isAr ? 'البطاقات الهيكلية' : 'Cards View'}</span>
            </button>

            <button
              onClick={() => setViewMode('gantt')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'gantt'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{isAr ? 'مخطط جانت' : 'Gantt Chart'}</span>
            </button>

            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>{isAr ? 'الجدول' : 'Table View'}</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className={`w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 ${isAr ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isAr ? 'البحث بالاسم أو الرمز...' : 'Search by name or code...'}
              className={`w-full bg-slate-950 border border-slate-800 rounded-xl text-xs text-white py-2 focus:outline-none focus:border-indigo-500 transition-colors ${
                isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
              }`}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
            <option value="not_started">{isAr ? 'لم يبدأ' : 'Not Started'}</option>
            <option value="in_progress">{isAr ? 'قيد التنفيذ' : 'In Progress'}</option>
            <option value="completed">{isAr ? 'مكتمل' : 'Completed'}</option>
            <option value="on_hold">{isAr ? 'متوقف' : 'On Hold'}</option>
            <option value="delayed">{isAr ? 'متأخر' : 'Delayed'}</option>
          </select>
        </div>

        {/* Right Side: Add Root Button */}
        <button
          onClick={handleOpenCreateRoot}
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2.5 px-5 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'إضافة بند WBS رئيسي' : 'Add Root WBS Item'}</span>
        </button>

      </div>

      {/* Main View Display */}
      {viewMode === 'cards' && (
        <WbsCardsTree
          treeData={displayTree}
          onAddSubItem={handleOpenAddSubItem}
          onEditItem={handleOpenEdit}
          onRefresh={refetch}
        />
      )}

      {viewMode === 'table' && (
        <WbsTreeTable
          treeData={displayTree}
          flatData={flatItems}
          onAddSubItem={handleOpenAddSubItem}
          onEditItem={handleOpenEdit}
          onRefresh={refetch}
        />
      )}

      {viewMode === 'gantt' && (
        <WbsGanttView
          items={flatItems}
          onEditItem={handleOpenEdit}
        />
      )}

      {/* Modal */}
      <WbsItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={projectId}
        parentItem={parentItem}
        editingItem={editingItem}
        flatItems={flatItems}
        onSuccess={() => refetch()}
      />

    </div>
  );
}
