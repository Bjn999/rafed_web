'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  MapPin,
  Plus,
  AlertCircle,
  Clock,
  CheckCircle2,
  User as UserIcon,
  HardHat,
  Camera,
  Layers,
  ChevronRight
} from 'lucide-react';
import { DrawingItem, IssueItem } from './types';
import CreateIssueDialog from './CreateIssueDialog';
import BeforeAfterCompareModal from './BeforeAfterCompareModal';
import { api } from '@/lib/api';
import { getFileUrl } from '@/lib/utils';

interface DrawingCanvasProps {
  drawing: DrawingItem;
  issues: IssueItem[];
  onIssueCreated: (issue: IssueItem) => void;
  onIssueUpdated: (issue: IssueItem) => void;
}

export default function DrawingCanvas({
  drawing,
  issues,
  onIssueCreated,
  onIssueUpdated,
}: DrawingCanvasProps) {
  const { isAr } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasDraggedRef = useRef<boolean>(false);

  // Zoom & Pan state
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Temp pin creation dialog state
  const [tempPin, setTempPin] = useState<{ x: number; y: number } | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Selected Pin Popover state
  const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);
  const [compareModalIssue, setCompareModalIssue] = useState<IssueItem | null>(null);

  // Status updating state
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Priorities map
  const PRIORITY_BADGES: Record<string, { label: string; bg: string; text: string; pinBg: string }> = {
    low: { label: isAr ? 'منخفضة' : 'Low', bg: 'bg-sky-500/10', text: 'text-sky-400', pinBg: 'bg-sky-500' },
    medium: { label: isAr ? 'متوسطة' : 'Medium', bg: 'bg-amber-500/10', text: 'text-amber-400', pinBg: 'bg-amber-500' },
    high: { label: isAr ? 'عالية' : 'High', bg: 'bg-orange-500/10', text: 'text-orange-400', pinBg: 'bg-orange-500' },
    critical: { label: isAr ? 'حرجة' : 'Critical', bg: 'bg-rose-500/10', text: 'text-rose-400', pinBg: 'bg-rose-500 animate-pulse' },
  };

  const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
    new: { label: isAr ? 'جديدة' : 'New', bg: 'bg-rose-500/10', text: 'text-rose-400' },
    in_progress: { label: isAr ? 'قيد التنفيذ' : 'In Progress', bg: 'bg-amber-500/10', text: 'text-amber-400' },
    pending_review: { label: isAr ? 'قيد المراجعة' : 'Pending Review', bg: 'bg-violet-500/10', text: 'text-violet-400' },
    closed: { label: isAr ? 'مغلقة' : 'Closed', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  };

  // Zoom handlers
  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 4));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
  const handleResetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.15 : -0.15;
    setScale((s) => Math.min(Math.max(s + zoomFactor, 0.5), 4));
  };

  // Global mouseup listener to guarantee dragging stops
  useEffect(() => {
    const handleGlobalUp = () => {
      setIsDragging(false);
    };
    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('touchend', handleGlobalUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  }, []);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag if left click on canvas background (not on pin)
    if ((e.target as HTMLElement).closest('.pin-element')) return;
    e.preventDefault(); // Prevent native browser drag / text selection
    setIsDragging(true);
    hasDraggedRef.current = false;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dist = Math.hypot(e.clientX - dragStartPosRef.current.x, e.clientY - dragStartPosRef.current.y);
    if (dist > 5) {
      hasDraggedRef.current = true;
    }
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch handlers for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
      dragStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      hasDraggedRef.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = Math.abs(e.touches[0].clientX - dragStartPosRef.current.x);
    const dy = Math.abs(e.touches[0].clientY - dragStartPosRef.current.y);
    if (dx > 5 || dy > 5) {
      hasDraggedRef.current = true;
    }
    setPan({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
  };

  const handleTouchEnd = () => setIsDragging(false);

  // Click canvas to place a pin
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    if ((e.target as HTMLElement).closest('.pin-element')) return;

    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const relativeX = (clickX / rect.width) * 100;
    const relativeY = (clickY / rect.height) * 100;

    if (relativeX >= 0 && relativeX <= 100 && relativeY >= 0 && relativeY <= 100) {
      setTempPin({ x: relativeX, y: relativeY });
      setIsCreateDialogOpen(true);
    }
  };

  const handleUpdateStatus = async (issueId: number, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await api.patch<{ success: boolean; data: IssueItem }>(`/issues/${issueId}/status`, {
        status: newStatus,
      });
      if (res.success && res.data) {
        onIssueUpdated(res.data);
        if (selectedIssue && selectedIssue.id === issueId) {
          setSelectedIssue(res.data);
        }
      }
    } catch (err) {
    } finally {
      setUpdatingStatus(false);
    }
  };

  const isImage = drawing.file_type === 'jpg' || drawing.file_type === 'png';

  return (
    <div className="flex flex-col gap-4">
      {/* Controls Bar */}
      <div className="bg-card border border-border rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span>{drawing.title}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-muted text-foreground border border-border">
                {drawing.drawing_number}
              </span>
            </h4>
            <p className="text-xs text-muted-foreground">
              {isAr ? 'انقر أو المس أي موقع في المخطط لإضافة ملاحظة دبابيس' : 'Tap anywhere on drawing to add issue pin'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-background p-1.5 rounded-xl border border-border">
          <button
            onClick={handleZoomIn}
            title={isAr ? 'تكبير' : 'Zoom In'}
            className="p-1.5 hover:bg-muted text-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono font-bold text-indigo-400 px-2 min-w-[45px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomOut}
            title={isAr ? 'تصغير' : 'Zoom Out'}
            className="p-1.5 hover:bg-muted text-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-muted mx-1" />
          <button
            onClick={handleResetZoom}
            title={isAr ? 'إعادة ضبط' : 'Reset View'}
            className="p-1.5 hover:bg-muted text-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas View Area */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full h-[420px] sm:h-[650px] bg-background border border-border rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none flex items-center justify-center touch-none"
      >
        {!isImage ? (
          <div className="text-center py-20 px-6 max-w-md">
            <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h4 className="text-base font-semibold text-foreground mb-1">
              {isAr ? 'معاينة هذا المخطط تتوفر عبر تنزيل الملف' : 'Preview for this document is available via file download'}
            </h4>
            <p className="text-xs text-muted-foreground mb-4">
              {isAr ? 'الملفات المرفوعة بنمط PDF / DWG تتيح إضافة الملاحظات الميدانية بمرونة.' : 'PDF / DWG formats support direct issue tracking.'}
            </p>
            <a
              href={getFileUrl(drawing.file_url || drawing.file_path)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2 text-xs font-semibold"
            >
              {isAr ? 'تنزيل/عرض المخطط الأصلي' : 'Download Original Document'}
            </a>
          </div>
        ) : (
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
            className="relative inline-block"
            onClick={handleCanvasClick}
          >
            {/* Drawing Image */}
            <img
              ref={imageRef}
              src={getFileUrl(drawing.file_url || drawing.file_path)}
              alt={drawing.title}
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              className="max-w-none max-h-[600px] object-contain rounded-lg shadow-2xl pointer-events-auto select-none"
            />

            {/* Temporary Pin Marker */}
            {tempPin && isCreateDialogOpen && (
              <div
                style={{ left: `${tempPin.x}%`, top: `${tempPin.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-full z-30 pointer-events-none animate-bounce"
              >
                <MapPin className="w-8 h-8 text-rose-500 fill-rose-500/30 drop-shadow-[0_4px_10px_rgba(244,63,94,0.6)]" />
              </div>
            )}

            {/* Existing Pins */}
            {issues.map((issue) => {
              if (issue.pin_x == null || issue.pin_y == null) return null;

              const priorityInfo = PRIORITY_BADGES[issue.priority] || PRIORITY_BADGES.medium;
              const isSelected = selectedIssue?.id === issue.id;

              return (
                <div
                  key={issue.id}
                  style={{ left: `${issue.pin_x}%`, top: `${issue.pin_y}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIssue(issue);
                  }}
                  className={`pin-element absolute -translate-x-1/2 -translate-y-full z-20 cursor-pointer transition-transform duration-200 hover:scale-125 ${
                    isSelected ? 'scale-125 z-40' : ''
                  }`}
                >
                  <div className="relative group">
                    <MapPin className={`w-7 h-7 drop-shadow-md text-foreground ${priorityInfo.pinBg}`} />
                    <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-foreground">
                      {issue.issue_number.replace('ISS-', '')}
                    </span>

                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-card text-foreground text-[11px] font-medium px-2.5 py-1 rounded-lg shadow-xl border border-border whitespace-nowrap">
                      {issue.issue_number}: {issue.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Pin Details Popover Card */}
      {selectedIssue && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20">
                  {selectedIssue.issue_number}
                </span>
                <span
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-lg ${
                    (PRIORITY_BADGES[selectedIssue.priority] || PRIORITY_BADGES.medium).bg
                  } ${(PRIORITY_BADGES[selectedIssue.priority] || PRIORITY_BADGES.medium).text}`}
                >
                  {isAr ? 'الأولوية: ' : 'Priority: '}
                  {(PRIORITY_BADGES[selectedIssue.priority] || PRIORITY_BADGES.medium).label}
                </span>
                <span
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-lg ${
                    (STATUS_MAP[selectedIssue.status] || STATUS_MAP.new).bg
                  } ${(STATUS_MAP[selectedIssue.status] || STATUS_MAP.new).text}`}
                >
                  {(STATUS_MAP[selectedIssue.status] || STATUS_MAP.new).label}
                </span>
              </div>
              <h4 className="text-base font-semibold text-foreground">{selectedIssue.title}</h4>
              {selectedIssue.description && (
                <p className="text-xs text-foreground leading-relaxed">{selectedIssue.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCompareModalIssue(selectedIssue)}
                className="bg-muted hover:bg-slate-700 text-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4 text-sky-400" />
                <span>{isAr ? 'مقارنة الصور (Before/After)' : 'Compare Field Photos'}</span>
              </button>

              <button
                onClick={() => setSelectedIssue(null)}
                className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-muted transition-colors"
              >
                &times;
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 mt-4 border-t border-border text-xs">
            <div>
              <span className="text-muted-foreground block mb-0.5">{isAr ? 'المسؤول' : 'Assigned To'}</span>
              <span className="text-slate-200 font-medium flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                {selectedIssue.assigned_user?.name || selectedIssue.assigned_user?.first_name || (isAr ? 'غير محدد' : 'Unassigned')}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block mb-0.5">{isAr ? 'جهة التنفيذ' : 'Contractor'}</span>
              <span className="text-slate-200 font-medium flex items-center gap-1">
                <HardHat className="w-3.5 h-3.5 text-amber-400" />
                {selectedIssue.contractor_name || (isAr ? 'غير محدد' : 'N/A')}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block mb-0.5">{isAr ? 'تاريخ الاستحقاق' : 'Due Date'}</span>
              <span className="text-slate-200 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                {selectedIssue.due_date ? new Date(selectedIssue.due_date).toLocaleDateString() : (isAr ? 'غير محدد' : 'N/A')}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block mb-0.5">{isAr ? 'تغيير الحالة السريع' : 'Quick Change Status'}</span>
              <select
                disabled={updatingStatus}
                value={selectedIssue.status}
                onChange={(e) => handleUpdateStatus(selectedIssue.id, e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="new">{isAr ? 'جديدة (New)' : 'New'}</option>
                <option value="in_progress">{isAr ? 'قيد التنفيذ (In Progress)' : 'In Progress'}</option>
                <option value="pending_review">{isAr ? 'قيد المراجعة (Pending Review)' : 'Pending Review'}</option>
                <option value="closed">{isAr ? 'مغلقة (Closed)' : 'Closed'}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Create Issue Dialog */}
      <CreateIssueDialog
        drawingId={drawing.id}
        pinX={tempPin?.x}
        pinY={tempPin?.y}
        isOpen={isCreateDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setTempPin(null);
        }}
        onSuccess={(newIssue) => {
          onIssueCreated(newIssue);
          setSelectedIssue(newIssue);
        }}
      />

      {/* Before / After Photo Comparison Modal */}
      <BeforeAfterCompareModal
        issue={compareModalIssue}
        isOpen={!!compareModalIssue}
        onClose={() => setCompareModalIssue(null)}
      />
    </div>
  );
}
