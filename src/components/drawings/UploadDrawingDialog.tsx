'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';
import { DrawingItem } from './types';

interface UploadDrawingDialogProps {
  projectId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (drawing: DrawingItem) => void;
}

export default function UploadDrawingDialog({
  projectId,
  isOpen,
  onClose,
  onSuccess,
}: UploadDrawingDialogProps) {
  const { isAr } = useLanguage();
  const [title, setTitle] = useState('');
  const [drawingNumber, setDrawingNumber] = useState('');
  const [version, setVersion] = useState('1.0');
  const [revisionNumber, setRevisionNumber] = useState('Rev-00');
  const [approvalStatus, setApprovalStatus] = useState<'draft' | 'under_review' | 'approved' | 'rejected'>('draft');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim() || !drawingNumber.trim()) {
      setError(isAr ? 'يرجى ملء جميع الحقول المطلوبة واختيار الملف.' : 'Please fill required fields and select a file.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('drawing_number', drawingNumber);
    formData.append('file', file);
    formData.append('version', version);
    formData.append('revision_number', revisionNumber);
    formData.append('approval_status', approvalStatus);

    try {
      const res = await api.post<{ success: boolean; data: DrawingItem }>(
        `/projects/${projectId}/drawings`,
        formData
      );

      if (res.success && res.data) {
        onSuccess(res.data);
        onClose();
        setTitle('');
        setDrawingNumber('');
        setFile(null);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || (isAr ? 'حدث خطأ أثناء رفع المخطط' : 'Error uploading drawing'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-5 border-b border-border bg-card">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-foreground text-base">
              {isAr ? 'رفع مخطط هندسي جديد' : 'Upload New Engineering Drawing'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              {isAr ? 'عنوان المخطط *' : 'Drawing Title *'}
            </label>
            <input
              type="text"
              required
              placeholder={isAr ? 'مثال: مخطط الدور الثالث المعماري' : 'e.g. 3rd Floor Architectural Plan'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              {isAr ? 'رقم المخطط الرسمي *' : 'Official Drawing Number *'}
            </label>
            <input
              type="text"
              required
              placeholder={isAr ? 'مثال: AR-301' : 'e.g. AR-301'}
              value={drawingNumber}
              onChange={(e) => setDrawingNumber(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                {isAr ? 'الإصدار' : 'Version'}
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                {isAr ? 'رقم المراجعة' : 'Revision Number'}
              </label>
              <input
                type="text"
                value={revisionNumber}
                onChange={(e) => setRevisionNumber(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              {isAr ? 'حالة الاعتماد' : 'Approval Status'}
            </label>
            <select
              value={approvalStatus}
              onChange={(e) => setApprovalStatus(e.target.value as any)}
              className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="draft">{isAr ? 'مسودة (Draft)' : 'Draft'}</option>
              <option value="under_review">{isAr ? 'قيد المراجعة (Under Review)' : 'Under Review'}</option>
              <option value="approved">{isAr ? 'معتمد (Approved)' : 'Approved'}</option>
              <option value="rejected">{isAr ? 'مرفوض (Rejected)' : 'Rejected'}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              {isAr ? 'ملف المخطط (PDF, DWG, JPG, PNG) *' : 'Drawing File (PDF, DWG, JPG, PNG) *'}
            </label>
            <div className="relative border-2 border-dashed border-border hover:border-indigo-500/50 rounded-xl p-4 text-center cursor-pointer transition-colors bg-background/50">
              <input
                type="file"
                accept=".pdf,.dwg,.png,.jpg,.jpeg"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              {file ? (
                <p className="text-xs font-medium text-indigo-400">{file.name}</p>
              ) : (
                <div>
                  <p className="text-xs font-medium text-foreground">
                    {isAr ? 'انقر أو اسحب الملف هنا للرفع' : 'Click or drag file here to upload'}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">PNG, JPG, PDF, DWG (Max 50MB)</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {isAr ? 'رفع المخطط' : 'Upload Drawing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
