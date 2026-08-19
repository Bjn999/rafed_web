'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Plus,
  Edit2,
  Trash2,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  User as UserIcon,
  Calendar,
  FolderTree,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  ChevronUp,
} from 'lucide-react';
import { TreeWbsItem } from './WbsTreeTable';

interface WbsCardsTreeProps {
  treeData: TreeWbsItem[];
  onAddSubItem: (parent: TreeWbsItem) => void;
  onEditItem: (item: TreeWbsItem) => void;
  onRefresh: () => void;
}

export default function WbsCardsTree({
  treeData,
  onAddSubItem,
  onEditItem,
  onRefresh,
}: WbsCardsTreeProps) {
  const { isAr } = useLanguage();
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({});
  const [movingId, setMovingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleMove = async (id: number, direction: 'indent' | 'outdent' | 'up' | 'down') => {
    setMovingId(id);
    try {
      await api.post(`/wbs/${id}/move`, { direction });
      onRefresh();
    } catch (err) {
      console.error('Failed to move item:', err);
    } finally {
      setMovingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !window.confirm(
        isAr
          ? 'هل أنت تأكد من حذف هذا النشاط وكافة الأنشطة الفرعية التابعة له؟'
          : 'Are you sure you want to delete this activity and all its sub-activities?'
      )
    ) {
      return;
    }
    setDeletingId(id);
    try {
      await api.delete(`/wbs/${id}`);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete item:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          label: isAr ? 'مكتمل' : 'Completed',
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/20',
          indicator: 'bg-emerald-500',
        };
      case 'in_progress':
        return {
          label: isAr ? 'قيد التنفيذ' : 'In Progress',
          color: 'text-indigo-400',
          bg: 'bg-indigo-500/10',
          border: 'border-indigo-500/20',
          indicator: 'bg-indigo-500',
        };
      case 'on_hold':
        return {
          label: isAr ? 'متوقف' : 'On Hold',
          color: 'text-amber-400',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/20',
          indicator: 'bg-amber-500',
        };
      case 'delayed':
        return {
          label: isAr ? 'متأخر' : 'Delayed',
          color: 'text-rose-400',
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/20',
          indicator: 'bg-rose-500',
        };
      default:
        return {
          label: isAr ? 'لم يبدأ' : 'Not Started',
          color: 'text-slate-400',
          bg: 'bg-slate-500/10',
          border: 'border-slate-500/20',
          indicator: 'bg-slate-600',
        };
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] font-bold">{isAr ? 'عاجل' : 'Urgent'}</span>;
      case 'high':
        return <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold">{isAr ? 'عالية' : 'High'}</span>;
      case 'medium':
        return <span className="text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded text-[10px] font-bold">{isAr ? 'متوسطة' : 'Medium'}</span>;
      default:
        return <span className="text-slate-400 bg-slate-500/10 border border-slate-500/20 px-2 py-0.5 rounded text-[10px]">{isAr ? 'منخفضة' : 'Low'}</span>;
    }
  };

  const formatMoney = (val?: number | null) => {
    if (!val) return null;
    return isAr ? `${val.toLocaleString('ar-SA')} ر.س` : `SAR ${val.toLocaleString('en-US')}`;
  };

  const renderCardNode = (node: TreeWbsItem, level: number = 0): React.ReactNode => {
    const hasChildren = node.children_recursive && node.children_recursive.length > 0;
    const isExpanded = expandedNodes[node.id!] ?? true;
    const statusCfg = getStatusConfig(node.status);

    const userName = node.assigned_user?.profile
      ? `${node.assigned_user.profile.first_name || ''} ${node.assigned_user.profile.last_name || ''}`.trim()
      : node.assigned_user?.email || null;

    const isRoot = level === 0;

    return (
      <div key={node.id} className="relative group animate-in fade-in duration-200">
        
        {/* Card Main Container */}
        <div
          className={`rounded-2xl transition-all duration-200 border ${
            isRoot
              ? 'bg-gradient-to-r from-slate-900/90 to-slate-950/80 border-slate-800 shadow-lg shadow-black/20 hover:border-slate-700'
              : 'bg-slate-900/60 border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900/90'
          }`}
        >
          {/* Card Header Content */}
          <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Left/Right Title Section with Expand Toggle */}
            <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
              
              {/* Expand / Collapse Button */}
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(node.id!)}
                  className="w-7 h-7 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-indigo-600 hover:border-indigo-500 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer shrink-0 transition-all shadow-sm"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ) : (
                <div className="w-7 h-7 shrink-0 flex items-center justify-center">
                  <div className={`w-2.5 h-2.5 rounded-full ${statusCfg.indicator}`} />
                </div>
              )}

              {/* Code Badge */}
              <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg shrink-0">
                {node.code || `#${node.id}`}
              </span>

              {/* Name & Description */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className={`font-bold text-white tracking-tight ${isRoot ? 'text-base sm:text-lg' : 'text-sm'}`}>
                    {node.name}
                  </h4>
                  <span className={`${statusCfg.color} ${statusCfg.bg} ${statusCfg.border} border text-[10px] font-bold px-2.5 py-0.5 rounded-full`}>
                    {statusCfg.label}
                  </span>
                  {getPriorityBadge(node.priority)}
                </div>
                {node.description && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                    {node.description}
                  </p>
                )}
              </div>

            </div>

            {/* Metrics & Progress Section */}
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap md:flex-nowrap shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
              
              {/* Progress Bar */}
              <div className="flex flex-col gap-1 min-w-[110px]">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-400">{isAr ? 'الإنجاز' : 'Progress'}</span>
                  <span className="text-indigo-400 font-mono">{node.progress}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-500 ${
                      node.progress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-indigo-400'
                    }`}
                    style={{ width: `${node.progress}%` }}
                  />
                </div>
              </div>

              {/* Financial Metrics */}
              {(node.estimated_cost || node.actual_cost) && (
                <div className="flex flex-col text-left font-mono text-xs">
                  {node.estimated_cost ? (
                    <span className="text-slate-300 text-[11px]">
                      {isAr ? 'مقدار:' : 'Est:'} {formatMoney(node.estimated_cost)}
                    </span>
                  ) : null}
                  {node.actual_cost ? (
                    <span className="text-emerald-400 text-[11px] font-bold">
                      {isAr ? 'فعلي:' : 'Act:'} {formatMoney(node.actual_cost)}
                    </span>
                  ) : null}
                </div>
              )}

              {/* Dates */}
              {(node.start_date || node.end_date) && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-950/60 px-2.5 py-1.5 rounded-xl border border-slate-800">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>
                    {node.start_date ? new Date(node.start_date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US') : ''}
                    {node.end_date ? ` - ${new Date(node.end_date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}` : ''}
                  </span>
                </div>
              )}

              {/* Assigned Person */}
              {userName && (
                <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-xl text-[11px]">
                  <UserIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate max-w-[90px] font-semibold">{userName}</span>
                </div>
              )}

              {/* Actions Quick Toolbar */}
              <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 p-1 rounded-xl">
                
                {/* Add Child */}
                <button
                  onClick={() => onAddSubItem(node)}
                  title={isAr ? 'إضافة نشاط فرعي' : 'Add Sub-activity'}
                  className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>

                {/* Move controls */}
                <button
                  onClick={() => handleMove(node.id!, 'indent')}
                  disabled={movingId === node.id}
                  title={isAr ? 'إزاحة للداخل (جعلها مهمة فرعية)' : 'Indent'}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-30"
                >
                  {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => handleMove(node.id!, 'outdent')}
                  disabled={movingId === node.id || !node.parent_id}
                  title={isAr ? 'إزاحة للخارج (ترقية مستوى)' : 'Outdent'}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-30"
                >
                  {isAr ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => handleMove(node.id!, 'up')}
                  disabled={movingId === node.id}
                  title={isAr ? 'تحريك للأعلى' : 'Move Up'}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-30"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleMove(node.id!, 'down')}
                  disabled={movingId === node.id}
                  title={isAr ? 'تحريك للأسفل' : 'Move Down'}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-30"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>

                {/* Edit */}
                <button
                  onClick={() => onEditItem(node)}
                  title={isAr ? 'تعديل' : 'Edit'}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(node.id!)}
                  disabled={deletingId === node.id}
                  title={isAr ? 'حذف' : 'Delete'}
                  className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer disabled:opacity-30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

              </div>

            </div>

          </div>
        </div>

        {/* Nested Sub-Cards Container with Tree Line Connectors */}
        {hasChildren && isExpanded && (
          <div
            className={`mt-3 space-y-3 relative ${
              isAr ? 'mr-2 sm:mr-6 pr-2 sm:pr-4 border-r-2 border-indigo-500/20' : 'ml-2 sm:ml-6 pl-2 sm:pl-4 border-l-2 border-indigo-500/20'
            }`}
          >
            {node.children_recursive!.map((child) => renderCardNode(child, level + 1))}
          </div>
        )}

      </div>
    );
  };

  return (
    <div className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      {treeData.length > 0 ? (
        treeData.map((node) => renderCardNode(node, 0))
      ) : (
        <div className="p-12 text-center text-slate-500 bg-slate-900/30 border border-slate-800 rounded-2xl flex flex-col items-center gap-3">
          <FolderTree className="w-12 h-12 text-slate-700" />
          <p className="text-xs font-semibold">
            {isAr ? 'لا يوجد أنشطة مضافة لهذا المشروع حتى الآن.' : 'No activities added to this project yet.'}
          </p>
        </div>
      )}
    </div>
  );
}
