'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import {
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  X,
  ClipboardCopy,
  ClipboardCheck
} from 'lucide-react';

interface TenantItem {
  id: string;
  name: string;
}

interface SystemLogItem {
  id: number;
  tenant_id: string | null;
  user_id: number | null;
  endpoint: string;
  method: string;
  payload: any;
  response: any;
  status_code: number;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  tenant?: {
    name: string;
  };
  user?: {
    email: string;
    profile?: {
      first_name: string;
      last_name: string;
    };
  };
}

export default function AdminLogsPage() {
  const { user: authUser } = useAuth();
  const { t, isAr } = useLanguage();

  // --- Logs Tab States ---
  const [logPage, setLogPage] = useState(1);
  const [logSearch, setLogSearch] = useState('');
  const [logMethod, setLogMethod] = useState('');
  const [logStatusCode, setLogStatusCode] = useState('');
  const [logTenantId, setLogTenantId] = useState('');
  const [logDateFrom, setLogDateFrom] = useState('');
  const [logDateTo, setLogDateTo] = useState('');
  const [debouncedLogSearch, setDebouncedLogSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<SystemLogItem | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);

  // Debounce log search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedLogSearch(logSearch);
      setLogPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [logSearch]);

  // Fetch Tenants for filter
  const { data: tenantsListForFilter } = useQuery({
    queryKey: ['admin-tenants-list-filter'],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        data: {
          data: TenantItem[];
        };
      }>('/system-admin/tenants', { params: { per_page: '100' } });
      return response.data.data;
    },
    enabled: !!authUser && authUser.role === 'system_admin',
  });

  // Fetch Paginated Logs
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['admin-logs', logPage, debouncedLogSearch, logMethod, logStatusCode, logTenantId, logDateFrom, logDateTo],
    queryFn: async () => {
      const params: Record<string, string> = {
        page: logPage.toString(),
      };
      if (debouncedLogSearch) params.search = debouncedLogSearch;
      if (logMethod) params.method = logMethod;
      if (logStatusCode) params.status_code = logStatusCode;
      if (logTenantId) params.tenant_id = logTenantId;
      if (logDateFrom) params.date_from = logDateFrom;
      if (logDateTo) params.date_to = logDateTo;

      const response = await api.get<{
        success: boolean;
        data: {
          data: SystemLogItem[];
          current_page: number;
          last_page: number;
          total: number;
        };
      }>('/system-admin/logs', { params });
      return response.data;
    },
    enabled: !!authUser && authUser.role === 'system_admin',
  });

  const handleCopy = (text: any, type: 'payload' | 'response') => {
    const stringified = typeof text === 'object' ? JSON.stringify(text, null, 2) : text;
    navigator.clipboard.writeText(stringified || '');
    if (type === 'payload') {
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    } else {
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2000);
    }
    toast.add({
      title: isAr ? 'تم النسخ' : 'Copied',
      description: isAr ? 'تم نسخ محتوى البيانات إلى الحافظة بنجاح.' : 'Data content copied to clipboard.',
      type: 'success',
    });
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat(isAr ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(date);
    } catch (e) {
      return dateStr;
    }
  };

  const getMethodBadgeClass = (m: string) => {
    switch (m.toUpperCase()) {
      case 'GET': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'POST': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'PUT': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'DELETE': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-slate-500/10 text-muted-foreground border-slate-500/20';
    }
  };

  const getStatusBadgeClass = (code: number) => {
    if (code >= 200 && code < 300) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (code >= 400 && code < 500) return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    if (code >= 500) return 'bg-red-500/10 text-red-400 border-red-500/20';
    return 'bg-slate-500/10 text-muted-foreground border-slate-500/20';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Filters Card */}
      <Card className="border-border bg-card backdrop-blur text-foreground">
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">{isAr ? 'بحث بالمسار (Path)' : 'Search by Path URL'}</label>
              <div className="relative">
                <Search className={`w-4 h-4 text-muted-foreground absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2`} />
                <input
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder={isAr ? 'مثال: profile' : 'e.g. profile'}
                  className={`w-full bg-background/80 border border-border focus:border-indigo-500 rounded-xl ${isAr ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2 text-sm text-foreground placeholder-slate-655 outline-none transition-all`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">{isAr ? 'حسب الشركة' : 'By Company'}</label>
              <select
                value={logTenantId}
                onChange={(e) => { setLogTenantId(e.target.value); setLogPage(1); }}
                className="w-full bg-background/80 border border-border focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-foreground outline-none transition-all cursor-pointer"
              >
                <option value="">{isAr ? 'الكل' : 'All'}</option>
                <option value="system_logs">{isAr ? 'الأنظمة الخلفية (مسؤولين)' : 'System Core Services (Admin)'}</option>
                {tenantsListForFilter?.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">{isAr ? 'طريقة الطلب' : 'Request Method'}</label>
              <select
                value={logMethod}
                onChange={(e) => { setLogMethod(e.target.value); setLogPage(1); }}
                className="w-full bg-background/80 border border-border focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-foreground outline-none transition-all cursor-pointer"
              >
                <option value="">{isAr ? 'الكل' : 'All'}</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">{isAr ? 'الاستجابة' : 'Response Status'}</label>
              <select
                value={logStatusCode}
                onChange={(e) => { setLogStatusCode(e.target.value); setLogPage(1); }}
                className="w-full bg-background/80 border border-border focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-foreground outline-none transition-all cursor-pointer"
              >
                <option value="">{isAr ? 'الكل' : 'All'}</option>
                <option value="success">{isAr ? 'ناجح (2xx)' : 'Success (2xx)'}</option>
                <option value="client_error">{isAr ? 'خطأ مستخدم (4xx)' : 'Client Error (4xx)'}</option>
                <option value="server_error">{isAr ? 'خطأ خادم (5xx)' : 'Server Error (5xx)'}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">{isAr ? 'نطاق التاريخ' : 'Date Range'}</label>
              <div className="flex gap-1.5">
                <input
                  type="date"
                  value={logDateFrom}
                  onChange={(e) => { setLogDateFrom(e.target.value); setLogPage(1); }}
                  className="w-1/2 bg-background/80 border border-border focus:border-indigo-500 rounded-xl px-2 py-1.5 text-xs text-slate-200 outline-none [color-scheme:dark]"
                />
                <input
                  type="date"
                  value={logDateTo}
                  onChange={(e) => { setLogDateTo(e.target.value); setLogPage(1); }}
                  className="w-1/2 bg-background/80 border border-border focus:border-indigo-500 rounded-xl px-2 py-1.5 text-xs text-slate-200 outline-none [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          {/* Reset Filters */}
          {(logSearch || logMethod || logStatusCode || logTenantId || logDateFrom || logDateTo) && (
            <div className="flex justify-end pt-2 border-t border-border">
              <Button
                onClick={() => {
                  setLogSearch('');
                  setLogMethod('');
                  setLogStatusCode('');
                  setLogTenantId('');
                  setLogDateFrom('');
                  setLogDateTo('');
                  setLogPage(1);
                }}
                variant="ghost"
                className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-1.5 rounded-lg h-8 px-3 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                {isAr ? 'إلغاء التصفية' : 'Reset Filters'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs Table Card */}
      <Card className="border-border bg-card backdrop-blur text-foreground overflow-hidden">
        <div className="overflow-x-auto min-h-[350px]">
          <table className={`w-full ${isAr ? 'text-right' : 'text-left'} border-collapse`}>
            <thead>
              <tr className="border-b border-border bg-card text-muted-foreground text-xs font-semibold">
                <th className="px-6 py-4">{isAr ? 'التاريخ والوقت' : 'Timestamp'}</th>
                <th className="px-6 py-4">{isAr ? 'الشركة' : 'Company'}</th>
                <th className="px-6 py-4">{isAr ? 'المستخدم' : 'Executing User'}</th>
                <th className="px-6 py-4">{isAr ? 'الميثود' : 'Method'}</th>
                <th className="px-6 py-4">{isAr ? 'المسار' : 'Endpoint URL'}</th>
                <th className="px-6 py-4 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="px-6 py-4">{isAr ? 'العنوان IP' : 'IP Address'}</th>
                <th className="px-6 py-4 text-center">{isAr ? 'العملية' : 'Audit Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {logsLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-36" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-28" /></td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-muted rounded w-24" />
                      <div className="h-3 bg-muted rounded w-16 mt-1" />
                    </td>
                    <td className="px-6 py-4"><div className="h-6 bg-muted rounded w-14" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-40" /></td>
                    <td className="px-6 py-4"><div className="h-6 bg-muted rounded w-10 mx-auto" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-24" /></td>
                    <td className="px-6 py-4"><div className="h-8 bg-muted rounded w-20 mx-auto" /></td>
                  </tr>
                ))
              ) : !logsData || logsData.data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-muted-foreground space-y-3">
                    <div className="w-12 h-12 bg-muted text-muted-foreground border border-border rounded-2xl flex items-center justify-center mx-auto shadow-md">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-foreground">{isAr ? 'لا توجد سجلات مطابقة' : 'No matching logs found'}</p>
                  </td>
                </tr>
              ) : (
                logsData.data.map((log: SystemLogItem) => (
                  <tr key={log.id} className="hover:bg-muted transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{formatTime(log.created_at)}</td>
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {log.tenant ? log.tenant.name : (
                        <span className="text-indigo-400 bg-indigo-500/10 border border-indigo-500/10 px-2 py-0.5 rounded text-xs font-semibold">
                          {isAr ? 'مسؤول النظام' : 'System Admin'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {log.user ? (
                        <div className="space-y-0.5">
                          <span className="font-medium text-foreground block">
                            {log.user.profile?.first_name} {log.user.profile?.last_name}
                          </span>
                          <span className="text-xs text-muted-foreground block font-mono">{log.user.email}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">{isAr ? 'طلب زائر / ضيف' : 'Guest / Visitor Request'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getMethodBadgeClass(log.method)}`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-indigo-300 max-w-[180px] truncate" title={log.endpoint}>
                      {log.endpoint}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-bold border ${getStatusBadgeClass(log.status_code)}`}>
                        {log.status_code}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{log.ip_address || '—'}</td>
                    <td className="px-6 py-4 text-center">
                      <Button
                        onClick={() => setSelectedLog(log)}
                        variant="ghost"
                        className="hover:bg-indigo-600/20 hover:text-indigo-300 text-indigo-400 border border-transparent hover:border-indigo-500/20 text-xs px-2.5 py-1.5 h-8 rounded-xl transition-all cursor-pointer"
                      >
                        <Eye className={`w-4 h-4 ${isAr ? 'ml-1' : 'mr-1'}`} />
                        {isAr ? 'التفاصيل' : 'Details'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Logs Pagination */}
        {logsData && logsData.last_page > 1 && (
          <div className="border-t border-border bg-card px-6 py-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {isAr ? (
                <>عرض السجلات من <strong>{((logPage - 1) * 15) + 1}</strong> إلى <strong>{Math.min(logPage * 15, logsData.total)}</strong> من إجمالي <strong>{logsData.total}</strong> سجل</>
              ) : (
                <>Showing logs <strong>{((logPage - 1) * 15) + 1}</strong> to <strong>{Math.min(logPage * 15, logsData.total)}</strong> of <strong>{logsData.total}</strong> total</>
              )}
            </span>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setLogPage((prev) => Math.max(prev - 1, 1))}
                disabled={logPage === 1}
                variant="outline"
                className="border-border hover:bg-muted text-foreground p-2 h-9 w-9 rounded-xl transition-all disabled:opacity-30 cursor-pointer"
              >
                {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
              
              <span className="text-xs text-foreground font-bold">
                {isAr ? `صفحة ${logPage} من ${logsData.last_page}` : `Page ${logPage} of ${logsData.last_page}`}
              </span>

              <Button
                onClick={() => setLogPage((prev) => Math.min(prev + 1, logsData.last_page))}
                disabled={logPage === logsData.last_page}
                variant="outline"
                className="border-border hover:bg-muted text-foreground p-2 h-9 w-9 rounded-xl transition-all disabled:opacity-30 cursor-pointer"
              >
                {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* --- LOG DETAILS MODAL --- */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm transition-all animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl w-full max-w-4xl shadow-2xl shadow-indigo-500/5 max-h-[85vh] flex flex-col overflow-hidden transform scale-100 transition-all">
            
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getMethodBadgeClass(selectedLog.method)}`}>
                  {selectedLog.method}
                </span>
                <div className={isAr ? 'text-right' : 'text-left'}>
                  <h3 className="text-sm font-bold text-foreground font-mono">{selectedLog.endpoint}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatTime(selectedLog.created_at)}</p>
                </div>
              </div>
              <Button
                onClick={() => setSelectedLog(null)}
                variant="ghost"
                className="hover:bg-muted text-muted-foreground hover:text-foreground p-2 rounded-xl h-8 w-8 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className={`p-6 overflow-y-auto space-y-6 flex-1 ${isAr ? 'text-right' : 'text-left'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-background/40 border border-border p-4 rounded-2xl">
                  <span className="text-xs text-muted-foreground block mb-1">{isAr ? 'الشركة' : 'Company'}</span>
                  <span className="font-bold text-foreground block text-sm">
                    {selectedLog.tenant ? selectedLog.tenant.name : (isAr ? 'مسؤول النظام' : 'System Admin')}
                  </span>
                </div>
                <div className="bg-background/40 border border-border p-4 rounded-2xl">
                  <span className="text-xs text-muted-foreground block mb-1">{isAr ? 'المستخدم المنفذ' : 'Executing User'}</span>
                  <span className="font-semibold text-foreground block text-sm">
                    {selectedLog.user ? `${selectedLog.user.profile?.first_name} ${selectedLog.user.profile?.last_name}` : (isAr ? 'زائر غير مسجل' : 'Anonymous Guest')}
                  </span>
                  <span className="text-xs text-muted-foreground block font-mono mt-0.5">{selectedLog.user?.email || '—'}</span>
                </div>
                <div className="bg-background/40 border border-border p-4 rounded-2xl">
                  <span className="text-xs text-muted-foreground block mb-1">{isAr ? 'حالة الطلب' : 'Request Status'}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-bold border mt-1 ${getStatusBadgeClass(selectedLog.status_code)}`}>
                    {selectedLog.status_code}
                  </span>
                </div>
                <div className="bg-background/40 border border-border p-4 rounded-2xl">
                  <span className="text-xs text-muted-foreground block mb-1">{isAr ? 'بيانات الاتصال' : 'Connection Details'}</span>
                  <span className="text-sm font-semibold text-foreground block font-mono">{selectedLog.ip_address || '—'}</span>
                  <span className="text-xs text-muted-foreground block truncate mt-0.5" title={selectedLog.user_agent || ''}>
                    {selectedLog.user_agent || '—'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-semibold">{isAr ? 'بيانات الطلب المرسلة (Request Payload)' : 'Request Payload Data'}</span>
                  {selectedLog.payload && Object.keys(selectedLog.payload).length > 0 && (
                    <Button
                      onClick={() => handleCopy(selectedLog.payload, 'payload')}
                      variant="ghost"
                      className="text-indigo-400 hover:text-indigo-300 hover:bg-muted h-7 text-xs px-2.5 rounded-lg cursor-pointer"
                    >
                      {copiedPayload ? <ClipboardCheck className="w-3.5 h-3.5" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
                      <span className={`${isAr ? 'mr-1' : 'ml-1'}`}>{copiedPayload ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ JSON' : 'Copy JSON')}</span>
                    </Button>
                  )}
                </div>
                <pre className="bg-background p-4 rounded-2xl overflow-auto text-xs font-mono text-left max-h-56 border border-border" dir="ltr">
                  {selectedLog.payload && Object.keys(selectedLog.payload).length > 0
                    ? JSON.stringify(selectedLog.payload, null, 2)
                    : (isAr ? '// لا توجد بيانات مرسلة' : '// Empty payload')}
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-semibold">{isAr ? 'استجابة الخادم المستلمة (Response)' : 'Server Response (JSON)'}</span>
                  {selectedLog.response && (
                    <Button
                      onClick={() => handleCopy(selectedLog.response, 'response')}
                      variant="ghost"
                      className="text-indigo-400 hover:text-indigo-300 hover:bg-muted h-7 text-xs px-2.5 rounded-lg cursor-pointer"
                    >
                      {copiedResponse ? <ClipboardCheck className="w-3.5 h-3.5" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
                      <span className={`${isAr ? 'mr-1' : 'ml-1'}`}>{copiedResponse ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ JSON' : 'Copy JSON')}</span>
                    </Button>
                  )}
                </div>
                <pre className="bg-background p-4 rounded-2xl overflow-auto text-xs font-mono text-left max-h-60 border border-border" dir="ltr">
                  {selectedLog.response
                    ? JSON.stringify(selectedLog.response, null, 2)
                    : (isAr ? '// لا توجد استجابة' : '// Empty response')}
                </pre>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border bg-card flex justify-end">
              <Button
                onClick={() => setSelectedLog(null)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 transition-all text-xs cursor-pointer"
              >
                {isAr ? 'إغلاق النافذة' : 'Close'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
