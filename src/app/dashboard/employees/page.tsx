'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { toast } from '@/components/ui/toast';
import {
  Users2,
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  DollarSign,
  IdCard,
  Trash2,
  Edit2,
  X,
  ShieldAlert,
  UserCheck,
  Clock,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

interface EmployeeItem {
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

export default function EmployeesPage() {
  const { user: currentUser } = useAuth();
  const { t, isAr } = useLanguage();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('all');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeItem | null>(null);

  // Form states
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<{ id: number; name: string } | null>(null);
  const [createConfirmOpen, setCreateConfirmOpen] = useState(false);
  const [editConfirmOpen, setEditConfirmOpen] = useState(false);

  const isCompanyAdmin = currentUser?.role === 'company_admin' || currentUser?.role === 'tenant_admin';

  // Fetch employees list
  const { data: employees = [], isLoading } = useQuery<EmployeeItem[]>({
    queryKey: ['employeesList'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: EmployeeItem[] }>('/users');
      return response.data || [];
    },
    enabled: !!currentUser,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      setValidationErrors({});
      return api.post<any>('/users', {
        ...data,
        job_title: data.role,
        salary: parseFloat(data.salary) || null,
        joining_date: data.joining_date || null,
        id_expiry_date: data.id_expiry_date || null,
      });
    },
    onSuccess: (res) => {
      toast.add({
        title: isAr ? 'تمت إضافة الموظف' : 'Employee Added',
        description: res.message || (isAr ? 'تم تسجيل ودعوة الموظف الجديد بنجاح.' : 'New employee registered and invited successfully.'),
        type: 'success',
      });
      setIsCreateOpen(false);
      setCreateConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['employeesList'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptionUsage'] });
      resetForm();
    },
    onError: (err: ApiError) => {
      setCreateConfirmOpen(false);
      if (err.status === 422) {
        setValidationErrors(err.data?.errors || err.data?.data || {});
      }
      toast.add({
        title: isAr ? 'فشل إضافة الموظف' : 'Failed to Add Employee',
        description: err.message || (isAr ? 'يرجى التحقق من المدخلات وسعة باقتك.' : 'Please verify inputs and package limit.'),
        type: 'error',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
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
      setIsEditOpen(false);
      setEditConfirmOpen(false);
      setSelectedEmployee(null);
      queryClient.invalidateQueries({ queryKey: ['employeesList'] });
      resetForm();
    },
    onError: (err: ApiError) => {
      setEditConfirmOpen(false);
      if (err.status === 422) {
        setValidationErrors(err.data?.errors || err.data?.data || {});
      }
      toast.add({
        title: isAr ? 'فشل التحديث' : 'Update Failed',
        description: err.message || (isAr ? 'حدث خطأ أثناء تعديل بيانات الموظف.' : 'An error occurred while updating employee.'),
        type: 'error',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete<any>(`/users/${id}`);
    },
    onSuccess: (res) => {
      toast.add({
        title: isAr ? 'تم حذف الموظف' : 'Employee Deleted',
        description: res.message || (isAr ? 'تم إزالة حساب الموظف بنجاح.' : 'Employee account removed successfully.'),
        type: 'success',
      });
      setDeleteConfirmOpen(false);
      setEmployeeToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['employeesList'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptionUsage'] });
    },
    onError: (err: ApiError) => {
      setDeleteConfirmOpen(false);
      setEmployeeToDelete(null);
      toast.add({
        title: isAr ? 'فشل الحذف' : 'Delete Failed',
        description: err.message || (isAr ? 'لا يمكن إتمام هذه العملية.' : 'Unable to complete this request.'),
        type: 'error',
      });
    },
  });

  const resetForm = () => {
    setFormData({
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
    setValidationErrors({});
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.password) {
      toast.add({
        title: isAr ? 'تنبيه' : 'Alert',
        description: isAr ? 'يرجى ملء الحقول الأساسية (الاسم، البريد، كلمة المرور).' : 'Please fill basic fields (name, email, password).',
        type: 'error',
      });
      return;
    }
    setCreateConfirmOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
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
    if (isEditOpen && formData.joining_date && formData.joining_date < today) {
      return formData.joining_date;
    }
    return today;
  };

  const openEditModal = (emp: EmployeeItem) => {
    setSelectedEmployee(emp);
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
    setIsEditOpen(true);
  };

  const handleDelete = (id: number, firstName: string, lastName: string) => {
    if (id === currentUser?.id) {
      toast.add({
        title: isAr ? 'تنبيه أمني' : 'Security Alert',
        description: isAr ? 'لا يمكنك حذف حسابك الشخصي النشط.' : 'You cannot delete your own active account.',
        type: 'error',
      });
      return;
    }
    setEmployeeToDelete({ id, name: `${firstName} ${lastName}` });
    setDeleteConfirmOpen(true);
  };

  const visibleEmployees = employees.filter((emp) => {
    const isEmpAdmin = emp.role === 'company_admin' || emp.role === 'tenant_admin';
    const isCurrentAdmin = currentUser?.role === 'company_admin' || currentUser?.role === 'tenant_admin';
    if (isEmpAdmin && !isCurrentAdmin) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    if (a.id === currentUser?.id) return -1;
    if (b.id === currentUser?.id) return 1;
    return 0;
  });

  // Extract unique specializations for filter dropdown
  const specializations = Array.from(
    new Set(
      visibleEmployees
        .map((emp) => emp.profile?.specialization)
        .filter((spec): spec is string => !!spec)
    )
  );

  const filteredEmployees = visibleEmployees.filter((emp) => {
    const fullName = `${emp.profile?.first_name || ''} ${emp.profile?.last_name || ''}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.role && getLocalizedRole(emp.role).toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSpecialization =
      specializationFilter === 'all' || emp.profile?.specialization === specializationFilter;

    return matchesSearch && matchesSpecialization;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Panel */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl`}>
        <div className="space-y-1">
          <h1 className={`text-2xl font-bold text-white flex items-center gap-2.5 ${isAr ? 'text-right' : 'text-left'}`}>
            <Users2 className={`w-6 h-6 text-indigo-400 ${isAr ? 'ml-1' : 'mr-1'}`} />
            {isAr ? 'دليل وإدارة الموظفين والكوادر الإنشائية' : 'Staff Directory & Construction Personnel Management'}
          </h1>
          <p className={`text-slate-400 text-xs ${isAr ? 'text-right' : 'text-left'}`}>
            {isAr ? 'إدارة أعضاء الفريق، الهويات الوطنية، الرواتب، التخصصات الهندسية وتاريخ التعيين.' : 'Manage team members, national IDs, salaries, engineering specializations, and joining dates.'}
          </p>
        </div>
        
        {isCompanyAdmin && (
          <button
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 px-5 text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Plus className={`w-4 h-4 ${isAr ? 'ml-1' : 'mr-1'}`} />
            {isAr ? 'إضافة / دعوة موظف جديد' : 'Add / Invite Employee'}
          </button>
        )}
      </div>

      {/* Info Warning for Non-Admins */}
      {!isCompanyAdmin && (
        <div className={`bg-slate-900/20 border border-slate-800 rounded-xl p-4 flex items-center gap-3 text-xs text-slate-400`} dir={isAr ? 'rtl' : 'ltr'}>
          <ShieldAlert className={`w-5 h-5 text-amber-500 shrink-0 ${isAr ? 'ml-1' : 'mr-1'}`} />
          <span>
            {isAr 
              ? 'أنت تشاهد دليل الموظفين بصفة استعراضية، صلاحيات الإضافة، التعديل أو الحذف مقصورة على مسؤول الشركة (Company Admin).' 
              : 'You are viewing the staff directory in read-only mode. Adding, editing, or deleting is limited to the Company Admin.'}
          </span>
        </div>
      )}

      {/* Stats Board */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        <Card className="border-slate-800 bg-slate-900/20 text-white pt-6">
          <CardContent>
            <p className="text-xs text-slate-400">{isAr ? 'إجمالي الموظفين' : 'Total Employees'}</p>
            <p className="text-2xl font-bold mt-1 text-white font-sans">{visibleEmployees.length}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/20 text-white pt-6">
          <CardContent>
            <p className="text-xs text-indigo-400">{isAr ? 'الكوادر الإدارية والهندسية' : 'Admin & Engineering Staff'}</p>
            <p className="text-base font-bold mt-2 text-indigo-400 font-sans">
              {isAr 
                ? `${visibleEmployees.filter(e => e.role === 'company_admin').length} مديرين / ${visibleEmployees.filter(e => e.role !== 'company_admin').length} موظفين`
                : `${visibleEmployees.filter(e => e.role === 'company_admin').length} admins / ${visibleEmployees.filter(e => e.role !== 'company_admin').length} employees`}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/20 text-white pt-6">
          <CardContent>
            <p className="text-xs text-emerald-400">{isAr ? 'موظفون نشطون' : 'Active Employees'}</p>
            <p className="text-2xl font-bold mt-1 text-emerald-400 font-sans">
              {visibleEmployees.filter(e => e.status === 'active').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className={`absolute ${isAr ? 'right-3.5' : 'left-3.5'} top-3.5 w-4 h-4 text-slate-500`} />
          <input
            type="text"
            placeholder={isAr ? 'البحث باسم الموظف، بريده، أو مسمّاه الوظيفي...' : 'Search by name, email, or job title...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full bg-slate-900/40 border border-slate-800 hover:border-slate-700/80 focus:border-indigo-500 text-slate-100 rounded-xl py-3 ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-sm outline-none transition-all`}
          />
        </div>

        {/* Specialization Filter Dropdown */}
        <div className="relative min-w-[200px]">
          <Filter className={`absolute ${isAr ? 'right-3.5' : 'left-3.5'} top-3.5 w-4 h-4 text-slate-500 pointer-events-none`} />
          <select
            value={specializationFilter}
            onChange={(e) => setSpecializationFilter(e.target.value)}
            className={`w-full bg-slate-900/40 border border-slate-800 hover:border-slate-700/80 focus:border-indigo-500 text-slate-100 rounded-xl py-3 ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-sm outline-none transition-all appearance-none cursor-pointer`}
          >
            <option value="all">{isAr ? 'كل التخصصات' : 'All Specializations'}</option>
            {specializations.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Employees Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center py-20 text-slate-455 gap-2">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">{isAr ? 'جاري تحميل دليل الموظفين...' : 'Loading staff directory...'}</p>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-slate-400 bg-slate-900/10 border border-slate-800 rounded-2xl gap-3">
          <div className="w-12 h-12 bg-slate-900/60 rounded-2xl border border-slate-805 flex items-center justify-center text-slate-500">
            <Users2 className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold">{isAr ? 'لا يوجد موظفون مسجلون يطابقون خيارات البحث' : 'No registered employees match your search criteria'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredEmployees.map((emp) => {
            const firstName = emp.profile?.first_name || '';
            const lastName = emp.profile?.last_name || '';
            const initial = firstName.charAt(0) || '?';
            
            return (
              <div
                key={emp.id}
                className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 hover:border-slate-700/60 transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Visual Admin Ribbon */}
                {(emp.role === 'company_admin' || emp.role === 'tenant_admin') && (
                  <div className={`absolute ${isAr ? 'left-0' : 'right-0'} top-0 bg-indigo-600/10 text-indigo-400 border-r border-b border-indigo-500/20 text-[9px] px-2.5 py-0.5 rounded-br-lg font-bold font-sans`}>
                    COMPANY ADMIN
                  </div>
                )}

                {/* Profile row */}
                <div className="flex items-start gap-4 mb-4">
                  {/* Initial Avatar */}
                  <div className="w-14 h-14 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0">
                    {initial}
                  </div>
                  
                  {/* Core details */}
                  <div className={`space-y-1 min-w-0 flex-1 ${isAr ? 'text-right' : 'text-left'}`}>
                    <h3 className="text-base font-bold text-white truncate">
                      {firstName} {lastName}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs text-indigo-400 font-medium flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5" />
                        {getLocalizedRole(emp.role)} 
                        {emp.profile?.specialization && ` - ${emp.profile.specialization}`}
                      </p>
                      {emp.status === 'active' ? (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                          {isAr ? 'نشط' : 'Active'}
                        </span>
                      ) : (
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                          {isAr ? 'غير نشط' : 'Inactive'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/dashboard/employees/${emp.id}`}
                      className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-400 transition-all cursor-pointer border border-transparent hover:border-slate-800"
                      title={isAr ? 'تفاصيل الموظف' : 'Employee Details'}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    {isCompanyAdmin && emp.role !== 'company_admin' && emp.role !== 'tenant_admin' && (
                      <>
                        <button
                          onClick={() => openEditModal(emp)}
                          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-400 transition-all cursor-pointer border border-transparent hover:border-slate-800"
                          title={isAr ? 'تعديل سريع' : 'Quick Edit'}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id, firstName, lastName)}
                          className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-455 transition-all cursor-pointer border border-transparent hover:border-slate-800"
                          title={isAr ? 'حذف الموظف' : 'Delete Employee'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Employee Construction Fields Grid */}
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-4 pt-4 border-t border-slate-800/60 text-xs text-slate-355 ${isAr ? 'text-right' : 'text-left'}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate font-mono">{emp.email}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 min-w-0">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate font-mono">{emp.profile?.phone_number || (isAr ? 'غير متوفر' : 'Not available')}</span>
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    <DollarSign className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">
                      {isAr ? 'الراتب:' : 'Salary:'}{' '}
                      <strong className="text-white font-mono">
                        {emp.profile?.salary 
                          ? (isAr ? `${Number(emp.profile.salary).toLocaleString('ar-SA')} ريال` : `SAR ${Number(emp.profile.salary).toLocaleString('en-US')}`) 
                          : (isAr ? 'غير محدد' : 'Not specified')}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">
                      {isAr ? 'التعيين:' : 'Hired:'}{' '}
                      <strong className="text-white">
                        {emp.profile?.joining_date ? new Date(emp.profile.joining_date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US') : (isAr ? 'غير محدد' : 'Not specified')}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    <IdCard className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">
                      {isAr ? 'الهوية:' : 'National ID:'}{' '}
                      <strong className="text-white font-mono">{emp.profile?.national_id || (isAr ? 'غير متوفر' : 'Not available')}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">
                      {isAr ? 'انتهاء الهوية:' : 'Expiry ID:'}{' '}
                      <strong className="text-white">
                        {emp.profile?.id_expiry_date ? new Date(emp.profile.id_expiry_date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US') : (isAr ? 'غير محدد' : 'Not specified')}
                      </strong>
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* --- CREATE / EDIT EMPLOYEE MODAL --- */}
      {isCompanyAdmin && (isCreateOpen || isEditOpen) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            {/* Close button */}
            <button
              onClick={() => {
                setIsCreateOpen(false);
                setIsEditOpen(false);
                setSelectedEmployee(null);
              }}
              className={`absolute ${isAr ? 'left-4' : 'right-4'} top-4 p-2 text-slate-500 hover:text-slate-350 hover:bg-slate-800/50 rounded-xl transition-all cursor-pointer`}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Title */}
            <div className={`mb-6 space-y-1 ${isAr ? 'text-right' : 'text-left'}`}>
              <h2 className="text-lg font-bold text-white font-sans">
                {isCreateOpen ? (isAr ? 'إضافة موظف إنشائي جديد' : 'Add New Construction Employee') : (isAr ? `تعديل بيانات الموظف: ${selectedEmployee?.profile?.first_name} ${selectedEmployee?.profile?.last_name}` : `Edit Employee Details: ${selectedEmployee?.profile?.first_name} ${selectedEmployee?.profile?.last_name}`)}
              </h2>
              <p className="text-slate-400 text-xs">
                {isAr ? 'قم بتسجيل وتعديل بيانات الكوادر، الحقول المعلمة بـ (*) مطلوبة.' : 'Register and edit staff details. Fields marked with (*) are required.'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={isCreateOpen ? handleCreateSubmit : handleEditSubmit} className={`space-y-4 ${isAr ? 'text-right' : 'text-left'}`} dir={isAr ? 'rtl' : 'ltr'}>
              
              {/* Row 1: First Name and Last Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">{isAr ? 'الاسم الأول *' : 'First Name *'}</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-sm rounded-xl p-3 outline-none transition-all"
                    placeholder={isAr ? 'الاسم الأول للموظف' : 'First name'}
                  />
                  {validationErrors.first_name && (
                    <p className="text-xs text-rose-500 font-semibold mt-1 animate-in fade-in duration-200">
                      {validationErrors.first_name[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">{isAr ? 'اسم العائلة *' : 'Last Name *'}</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-sm rounded-xl p-3 outline-none transition-all"
                    placeholder={isAr ? 'الاسم الأخير أو العائلة' : 'Last or family name'}
                  />
                  {validationErrors.last_name && (
                    <p className="text-xs text-rose-500 font-semibold mt-1 animate-in fade-in duration-200">
                      {validationErrors.last_name[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: Email and Password */}
              <div className={isCreateOpen ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "grid grid-cols-1 gap-4"}>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">{isAr ? 'البريد الإلكتروني للموظف *' : 'Employee Email *'}</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-sm rounded-xl p-3 outline-none transition-all font-mono"
                    placeholder="email@example.com"
                  />
                  {validationErrors.email && (
                     <p className="text-xs text-rose-500 font-semibold mt-1 animate-in fade-in duration-200">
                       {validationErrors.email[0]}
                     </p>
                  )}
                </div>
                {isCreateOpen && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">
                      {isAr ? 'كلمة المرور *' : 'Password *'}
                    </label>
                    <input
                      type="password"
                      required={isCreateOpen}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-sm rounded-xl p-3 outline-none transition-all"
                      placeholder={isAr ? '8 خانات على الأقل' : 'At least 8 characters'}
                    />
                    {validationErrors.password && (
                      <p className="text-xs text-rose-500 font-semibold mt-1 animate-in fade-in duration-200">
                        {validationErrors.password[0]}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Row 3: Phone Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">{isAr ? 'رقم الجوال' : 'Phone Number'}</label>
                <input
                  type="text"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-sm rounded-xl p-3 outline-none transition-all font-mono"
                  placeholder={isAr ? 'مثال: 05XXXXXXXX' : 'e.g. 05XXXXXXXX'}
                />
                {validationErrors.phone_number && (
                  <p className="text-xs text-rose-500 font-semibold mt-1 animate-in fade-in duration-200">
                    {validationErrors.phone_number[0]}
                  </p>
                )}
              </div>

              {/* Row 4: National ID & Salary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">{isAr ? 'رقم الهوية الوطنية / الإقامة' : 'National ID / Residency ID'}</label>
                  <input
                    type="text"
                    value={formData.national_id}
                    onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-sm rounded-xl p-3 outline-none transition-all font-mono"
                    placeholder={isAr ? 'رقم الهوية المكون من 10 أرقام' : '10-digit national ID code'}
                  />
                  {validationErrors.national_id && (
                    <p className="text-xs text-rose-500 font-semibold mt-1 animate-in fade-in duration-200">
                      {validationErrors.national_id[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">{isAr ? 'الراتب الأساسي الشهري' : 'Basic Monthly Salary'}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-sm rounded-xl p-3 outline-none transition-all font-mono"
                    placeholder={isAr ? 'مثال: 8500' : 'e.g. 8500'}
                  />
                  {validationErrors.salary && (
                    <p className="text-xs text-rose-500 font-semibold mt-1 animate-in fade-in duration-200">
                      {validationErrors.salary[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 5: Specialization & Joining Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">{isAr ? 'التخصص / القسم' : 'Specialization / Department'}</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-sm rounded-xl p-3 outline-none transition-all"
                    placeholder={isAr ? 'مثال: الهندسة المدنية، الأمن والسلامة' : 'e.g. Civil Engineering, Safety'}
                  />
                  {validationErrors.specialization && (
                    <p className="text-xs text-rose-500 font-semibold mt-1 animate-in fade-in duration-200">
                      {validationErrors.specialization[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">{isAr ? 'تاريخ التعيين / المباشرة' : 'Hiring / Joining Date'}</label>
                  <input
                    type="date"
                    min={getMinJoiningDate()}
                    value={formData.joining_date}
                    onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-250 text-sm rounded-xl p-3 outline-none transition-all"
                  />
                  {validationErrors.joining_date && (
                    <p className="text-xs text-rose-500 font-semibold mt-1 animate-in fade-in duration-200">
                      {validationErrors.joining_date[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 6: ID Expiry Date & Role */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">{isAr ? 'تاريخ انتهاء الهوية / الإقامة' : 'ID Expiry Date'}</label>
                  <input
                    type="date"
                    value={formData.id_expiry_date}
                    onChange={(e) => setFormData({ ...formData, id_expiry_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-250 text-sm rounded-xl p-3 outline-none transition-all"
                  />
                  {validationErrors.id_expiry_date && (
                    <p className="text-xs text-rose-500 font-semibold mt-1 animate-in fade-in duration-200">
                      {validationErrors.id_expiry_date[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">{isAr ? 'صلاحية النظام (Role)' : 'System Permission (Role)'}</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-sm rounded-xl p-3 outline-none transition-all cursor-pointer"
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
                    <p className="text-xs text-rose-500 font-semibold mt-1 animate-in fade-in duration-200">
                      {validationErrors.role[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 7: Status (if Editing) */}
              {isEditOpen && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">{isAr ? 'حالة الحساب' : 'Account Status'}</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-sm rounded-xl p-3 outline-none transition-all cursor-pointer"
                  >
                    <option value="active">{isAr ? 'نشط' : 'Active'}</option>
                    <option value="inactive">{isAr ? 'غير نشط' : 'Inactive'}</option>
                  </select>
                  {validationErrors.status && (
                    <p className="text-xs text-rose-500 font-semibold mt-1 animate-in fade-in duration-200">
                      {validationErrors.status[0]}
                    </p>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setIsEditOpen(false);
                    setSelectedEmployee(null);
                  }}
                  className="bg-slate-800 hover:bg-slate-700/80 text-slate-200 rounded-xl py-3 px-6 text-sm font-semibold transition-all cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 px-6 text-sm font-semibold transition-all cursor-pointer flex items-center gap-2"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-1" />
                      {isAr ? 'جاري الحفظ...' : 'Saving...'}
                    </>
                  ) : (
                    isAr ? 'حفظ البيانات' : 'Save Changes'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setEmployeeToDelete(null);
        }}
        onConfirm={() => {
          if (employeeToDelete) {
            deleteMutation.mutate(employeeToDelete.id);
          }
        }}
        isLoading={deleteMutation.isPending}
        type="danger"
        title={isAr ? 'تأكيد حذف الموظف' : 'Confirm Employee Deletion'}
        message={
          isAr
            ? `هل أنت متأكد من حذف حساب الموظف "${employeeToDelete?.name}"؟ سيتم مسح بياناته نهائياً من النظام.`
            : `Are you sure you want to delete employee "${employeeToDelete?.name}"? Their account data will be permanently removed.`
        }
        confirmText={isAr ? 'نعم، احذف الحساب' : 'Yes, delete account'}
        cancelText={isAr ? 'إلغاء' : 'Cancel'}
      />

      <ConfirmationModal
        isOpen={createConfirmOpen}
        onClose={() => setCreateConfirmOpen(false)}
        onConfirm={() => createMutation.mutate(formData)}
        isLoading={createMutation.isPending}
        type="success"
        title={isAr ? 'تأكيد إضافة موظف جديد' : 'Confirm New Employee Invitation'}
        message={
          isAr
            ? `هل أنت متأكد من إرسال دعوة وإضافة الموظف "${formData.first_name} ${formData.last_name}" بالنظام؟`
            : `Are you sure you want to invite and register employee "${formData.first_name} ${formData.last_name}"?`
        }
        confirmText={isAr ? 'تأكيد الإضافة' : 'Confirm Invitation'}
        cancelText={isAr ? 'تراجع' : 'Cancel'}
      />

      <ConfirmationModal
        isOpen={editConfirmOpen}
        onClose={() => setEditConfirmOpen(false)}
        onConfirm={() => {
          if (selectedEmployee) {
            updateMutation.mutate({ id: selectedEmployee.id, data: formData });
          }
        }}
        isLoading={updateMutation.isPending}
        type="info"
        title={isAr ? 'تأكيد حفظ التعديلات' : 'Confirm Save Changes'}
        message={
          isAr
            ? `هل أنت متأكد من حفظ التعديلات الجديدة على بيانات الموظف "${selectedEmployee?.profile?.first_name} ${selectedEmployee?.profile?.last_name}"؟`
            : `Are you sure you want to save changes to employee "${selectedEmployee?.profile?.first_name} ${selectedEmployee?.profile?.last_name}"?`
        }
        confirmText={isAr ? 'حفظ التغييرات' : 'Save Changes'}
        cancelText={isAr ? 'تراجع' : 'Cancel'}
      />

    </div>
  );
}
