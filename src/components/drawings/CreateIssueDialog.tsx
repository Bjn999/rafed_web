'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { X, MapPin, Camera, AlertCircle, Plus } from 'lucide-react';
import { IssueItem, UserSimple } from './types';

interface CreateIssueDialogProps {
  drawingId: number;
  pinX?: number | null;
  pinY?: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (issue: IssueItem) => void;
}

export default function CreateIssueDialog({
  drawingId,
  pinX,
  pinY,
  isOpen,
  onClose,
  onSuccess,
}: CreateIssueDialogProps) {
  const { isAr } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [assignedToUserId, setAssignedToUserId] = useState<string>('');
  const [contractorName, setContractorName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [locationDescription, setLocationDescription] = useState('');
  
  // Geolocation
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);

  // Initial Photo Attachment
  const [photo, setPhoto] = useState<File | null>(null);

  // Users list for assignment
  const [users, setUsers] = useState<UserSimple[]>([]);

  // Loading state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch users for assignment
      api.get<{ success: boolean; data: UserSimple[] }>('/users')
        .then((res) => {
          if (res.data) setUsers(res.data);
        })
        .catch(() => {});

      // Auto capture GPS if supported
      captureGeolocation();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const captureGeolocation = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      setGeoLoading(true);
      setGeoStatus(isAr ? 'جاري تحديد موقع GPS...' : 'Fetching GPS location...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setGeoLoading(false);
          setGeoStatus(isAr ? 'تم تحديد الإحداثيات بنجاح' : 'GPS acquired');
        },
        (err) => {
          setGeoLoading(false);
          setGeoStatus(isAr ? 'تعذر تحديد GPS تلقائياً' : 'Could not fetch GPS');
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(isAr ? 'عنوان الملاحظة مطلوب' : 'Issue title is required');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      title,
      description,
      pin_x: pinX ?? null,
      pin_y: pinY ?? null,
      priority,
      assigned_to_user_id: assignedToUserId ? parseInt(assignedToUserId) : null,
      contractor_name: contractorName || null,
      due_date: dueDate || null,
      location_description: locationDescription || null,
      latitude,
      longitude,
      logged_at: new Date().toISOString(),
    };

    try {
      const res = await api.post<{ success: boolean; data: IssueItem }>(
        `/drawings/${drawingId}/issues`,
        payload
      );

      if (res.success && res.data) {
        const issue = res.data;

        // If user attached a photo, upload it as 'before' stage attachment
        if (photo) {
          const photoForm = new FormData();
          photoForm.append('file', photo);
          photoForm.append('stage', 'before');
          if (latitude) photoForm.append('latitude', latitude.toString());
          if (longitude) photoForm.append('longitude', longitude.toString());

          await api.post(`/issues/${issue.id}/attachments`, photoForm).catch(() => {});
        }

        onSuccess(issue);
        onClose();
        setTitle('');
        setDescription('');
        setPhoto(null);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || (isAr ? 'حدث خطأ أثناء حفظ الملاحظة' : 'Error creating issue'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">
                {isAr ? 'تسجيل ملاحظة ميدانية جديدة (Issue)' : 'New Field Punch List Issue'}
              </h3>
              {pinX !== undefined && pinY !== undefined && (
                <p className="text-[11px] text-slate-400 font-mono">
                  {isAr ? `إحداثيات النقطة: X: ${pinX?.toFixed(1)}%, Y: ${pinY?.toFixed(1)}%` : `Pin Coordinates: X: ${pinX?.toFixed(1)}%, Y: ${pinY?.toFixed(1)}%`}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {isAr ? 'عنوان الملاحظة / الملاحظة الهندسية *' : 'Issue Title *'}
            </label>
            <input
              type="text"
              required
              placeholder={isAr ? 'مثال: تشقق بلاط الدور الثالث' : 'e.g. Floor Tile Crack 3rd Floor'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {isAr ? 'الوصف التفصيلي' : 'Detailed Description'}
            </label>
            <textarea
              rows={3}
              placeholder={isAr ? 'اكتب تفاصيل الملاحظة وسياق الرصد الميداني...' : 'Provide details regarding this issue...'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {isAr ? 'درجة الأولوية' : 'Priority'}
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="low">{isAr ? 'منخفضة (Low)' : 'Low'}</option>
                <option value="medium">{isAr ? 'متوسطة (Medium)' : 'Medium'}</option>
                <option value="high">{isAr ? 'عالية (High)' : 'High'}</option>
                <option value="critical">{isAr ? 'حارجة / طارئة (Critical)' : 'Critical'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {isAr ? 'المهندس المسؤول' : 'Assigned Engineer'}
              </label>
              <select
                value={assignedToUserId}
                onChange={(e) => setAssignedToUserId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">{isAr ? '-- غير محدد --' : '-- Unassigned --'}</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || `${u.first_name || ''} ${u.last_name || ''}`} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {isAr ? 'جهة التنفيذ / المقاول' : 'Contractor / Company'}
              </label>
              <input
                type="text"
                placeholder={isAr ? 'مثال: شركة التشطيبات' : 'e.g. Contracting Co'}
                value={contractorName}
                onChange={(e) => setContractorName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {isAr ? 'تاريخ الاستحقاق (Due Date)' : 'Due Date'}
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {isAr ? 'وصف الموقع الميداني' : 'Location Description'}
            </label>
            <input
              type="text"
              placeholder={isAr ? 'مثال: بجوار المصعد الشمالي' : 'e.g. Next to north elevator'}
              value={locationDescription}
              onChange={(e) => setLocationDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* GPS Location & Field Camera Attachment */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-medium text-slate-200">
                  {isAr ? 'التوثيق الجغرافي (GPS)' : 'Field Geolocation (GPS)'}
                </span>
              </div>
              <button
                type="button"
                onClick={captureGeolocation}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
              >
                {isAr ? 'تحديث الموقع' : 'Refresh GPS'}
              </button>
            </div>
            {geoStatus && (
              <p className="text-[11px] text-slate-400">
                {geoStatus}
                {latitude && longitude && (
                  <span className="font-mono text-emerald-400 ml-2">
                    ({latitude.toFixed(5)}, {longitude.toFixed(5)})
                  </span>
                )}
              </p>
            )}

            {/* Direct Camera Capture */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="block text-xs font-medium text-slate-300 mb-2 flex items-center gap-2">
                <Camera className="w-4 h-4 text-sky-400" />
                <span>{isAr ? 'إرفاق صورة ميدانية قبل التنفيذ (Before)' : 'Attach Field Photo (Before)'}</span>
              </label>
              <div className="relative border border-dashed border-slate-800 hover:border-sky-500/50 rounded-xl p-3 text-center cursor-pointer bg-slate-900/50">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {photo ? (
                  <p className="text-xs text-sky-400 font-medium">{photo.name}</p>
                ) : (
                  <p className="text-xs text-slate-400">
                    {isAr ? 'انقر لالتقاط صورة مباشرة بالكاميرا أو اختيار صورة' : 'Tap to take photo with camera or choose image'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {isAr ? 'حفظ الملاحظة' : 'Create Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
