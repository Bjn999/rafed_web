'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { X, Image as ImageIcon, MapPin, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';
import { IssueItem, IssueAttachment } from './types';
import { getFileUrl } from '@/lib/utils';

interface BeforeAfterCompareModalProps {
  issue: IssueItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function BeforeAfterCompareModal({
  issue,
  isOpen,
  onClose,
}: BeforeAfterCompareModalProps) {
  const { isAr } = useLanguage();
  const [viewMode, setViewMode] = useState<'sideBySide' | 'slider'>('sideBySide');
  const [sliderPos, setSliderPos] = useState(50);

  if (!isOpen || !issue) return null;

  const attachments = issue.attachments || [];
  const beforePhotos = attachments.filter((a) => a.stage === 'before');
  const afterPhotos = attachments.filter((a) => a.stage === 'after');

  const beforePhoto = beforePhotos[0];
  const afterPhoto = afterPhotos[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {issue.issue_number}
                </span>
                <h3 className="font-semibold text-white text-base">
                  {issue.title}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr ? 'مقارنة الصور قبل التنفيذ والمعالجة الميدانية وبعدها' : 'Before Execution vs After Remediation Comparison'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {(!beforePhoto && !afterPhoto) ? (
            <div className="text-center py-12 text-slate-400">
              <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-medium">
                {isAr ? 'لا يوجد صور مرفقة لهذه الملاحظة حتى الآن.' : 'No field photos attached to this issue yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Before Photo Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
                <div className="p-3 bg-amber-500/10 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{isAr ? 'لحظة الرصد الميداني (Before)' : 'Initial Observation (Before)'}</span>
                  </div>
                  {beforePhoto?.taken_at && (
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(beforePhoto.taken_at).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="relative aspect-video bg-slate-900 flex items-center justify-center overflow-hidden">
                  {beforePhoto ? (
                    <img
                      src={getFileUrl(beforePhoto.file_url || beforePhoto.file_path)}
                      alt="Before"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <p className="text-xs text-slate-500">{isAr ? 'لم ترفع صورة قبل التنفيذ' : 'No Before Photo'}</p>
                  )}
                </div>

                {beforePhoto && (
                  <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                    {beforePhoto.latitude && beforePhoto.longitude && (
                      <div className="flex items-center gap-1.5 font-mono text-emerald-400">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>GPS: {beforePhoto.latitude.toFixed(5)}, {beforePhoto.longitude.toFixed(5)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* After Photo Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
                <div className="p-3 bg-emerald-500/10 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isAr ? 'بعد المعالجة والإنهاء (After)' : 'After Remediation (After)'}</span>
                  </div>
                  {afterPhoto?.taken_at && (
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(afterPhoto.taken_at).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="relative aspect-video bg-slate-900 flex items-center justify-center overflow-hidden">
                  {afterPhoto ? (
                    <img
                      src={getFileUrl(afterPhoto.file_url || afterPhoto.file_path)}
                      alt="After"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <p className="text-xs text-slate-500">{isAr ? 'لم ترفع صورة بعد المعالجة' : 'No After Photo'}</p>
                  )}
                </div>

                {afterPhoto && (
                  <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                    {afterPhoto.latitude && afterPhoto.longitude && (
                      <div className="flex items-center gap-1.5 font-mono text-emerald-400">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>GPS: {afterPhoto.latitude.toFixed(5)}, {afterPhoto.longitude.toFixed(5)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
