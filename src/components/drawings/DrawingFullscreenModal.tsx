'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  MapPin,
  X,
  AlertCircle,
  Clock,
  CheckCircle2,
  User as UserIcon,
  HardHat,
  Camera,
  Layers,
  ChevronDown,
  Search,
  Filter,
  List,
} from 'lucide-react';
import { DrawingItem, IssueItem } from './types';
import CreateIssueDialog from './CreateIssueDialog';
import BeforeAfterCompareModal from './BeforeAfterCompareModal';
import { api } from '@/lib/api';
import { getFileUrl } from '@/lib/utils';

interface DrawingFullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  drawing: DrawingItem | null;
  allDrawings: DrawingItem[];
  onSelectDrawing: (drawingId: number) => void;
  issues: IssueItem[];
  onIssueCreated: (issue: IssueItem) => void;
  onIssueUpdated: (issue: IssueItem) => void;
}

export default function DrawingFullscreenModal({
  isOpen,
  onClose,
  drawing,
  allDrawings,
  onSelectDrawing,
  issues,
  onIssueCreated,
  onIssueUpdated,
}: DrawingFullscreenModalProps) {
  const { isAr } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Mobile drawer state vs canvas view on small screens
  const [mobileTab, setMobileTab] = useState<'canvas' | 'issues'>('canvas');

  // Zoom & Pan state
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Touch handling state for Pinch-to-Zoom & Pan
  const initialPinchDistRef = useRef<number | null>(null);
  const initialPinchScaleRef = useRef<number>(1);
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Filter & Search in Sidebar
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Selected Pin Popover / Sidebar highlight state
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);
  const [compareModalIssue, setCompareModalIssue] = useState<IssueItem | null>(null);

  // Pin creation dialog state
  const [tempPin, setTempPin] = useState<{ x: number; y: number } | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Status updating loading state
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  // Priorities map
  const PRIORITY_BADGES: Record<string, { label: string; bg: string; text: string; pinBg: string }> = {
    low: { label: isAr ? 'منخفضة' : 'Low', bg: 'bg-sky-500/10 border-sky-500/20', text: 'text-sky-400', pinBg: 'bg-sky-500' },
    medium: { label: isAr ? 'متوسطة' : 'Medium', bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400', pinBg: 'bg-amber-500' },
    high: { label: isAr ? 'عالية' : 'High', bg: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-400', pinBg: 'bg-orange-500' },
    critical: { label: isAr ? 'حرجة' : 'Critical', bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-400', pinBg: 'bg-rose-500 animate-pulse' },
  };

  const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
    new: { label: isAr ? 'جديدة' : 'New', bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-400' },
    in_progress: { label: isAr ? 'قيد التنفيذ' : 'In Progress', bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400' },
    pending_review: { label: isAr ? 'قيد المراجعة' : 'Pending Review', bg: 'bg-violet-500/10 border-violet-500/20', text: 'text-violet-400' },
    closed: { label: isAr ? 'مغلقة' : 'Closed', bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400' },
  };

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset zoom state on drawing change
  useEffect(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setSelectedIssueId(null);
  }, [drawing?.id]);

  // Zoom handlers
  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 5));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.4));
  const handleResetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  // Wheel Zoom scoped strictly to canvas
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.15 : -0.15;
    setScale((s) => Math.min(Math.max(s + zoomFactor, 0.4), 5));
  };

  // Touch and Drag tracking refs to distinguish click from pan/drag
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasDraggedRef = useRef<boolean>(false);

  // Global mouseup / touchend listener to guarantee dragging stops even if released outside container
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

  // Mouse Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
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

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mobile Touch Pan & Pinch Zoom Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      if ((e.target as HTMLElement).closest('.pin-element')) return;
      setIsDragging(true);
      hasDraggedRef.current = false;
      dragStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      touchStartRef.current = { x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y };
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      hasDraggedRef.current = true;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchDistRef.current = dist;
      initialPinchScaleRef.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const dist = Math.hypot(
        e.touches[0].clientX - dragStartPosRef.current.x,
        e.touches[0].clientY - dragStartPosRef.current.y
      );
      if (dist > 5) {
        hasDraggedRef.current = true;
      }
      setPan({
        x: e.touches[0].clientX - touchStartRef.current.x,
        y: e.touches[0].clientY - touchStartRef.current.y,
      });
    } else if (e.touches.length === 2 && initialPinchDistRef.current !== null) {
      hasDraggedRef.current = true;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / initialPinchDistRef.current;
      const newScale = Math.min(Math.max(initialPinchScaleRef.current * factor, 0.4), 5);
      setScale(newScale);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    initialPinchDistRef.current = null;
  };

  // Canvas Click to drop pin (Only on clean single click without drag)
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

  // Focus and Pan to pin on issue selection
  const handleSelectIssue = (issue: IssueItem) => {
    setSelectedIssueId(issue.id);
    if (issue.pin_x != null && issue.pin_y != null && imageRef.current && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const imgWidth = imageRef.current.offsetWidth;
      const imgHeight = imageRef.current.offsetHeight;

      const targetX = (imgWidth * (issue.pin_x / 100)) - (containerRect.width / 2);
      const targetY = (imgHeight * (issue.pin_y / 100)) - (containerRect.height / 2);

      setPan({ x: -targetX * scale, y: -targetY * scale });
    }
  };

  // Status Quick Update
  const handleUpdateStatus = async (issueId: number, newStatus: string) => {
    setUpdatingStatusId(issueId);
    try {
      const res = await api.patch<{ success: boolean; data: IssueItem }>(`/issues/${issueId}/status`, {
        status: newStatus,
      });
      if (res.success && res.data) {
        onIssueUpdated(res.data);
      }
    } catch (err) {
    } finally {
      setUpdatingStatusId(null);
    }
  };

  if (!isOpen || !drawing) return null;

  const drawingIssues = issues.filter((i) => i.drawing_id === drawing.id);
  const filteredIssues = drawingIssues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.issue_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const isImage = drawing.file_type === 'jpg' || drawing.file_type === 'png';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col h-screen overflow-hidden select-none animate-in fade-in duration-200">
      {/* 1. Modal Top Bar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between gap-4 z-20 shrink-0">
        {/* Title & Selector */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <div className="relative group">
              <select
                value={drawing.id}
                onChange={(e) => onSelectDrawing(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-white font-semibold text-xs md:text-sm rounded-xl py-1.5 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer appearance-none truncate max-w-[200px] sm:max-w-[320px]"
              >
                {allDrawings.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.drawing_number} - {d.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {drawing.file_type.toUpperCase()} • {drawing.version}
            </span>
          </div>
        </div>

        {/* Canvas Toolbar & Zoom Controls */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={handleZoomIn}
              title={isAr ? 'تكبير' : 'Zoom In'}
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-400 px-2 min-w-[45px] text-center select-none">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomOut}
              title={isAr ? 'تصغير' : 'Zoom Out'}
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-800 mx-1" />
            <button
              onClick={handleResetZoom}
              title={isAr ? 'إعادة ضبط' : 'Reset View'}
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Close Modal Button */}
          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
            title={isAr ? 'إغلاق (Esc)' : 'Close (Esc)'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. Main Work Area (Canvas + Sidebar) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Canvas Section */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'none' }}
          className={`flex-1 relative bg-slate-950 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing ${
            mobileTab === 'issues' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {!isImage ? (
            <div className="text-center py-20 px-6 max-w-md">
              <Layers className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">
                {isAr ? 'معاينة التكبير الحية تتوفر للمستندات الصور (JPG / PNG)' : 'Live zoom preview is supported for image formats (JPG / PNG)'}
              </h4>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                {isAr
                  ? 'يمكنك تنزيل المخطط الأصلي لمعاينته بتطبيق PDF الخارجي أو إضافة الملاحظات الميدانية هنا.'
                  : 'Download the original file to view via PDF viewer.'}
              </p>
              <a
                href={getFileUrl(drawing.file_url || drawing.file_path)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-5 py-2.5 text-xs font-semibold shadow-lg shadow-indigo-600/20"
              >
                {isAr ? 'تنزيل/عرض المخطط الأصلي' : 'Download Original File'}
              </a>
            </div>
          ) : (
            <div
              style={{
                transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${scale})`,
                transformOrigin: 'center center',
                willChange: 'transform',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              }}
              className="relative inline-block"
              onClick={handleCanvasClick}
            >
              {/* Main Drawing Image */}
              <img
                ref={imageRef}
                src={getFileUrl(drawing.file_url || drawing.file_path)}
                alt={drawing.title}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                className="max-w-none max-h-[82vh] md:max-h-[86vh] object-contain shadow-2xl pointer-events-auto rounded-md select-none"
              />

              {/* Temporary Pin Marker when creating issue */}
              {tempPin && isCreateDialogOpen && (
                <div
                  style={{ left: `${tempPin.x}%`, top: `${tempPin.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-full z-30 pointer-events-none animate-bounce"
                >
                  <MapPin className="w-9 h-9 text-rose-500 fill-rose-500/40 drop-shadow-[0_4px_12px_rgba(244,63,94,0.8)]" />
                </div>
              )}

              {/* Existing Pins */}
              {drawingIssues.map((issue) => {
                if (issue.pin_x == null || issue.pin_y == null) return null;

                const priorityInfo = PRIORITY_BADGES[issue.priority] || PRIORITY_BADGES.medium;
                const isSelected = selectedIssueId === issue.id;

                return (
                  <div
                    key={issue.id}
                    style={{ left: `${issue.pin_x}%`, top: `${issue.pin_y}%` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectIssue(issue);
                      if (window.innerWidth < 768) {
                        setMobileTab('issues');
                      }
                    }}
                    className={`pin-element absolute -translate-x-1/2 -translate-y-full z-20 cursor-pointer transition-transform duration-200 hover:scale-125 ${
                      isSelected ? 'scale-125 z-40' : ''
                    }`}
                  >
                    <div className="relative group">
                      <MapPin className={`w-8 h-8 drop-shadow-lg text-white ${priorityInfo.pinBg}`} />
                      <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white">
                        {issue.issue_number.replace('ISS-', '')}
                      </span>

                      {/* Floating tooltip on desktop hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-lg shadow-xl border border-slate-700 whitespace-nowrap z-50">
                        {issue.issue_number}: {issue.title}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Notes Sidebar (Right side for Arabic RTL) */}
        <aside
          className={`w-full md:w-[380px] bg-slate-900 border-t md:border-t-0 md:border-r border-slate-800 flex flex-col shrink-0 overflow-hidden ${
            mobileTab === 'canvas' ? 'hidden md:flex' : 'flex flex-1'
          }`}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-900/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <h4 className="font-semibold text-white text-xs uppercase tracking-wider">
                  {isAr ? 'ملاحظات وعيوب المخطط' : 'Drawing Issues & Notes'}
                </h4>
              </div>
              <span className="text-xs font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-lg">
                {drawingIssues.length}
              </span>
            </div>

            {/* Search & Filter Controls */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'بحث في الملاحظات...' : 'Search notes...'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-8 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">{isAr ? 'الكل' : 'All Status'}</option>
                <option value="new">{isAr ? 'جديدة' : 'New'}</option>
                <option value="in_progress">{isAr ? 'قيد التنفيذ' : 'In Progress'}</option>
                <option value="pending_review">{isAr ? 'قيد المراجعة' : 'Pending Review'}</option>
                <option value="closed">{isAr ? 'مغلقة' : 'Closed'}</option>
              </select>
            </div>
          </div>

          {/* Issue Cards Scrollable List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {filteredIssues.length === 0 ? (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs">
                  {searchQuery || statusFilter !== 'all'
                    ? isAr ? 'لا يوجد نتائج تطابق البحث' : 'No matching issues found'
                    : isAr ? 'انقر على المخطط لإضافة أول ملاحظة ميدانية.' : 'Click drawing canvas to add first issue pin.'}
                </p>
              </div>
            ) : (
              filteredIssues.map((issue) => {
                const isSelected = selectedIssueId === issue.id;
                const priorityInfo = PRIORITY_BADGES[issue.priority] || PRIORITY_BADGES.medium;
                const statusInfo = STATUS_MAP[issue.status] || STATUS_MAP.new;

                return (
                  <div
                    key={issue.id}
                    onClick={() => handleSelectIssue(issue)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                      isSelected
                        ? 'bg-indigo-600/10 border-indigo-500/50 shadow-lg ring-1 ring-indigo-500/30'
                        : 'bg-slate-950/70 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Header: Number & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          {issue.issue_number}
                        </span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${priorityInfo.bg}`}>
                          {priorityInfo.label}
                        </span>
                      </div>

                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${statusInfo.bg}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h5 className="text-xs font-semibold text-white leading-snug">{issue.title}</h5>
                      {issue.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {issue.description}
                        </p>
                      )}
                    </div>

                    {/* Expanded Note Actions if selected */}
                    {isSelected && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-2 text-[11px] animate-in fade-in duration-150">
                        <div className="grid grid-cols-2 gap-2 text-slate-400">
                          <div className="flex items-center gap-1 truncate">
                            <UserIcon className="w-3 h-3 text-indigo-400 shrink-0" />
                            <span className="truncate">
                              {issue.assigned_user?.name || issue.assigned_user?.first_name || (isAr ? 'غير محدد' : 'Unassigned')}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 truncate">
                            <HardHat className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="truncate">{issue.contractor_name || (isAr ? 'غير محدد' : 'N/A')}</span>
                          </div>
                        </div>

                        {/* Status Change Selector & Compare Photos */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <select
                            disabled={updatingStatusId === issue.id}
                            value={issue.status}
                            onChange={(e) => handleUpdateStatus(issue.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            <option value="new">{isAr ? 'جديدة' : 'New'}</option>
                            <option value="in_progress">{isAr ? 'قيد التنفيذ' : 'In Progress'}</option>
                            <option value="pending_review">{isAr ? 'قيد المراجعة' : 'Pending Review'}</option>
                            <option value="closed">{isAr ? 'مغلقة' : 'Closed'}</option>
                          </select>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCompareModalIssue(issue);
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>{isAr ? 'الصور' : 'Photos'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>

      {/* 4. Mobile Bottom Switcher Bar (< md screens) */}
      <div className="md:hidden bg-slate-900 border-t border-slate-800 p-2 flex items-center justify-around z-30 shrink-0">
        <button
          onClick={() => setMobileTab('canvas')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors ${
            mobileTab === 'canvas'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{isAr ? 'المخطط التفاعلي' : 'Drawing View'}</span>
        </button>

        <button
          onClick={() => setMobileTab('issues')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors ${
            mobileTab === 'issues'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <List className="w-4 h-4" />
          <span>{isAr ? 'الملاحظات والعيوب' : 'Notes List'}</span>
          <span className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded text-[10px] font-mono">
            {drawingIssues.length}
          </span>
        </button>
      </div>

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
          setSelectedIssueId(newIssue.id);
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
