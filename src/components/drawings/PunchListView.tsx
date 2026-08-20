'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';
import {
  CheckSquare,
  Search,
  Filter,
  User as UserIcon,
  HardHat,
  Clock,
  CheckCircle2,
  Camera,
  Upload,
  AlertCircle,
  MapPin
} from 'lucide-react';
import { IssueItem } from './types';
import BeforeAfterCompareModal from './BeforeAfterCompareModal';

interface PunchListViewProps {
  projectId: number;
  issues: IssueItem[];
  onIssueUpdated: (issue: IssueItem) => void;
}

export default function PunchListView({
  projectId,
  issues,
  onIssueUpdated,
}: PunchListViewProps) {
  const { isAr } = useLanguage();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Attachment upload modal state
  const [uploadIssue, setUploadIssue] = useState<IssueItem | null>(null);
  const [uploadStage, setUploadStage] = useState<'before' | 'after'>('after');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Compare Modal State
  const [compareIssue, setCompareIssue] = useState<IssueItem | null>(null);

  const PRIORITY_BADGES: Record<string, { label: string; bg: string; text: string }> = {
    low: { label: isAr ? 'منخفضة' : 'Low', bg: 'bg-sky-500/10', text: 'text-sky-400' },
    medium: { label: isAr ? 'متوسطة' : 'Medium', bg: 'bg-amber-500/10', text: 'text-amber-400' },
    high: { label: isAr ? 'عالية' : 'High', bg: 'bg-orange-500/10', text: 'text-orange-400' },
    critical: { label: isAr ? 'حرجة' : 'Critical', bg: 'bg-rose-500/10', text: 'text-rose-400' },
  };

  const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
    new: { label: isAr ? 'جديدة' : 'New', bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-400' },
    in_progress: { label: isAr ? 'قيد التنفيذ' : 'In Progress', bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400' },
    pending_review: { label: isAr ? 'قيد المراجعة' : 'Pending Review', bg: 'bg-violet-500/10 border-violet-500/20', text: 'text-violet-400' },
    closed: { label: isAr ? 'مغلقة' : 'Closed', bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400' },
  };

  // Filtered issues
  const filteredIssues = issues.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchNum = item.issue_number.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchNum && !matchDesc) return false;
    }
    return true;
  });

  const handleStatusChange = async (issue: IssueItem, newStatus: string) => {
    try {
      const res = await api.patch<{ success: boolean; data: IssueItem }>(`/issues/${issue.id}/status`, {
        status: newStatus,
      });
      if (res.success && res.data) {
        onIssueUpdated(res.data);
      }
    } catch (err) {}
  };

  const handleUploadAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadIssue || !uploadFile) return;

    setUploadLoading(true);
    const form = new FormData();
    form.append('file', uploadFile);
    form.append('stage', uploadStage);

    try {
      const res = await api.post<{ success: boolean }>(`/issues/${uploadIssue.id}/attachments`, form);
      if (res.success) {
        // Refresh issue details
        const issueRes = await api.get<{ success: boolean; data: IssueItem[] }>(`/projects/${projectId}/issues`);
        if (issueRes.data) {
          const updated = issueRes.data.find((i) => i.id === uploadIssue.id);
          if (updated) onIssueUpdated(updated);
        }
        setUploadIssue(null);
        setUploadFile(null);
      }
    } catch (err) {
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isAr ? 'بحث برقم الملاحظة أو العنوان...' : 'Search by issue number or title...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-border rounded-xl pl-10 pr-3.5 py-2 text-xs text-foreground placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-indigo-500"
            >
              <option value="all">{isAr ? 'جميع الأولويات' : 'All Priorities'}</option>
              <option value="critical">{isAr ? 'حرجة' : 'Critical'}</option>
              <option value="high">{isAr ? 'عالية' : 'High'}</option>
              <option value="medium">{isAr ? 'متوسطة' : 'Medium'}</option>
              <option value="low">{isAr ? 'منخفضة' : 'Low'}</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border">
          {[
            { key: 'all', label: isAr ? 'الكل' : 'All', count: issues.length },
            { key: 'new', label: isAr ? 'جديدة' : 'New', count: issues.filter((i) => i.status === 'new').length },
            { key: 'in_progress', label: isAr ? 'قيد التنفيذ' : 'In Progress', count: issues.filter((i) => i.status === 'in_progress').length },
            { key: 'pending_review', label: isAr ? 'قيد المراجعة' : 'Pending Review', count: issues.filter((i) => i.status === 'pending_review').length },
            { key: 'closed', label: isAr ? 'مغلقة' : 'Closed', count: issues.filter((i) => i.status === 'closed').length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-background hover:bg-muted text-muted-foreground hover:text-slate-200 border border-border'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                statusFilter === tab.key ? 'bg-white/20 text-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Issues Table / Cards */}
      {filteredIssues.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
          <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">{isAr ? 'لا يوجد ملاحظات مطابقة للفلتر المحظور.' : 'No issues matching the filter criteria.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredIssues.map((issue) => {
            const priorityBadge = PRIORITY_BADGES[issue.priority] || PRIORITY_BADGES.medium;
            const statusBadge = STATUS_MAP[issue.status] || STATUS_MAP.new;
            const attachments = issue.attachments || [];
            const hasBefore = attachments.some((a) => a.stage === 'before');
            const hasAfter = attachments.some((a) => a.stage === 'after');

            return (
              <div
                key={issue.id}
                className="bg-card border border-border hover:border-border rounded-2xl p-4 transition-all space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20">
                        {issue.issue_number}
                      </span>
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-lg ${priorityBadge.bg} ${priorityBadge.text}`}>
                        {priorityBadge.label}
                      </span>
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-lg border ${statusBadge.bg} ${statusBadge.text}`}>
                        {statusBadge.label}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-foreground mt-1">{issue.title}</h4>
                    {issue.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{issue.description}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCompareIssue(issue)}
                      className="bg-background hover:bg-muted text-foreground rounded-xl px-3 py-1.5 text-xs font-medium border border-border flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-sky-400" />
                      <span>{isAr ? 'معاينة التوثيق (Before/After)' : 'View Photos'}</span>
                      {(hasBefore || hasAfter) && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setUploadIssue(issue);
                        setUploadStage(issue.status === 'new' ? 'before' : 'after');
                      }}
                      className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-xl px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isAr ? 'إرفاق صورة' : 'Attach Photo'}</span>
                    </button>
                  </div>
                </div>

                {/* Metadata Row */}
                <div className="flex flex-wrap items-center justify-between pt-3 border-t border-border text-[11px] text-muted-foreground gap-3">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                      {issue.assigned_user?.name || issue.assigned_user?.first_name || (isAr ? 'غير محدد' : 'Unassigned')}
                    </span>
                    {issue.contractor_name && (
                      <span className="flex items-center gap-1">
                        <HardHat className="w-3.5 h-3.5 text-amber-400" />
                        {issue.contractor_name}
                      </span>
                    )}
                    {issue.drawing && (
                      <span className="flex items-center gap-1 font-mono text-foreground">
                        {issue.drawing.drawing_number} - {issue.drawing.title}
                      </span>
                    )}
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{isAr ? 'تحديث الحالة:' : 'Status:'}</span>
                    <select
                      value={issue.status}
                      onChange={(e) => handleStatusChange(issue, e.target.value)}
                      className="bg-background border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-indigo-500"
                    >
                      <option value="new">{isAr ? 'جديدة' : 'New'}</option>
                      <option value="in_progress">{isAr ? 'قيد التنفيذ' : 'In Progress'}</option>
                      <option value="pending_review">{isAr ? 'قيد المراجعة' : 'Pending Review'}</option>
                      <option value="closed">{isAr ? 'مغلقة' : 'Closed'}</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Attachment Dialog */}
      {uploadIssue && (
        <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-foreground">
              {isAr ? `إرفاق صورة توثيقية لملاحظة (${uploadIssue.issue_number})` : `Upload Documentation Photo (${uploadIssue.issue_number})`}
            </h3>

            <form onSubmit={handleUploadAttachment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  {isAr ? 'مرحلة الصورة (Stage)' : 'Photo Stage'}
                </label>
                <select
                  value={uploadStage}
                  onChange={(e) => setUploadStage(e.target.value as any)}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-sm text-foreground"
                >
                  <option value="before">{isAr ? 'قبل التنفيذ (Before Observation)' : 'Before Execution'}</option>
                  <option value="after">{isAr ? 'بعد المعالجة والإنهاء (After Remediation)' : 'After Remediation'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  {isAr ? 'اختيار أو التقاط الصورة' : 'Choose or Capture Image'}
                </label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  capture="environment"
                  required
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full bg-background border border-border rounded-xl p-2 text-xs text-foreground"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setUploadIssue(null)}
                  className="px-4 py-2 text-xs font-medium text-foreground hover:bg-muted rounded-xl"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="px-5 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl"
                >
                  {uploadLoading ? (isAr ? 'جاري الرفع...' : 'Uploading...') : (isAr ? 'رفع المرفق' : 'Upload')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      <BeforeAfterCompareModal
        issue={compareIssue}
        isOpen={!!compareIssue}
        onClose={() => setCompareIssue(null)}
      />
    </div>
  );
}
