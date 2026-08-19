'use client';

import React, { useMemo, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { WbsItemData } from './WbsItemModal';
import { Calendar, User as UserIcon, CheckCircle2, Clock, AlertTriangle, Layers, ZoomIn } from 'lucide-react';

interface WbsGanttViewProps {
  items: WbsItemData[];
  onEditItem?: (item: WbsItemData) => void;
  projectStartDate?: string | null;
  projectEndDate?: string | null;
  dependencies?: any[];
}

export default function WbsGanttView({
  items,
  onEditItem,
  projectStartDate,
  projectEndDate,
  dependencies = [],
}: WbsGanttViewProps) {
  const { isAr } = useLanguage();
  const [zoomMode, setZoomMode] = useState<'auto' | '5days' | '10days' | 'monthly'>('auto');

  // Compute timeline boundaries and interval columns
  const { startDate, endDate, totalDays, dayColumns } = useMemo(() => {
    let minDate: Date;
    let maxDate: Date;

    // Use project dates if explicitly provided
    if (projectStartDate && !isNaN(new Date(projectStartDate).getTime())) {
      minDate = new Date(projectStartDate);
    } else {
      minDate = new Date();
    }

    if (projectEndDate && !isNaN(new Date(projectEndDate).getTime())) {
      maxDate = new Date(projectEndDate);
    } else {
      maxDate = new Date(minDate);
      maxDate.setDate(maxDate.getDate() + 30);
    }

    // Fallback adjustment if project dates are missing or invalid
    if (!projectStartDate || !projectEndDate) {
      const validDates: number[] = [];
      items.forEach((item) => {
        if (item.start_date) validDates.push(new Date(item.start_date).getTime());
        if (item.end_date) validDates.push(new Date(item.end_date).getTime());
      });

      if (validDates.length > 0) {
        const minTaskDate = Math.min(...validDates);
        const maxTaskDate = Math.max(...validDates);
        if (!projectStartDate) minDate = new Date(minTaskDate);
        if (!projectEndDate) maxDate = new Date(maxTaskDate);
      }
    }

    // Ensure maxDate is after minDate
    if (maxDate.getTime() <= minDate.getTime()) {
      maxDate = new Date(minDate);
      maxDate.setDate(maxDate.getDate() + 7);
    }

    const totalTime = maxDate.getTime() - minDate.getTime();
    let days = Math.max(1, Math.ceil(totalTime / (1000 * 3600 * 24)));

    // Calculate step interval based on duration or user zoom preference
    let step = 10;
    if (zoomMode === '5days') {
      step = 5;
    } else if (zoomMode === '10days') {
      step = 10;
    } else if (zoomMode === 'monthly') {
      step = 30;
    } else {
      // Auto step calculation for legibility
      if (days <= 15) step = 2;
      else if (days <= 45) step = 5;
      else if (days <= 90) step = 10;
      else if (days <= 180) step = 15;
      else step = 30;
    }

    const cols: { date: Date; label: string }[] = [];
    for (let i = 0; i <= days; i += step) {
      const d = new Date(minDate);
      d.setDate(d.getDate() + i);
      cols.push({
        date: d,
        label: d.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short' }),
      });
    }

    return {
      startDate: minDate,
      endDate: maxDate,
      totalDays: Math.max(1, days),
      dayColumns: cols,
    };
  }, [items, projectStartDate, projectEndDate, zoomMode, isAr]);

  const getTaskLayoutValues = (item: WbsItemData) => {
    const itemStart = item.start_date ? new Date(item.start_date) : startDate;
    const itemEnd = item.end_date
      ? new Date(item.end_date)
      : new Date(itemStart.getTime() + 7 * 24 * 3600 * 1000);

    const startDiffDays = (itemStart.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
    const durationDays = Math.max(1, (itemEnd.getTime() - itemStart.getTime()) / (1000 * 3600 * 24));

    const startPercent = (startDiffDays / totalDays) * 100;
    const durationPercent = (durationDays / totalDays) * 100;

    const widthPercent = Math.min(100, Math.max(2, durationPercent));

    if (isAr) {
      const rightVal = Math.min(98, Math.max(0, startPercent));
      return { start: rightVal, width: Math.min(100 - rightVal, widthPercent) };
    } else {
      const leftVal = Math.min(98, Math.max(0, startPercent));
      return { start: leftVal, width: Math.min(100 - leftVal, widthPercent) };
    }
  };

  const getTaskLayout = (item: WbsItemData) => {
    const vals = getTaskLayoutValues(item);
    if (isAr) {
      return {
        style: {
          right: `${vals.start}%`,
          width: `${vals.width}%`,
        },
      };
    } else {
      return {
        style: {
          left: `${vals.start}%`,
          width: `${vals.width}%`,
        },
      };
    }
  };

  const getBarColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-600 border-emerald-400 text-white';
      case 'in_progress':
        return 'bg-indigo-600 border-indigo-400 text-white';
      case 'on_hold':
        return 'bg-amber-600 border-amber-400 text-white';
      case 'delayed':
        return 'bg-rose-600 border-rose-400 text-white';
      default:
        return 'bg-slate-700 border-slate-600 text-slate-200';
    }
  };

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in duration-300" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Header Banner */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{isAr ? 'مخطط جانت الزمني (Gantt Chart Roadmap)' : 'Gantt Chart Roadmap'}</span>
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                {totalDays} {isAr ? 'يوم' : 'days'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {isAr ? 'نطاق المخطط محصور بتاريخ بداية ونهاية المشروع بالتحديد، مع التكبير والتلميحات عند الحواف' : 'Timeline bounded strictly by project start and end dates with edge hover tooltips'}
            </p>
          </div>
        </div>

        {/* Zoom Controls & Legend */}
        <div className="flex flex-wrap items-center gap-3">

          {/* Zoom Mode Selector */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl text-[10px]">
            <ZoomIn className="w-3.5 h-3.5 text-slate-400 ms-1" />
            <button
              onClick={() => setZoomMode('auto')}
              className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${zoomMode === 'auto' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
            >
              {isAr ? 'تلقائي' : 'Auto'}
            </button>
            <button
              onClick={() => setZoomMode('5days')}
              className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${zoomMode === '5days' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
            >
              {isAr ? 'كل 5 أيام' : '5 Days'}
            </button>
            <button
              onClick={() => setZoomMode('10days')}
              className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${zoomMode === '10days' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
            >
              {isAr ? 'كل 10 أيام' : '10 Days'}
            </button>
            <button
              onClick={() => setZoomMode('monthly')}
              className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${zoomMode === 'monthly' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
            >
              {isAr ? 'شهري' : 'Monthly'}
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-3 text-[10px] font-semibold text-slate-400 border-s border-slate-800 ps-3">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> {isAr ? 'قيد التنفيذ' : 'In Progress'}</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> {isAr ? 'مكتمل' : 'Completed'}</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-600" /> {isAr ? 'متأخر' : 'Delayed'}</div>
            <div className="flex items-center gap-1.5"><span className="text-amber-400 font-bold">◆</span> {isAr ? 'معلم' : 'Milestone'}</div>
          </div>

        </div>
      </div>

      {/* Gantt Container */}
      <div className="overflow-x-auto touch-scroll no-scrollbar">
        <div className="min-w-[750px] sm:min-w-[900px]">

          {/* Timeline Header Columns */}
          <div className="flex border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-slate-400">

            {/* Task Name Sidebar Header */}
            <div className="w-48 sm:w-72 p-3 shrink-0 border-e border-slate-800 flex items-center justify-between">
              <span>{isAr ? 'اسم البند / النشاط' : 'Activity Name'}</span>
              <span className="text-[10px] text-slate-500 font-mono">({items.length})</span>
            </div>

            {/* Dates Bar Header (Aggregated Scale) */}
            <div className="flex-1 flex items-center justify-between px-3 overflow-hidden">
              {dayColumns.map((col, idx) => (
                <div key={idx} className="text-center truncate px-1 text-[10px] font-mono text-indigo-300/90 font-bold">
                  {col.label}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div className="relative">
            {/* The SVG Overlay Container (Mimics a row layout but covers all height) */}
            <div className="absolute inset-0 flex pointer-events-none z-20" style={{ height: `${items.length * 49}px` }}>
              <div className="w-48 sm:w-72 shrink-0 border-e border-transparent" />
              <div className="flex-1 relative">
                {dependencies.length > 0 && items.length > 0 && (
                  <svg className="absolute inset-0 w-full h-full">
                    <defs>
                      <marker id="arrow-end" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                        <path d="M0,0 L10,5 L0,10 z" fill="#818cf8" />
                      </marker>
                      <marker id="arrow-end-rtl" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M0,0 L10,5 L0,10 z" fill="#818cf8" />
                      </marker>
                    </defs>
                    {dependencies.map(dep => {
                      const predIndex = items.findIndex(i => i.id === dep.predecessor_id);
                      const succIndex = items.findIndex(i => i.id === dep.successor_id);
                      if (predIndex === -1 || succIndex === -1) return null;

                      const predLayout = getTaskLayoutValues(items[predIndex]);
                      const succLayout = getTaskLayoutValues(items[succIndex]);

                      // Approximate Y centers (49px per row)
                      const y1 = predIndex * 49 + 24.5;
                      const y2 = succIndex * 49 + 24.5;

                      let x1, x2;

                      if (isAr) {
                        // In RTL, "start" is from the right edge. So X from left is 100 - start.
                        if (dep.type === 'FS' || !dep.type) {
                          x1 = 100 - (predLayout.start + predLayout.width);
                          x2 = 100 - succLayout.start;
                        } else if (dep.type === 'SS') {
                          x1 = 100 - predLayout.start;
                          x2 = 100 - succLayout.start;
                        } else if (dep.type === 'FF') {
                          x1 = 100 - (predLayout.start + predLayout.width);
                          x2 = 100 - (succLayout.start + succLayout.width);
                        } else { // SF
                          x1 = 100 - predLayout.start;
                          x2 = 100 - (succLayout.start + succLayout.width);
                        }
                      } else {
                        // In LTR, "start" is from the left edge.
                        if (dep.type === 'FS' || !dep.type) {
                          x1 = predLayout.start + predLayout.width;
                          x2 = succLayout.start;
                        } else if (dep.type === 'SS') {
                          x1 = predLayout.start;
                          x2 = succLayout.start;
                        } else if (dep.type === 'FF') {
                          x1 = predLayout.start + predLayout.width;
                          x2 = succLayout.start + succLayout.width;
                        } else { // SF
                          x1 = predLayout.start;
                          x2 = succLayout.start + succLayout.width;
                        }
                      }

                      // Since <path> doesn't support percentage coords, we use <line> or <polyline>.
                      // A single straight <line> is the most robust cross-browser way using percentages.
                      // Wait, we can draw a 3-part stepped line using three <line> elements.
                      const xMid = (x1 + x2) / 2;

                      return (
                        <g key={dep.id}>
                          <line x1={`${x1}%`} y1={y1} x2={`${xMid}%`} y2={y1} stroke="#818cf8" strokeWidth="1.5" strokeOpacity="0.8" strokeDasharray="4 2" />
                          <line x1={`${xMid}%`} y1={y1} x2={`${xMid}%`} y2={y2} stroke="#818cf8" strokeWidth="1.5" strokeOpacity="0.8" strokeDasharray="4 2" />
                          <line x1={`${xMid}%`} y1={y2} x2={`${x2}%`} y2={y2} stroke="#818cf8" strokeWidth="1.5" strokeOpacity="0.8" strokeDasharray="4 2" markerEnd={`url(#${isAr ? 'arrow-end-rtl' : 'arrow-end'})`} />
                        </g>
                      );
                    })}
                  </svg>
                )}
              </div>
            </div>

            <div className="divide-y divide-slate-800/60 relative z-10">

              {items.length > 0 ? (
                items.map((item) => {
                  const barLayout = getTaskLayout(item);
                  const barColor = getBarColor(item.status);
                  const isMilestone = Boolean(item.is_milestone);

                  return (
                    <div
                      key={item.id}
                      onClick={() => onEditItem && onEditItem(item)}
                      className="flex items-center hover:bg-slate-850/50 transition-colors group cursor-pointer"
                    >
                      {/* Left Sidebar Task info */}
                      <div className="w-48 sm:w-72 p-3 shrink-0 border-e border-slate-800/80 flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                          {item.code || `#${item.id}`}
                        </span>
                        {isMilestone && (
                          <span className="text-amber-400 font-bold text-xs shrink-0" title={isAr ? 'معلم رئيسي' : 'Milestone'}>◆</span>
                        )}
                        <span className="text-xs font-semibold text-white truncate flex-1">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono font-bold">
                          {item.progress}%
                        </span>
                      </div>

                      {/* Timeline Canvas Bar Area */}
                      <div className="flex-1 relative h-12 flex items-center px-2">

                        {/* Grid background lines */}
                        <div className="absolute inset-0 flex justify-between pointer-events-none opacity-10">
                          {dayColumns.map((_, i) => (
                            <div key={i} className="border-e border-slate-400 h-full" />
                          ))}
                        </div>

                        {/* Floating Bar or Milestone Diamond with Hover Date Badges */}
                        {isMilestone ? (
                          <div
                            className="absolute flex items-center gap-1.5 -translate-x-1/2 cursor-pointer z-10 group/bar"
                            style={barLayout.style}
                          >
                            <div className="w-6 h-6 rotate-45 bg-amber-500 border-2 border-amber-300 shadow-lg shadow-amber-500/30 flex items-center justify-center shrink-0" />
                            <span className="text-[10px] font-bold text-amber-300 bg-slate-900/90 border border-amber-500/30 px-2 py-0.5 rounded-full whitespace-nowrap shadow-md">
                              {item.name} ({item.start_date || (isAr ? 'غير محدد' : 'No Date')})
                            </span>
                          </div>
                        ) : (
                          <div
                            className={`absolute h-7 rounded-xl border shadow-md flex items-center px-2 text-[10px] font-bold transition-all group/bar hover:z-30 hover:ring-2 hover:ring-indigo-400/50 ${barColor}`}
                            style={barLayout.style}
                          >
                            {/* Progress Fill inside the bar */}
                            <div
                              className="absolute inset-y-0 left-0 bg-white/20 rounded-xl"
                              style={{ width: `${item.progress}%` }}
                            />

                            <span className="relative z-10 truncate font-mono drop-shadow">
                              {item.name} ({item.progress}%)
                            </span>

                            {/* Hover Start Date Badge (Top-Start Edge) */}
                            <div className={`absolute -top-8 ${isAr ? 'right-0 -mr-1' : 'left-0 -ml-1'} bg-slate-950/95 border border-indigo-500/80 text-indigo-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-lg shadow-2xl opacity-0 group-hover/bar:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50 flex items-center gap-1`}>
                              <span className="text-indigo-400">▶</span> {isAr ? 'بدء:' : 'Start:'} {item.start_date || (isAr ? 'غير محدد' : 'N/A')}
                            </div>

                            {/* Hover End Date Badge (Bottom-End Edge) */}
                            <div className={`absolute -bottom-8 ${isAr ? 'left-0 -ml-1' : 'right-0 -mr-1'} bg-slate-950/95 border border-emerald-500/80 text-emerald-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-lg shadow-2xl opacity-0 group-hover/bar:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50 flex items-center gap-1`}>
                              {isAr ? 'نهاية:' : 'End:'} {item.end_date || (isAr ? 'غير محدد' : 'N/A')} <span className="text-emerald-400">🏁</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs font-semibold">
                  {isAr ? 'لا يوجد أنشطة مضافة لعرضها في خطة جانت.' : 'No activities added to display in Gantt chart.'}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
