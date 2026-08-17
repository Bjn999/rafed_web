'use client';

import React, { useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { WbsItemData } from './WbsItemModal';
import { Calendar, User as UserIcon, CheckCircle2, Clock, AlertTriangle, Layers } from 'lucide-react';

interface WbsGanttViewProps {
  items: WbsItemData[];
  onEditItem?: (item: WbsItemData) => void;
}

export default function WbsGanttView({ items, onEditItem }: WbsGanttViewProps) {
  const { isAr } = useLanguage();

  // Compute timeline boundaries
  const { startDate, totalDays, dayColumns } = useMemo(() => {
    let minDate = new Date();
    let maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // default +30 days

    const validDates: number[] = [];
    items.forEach((item) => {
      if (item.start_date) validDates.push(new Date(item.start_date).getTime());
      if (item.end_date) validDates.push(new Date(item.end_date).getTime());
    });

    if (validDates.length > 0) {
      minDate = new Date(Math.min(...validDates));
      maxDate = new Date(Math.max(...validDates));
    }

    // Add 2 days padding before and 5 days after
    minDate.setDate(minDate.getDate() - 2);
    maxDate.setDate(maxDate.getDate() + 5);

    const totalTime = maxDate.getTime() - minDate.getTime();
    const days = Math.max(15, Math.ceil(totalTime / (1000 * 3600 * 24)));

    // Generate date columns (1 per day or aggregated every 3 days if > 60 days)
    const step = days > 90 ? 7 : days > 45 ? 3 : 1;
    const cols: { date: Date; label: string }[] = [];

    for (let i = 0; i < days; i += step) {
      const d = new Date(minDate);
      d.setDate(d.getDate() + i);
      cols.push({
        date: d,
        label: d.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' }),
      });
    }

    return {
      startDate: minDate,
      totalDays: days,
      dayColumns: cols,
    };
  }, [items, isAr]);

  const getBarStyle = (item: WbsItemData) => {
    const itemStart = item.start_date ? new Date(item.start_date) : startDate;
    const itemEnd = item.end_date
      ? new Date(item.end_date)
      : new Date(itemStart.getTime() + 7 * 24 * 3600 * 1000); // 7 days default

    const startDiffDays = Math.max(0, (itemStart.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    const durationDays = Math.max(1, (itemEnd.getTime() - itemStart.getTime()) / (1000 * 3600 * 24));

    const leftPercent = (startDiffDays / totalDays) * 100;
    const widthPercent = (durationDays / totalDays) * 100;

    return {
      left: `${Math.min(95, Math.max(0, leftPercent))}%`,
      width: `${Math.min(100 - leftPercent, Math.max(3, widthPercent))}%`,
    };
  };

  const getBarColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500 border-emerald-400';
      case 'in_progress':
        return 'bg-indigo-600 border-indigo-400';
      case 'on_hold':
        return 'bg-amber-500 border-amber-400';
      case 'delayed':
        return 'bg-rose-600 border-rose-400';
      default:
        return 'bg-slate-700 border-slate-600';
    }
  };

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in duration-300" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Header Banner */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{isAr ? 'مخطط جانت الزمني (Gantt Chart Roadmap)' : 'Gantt Chart Timeline'}</h3>
            <p className="text-[11px] text-slate-400">{isAr ? 'عرض الفترات الزمنية ومسار الإنجاز لكافة الأنشطة' : 'Activity schedules and progress timeline'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-[10px] font-semibold text-slate-400">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> {isAr ? 'قيد التنفيذ' : 'In Progress'}</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> {isAr ? 'مكتمل' : 'Completed'}</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-600" /> {isAr ? 'متأخر' : 'Delayed'}</div>
        </div>
      </div>

      {/* Gantt Container */}
      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-[850px]">
          
          {/* Timeline Header Columns */}
          <div className="flex border-b border-slate-800 bg-slate-950/40 text-[11px] font-bold text-slate-400">
            {/* Task Name Sidebar Header */}
            <div className="w-64 sm:w-72 p-3 shrink-0 border-e border-slate-800">
              {isAr ? 'اسم البند / النشاط' : 'Activity Name'}
            </div>

            {/* Dates Bar Header */}
            <div className="flex-1 flex items-center justify-between px-2 overflow-hidden">
              {dayColumns.map((col, idx) => (
                <div key={idx} className="text-center truncate px-1 text-[10px] font-mono text-slate-500">
                  {col.label}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-800/60">
            {items.length > 0 ? (
              items.map((item) => {
                const barPos = getBarStyle(item);
                const barColor = getBarColor(item.status);

                return (
                  <div
                    key={item.id}
                    onClick={() => onEditItem && onEditItem(item)}
                    className="flex items-center hover:bg-slate-850/50 transition-colors group cursor-pointer"
                  >
                    {/* Left Sidebar Task info */}
                    <div className="w-64 sm:w-72 p-3 shrink-0 border-e border-slate-800/80 flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                        {item.code || `#${item.id}`}
                      </span>
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

                      {/* Floating Progress Bar */}
                      <div
                        className={`absolute h-7 rounded-xl border shadow-md flex items-center px-2 text-[10px] text-white font-bold transition-all ${barColor}`}
                        style={barPos}
                        title={`${item.name} (${item.progress}%) - ${item.start_date || 'No Start'} to ${item.end_date || 'No End'}`}
                      >
                        {/* Progress Fill inside the bar */}
                        <div
                          className="absolute inset-y-0 left-0 bg-white/20 rounded-xl"
                          style={{ width: `${item.progress}%` }}
                        />
                        <span className="relative z-10 truncate font-mono drop-shadow">
                          {item.name} ({item.progress}%)
                        </span>
                      </div>
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
  );
}
