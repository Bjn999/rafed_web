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
  AlertCircle,
  FolderTree,
} from 'lucide-react';
import { WbsItemData } from './WbsItemModal';

export interface TreeWbsItem extends WbsItemData {
  children_recursive?: TreeWbsItem[];
  assigned_user?: {
    id: number;
    email: string;
    profile?: {
      first_name?: string;
      last_name?: string;
    };
  };
}

interface WbsTreeTableProps {
  treeData: TreeWbsItem[];
  flatData: WbsItemData[];
  onAddSubItem: (parent: TreeWbsItem) => void;
  onEditItem: (item: TreeWbsItem) => void;
  onRefresh: () => void;
}

export default function WbsTreeTable({
  treeData,
  flatData,
  onAddSubItem,
  onEditItem,
  onRefresh,
}: WbsTreeTableProps) {
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
    if (!window.confirm(isAr ? 'هل أنت تأكد من حذف هذا النشاط وكافة الأنشطة الفرعية التابعة له؟' : 'Are you sure you want to delete this activity and all its sub-activities?')) {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {isAr ? 'مكتمل' : 'Completed'}
          </span>
        );
      case 'in_progress':
        return (
          <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {isAr ? 'قيد التنفيذ' : 'In Progress'}
          </span>
        );
      case 'on_hold':
        return (
          <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {isAr ? 'متوقف' : 'On Hold'}
          </span>
        );
      case 'delayed':
        return (
          <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {isAr ? 'متأخر' : 'Delayed'}
          </span>
        );
      default:
        return (
          <span className="bg-slate-500/10 border border-slate-500/20 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {isAr ? 'لم يبدأ' : 'Not Started'}
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <span className="text-rose-400 font-bold text-[10px]">{isAr ? 'عاجل' : 'Urgent'}</span>;
      case 'high':
        return <span className="text-amber-400 font-bold text-[10px]">{isAr ? 'عالية' : 'High'}</span>;
      case 'medium':
        return <span className="text-sky-400 font-bold text-[10px]">{isAr ? 'متوسطة' : 'Medium'}</span>;
      default:
        return <span className="text-slate-400 text-[10px]">{isAr ? 'منخفضة' : 'Low'}</span>;
    }
  };

  const formatMoney = (val?: number | null) => {
    if (!val) return '-';
    return isAr ? `${val.toLocaleString('ar-SA')} ر.س` : `SAR ${val.toLocaleString('en-US')}`;
  };

  const renderTreeRow = (node: TreeWbsItem, level: number = 0): React.ReactNode => {
    const hasChildren = node.children_recursive && node.children_recursive.length > 0;
    const isExpanded = expandedNodes[node.id!] ?? true; // expanded by default

    const userName = node.assigned_user?.profile 
      ? `${node.assigned_user.profile.first_name || ''} ${node.assigned_user.profile.last_name || ''}`.trim()
      : node.assigned_user?.email || null;

    return (
      <React.Fragment key={node.id}>
        <tr className="border-b border-slate-800/60 hover:bg-slate-850/40 transition-colors group">
          
          {/* WBS Code & Name */}
          <td className="py-3 px-4 text-xs">
            <div
              className="flex items-center gap-2"
              style={{ [isAr ? 'paddingRight' : 'paddingLeft']: `${level * 24}px` }}
            >
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(node.id!)}
                  className="w-5 h-5 rounded hover:bg-slate-800 text-slate-400 flex items-center justify-center cursor-pointer shrink-0"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ) : (
                <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                </div>
              )}

              <span className="font-mono text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded text-[11px] shrink-0">
                {node.code || `#${node.id}`}
              </span>

              <span className={`font-semibold text-white truncate max-w-xs ${level === 0 ? 'text-sm' : 'text-xs'}`}>
                {node.name}
              </span>
            </div>
          </td>

          {/* Status */}
          <td className="py-3 px-3 text-center">{getStatusBadge(node.status)}</td>

          {/* Priority */}
          <td className="py-3 px-3 text-center">{getPriorityBadge(node.priority)}</td>

          {/* Progress */}
          <td className="py-3 px-3 min-w-[120px]">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-300">
                <span>{node.progress}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    node.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${node.progress}%` }}
                />
              </div>
            </div>
          </td>

          {/* Costs */}
          <td className="py-3 px-3 font-mono text-[11px] text-slate-300 text-center whitespace-nowrap">
            <div>{formatMoney(node.estimated_cost)}</div>
            {node.actual_cost ? (
              <div className="text-[10px] text-emerald-400 font-bold">{formatMoney(node.actual_cost)}</div>
            ) : null}
          </td>

          {/* Dates */}
          <td className="py-3 px-3 text-[11px] text-slate-400 whitespace-nowrap text-center">
            {node.start_date || node.end_date ? (
              <div className="flex items-center justify-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>{node.start_date ? new Date(node.start_date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US') : ''}</span>
                {node.end_date ? <span>- {new Date(node.end_date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</span> : null}
              </div>
            ) : (
              '-'
            )}
          </td>

          {/* Assigned User */}
          <td className="py-3 px-3 text-[11px] text-slate-300 whitespace-nowrap text-center">
            {userName ? (
              <div className="inline-flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded-md text-[10px]">
                <UserIcon className="w-3 h-3 text-indigo-400" />
                <span className="truncate max-w-[100px]">{userName}</span>
              </div>
            ) : (
              '-'
            )}
          </td>

          {/* Actions */}
          <td className="py-3 px-4 text-left whitespace-nowrap">
            <div className="flex items-center justify-end gap-1 opacity-90 group-hover:opacity-100">
              
              {/* Add Sub-Item */}
              <button
                onClick={() => onAddSubItem(node)}
                title={isAr ? 'إضافة نشاط فرعي' : 'Add Sub-activity'}
                className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              {/* Indent / Outdent / Move controls */}
              <button
                onClick={() => handleMove(node.id!, 'indent')}
                disabled={movingId === node.id}
                title={isAr ? 'إزاحة للداخل (جعله فرعي)' : 'Indent (Make sub-activity)'}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-30"
              >
                {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => handleMove(node.id!, 'outdent')}
                disabled={movingId === node.id || !node.parent_id}
                title={isAr ? 'إزاحة للخارج (ترقية كعنصر أعلى)' : 'Outdent (Promote)'}
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
                title={isAr ? 'تعديل البند' : 'Edit Item'}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              {/* Delete */}
              <button
                onClick={() => handleDelete(node.id!)}
                disabled={deletingId === node.id}
                title={isAr ? 'حذف البند' : 'Delete Item'}
                className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer disabled:opacity-30"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

            </div>
          </td>
        </tr>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          node.children_recursive!.map((child) => renderTreeRow(child, level + 1))
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="w-full overflow-x-auto touch-scroll rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl">
      <table className="w-full text-right min-w-[750px]" dir={isAr ? 'rtl' : 'ltr'}>
        <thead>
          <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <th className="py-3 px-4 text-right">{isAr ? 'رمز WBS وبند العمل' : 'WBS Code & Activity'}</th>
            <th className="py-3 px-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
            <th className="py-3 px-3 text-center">{isAr ? 'الأولوية' : 'Priority'}</th>
            <th className="py-3 px-3 text-center min-w-[120px]">{isAr ? 'نسبة الإنجاز' : 'Progress'}</th>
            <th className="py-3 px-3 text-center">{isAr ? 'التكلفة المقدرة/الفعلية' : 'Est. / Act. Cost'}</th>
            <th className="py-3 px-3 text-center">{isAr ? 'الجدول الزمني' : 'Timeline'}</th>
            <th className="py-3 px-3 text-center">{isAr ? 'المسؤول' : 'Assigned'}</th>
            <th className="py-3 px-4 text-left">{isAr ? 'إجراءات' : 'Actions'}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/40">
          {treeData.length > 0 ? (
            treeData.map((node) => renderTreeRow(node, 0))
          ) : (
            <tr>
              <td colSpan={8} className="py-12 text-center text-slate-500">
                <div className="flex flex-col items-center gap-3">
                  <FolderTree className="w-10 h-10 text-slate-700" />
                  <p className="text-xs font-semibold">{isAr ? 'لا يوجد أنشطة مضافة لهذا المشروع حتى الآن.' : 'No activities added to this project yet.'}</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
