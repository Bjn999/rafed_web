'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { toast } from '@/components/ui/toast';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight,
  User,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  DollarSign,
  IdCard,
  Clock,
  Shield,
  Activity,
  Edit2,
  Lock,
  Loader2,
  AlertCircle,
  X
} from 'lucide-react';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

interface EmployeeDetail {
  id: number;
  email: string;
  role: string;
  status: string;
  profile?: {
    first_name: string;
    last_name: string;
    phone_number?: string | null;
    job_title?: string | null;
    national_id?: string | null;
    salary?: number | null;
    joining_date?: string | null;
    specialization?: string | null;
    id_expiry_date?: string | null;
  } | null;
  created_at: string;
}

export default function EmployeeDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { t, isAr } = useLanguage();
  const queryClient = useQueryClient();

  const isCompanyAdmin = currentUser?.role === 'company_admin' || currentUser?.role === 'tenant_admin';

  // Modal and form states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    job_title: '',
    national_id: '',
    salary: '',
    joining_date: '',
    specialization: '',
    id_expiry_date: '',
    role: 'Project Engineer',
    status: 'inactive',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  // Confirmation state
  const [editConfirmOpen, setEditConfirmOpen] = useState(false);

  // Fetch employee details
  const { data: employee, isLoading, error } = useQuery<EmployeeDetail>({
    queryKey: ['employeeDetails', id],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: EmployeeDetail }>(`/users/${id}`);
      return response.data;
    },
    enabled: !!currentUser && !!id,
  });

  // Sync state with fetched details (fallback/default representation)
  useEffect(() => {
    if (employee) {
      setFormData({
        email: employee.email,
        password: '',
        first_name: employee.profile?.first_name || '',
        last_name: employee.profile?.last_name || '',
        phone_number: employee.profile?.phone_number || '',
        job_title: employee.profile?.job_title || '',
        national_id: employee.profile?.national_id || '',
        salary: employee.profile?.salary ? employee.profile.salary.toString() : '',
        joining_date: formatDateString(employee.profile?.joining_date),
        specialization: employee.profile?.specialization || '',
        id_expiry_date: formatDateString(employee.profile?.id_expiry_date),
        role: employee.role,
        status: employee.status,
      });
    }
  }, [employee]);

  // Mutation for updating details
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      setValidationErrors({});
      return api.put<any>(`/users/${id}`, {
        ...data,
        job_title: data.role,
        salary: parseFloat(data.salary) || null,
        joining_date: data.joining_date || null,
        id_expiry_date: data.id_expiry_date || null,
      });
    },
    onSuccess: (res) => {
      toast.add({
        title: isAr ? 'تم تحديث البيانات' : 'Data Updated',
        description: res.message || (isAr ? 'تم حفظ بيانات الموظف بنجاح.' : 'Employee data saved successfully.'),
        type: 'success',
      });
      setIsEditModalOpen(false);
      setEditConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['employeeDetails', id] });
      queryClient.invalidateQueries({ queryKey: ['employeesList'] });
    },
    onError: (err: ApiError) => {
      setEditConfirmOpen(false);
      if (err.status === 422) {
        setValidationErrors(err.data?.errors || err.data?.data || {});
      }
      toast.add({
        title: isAr ? 'فشل تحديث البيانات' : 'Update Failed',
        description: err.message || (isAr ? 'حدث خطأ أثناء تعديل بيانات الموظف.' : 'An error occurred while modifying employee.'),
        type: 'error',
      });
    },
  });

  const getLocalizedRole = (role: string) => {
    const rolesMap: Record<string, { ar: string; en: string }> = {
      'Project Engineer': { ar: 'مهندس مشروع', en: 'Project Engineer' },
      'Project Manager': { ar: 'مدير مشروع', en: 'Project Manager' },
      'Contractor': { ar: 'مقاول', en: 'Contractor' },
      'Consultant': { ar: 'استشاري', en: 'Consultant' },
      'Site Supervisor': { ar: 'مشرف موقع', en: 'Site Supervisor' },
      'Site Engineer': { ar: 'مهندس موقع', en: 'Site Engineer' },
      'Viewer': { ar: 'مستعرض', en: 'Viewer' },
      'Client': { ar: 'عميل', en: 'Client' },
      'company_admin': { ar: 'مدير الشركة', en: 'Company Manager' },
      'user': { ar: 'مستخدم', en: 'User' },
    };
    const found = rolesMap[role];
    if (!found) return role;
    return isAr ? found.ar : found.en;
  };

  const formatDateString = (dateStr?: any) => {
    if (!dateStr) return '';
    if (typeof dateStr !== 'string') {
      try {
        return new Date(dateStr).toISOString().split('T')[0];
      } catch (e) {
        return '';
      }
    }
    return dateStr.split('T')[0];
  };

  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMinJoiningDate = () => {
    const today = getTodayDateString();
    if (formData.joining_date && formData.joining_date < today) {
      return formData.joining_date;
    }
    return today;
  };

  const openEditModal = (emp: EmployeeDetail) => {
    setFormData({
      email: emp.email,
      password: '',
      first_name: emp.profile?.first_name || '',
      last_name: emp.profile?.last_name || '',
      phone_number: emp.profile?.phone_number || '',
      job_title: emp.profile?.job_title || '',
      national_id: emp.profile?.national_id || '',
      salary: emp.profile?.salary ? emp.profile.salary.toString() : '',
      joining_date: formatDateString(emp.profile?.joining_date),
      specialization: emp.profile?.specialization || '',
      id_expiry_date: formatDateString(emp.profile?.id_expiry_date),
      role: emp.role,
      status: emp.status,
    });
    setValidationErrors({});
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.email) {
      toast.add({
        title: isAr ? 'تنبيه' : 'Alert',
        description: isAr ? 'يرجى إدخال اسم الموظف والبريد الإلكتروني.' : 'Please enter name and email.',
        type: 'error',
      });
      return;
    }
    setEditConfirmOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center py-24 text-slate-455 gap-3" dir={isAr ? 'rtl' : 'ltr'}>
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">{isAr ? 'جاري تحميل تفاصيل الموظف...' : 'Loading employee details...'}</p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="flex flex-col items-center py-20 text-muted-foreground gap-4" dir={isAr ? 'rtl' : 'ltr'}>
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <p className="text-sm font-semibold text-rose-455">
          {isAr ? 'حدث خطأ أثناء تحميل بيانات الموظف أو أن الموظف غير موجود.' : 'An error occurred while loading employee details, or they do not exist.'}
        </p>
        <button
          onClick={() => router.push('/dashboard/employees')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2.5 px-6 text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 transition-all"
        >
          <ArrowRight className={`w-4 h-4 ${isAr ? 'ml-1' : 'mr-1 rotate-180'}`} />
          {isAr ? 'العودة لدليل الموظفين' : 'Back to Employees'}
        </button>
      </div>
    );
  }

  const fullName = `${employee.profile?.first_name || ''} ${employee.profile?.last_name || ''}`;
  const initial = employee.profile?.first_name?.charAt(0) || '?';

  return (
    <div className="space-y-8 animate-in fade-in duration-300" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Header with Back button and Actions */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border backdrop-blur-xl`}>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/employees"
            className="p-3 bg-muted hover:bg-slate-700/80 border border-border hover:border-slate-650 rounded-xl text-slate-355 hover:text-foreground transition-all cursor-pointer"
            title={isAr ? 'رجوع' : 'Back'}
          >
            <ArrowRight className={`w-5 h-5 ${isAr ? '' : 'rotate-180'}`} />
          </Link>
          <div className={`space-y-1 ${isAr ? 'text-right' : 'text-left'}`}>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2.5">
              <span>{isAr ? `ملف الموظف: ${fullName}` : `Employee Profile: ${fullName}`}</span>
            </h1>
            <p className="text-muted-foreground text-xs">
              {isAr ? 'استعراض البيانات الشخصية، المهام، الصلاحيات، وحالة الحساب والرواتب.' : 'View personal details, assignments, credentials, salaries, and account status.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status badge */}
          {employee.status === 'active' ? (
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-3.5 py-1.5 rounded-full font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-450 inline-block" />
              {isAr ? 'نشط' : 'Active'}
            </span>
          ) : (
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs px-3.5 py-1.5 rounded-full font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-450 inline-block" />
              {isAr ? 'غير نشط' : 'Inactive'}
            </span>
          )}

          {/* Edit Button - Prohibit editing company_admin */}
          {isCompanyAdmin && employee.role !== 'company_admin' && employee.role !== 'tenant_admin' && (
            <button
              onClick={() => openEditModal(employee)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2.5 px-5 text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 transition-all"
            >
              <Edit2 className="w-4 h-4" />
              {isAr ? 'تعديل البيانات' : 'Edit Profile'}
            </button>
          )}
        </div>
      </div>

      {/* Main Details Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Summary Card */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="border-border bg-card overflow-hidden backdrop-blur-xl">
            <CardContent className="pt-8 flex flex-col items-center text-center">
              {/* Profile Avatar */}
              <div className="w-24 h-24 bg-indigo-600/10 text-indigo-400 border-2 border-indigo-500/20 rounded-3xl flex items-center justify-center font-bold text-3xl mb-4 shadow-inner shadow-indigo-500/5">
                {initial}
              </div>

              {/* Basic Info */}
              <h2 className="text-lg font-bold text-foreground mb-1">{fullName}</h2>
              <p className="text-indigo-400 text-xs font-semibold flex items-center gap-1 mb-4 justify-center">
                <Briefcase className="w-3.5 h-3.5" />
                {getLocalizedRole(employee.role)}
              </p>

              {/* Role Display */}
              <div className="inline-flex items-center gap-1.5 bg-background border border-slate-850 px-3 py-1.5 rounded-xl text-xs text-foreground font-mono mb-6">
                <Shield className="w-3.5 h-3.5 text-indigo-455" />
                <span>{isAr ? 'صلاحية النظام: ' : 'System Role: '}</span>
                <strong className="text-foreground font-bold">{getLocalizedRole(employee.role)}</strong>
              </div>

              {/* Status Notice for non-admins */}
              {!isCompanyAdmin && (
                <div className={`w-full bg-background/40 border border-slate-850 p-4 rounded-xl text-xs text-muted-foreground leading-relaxed ${isAr ? 'text-right' : 'text-left'}`}>
                  <span className="text-amber-500 font-bold block mb-1">{isAr ? 'تنبيه الصلاحية:' : 'Permission Alert:'}</span>
                  {isAr 
                    ? 'أنت لا تملك صلاحية تعديل بيانات هذا الكادر الإنشائي. تعديل الرواتب أو البيانات أو تفعيل الحساب مقصور على مدير الشركة.' 
                    : 'You do not have the required permissions to modify this personnel profile. Adjusting salaries, data or activation is restricted to the Company Admin.'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Account Details Card */}
          <Card className="border-border bg-card backdrop-blur-xl">
            <CardContent className={`p-6 space-y-4 ${isAr ? 'text-right' : 'text-left'}`}>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 border-b border-border pb-2">
                {isAr ? 'تفاصيل الحساب السريعة' : 'Quick Account Details'}
              </h3>
              
              <div className="flex items-center gap-3 text-xs">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-muted-foreground">{isAr ? 'البريد الإلكتروني' : 'Email Address'}</p>
                  <p className="text-slate-200 font-mono truncate">{employee.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <Activity className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-muted-foreground">{isAr ? 'حالة الحساب' : 'Account Status'}</p>
                  <p className="text-slate-200 font-semibold">
                    {employee.status === 'active' 
                      ? (isAr ? 'نشط وقابل للاستخدام' : 'Active & authorized to login') 
                      : (isAr ? 'غير نشط ومعلق حالياً' : 'Suspended & restricted from system')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-muted-foreground">{isAr ? 'تاريخ التسجيل بالنظام' : 'Registered Date'}</p>
                  <p className="text-slate-200">{new Date(employee.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Clean Read-Only Profile View */}
        <div className="lg:col-span-2">
          <Card className="border-border bg-card backdrop-blur-xl">
            <CardContent className="p-6">
              
              {/* Profile Details Header */}
              <h3 className={`text-base font-bold text-foreground mb-6 flex items-center gap-2 border-b border-border pb-3 ${isAr ? 'text-right' : 'text-left'}`}>
                <User className={`w-4 h-4 text-indigo-400 ${isAr ? 'ml-1' : 'mr-1'}`} />
                {isAr ? 'البيانات الشخصية والملف المهني للموظف' : 'Employee Personal & Professional Details'}
              </h3>

              {/* View Grid */}
              <div className={`space-y-6 ${isAr ? 'text-right' : 'text-left'}`}>
                
                {/* Section 1: Name and Contact */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-muted-foreground border-b border-slate-850 pb-1.5 uppercase tracking-wide">
                    {isAr ? 'المعلومات الشخصية والاتصال' : 'Personal Information & Contact'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground">{isAr ? 'الاسم الأول' : 'First Name'}</p>
                      <p className="text-sm font-semibold text-slate-200 mt-1">{employee.profile?.first_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{isAr ? 'اسم العائلة' : 'Last Name'}</p>
                      <p className="text-sm font-semibold text-slate-200 mt-1">{employee.profile?.last_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{isAr ? 'البريد الإلكتروني' : 'Email Address'}</p>
                      <p className="text-sm font-semibold text-slate-200 font-mono mt-1">{employee.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{isAr ? 'رقم الجوال' : 'Phone Number'}</p>
                      <p className="text-sm font-semibold text-slate-200 font-mono mt-1">{employee.profile?.phone_number || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Section 2: Job Description and Salary */}
                <div className="space-y-4 border-t border-slate-850/60 pt-4">
                  <h4 className="text-xs font-bold text-muted-foreground border-b border-slate-850 pb-1.5 uppercase tracking-wide">
                    {isAr ? 'البيانات الوظيفية والتعويضات المالية' : 'Job Specifications & Compensation'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground">{isAr ? 'المسمى الوظيفي' : 'Job Title'}</p>
                      <p className="text-sm font-semibold text-slate-200 mt-1">{getLocalizedRole(employee.role)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{isAr ? 'التخصص / القسم' : 'Specialization / Department'}</p>
                      <p className="text-sm font-semibold text-slate-200 mt-1">{employee.profile?.specialization || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{isAr ? 'الراتب الأساسي الشهري' : 'Basic Monthly Salary'}</p>
                      <p className="text-sm font-semibold text-slate-200 font-mono mt-1">
                        {employee.profile?.salary 
                          ? (isAr ? `${Number(employee.profile.salary).toLocaleString()} ريال سعودي` : `SAR ${Number(employee.profile.salary).toLocaleString()}`) 
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{isAr ? 'تاريخ المباشرة / التعيين' : 'Hiring / Joining Date'}</p>
                      <p className="text-sm font-semibold text-slate-200 mt-1">
                        {employee.profile?.joining_date 
                          ? new Date(employee.profile.joining_date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US') 
                          : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 3: National Identification */}
                <div className="space-y-4 border-t border-slate-850/60 pt-4">
                  <h4 className="text-xs font-bold text-muted-foreground border-b border-slate-850 pb-1.5 uppercase tracking-wide">
                    {isAr ? 'وثائق الهوية والإقامة' : 'Identity Documents'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground">{isAr ? 'رقم الهوية الوطنية / الإقامة' : 'National ID / Iqama Number'}</p>
                      <p className="text-sm font-semibold text-slate-200 font-mono mt-1">{employee.profile?.national_id || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{isAr ? 'تاريخ انتهاء الهوية' : 'ID Expiry Date'}</p>
                      <p className="text-sm font-semibold text-slate-200 mt-1">
                        {employee.profile?.id_expiry_date 
                          ? new Date(employee.profile.id_expiry_date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US') 
                          : '-'}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* --- EDIT EMPLOYEE MODAL (OVERLAY) --- */}
      {isCompanyAdmin && isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            {/* Close button */}
            <button
              onClick={() => {
                setIsEditModalOpen(false);
              }}
              className={`absolute ${isAr ? 'left-4' : 'right-4'} top-4 p-2 text-muted-foreground hover:text-slate-350 hover:bg-muted rounded-xl transition-all cursor-pointer`}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Title */}
            <div className={`mb-6 space-y-1 ${isAr ? 'text-right' : 'text-left'}`}>
              <h2 className="text-lg font-bold text-foreground font-sans">
                {isAr ? `تعديل بيانات الموظف: ${employee?.profile?.first_name} ${employee?.profile?.last_name}` : `Edit Employee Details: ${employee?.profile?.first_name} ${employee?.profile?.last_name}`}
              </h2>
              <p className="text-muted-foreground text-xs">
                {isAr ? 'قم بتعديل بيانات الموظف وحفظ التغييرات.' : 'Update employee profile details and save changes.'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={(e) => { e.preventDefault(); setEditConfirmOpen(true); }} className={`space-y-4 ${isAr ? 'text-right' : 'text-left'}`} dir={isAr ? 'rtl' : 'ltr'}>
              
              {/* Row 1: First Name and Last Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">{isAr ? 'الاسم الأول *' : 'First Name *'}</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full bg-background border border-border focus:border-indigo-500 text-slate-200 text-sm rounded-xl p-3 outline-none transition-all"
                    placeholder={isAr ? 'الاسم الأول للموظف' : 'First name'}
                  />
                  {validationErrors.first_name && (
                    <p className="text-xs text-rose-500 font-semibold mt-1">
                      {validationErrors.first_name[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">{isAr ? 'اسم العائلة *' : 'Last Name *'}</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full bg-background border border-border focus:border-indigo-500 text-slate-200 text-sm rounded-xl p-3 outline-none transition-all"
                    placeholder={isAr ? 'اسم العائلة' : 'Last name'}
                  />
                  {validationErrors.last_name && (
                    <p className="text-xs text-rose-500 font-semibold mt-1">
                      {validationErrors.last_name[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: Email (Edit restricted to company manager) */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">{isAr ? 'البريد الإلكتروني للموظف *' : 'Employee Email *'}</label>
                  <input
                    type="email"
                    required
                    disabled={!isCompanyAdmin}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-background border border-border focus:border-indigo-500 disabled:opacity-50 text-slate-200 text-sm rounded-xl p-3 outline-none transition-all font-mono"
                    placeholder="email@example.com"
                  />
                  {validationErrors.email && (
                    <p className="text-xs text-rose-500 font-semibold mt-1">
                      {validationErrors.email[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 3: Phone Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">{isAr ? 'رقم الجوال' : 'Phone Number'}</label>
                <input
                  type="text"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full bg-background border border-border focus:border-indigo-500 text-slate-200 text-sm rounded-xl p-3 outline-none transition-all font-mono"
                  placeholder={isAr ? 'مثال: 05XXXXXXXX' : 'e.g. 05XXXXXXXX'}
                />
                {validationErrors.phone_number && (
                  <p className="text-xs text-rose-500 font-semibold mt-1">
                    {validationErrors.phone_number[0]}
                  </p>
                )}
              </div>

              {/* Row 4: National ID & Salary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">{isAr ? 'رقم الهوية الوطنية / الإقامة' : 'National ID / Residency ID'}</label>
                  <input
                    type="text"
                    value={formData.national_id}
                    onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                    className="w-full bg-background border border-border focus:border-indigo-500 text-slate-200 text-sm rounded-xl p-3 outline-none transition-all font-mono"
                    placeholder={isAr ? 'رقم الهوية' : 'National ID'}
                  />
                  {validationErrors.national_id && (
                    <p className="text-xs text-rose-500 font-semibold mt-1">
                      {validationErrors.national_id[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">{isAr ? 'الراتب الأساسي الشهري' : 'Basic Monthly Salary'}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full bg-background border border-border focus:border-indigo-500 text-slate-200 text-sm rounded-xl p-3 outline-none transition-all font-mono"
                    placeholder="Salary"
                  />
                  {validationErrors.salary && (
                    <p className="text-xs text-rose-500 font-semibold mt-1">
                      {validationErrors.salary[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 5: Specialization & Joining Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">{isAr ? 'التخصص / القسم' : 'Specialization / Department'}</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full bg-background border border-border focus:border-indigo-500 text-slate-200 text-sm rounded-xl p-3 outline-none transition-all"
                    placeholder={isAr ? 'مثال: الهندسة المدنية' : 'Specialization'}
                  />
                  {validationErrors.specialization && (
                    <p className="text-xs text-rose-500 font-semibold mt-1">
                      {validationErrors.specialization[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">{isAr ? 'تاريخ التعيين / المباشرة' : 'Hiring / Joining Date'}</label>
                  <input
                    type="date"
                    min={getMinJoiningDate()}
                    value={formData.joining_date}
                    onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                    className="w-full bg-background border border-border focus:border-indigo-500 text-slate-250 text-sm rounded-xl p-3 outline-none transition-all"
                  />
                  {validationErrors.joining_date && (
                    <p className="text-xs text-rose-500 font-semibold mt-1">
                      {validationErrors.joining_date[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 6: ID Expiry Date & Role */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">{isAr ? 'تاريخ انتهاء الهوية / الإقامة' : 'ID Expiry Date'}</label>
                  <input
                    type="date"
                    value={formData.id_expiry_date}
                    onChange={(e) => setFormData({ ...formData, id_expiry_date: e.target.value })}
                    className="w-full bg-background border border-border focus:border-indigo-500 text-slate-250 text-sm rounded-xl p-3 outline-none transition-all"
                  />
                  {validationErrors.id_expiry_date && (
                    <p className="text-xs text-rose-500 font-semibold mt-1">
                      {validationErrors.id_expiry_date[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">{isAr ? 'صلاحية النظام (Role)' : 'System Permission (Role)'}</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-background border border-border focus:border-indigo-500 text-slate-200 text-sm rounded-xl p-3 outline-none transition-all cursor-pointer"
                  >
                    <option value="Project Engineer">{isAr ? 'مهندس مشروع' : 'Project Engineer'}</option>
                    <option value="Project Manager">{isAr ? 'مدير مشروع' : 'Project Manager'}</option>
                    <option value="Contractor">{isAr ? 'مقاول' : 'Contractor'}</option>
                    <option value="Consultant">{isAr ? 'استشاري' : 'Consultant'}</option>
                    <option value="Site Supervisor">{isAr ? 'مشرف موقع' : 'Site Supervisor'}</option>
                    <option value="Site Engineer">{isAr ? 'مهندس موقع' : 'Site Engineer'}</option>
                    <option value="Viewer">{isAr ? 'مستعرض' : 'Viewer'}</option>
                    <option value="Client">{isAr ? 'عميل' : 'Client'}</option>
                  </select>
                  {validationErrors.role && (
                    <p className="text-xs text-rose-500 font-semibold mt-1">
                      {validationErrors.role[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 7: Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">{isAr ? 'حالة الحساب' : 'Account Status'}</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-background border border-border focus:border-indigo-500 text-slate-200 text-sm rounded-xl p-3 outline-none transition-all cursor-pointer"
                >
                  <option value="active">{isAr ? 'نشط' : 'Active'}</option>
                  <option value="inactive">{isAr ? 'غير نشط' : 'Inactive'}</option>
                </select>
                {validationErrors.status && (
                  <p className="text-xs text-rose-500 font-semibold mt-1">
                    {validationErrors.status[0]}
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="bg-muted hover:bg-slate-700/80 text-slate-200 rounded-xl py-3 px-6 text-sm font-semibold transition-all cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 px-6 text-sm font-semibold transition-all cursor-pointer flex items-center gap-2"
                >
                  {isAr ? 'حفظ التغييرات' : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={editConfirmOpen}
        onClose={() => setEditConfirmOpen(false)}
        onConfirm={() => updateMutation.mutate(formData)}
        isLoading={updateMutation.isPending}
        type="info"
        title={isAr ? 'تأكيد حفظ التعديلات' : 'Confirm Save Changes'}
        message={
          isAr
            ? `هل أنت متأكد من حفظ التعديلات الجديدة على ملف الموظف "${employee?.profile?.first_name} ${employee?.profile?.last_name}"؟`
            : `Are you sure you want to save changes to employee profile "${employee?.profile?.first_name} ${employee?.profile?.last_name}"?`
        }
        confirmText={isAr ? 'حفظ التغييرات' : 'Save Changes'}
        cancelText={isAr ? 'تراجع' : 'Cancel'}
      />

    </div>
  );
}
