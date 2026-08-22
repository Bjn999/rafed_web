'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { useLanguage } from '@/context/LanguageContext';
import { FileText, CheckCircle, XCircle, Clock, Search, X } from 'lucide-react';
import Image from 'next/image';

interface SubscriptionRequest {
  id: number;
  tenant_id: string;
  plan_name: string;
  receipt_path: string;
  type: string;
  status: string;
  created_at: string;
  tenant: {
    name: string;
    name_en: string;
  };
}

export default function AdminSubscriptionsPage() {
  const { isAr } = useLanguage();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  
  // Confirmation Modal States
  const [actionModal, setActionModal] = useState<{type: 'approve' | 'reject', requestId: number} | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: response, isLoading } = useQuery<{ success: boolean; data: SubscriptionRequest[] }>({
    queryKey: ['adminSubscriptionRequests'],
    queryFn: async () => {
      return await api.get('/system-admin/subscription-requests');
    }
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => api.post(`/system-admin/subscription-requests/${id}/approve`),
    onSuccess: () => {
      toast.add({
        title: isAr ? 'تم الموافقة' : 'Approved',
        description: isAr ? 'تم الموافقة على الطلب وتحديث الاشتراك' : 'Request approved and subscription updated.',
        type: 'success',
      });
      setActionModal(null);
      queryClient.invalidateQueries({ queryKey: ['adminSubscriptionRequests'] });
    },
    onError: (error: any) => {
      toast.add({
        title: isAr ? 'خطأ' : 'Error',
        description: error.response?.data?.message || 'Failed to approve request',
        type: 'error',
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (data: {id: number, reason: string}) => api.post(`/system-admin/subscription-requests/${data.id}/reject`, { reason: data.reason }),
    onSuccess: () => {
      toast.add({
        title: isAr ? 'تم الرفض' : 'Rejected',
        description: isAr ? 'تم رفض الطلب' : 'Request rejected.',
        type: 'success',
      });
      setActionModal(null);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['adminSubscriptionRequests'] });
    },
    onError: (error: any) => {
      toast.add({
        title: isAr ? 'خطأ' : 'Error',
        description: error.response?.data?.message || 'Failed to reject request',
        type: 'error',
      });
    }
  });

  const requests = response?.data || [];
  const filteredRequests = requests.filter(req => 
    req.tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    req.tenant.name_en?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-rose-500" />;
      default: return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStatusText = (status: string) => {
    if (isAr) {
      switch (status) {
        case 'approved': return 'مقبول';
        case 'rejected': return 'مرفوض';
        default: return 'قيد الانتظار';
      }
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getPlanName = (plan: string) => {
    if (isAr) {
      switch (plan) {
        case 'basic': return 'الأساسية';
        case 'professional': return 'الاحترافية';
        case 'business': return 'الأعمال';
        case 'enterprise': return 'المؤسسات';
        default: return plan;
      }
    }
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isAr ? 'text-right' : 'text-left'}`} dir={isAr ? 'rtl' : 'ltr'}>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{isAr ? 'طلبات الاشتراكات' : 'Subscription Requests'}</h1>
          <p className="text-muted-foreground text-sm mt-1">{isAr ? 'إدارة طلبات ترقية وتجديد الاشتراكات للشركات' : 'Manage subscription upgrade and renewal requests'}</p>
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center" dir={isAr ? 'rtl' : 'ltr'}>
            <CardTitle className="text-lg">{isAr ? 'قائمة الطلبات' : 'Requests List'}</CardTitle>
            <div className="relative max-w-sm w-full">
              <Search className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
              <input
                type="text"
                placeholder={isAr ? 'البحث باسم الشركة...' : 'Search company...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full bg-background border border-border rounded-xl py-2 ${isAr ? 'pr-9 pl-4' : 'pl-9 pr-4'} text-sm focus:border-indigo-500 focus:outline-none`}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" dir={isAr ? 'rtl' : 'ltr'}>
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className={`pb-3 font-semibold ${isAr ? 'text-right' : 'text-left'}`}>{isAr ? 'الشركة' : 'Company'}</th>
                  <th className={`pb-3 font-semibold ${isAr ? 'text-right' : 'text-left'}`}>{isAr ? 'نوع الطلب' : 'Type'}</th>
                  <th className={`pb-3 font-semibold ${isAr ? 'text-right' : 'text-left'}`}>{isAr ? 'الباقة المطلوبة' : 'Requested Plan'}</th>
                  <th className={`pb-3 font-semibold ${isAr ? 'text-right' : 'text-left'}`}>{isAr ? 'التاريخ' : 'Date'}</th>
                  <th className={`pb-3 font-semibold ${isAr ? 'text-right' : 'text-left'}`}>{isAr ? 'الحالة' : 'Status'}</th>
                  <th className={`pb-3 font-semibold ${isAr ? 'text-right' : 'text-left'}`}>{isAr ? 'الإيصال' : 'Receipt'}</th>
                  <th className={`pb-3 font-semibold ${isAr ? 'text-right' : 'text-left'}`}>{isAr ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      <div className="flex justify-center mb-2">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                      {isAr ? 'جاري التحميل...' : 'Loading...'}
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      {isAr ? 'لا توجد طلبات مطابقة' : 'No matching requests found'}
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr key={req.id} className="group hover:bg-muted/30 transition-colors">
                      <td className="py-4 font-medium">{isAr ? req.tenant.name : (req.tenant.name_en || req.tenant.name)}</td>
                      <td className="py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${req.type === 'upgrade' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-blue-500/10 text-blue-400'}`}>
                          {isAr ? (req.type === 'upgrade' ? 'ترقية' : 'تجديد') : (req.type === 'upgrade' ? 'Upgrade' : 'Renewal')}
                        </span>
                      </td>
                      <td className="py-4 font-semibold text-indigo-400">{getPlanName(req.plan_name)}</td>
                      <td className="py-4 text-muted-foreground">{new Date(req.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-1.5">
                          {getStatusIcon(req.status)}
                          <span className="text-xs font-medium">{getStatusText(req.status)}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              const filename = req.receipt_path.split('/').pop();
                              const blobData = await api.get<Blob>(`/system-admin/receipts/${filename}`, {
                                responseType: 'blob'
                              });
                              const url = window.URL.createObjectURL(blobData);
                              setSelectedReceipt(url);
                            } catch (err) {
                              toast.add({
                                title: isAr ? 'خطأ' : 'Error',
                                description: isAr ? 'تعذر تحميل الإيصال' : 'Failed to load receipt',
                                type: 'error'
                              });
                            }
                          }}
                          className="h-8 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10"
                        >
                          <FileText className={`w-3.5 h-3.5 ${isAr ? 'ml-1' : 'mr-1'}`} />
                          {isAr ? 'عرض' : 'View'}
                        </Button>
                      </td>
                      <td className="py-4">
                        {req.status === 'pending' ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => setActionModal({ type: 'approve', requestId: req.id })}
                              className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              {isAr ? 'قبول' : 'Approve'}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setActionModal({ type: 'reject', requestId: req.id });
                                setRejectionReason('');
                              }}
                              className="h-8 bg-rose-600 hover:bg-rose-700 text-white"
                            >
                              {isAr ? 'رفض' : 'Reject'}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">{isAr ? 'تمت المعالجة' : 'Processed'}</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative">
            <div className="flex justify-between items-center p-4 border-b border-border bg-muted/50">
              <h3 className="font-bold text-foreground">{isAr ? 'إيصال الدفع' : 'Payment Receipt'}</h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1 rounded-full hover:bg-background transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-black/5 flex justify-center items-center min-h-[400px] max-h-[80vh] overflow-auto">
              {selectedReceipt.endsWith('.pdf') ? (
                <iframe src={selectedReceipt} className="w-full h-[60vh] rounded-lg" />
              ) : (
                <img src={selectedReceipt} alt="Receipt" className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl relative" dir={isAr ? 'rtl' : 'ltr'}>
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <h3 className="font-bold text-foreground">
                {actionModal.type === 'approve' 
                  ? (isAr ? 'تأكيد الموافقة' : 'Confirm Approval') 
                  : (isAr ? 'تأكيد الرفض' : 'Confirm Rejection')}
              </h3>
              <button
                onClick={() => setActionModal(null)}
                className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="py-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                {actionModal.type === 'approve' 
                  ? (isAr ? 'هل أنت متأكد من رغبتك في الموافقة على طلب الترقية/التجديد لهذا الحساب؟ سيتم تفعيل الباقة الجديدة تلقائياً.' : 'Are you sure you want to approve this request? The new plan will be activated automatically.')
                  : (isAr ? 'هل أنت متأكد من رغبتك في رفض هذا الطلب؟ يرجى إدخال سبب الرفض ليظهر للشركة.' : 'Are you sure you want to reject this request? Please enter a reason to be displayed to the company.')}
              </p>

              {actionModal.type === 'reject' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">{isAr ? 'سبب الرفض' : 'Rejection Reason'}</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm focus:border-rose-500 focus:outline-none resize-none h-24"
                    placeholder={isAr ? 'مثال: الإيصال غير واضح، أو لم تصل الحوالة...' : 'e.g., Receipt is unclear, or transfer not received...'}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setActionModal(null)}
                className="rounded-xl border-border hover:bg-muted"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              {actionModal.type === 'approve' ? (
                <Button
                  disabled={approveMutation.isPending}
                  onClick={() => approveMutation.mutate(actionModal.requestId)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                >
                  {approveMutation.isPending ? (isAr ? 'جاري...' : 'Processing...') : (isAr ? 'تأكيد الموافقة' : 'Confirm Approve')}
                </Button>
              ) : (
                <Button
                  disabled={rejectMutation.isPending || !rejectionReason.trim()}
                  onClick={() => rejectMutation.mutate({ id: actionModal.requestId, reason: rejectionReason })}
                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
                >
                  {rejectMutation.isPending ? (isAr ? 'جاري...' : 'Processing...') : (isAr ? 'تأكيد الرفض' : 'Confirm Reject')}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
