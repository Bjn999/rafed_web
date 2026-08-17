'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import {
  Building2,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface TenantItem {
  id: string;
  name: string;
  domain: string;
  status: 'active' | 'suspended' | 'pending';
  users_count: number;
  created_at: string;
  subscription?: {
    billing_cycle: string;
    starts_at: string;
    ends_at: string;
    status: string;
    plan?: {
      name: string;
      slug: string;
    };
  };
}

export default function AdminTenantsPage() {
  const { user: authUser } = useAuth();
  const { t, isAr } = useLanguage();

  // --- Tenants Tab States ---
  const [tenantPage, setTenantPage] = useState(1);
  const [tenantSearch, setTenantSearch] = useState('');
  const [tenantStatus, setTenantStatus] = useState('');
  const [debouncedTenantSearch, setDebouncedTenantSearch] = useState('');

  // Debounce tenant search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTenantSearch(tenantSearch);
      setTenantPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [tenantSearch]);

  // Fetch Paginated Tenants
  const { data: tenantsData, isLoading: tenantsLoading } = useQuery({
    queryKey: ['admin-tenants', tenantPage, debouncedTenantSearch, tenantStatus],
    queryFn: async () => {
      const params: Record<string, string> = {
        page: tenantPage.toString(),
      };
      if (debouncedTenantSearch) params.search = debouncedTenantSearch;
      if (tenantStatus) params.status = tenantStatus;

      const response = await api.get<{
        success: boolean;
        data: {
          data: TenantItem[];
          current_page: number;
          last_page: number;
          total: number;
        };
      }>('/system-admin/tenants', { params });
      return response.data;
    },
    enabled: !!authUser && authUser.role === 'system_admin',
  });

  const getTenantStatusBadgeClass = (status: string) => {
    if (status === 'active') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (status === 'suspended') return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  };

  const getTenantStatusLabel = (status: string) => {
    if (status === 'active') return isAr ? 'نشط' : 'Active';
    if (status === 'suspended') return isAr ? 'موقوف' : 'Suspended';
    return isAr ? 'معلق' : 'Pending';
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
        hour12: true
      }).format(date);
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Filters Card */}
      <Card className="border-slate-800 bg-slate-900/40 backdrop-blur text-white">
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs text-slate-400 font-medium">{isAr ? 'بحث باسم الشركة أو النطاق' : 'Search by company name or domain'}</label>
              <div className="relative">
                <Search className={`w-4 h-4 text-slate-500 absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2`} />
                <input
                  type="text"
                  value={tenantSearch}
                  onChange={(e) => setTenantSearch(e.target.value)}
                  placeholder={isAr ? 'مثال: شركة المقاولات الحديثة' : 'e.g. Modern Contracting Co.'}
                  className={`w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl ${isAr ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2 text-sm text-slate-100 placeholder-slate-650 outline-none transition-all`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">{isAr ? 'الحالة' : 'Status'}</label>
              <select
                value={tenantStatus}
                onChange={(e) => { setTenantStatus(e.target.value); setTenantPage(1); }}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none transition-all cursor-pointer"
              >
                <option value="">{isAr ? 'الكل' : 'All'}</option>
                <option value="active">{isAr ? 'نشط' : 'Active'}</option>
                <option value="suspended">{isAr ? 'موقوف' : 'Suspended'}</option>
                <option value="pending">{isAr ? 'معلق' : 'Pending'}</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenants Table Card */}
      <Card className="border-slate-800 bg-slate-900/40 backdrop-blur text-white overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className={`w-full ${isAr ? 'text-right' : 'text-left'} border-collapse`}>
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-xs font-semibold">
                <th className="px-6 py-4">{isAr ? 'اسم الشركة' : 'Company Name'}</th>
                <th className="px-6 py-4">{isAr ? 'النطاق (Domain)' : 'Domain Link'}</th>
                <th className="px-6 py-4">{isAr ? 'الباقة' : 'Plan Package'}</th>
                <th className="px-6 py-4 text-center">{isAr ? 'أعضاء الفريق' : 'Team Members'}</th>
                <th className="px-6 py-4 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="px-6 py-4">{isAr ? 'تاريخ الانضمام' : 'Joined At'}</th>
                <th className="px-6 py-4 text-center">{isAr ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {tenantsLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-44" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-36" /></td>
                    <td className="px-6 py-4"><div className="h-6 bg-slate-800 rounded w-20" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-10 mx-auto" /></td>
                    <td className="px-6 py-4"><div className="h-6 bg-slate-800 rounded w-16 mx-auto" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-28" /></td>
                    <td className="px-6 py-4"><div className="h-8 bg-slate-800 rounded w-24 mx-auto" /></td>
                  </tr>
                ))
              ) : !tenantsData || tenantsData.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-500 space-y-2">
                    <p className="font-semibold text-white">{isAr ? 'لا توجد شركات مطابقة' : 'No matching companies found'}</p>
                    <p className="text-xs text-slate-500">{isAr ? 'جرب تعديل شروط البحث والتصفية.' : 'Try adjusting your search and filter criteria.'}</p>
                  </td>
                </tr>
              ) : (
                tenantsData.data.map((tenant: TenantItem) => (
                  <tr key={tenant.id} className="hover:bg-slate-800/10 transition-colors group">
                    <td className="px-6 py-4 font-bold text-white">{tenant.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">{tenant.domain}</td>
                    <td className="px-6 py-4">
                      {tenant.subscription?.plan ? (
                        <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                          {isAr 
                            ? (tenant.subscription.plan.slug === 'basic' ? 'الأساسية' :
                               tenant.subscription.plan.slug === 'professional' ? 'الاحترافية' :
                               tenant.subscription.plan.slug === 'business' ? 'الأعمال' :
                               tenant.subscription.plan.slug === 'enterprise' ? 'المؤسسات' :
                               tenant.subscription.plan.name)
                            : tenant.subscription.plan.name
                          }
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs font-medium">{isAr ? 'بلا باقة' : 'No Plan'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center font-bold font-mono">
                      {tenant.users_count} {isAr ? 'أعضاء' : 'members'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getTenantStatusBadgeClass(tenant.status)}`}>
                        {getTenantStatusLabel(tenant.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                      {formatTime(tenant.created_at)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link href={`/admin/tenants/${tenant.id}`}>
                        <Button
                          variant="ghost"
                          className="hover:bg-indigo-600/20 hover:text-indigo-300 text-indigo-400 border border-indigo-500/10 text-xs px-2.5 py-1.5 h-8 rounded-xl transition-all cursor-pointer mx-auto"
                        >
                          <Eye className={`w-3.5 h-3.5 ${isAr ? 'ml-1' : 'mr-1'}`} />
                          {isAr ? 'تفاصيل الشركة' : 'Company Details'}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Tenants Pagination */}
        {tenantsData && tenantsData.last_page > 1 && (
          <div className="border-t border-slate-800 bg-slate-900/30 px-6 py-4 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {isAr ? (
                <>عرض الشركات من <strong>{((tenantPage - 1) * 15) + 1}</strong> إلى <strong>{Math.min(tenantPage * 15, tenantsData.total)}</strong> من إجمالي <strong>{tenantsData.total}</strong> شركة</>
              ) : (
                <>Showing companies <strong>{((tenantPage - 1) * 15) + 1}</strong> to <strong>{Math.min(tenantPage * 15, tenantsData.total)}</strong> of <strong>{tenantsData.total}</strong> total</>
              )}
            </span>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setTenantPage((prev) => Math.max(prev - 1, 1))}
                disabled={tenantPage === 1}
                variant="outline"
                className="border-slate-800 hover:bg-slate-800 text-slate-300 p-2 h-9 w-9 rounded-xl transition-all disabled:opacity-30 cursor-pointer"
              >
                {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
              
              <span className="text-xs text-slate-300 font-bold">
                {isAr ? `صفحة ${tenantPage} من ${tenantsData.last_page}` : `Page ${tenantPage} of ${tenantsData.last_page}`}
              </span>

              <Button
                onClick={() => setTenantPage((prev) => Math.min(prev + 1, tenantsData.last_page))}
                disabled={tenantPage === tenantsData.last_page}
                variant="outline"
                className="border-slate-800 hover:bg-slate-800 text-slate-300 p-2 h-9 w-9 rounded-xl transition-all disabled:opacity-30 cursor-pointer"
              >
                {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
