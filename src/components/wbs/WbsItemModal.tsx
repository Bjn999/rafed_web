'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { X, Calendar, DollarSign, User, AlertCircle, Plus, Edit2, Layers } from 'lucide-react';

export interface WbsItemData {
  id?: number;
  project_id?: number;
  parent_id?: number | null;
  code?: string;
  name: string;
  description?: string | null;
  status: string;
  priority: string;
  progress: number;
  estimated_cost?: number | null;
  actual_cost?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  assigned_to?: number | null;
  is_milestone?: boolean;
  predecessor_dependencies?: any[];
  successor_dependencies?: any[];
}

interface UserOption {
  id: number;
  email: string;
  profile?: {
    first_name?: string;
    last_name?: string;
  };
}

interface WbsItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  parentItem?: WbsItemData | null;
  editingItem?: WbsItemData | null;
  flatItems: WbsItemData[];
  dependencies?: any[];
  onSuccess: () => void;
}

export default function WbsItemModal({
  isOpen,
  onClose,
  projectId,
  parentItem,
  editingItem,
  flatItems,
  dependencies,
  onSuccess,
}: WbsItemModalProps) {
  const { isAr } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'dependencies'>('details');
  const [depLoading, setDepLoading] = useState(false);
  const [newDep, setNewDep] = useState({ predecessor_id: '', type: 'FS' });

  const [formData, setFormData] = useState<WbsItemData>({
    name: '',
    parent_id: null,
    description: '',
    status: 'not_started',
    priority: 'medium',
    progress: 0,
    estimated_cost: undefined,
    actual_cost: undefined,
    start_date: '',
    end_date: '',
    assigned_to: null,
  });

  // Fetch company users for assignment
  const { data: usersData } = useQuery<{ success: boolean; data: UserOption[] }>({
    queryKey: ['usersList'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: UserOption[] }>('/users');
      return res;
    },
    enabled: isOpen,
  });

  const users = usersData?.data || [];

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name || '',
        parent_id: editingItem.parent_id ?? null,
        description: editingItem.description || '',
        status: editingItem.status || 'not_started',
        priority: editingItem.priority || 'medium',
        progress: editingItem.progress ?? 0,
        estimated_cost: editingItem.estimated_cost ?? undefined,
        actual_cost: editingItem.actual_cost ?? undefined,
        start_date: editingItem.start_date || '',
        end_date: editingItem.end_date || '',
        assigned_to: editingItem.assigned_to ?? null,
        is_milestone: editingItem.is_milestone ?? false,
      });
    } else if (parentItem) {
      setFormData({
        name: '',
        parent_id: parentItem.id ?? null,
        description: '',
        status: 'not_started',
        priority: 'medium',
        progress: 0,
        estimated_cost: undefined,
        actual_cost: undefined,
        start_date: parentItem.start_date || '',
        end_date: parentItem.end_date || '',
        assigned_to: null,
        is_milestone: false,
      });
    } else {
      setFormData({
        name: '',
        parent_id: null,
        description: '',
        status: 'not_started',
        priority: 'medium',
        progress: 0,
        estimated_cost: undefined,
        actual_cost: undefined,
        start_date: '',
        end_date: '',
        assigned_to: null,
        is_milestone: false,
      });
    }
    setErrorMessage('');
    setActiveTab('details');
    setNewDep({ predecessor_id: '', type: 'FS' });
  }, [editingItem, parentItem, isOpen]);

  const handleAddDependency = async () => {
    if (!newDep.predecessor_id || !editingItem?.id) return;
    setDepLoading(true);
    setErrorMessage('');
    try {
      await api.post(`/projects/${projectId}/wbs-dependencies`, {
        predecessor_id: Number(newDep.predecessor_id),
        successor_id: editingItem.id,
        type: newDep.type,
      });
      setNewDep({ predecessor_id: '', type: 'FS' });
      onSuccess(); // refresh dependencies
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || (isAr ? 'حدث خطأ أثناء إضافة الاعتمادية' : 'Error adding dependency'));
    } finally {
      setDepLoading(false);
    }
  };

  const handleDeleteDependency = async (id: number) => {
    if (!window.confirm(isAr ? 'هل أنت متأكد من حذف هذه الاعتمادية؟' : 'Are you sure you want to delete this dependency?')) return;
    setDepLoading(true);
    setErrorMessage('');
    try {
      await api.delete(`/wbs-dependencies/${id}`);
      onSuccess(); // refresh
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || (isAr ? 'حدث خطأ أثناء حذف الاعتمادية' : 'Error deleting dependency'));
    } finally {
      setDepLoading(false);
    }
  };

  const itemDependencies = dependencies?.filter(d => d.successor_id === editingItem?.id) || [];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMessage(isAr ? 'يرجى إدخال اسم النشاط' : 'Please enter activity name');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      if (editingItem && editingItem.id) {
        await api.put(`/wbs/${editingItem.id}`, formData);
      } else {
        await api.post(`/projects/${projectId}/wbs`, formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || (isAr ? 'حدث خطأ أثناء الحفظ' : 'Error occurred while saving');
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              {editingItem ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {editingItem 
                  ? (isAr ? 'تعديل بند WBS' : 'Edit WBS Item') 
                  : parentItem 
                    ? (isAr ? `إضافة بند فرعي تحت: ${parentItem.code || ''} ${parentItem.name}` : `Add Sub-item under: ${parentItem.code || ''} ${parentItem.name}`)
                    : (isAr ? 'إضافة بند WBS رئيسي' : 'Add Root WBS Item')}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr ? 'تحديد مواصفات النشاط، التكاليف والمواعيد الزمنية' : 'Specify activity details, costs, and timeline'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        {editingItem && (
          <div className="flex border-b border-slate-800 px-6 pt-2 gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`pb-2 text-sm font-bold border-b-2 transition-all ${activeTab === 'details' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              {isAr ? 'تفاصيل النشاط' : 'Activity Details'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dependencies')}
              className={`pb-2 text-sm font-bold border-b-2 transition-all ${activeTab === 'dependencies' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              {isAr ? 'الاعتماديات' : 'Dependencies'}
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          
          {errorMessage && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'dependencies' ? (
            <div className="space-y-5">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                <h4 className="text-sm font-bold text-white">{isAr ? 'إضافة اعتمادية جديدة' : 'Add New Dependency'}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">{isAr ? 'النشاط السابق (Predecessor)' : 'Predecessor Activity'}</label>
                    <select
                      value={newDep.predecessor_id}
                      onChange={(e) => setNewDep({...newDep, predecessor_id: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                      <option value="">{isAr ? '-- اختر النشاط --' : '-- Select Activity --'}</option>
                      {flatItems.filter(item => item.id !== editingItem?.id).map(item => (
                        <option key={item.id} value={item.id}>{item.code ? `${item.code} - ` : ''}{item.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">{isAr ? 'نوع الاعتمادية' : 'Dependency Type'}</label>
                    <select
                      value={newDep.type}
                      onChange={(e) => setNewDep({...newDep, type: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                      <option value="FS">{isAr ? 'النهاية للبداية (FS)' : 'Finish-to-Start (FS)'}</option>
                      <option value="SS">{isAr ? 'البداية للبداية (SS)' : 'Start-to-Start (SS)'}</option>
                      <option value="FF">{isAr ? 'النهاية للنهاية (FF)' : 'Finish-to-Finish (FF)'}</option>
                      <option value="SF">{isAr ? 'البداية للنهاية (SF)' : 'Start-to-Finish (SF)'}</option>
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddDependency}
                  disabled={depLoading || !newDep.predecessor_id}
                  className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {isAr ? 'إضافة' : 'Add'}
                </button>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white">{isAr ? 'الأنشطة السابقة المرتبطة' : 'Linked Predecessors'}</h4>
                {itemDependencies.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl text-xs">
                    {isAr ? 'لا يوجد اعتماديات لهذا النشاط' : 'No dependencies for this activity'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {itemDependencies.map(dep => {
                      const predItem = flatItems.find(i => i.id === dep.predecessor_id);
                      return (
                        <div key={dep.id} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
                          <div className="flex flex-col">
                            <span className="text-sm text-white font-semibold">
                              {predItem?.name || (isAr ? 'نشاط محذوف' : 'Deleted Activity')}
                            </span>
                            <span className="text-xs text-indigo-400 font-mono">
                              Type: {dep.type}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteDependency(dep.id)}
                            disabled={depLoading}
                            className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form id="wbs-form" onSubmit={handleSubmit} className="space-y-5">

          {/* Milestone Toggle */}
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
            <input
              type="checkbox"
              id="is_milestone"
              checked={formData.is_milestone || false}
              onChange={(e) => {
                const checked = e.target.checked;
                setFormData({
                  ...formData,
                  is_milestone: checked,
                  end_date: checked ? formData.start_date : formData.end_date,
                });
              }}
              className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500 bg-slate-950 border-slate-800 cursor-pointer"
            />
            <label htmlFor="is_milestone" className="text-xs font-bold text-amber-400 cursor-pointer flex items-center gap-2">
              <span className="text-base font-bold">◆</span>
              {isAr ? 'تعيين كـ معلم رئيسي (Milestone)' : 'Set as Milestone'}
              <span className="text-[10px] text-slate-400 font-normal block">
                ({isAr ? 'محطة محورية مدتها 0 أيام' : 'Key progress checkpoint with 0 days duration'})
              </span>
            </label>
          </div>

          {/* Name & Parent selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                {isAr ? 'اسم البند / النشاط *' : 'Item / Activity Name *'}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={isAr ? 'مثال: صب الخرسانة المسلحة للقواعد' : 'e.g. Concrete Pouring for Foundations'}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                {isAr ? 'العنصر الأب (Parent WBS)' : 'Parent WBS Item'}
              </label>
              <select
                value={formData.parent_id || ''}
                onChange={(e) => setFormData({ ...formData, parent_id: e.target.value ? Number(e.target.value) : null })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">{isAr ? '-- بند رئيسي (بدون أب) --' : '-- Root Item (No Parent) --'}</option>
                {flatItems
                  .filter((item) => !editingItem || item.id !== editingItem.id)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code ? `${item.code} - ` : ''}{item.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                {isAr ? 'الشخص المكلف' : 'Assigned Person'}
              </label>
              <select
                value={formData.assigned_to || ''}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value ? Number(e.target.value) : null })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">{isAr ? '-- غير محدد --' : '-- Unassigned --'}</option>
                {users.map((u) => {
                  const name = u.profile ? `${u.profile.first_name || ''} ${u.profile.last_name || ''}`.trim() : u.email;
                  return (
                    <option key={u.id} value={u.id}>
                      {name || u.email}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">{isAr ? 'الحالة' : 'Status'}</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="not_started">{isAr ? 'لم يبدأ' : 'Not Started'}</option>
                <option value="in_progress">{isAr ? 'قيد التنفيذ' : 'In Progress'}</option>
                <option value="completed">{isAr ? 'مكتمل' : 'Completed'}</option>
                <option value="on_hold">{isAr ? 'متوقف' : 'On Hold'}</option>
                <option value="delayed">{isAr ? 'متأخر' : 'Delayed'}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">{isAr ? 'الأولوية' : 'Priority'}</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="low">{isAr ? 'منخفضة' : 'Low'}</option>
                <option value="medium">{isAr ? 'متوسطة' : 'Medium'}</option>
                <option value="high">{isAr ? 'عالية' : 'High'}</option>
                <option value="urgent">{isAr ? 'طوارئ / عاجل' : 'Urgent'}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>{isAr ? 'نسبة الإنجاز' : 'Progress'}</span>
                <span className="text-indigo-400 font-mono font-bold">{formData.progress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer mt-2"
              />
            </div>
          </div>

          {/* Dates & Financials */}
          {(() => {
            const selectedParent = flatItems.find((item) => item.id === formData.parent_id);
            const dateMin = selectedParent?.start_date || undefined;
            const dateMax = selectedParent?.end_date || undefined;

            return (
              <div className="space-y-4">
                {selectedParent && (selectedParent.start_date || selectedParent.end_date) && (
                  <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[11px] text-indigo-300 flex items-center justify-between">
                    <span className="font-semibold">
                      {isAr
                        ? `💡 نطاق تواريخ البند الأب (${selectedParent.code || ''} ${selectedParent.name}):`
                        : `💡 Parent Activity Date Range (${selectedParent.code || ''} ${selectedParent.name}):`}
                    </span>
                    <span className="font-mono font-bold">
                      {selectedParent.start_date || '...'} ➔ {selectedParent.end_date || '...'}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">{isAr ? 'تاريخ البدء المتوقع' : 'Start Date'}</label>
                    <input
                      type="date"
                      value={formData.start_date || ''}
                      min={dateMin}
                      max={dateMax}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          start_date: e.target.value,
                          end_date: formData.is_milestone ? e.target.value : formData.end_date,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">{isAr ? 'تاريخ الانتهاء المتوقع' : 'End Date'}</label>
                    <input
                      type="date"
                      value={formData.end_date || ''}
                      min={formData.start_date || dateMin}
                      max={dateMax}
                      disabled={formData.is_milestone}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">{isAr ? 'التكلفة التقديرية (ريال)' : 'Estimated Cost (SAR)'}</label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.estimated_cost ?? ''}
                onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">{isAr ? 'التكلفة الفعلية (ريال)' : 'Actual Cost (SAR)'}</label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.actual_cost ?? ''}
                onChange={(e) => setFormData({ ...formData, actual_cost: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">{isAr ? 'الوصف والملاحظات' : 'Description & Notes'}</label>
            <textarea
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={isAr ? 'تفاصيل إضافية حول آلية التنفيذ أو الاشتراطات...' : 'Additional details or specifications...'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              form="wbs-form"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {editingItem ? (isAr ? 'تحديث البند' : 'Update Item') : (isAr ? 'حفظ البند' : 'Save Item')}
            </button>
          </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}
