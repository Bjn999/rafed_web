'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { toast } from '@/components/ui/toast';
import Link from 'next/link';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  MapPin,
  User as UserIcon,
  Trash2,
  Edit2,
  Eye,
  X,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  HardHat
} from 'lucide-react';

interface ProjectItem {
  id: number;
  name: string;
  project_number: string;
  client_id?: number | null;
  contractor_id?: number | null;
  project_manager_id?: number | null;
  client_name?: string | null;
  contractor_name?: string | null;
  project_manager?: string | null;
  location?: string | null;
  contract_value?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
  budget: number;
  status: string;
  overall_progress?: number;
  created_at: string;
}

interface UserOption {
  id: number;
  email: string;
  role: string;
  profile?: {
    first_name: string;
    last_name: string;
    job_title?: string;
  } | null;
}

interface CustomDatePickerProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  isAr: boolean;
}

function CustomDatePicker({ value, onChange, placeholder, isAr }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => {
    return value ? new Date(value) : new Date();
  });
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value) {
      setCurrentDate(new Date(value));
    }
  }, [value]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, idx) => idx + 1);
  const emptySlots = Array.from({ length: firstDayOfMonth }, (_, idx) => idx);

  const MONTH_NAMES_AR = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const MONTH_NAMES_EN = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const MONTH_NAME = isAr ? MONTH_NAMES_AR[month] : MONTH_NAMES_EN[month];

  const WEEK_DAYS_AR = ['أح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];
  const WEEK_DAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const WEEK_DAYS = isAr ? WEEK_DAYS_AR : WEEK_DAYS_EN;

  const displayDate = value 
    ? new Date(value).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : placeholder || (isAr ? 'اختر التاريخ' : 'Select Date');

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-background border border-border hover:border-border focus:border-indigo-500 text-slate-200 text-sm rounded-xl p-3 outline-none transition-all cursor-pointer text-right"
      >
        <span className={value ? 'text-slate-200 font-sans' : 'text-muted-foreground font-normal font-sans'}>{displayDate}</span>
        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>

      {isOpen && (
        <div className={`absolute bottom-full mb-2 ${isAr ? 'right-0' : 'left-0'} z-50 bg-card border border-border rounded-2xl p-4 shadow-2xl w-64 animate-in slide-in-from-bottom-2 duration-200`}>
          <div className="flex justify-between items-center mb-3" dir={isAr ? 'rtl' : 'ltr'}>
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <span className="text-xs font-bold text-foreground font-sans">{MONTH_NAME} {year}</span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground font-bold mb-2">
            {WEEK_DAYS.map((d, idx) => (
              <div key={idx}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {emptySlots.map((_, idx) => (
              <div key={`empty-${idx}`} />
            ))}
            {daysArray.map((day) => {
              const formattedMonth = String(month + 1).padStart(2, '0');
              const formattedDay = String(day).padStart(2, '0');
              const cellDateStr = `${year}-${formattedMonth}-${formattedDay}`;
              const isSelected = value === cellDateStr;

              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => handleSelectDay(day)}
                  className={`py-1.5 rounded-lg font-medium transition-all cursor-pointer font-sans ${
                    isSelected 
                      ? 'bg-indigo-600 text-white font-bold' 
                      : 'text-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const { t, isAr } = useLanguage();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    project_number: '',
    client_id: '',
    contractor_id: '',
    project_manager_id: '',
    location: '',
    contract_value: '',
    start_date: '',
    end_date: '',
    budget: '',
    description: '',
    status: 'planned',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
    planned: { label: isAr ? 'مخطط له' : 'Planned', color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
    preparation: { label: isAr ? 'قيد التحضير' : 'Preparation', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
    active: { label: isAr ? 'نشط' : 'Active', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    on_hold: { label: isAr ? 'متوقف مؤقتاً' : 'On Hold', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    delayed: { label: isAr ? 'متأخر' : 'Delayed', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    completed: { label: isAr ? 'مكتمل' : 'Completed', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    closed: { label: isAr ? 'مغلق' : 'Closed', color: 'text-muted-foreground', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
  };

  // Fetch projects list
  const { data: rawProjects, isLoading } = useQuery({
    queryKey: ['projectsList'],
    queryFn: async () => {
      const response = await api.get<any>('/projects');
      return response?.data ?? response;
    },
    enabled: !!user,
  });

  const projects: ProjectItem[] = Array.isArray(rawProjects)
    ? rawProjects
    : Array.isArray(rawProjects?.data)
    ? rawProjects.data
    : [];

  // Fetch company employees / users list
  const { data: usersResponse } = useQuery<{ success: boolean; data: UserOption[] }>({
    queryKey: ['companyUsersList'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: UserOption[] }>('/users');
      return response;
    },
    enabled: !!user,
  });

  const rawUsers = Array.isArray(usersResponse?.data) ? usersResponse.data : [];

  const getUserDisplayName = (u: UserOption) => {
    if (u.profile?.first_name || u.profile?.last_name) {
      return `${u.profile.first_name || ''} ${u.profile.last_name || ''}`.trim();
    }
    return u.email;
  };

  // Filter users by roles
  const clientUsers = rawUsers.filter(u => u.role === 'Client' || u.role === 'client');
  const contractorUsers = rawUsers.filter(u => u.role === 'Contractor' || u.role === 'contractor');
  const pmUsers = rawUsers.filter(u => u.role === 'Project Manager' || u.role === 'project_manager');

  // Fallbacks if no specific roles exist yet
  const availableClients = clientUsers.length > 0 ? clientUsers : rawUsers;
  const availableContractors = contractorUsers.length > 0 ? contractorUsers : rawUsers;
  const availablePMs = pmUsers.length > 0 ? pmUsers : rawUsers;

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      setValidationErrors({});
      return api.post<any>('/projects', {
        ...data,
        budget: parseFloat(data.budget) || 0,
        contract_value: parseFloat(data.contract_value) || null,
        client_id: data.client_id ? parseInt(data.client_id) : null,
        contractor_id: data.contractor_id ? parseInt(data.contractor_id) : null,
        project_manager_id: data.project_manager_id ? parseInt(data.project_manager_id) : null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
      });
    },
    onSuccess: (res) => {
      toast.add({
        title: isAr ? 'تم إنشاء المشروع' : 'Project Created',
        description: res.message || (isAr ? 'تمت إضافة المشروع الجديد للمؤسسة بنجاح.' : 'New project added successfully.'),
        type: 'success',
      });
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['projectsList'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptionUsage'] });
      resetForm();
    },
    onError: (err: ApiError) => {
      if (err.status === 422) {
        setValidationErrors(err.data?.errors || err.data?.data || {});
      }
      toast.add({
        title: isAr ? 'فشل في إنشاء المشروع' : 'Failed to Create Project',
        description: err.message || (isAr ? 'يرجى التحقق من صحة البيانات والميزانيات المتاحة.' : 'Please check data correctness and plan budget limits.'),
        type: 'error',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      setValidationErrors({});
      return api.put<any>(`/projects/${id}`, {
        ...data,
        budget: parseFloat(data.budget) || 0,
        contract_value: parseFloat(data.contract_value) || null,
        client_id: data.client_id ? parseInt(data.client_id) : null,
        contractor_id: data.contractor_id ? parseInt(data.contractor_id) : null,
        project_manager_id: data.project_manager_id ? parseInt(data.project_manager_id) : null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
      });
    },
    onSuccess: (res) => {
      toast.add({
        title: isAr ? 'تم تحديث المشروع' : 'Project Updated',
        description: res.message || (isAr ? 'تم حفظ التعديلات بنجاح.' : 'Changes saved successfully.'),
        type: 'success',
      });
      setIsEditOpen(false);
      setSelectedProject(null);
      queryClient.invalidateQueries({ queryKey: ['projectsList'] });
      resetForm();
    },
    onError: (err: ApiError) => {
      if (err.status === 422) {
        setValidationErrors(err.data?.errors || err.data?.data || {});
      }
      toast.add({
        title: isAr ? 'فشل في التعديل' : 'Update Failed',
        description: err.message || (isAr ? 'تأكد من إدخال البيانات بشكل صحيح.' : 'Make sure to enter correct values.'),
        type: 'error',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete<any>(`/projects/${id}`);
    },
    onSuccess: (res) => {
      toast.add({
        title: isAr ? 'تم حذف المشروع' : 'Project Deleted',
        description: res.message || (isAr ? 'تم إزالة المشروع من قاعدة البيانات.' : 'Project deleted from database.'),
        type: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['projectsList'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptionUsage'] });
    },
    onError: (err: ApiError) => {
      toast.add({
        title: isAr ? 'فشل الحذف' : 'Delete Failed',
        description: err.message || (isAr ? 'حدث خطأ أثناء محاولة حذف المشروع.' : 'An error occurred while deleting project.'),
        type: 'error',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      project_number: '',
      client_id: '',
      contractor_id: '',
      project_manager_id: '',
      location: '',
      contract_value: '',
      start_date: '',
      end_date: '',
      budget: '',
      description: '',
      status: 'planned',
    });
    setValidationErrors({});
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.project_number || !formData.budget || !formData.start_date || !formData.end_date) {
      toast.add({
        title: isAr ? 'تنبيه' : 'Alert',
        description: isAr ? 'يرجى إدخال اسم المشروع، رقم المشروع، الميزانية، وتاريخي البدء والنهاية.' : 'Please enter project name, project number, budget, start date, and end date.',
        type: 'error',
      });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    if (!formData.name || !formData.project_number || !formData.budget || !formData.start_date || !formData.end_date) {
      toast.add({
        title: isAr ? 'تنبيه' : 'Alert',
        description: isAr ? 'يرجى إدخال اسم المشروع، رقم المشروع، الميزانية، وتاريخي البدء والنهاية.' : 'Please enter project name, project number, budget, start date, and end date.',
        type: 'error',
      });
      return;
    }
    updateMutation.mutate({ id: selectedProject.id, data: formData });
  };

  const openEditModal = (project: ProjectItem) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      project_number: project.project_number || '',
      client_id: project.client_id ? project.client_id.toString() : '',
      contractor_id: project.contractor_id ? project.contractor_id.toString() : '',
      project_manager_id: project.project_manager_id ? project.project_manager_id.toString() : '',
      location: project.location || '',
      contract_value: project.contract_value ? project.contract_value.toString() : '',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      budget: project.budget.toString(),
      description: project.description || '',
      status: project.status,
    });
    setValidationErrors({});
    setIsEditOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(isAr ? `هل أنت متأكد من رغبتك في حذف مشروع "${name}" بشكل نهائي؟` : `Are you sure you want to permanently delete project "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return isAr ? 'غير محدد' : 'Not specified';
    return isAr 
      ? `${Number(val).toLocaleString('ar-SA')} ريال`
      : `SAR ${Number(val).toLocaleString('en-US')}`;
  };

  // Filters logic
  const projectsList = Array.isArray(projects) ? projects : [];
  const filteredProjects = projectsList.filter((prj) => {
    const matchesSearch =
      prj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prj.project_number && prj.project_number.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || prj.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Panel */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border backdrop-blur-xl`}>
        <div className="space-y-1">
          <h1 className={`text-2xl font-bold text-foreground flex items-center gap-2.5 ${isAr ? 'text-right' : 'text-left'}`}>
            <FolderKanban className={`w-6 h-6 text-indigo-400 ${isAr ? 'ml-1' : 'mr-1'}`} />
            {isAr ? 'إدارة ومتابعة المشاريع الإنشائية' : 'Construction Projects Management'}
          </h1>
          <p className={`text-muted-foreground text-xs ${isAr ? 'text-right' : 'text-left'}`}>
            {isAr ? 'قم بإنشاء وتحديث مشاريع المؤسسة، تتبع الميزانيات، عقود العملاء وحالات التشغيل.' : 'Create and update company projects, track budgets, client contracts, and status.'}
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 px-5 text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 hover:shadow-indigo-550/30 transition-all"
        >
          <Plus className={`w-4 h-4 ${isAr ? 'ml-1' : 'mr-1'}`} />
          {isAr ? 'إنشاء مشروع جديد' : 'Create New Project'}
        </button>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        <Card className="border-border bg-card backdrop-blur text-foreground">
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <p className="text-[11px] sm:text-xs text-muted-foreground">{isAr ? 'إجمالي المشاريع' : 'Total Projects'}</p>
            <p className="text-xl sm:text-2xl font-bold mt-1 text-foreground font-sans">{projectsList.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card backdrop-blur text-foreground">
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <p className="text-[11px] sm:text-xs text-emerald-400">{isAr ? 'المشاريع النشطة' : 'Active Projects'}</p>
            <p className="text-xl sm:text-2xl font-bold mt-1 text-emerald-400 font-sans">
              {projectsList.filter(p => p.status === 'active').length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card backdrop-blur text-foreground">
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <p className="text-[11px] sm:text-xs text-violet-400">{isAr ? 'تحت التحضير' : 'Preparation'}</p>
            <p className="text-xl sm:text-2xl font-bold mt-1 text-violet-400 font-sans">
              {projectsList.filter(p => p.status === 'preparation' || p.status === 'planned').length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card backdrop-blur text-foreground">
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <p className="text-[11px] sm:text-xs text-rose-450">{isAr ? 'المتأخرة' : 'Delayed'}</p>
            <p className="text-xl sm:text-2xl font-bold mt-1 text-rose-450 font-sans">
              {projectsList.filter(p => p.status === 'delayed').length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card backdrop-blur text-foreground col-span-2 sm:col-span-1">
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <p className="text-[11px] sm:text-xs text-indigo-400">{isAr ? 'المكتملة والمغلقة' : 'Completed & Closed'}</p>
            <p className="text-xl sm:text-2xl font-bold mt-1 text-indigo-400 font-sans">
              {projectsList.filter(p => p.status === 'completed' || p.status === 'closed').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className={`absolute ${isAr ? 'right-3.5' : 'left-3.5'} top-3.5 w-4 h-4 text-muted-foreground`} />
          <input
            type="text"
            placeholder={isAr ? 'البحث باسم المشروع أو رقم المشروع...' : 'Search by project name or code...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full bg-card border border-border hover:border-border focus:border-indigo-500 text-foreground rounded-xl py-3 ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-sm outline-none transition-all`}
          />
        </div>

        {/* Filter Dropdown */}
        <div className="relative min-w-[200px]">
          <Filter className={`absolute ${isAr ? 'right-3.5' : 'left-3.5'} top-3.5 w-4 h-4 text-muted-foreground pointer-events-none`} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`w-full bg-card border border-border hover:border-border focus:border-indigo-500 text-foreground rounded-xl py-3 ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-sm outline-none transition-all appearance-none cursor-pointer`}
          >
            <option value="all">{isAr ? 'كل الحالات' : 'All Statuses'}</option>
            {Object.entries(STATUS_MAP).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center py-20 text-slate-450 gap-2">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">{isAr ? 'جاري تحميل قائمة المشاريع...' : 'Loading projects list...'}</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-muted-foreground bg-card border border-border rounded-2xl gap-3">
          <div className="w-12 h-12 bg-card rounded-2xl border border-border flex items-center justify-center text-muted-foreground">
            <FolderKanban className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold">{isAr ? 'لم نجد أي مشاريع تطابق خيارات البحث' : 'No projects match your search'}</p>
          <p className="text-xs text-muted-foreground">{isAr ? 'جرب البحث بكلمات أخرى أو قم بإنشاء مشروع جديد.' : 'Try different search keywords or create a new project.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const statusConfig = STATUS_MAP[project.status] || STATUS_MAP.planned;
            return (
              <div
                key={project.id}
                className="bg-card border border-border rounded-2xl p-5 hover:border-border transition-all flex flex-col justify-between group hover:shadow-lg hover:shadow-indigo-500/[0.02]"
              >
                {/* Badge Status & ID */}
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] text-muted-foreground font-mono tracking-wider font-bold">
                    {project.project_number || `#PRJ-${project.id}`}
                  </span>
                  <span className={`${statusConfig.color} ${statusConfig.bg} ${statusConfig.border} border text-[11px] px-2.5 py-1 rounded-full font-bold`}>
                    {statusConfig.label}
                  </span>
                </div>

                {/* Project Details */}
                <div className="space-y-3 flex-1 mb-5">
                  <h3 className={`text-base font-bold text-foreground group-hover:text-indigo-400 transition-colors ${isAr ? 'text-right' : 'text-left'}`}>
                    {project.name}
                  </h3>
                  
                  {project.description && (
                    <p className={`text-xs text-muted-foreground line-clamp-2 leading-relaxed ${isAr ? 'text-right' : 'text-left'}`}>
                      {project.description}
                    </p>
                  )}

                  {/* Indicators Grid */}
                  <div className={`grid grid-cols-2 gap-2 pt-2 border-t border-border text-xs text-muted-foreground ${isAr ? 'text-right' : 'text-left'}`}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <UserIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{project.client_name || (isAr ? 'بدون عميل' : 'No client')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{project.location || (isAr ? 'غير محدد' : 'Not specified')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <DollarSign className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate font-mono font-bold text-indigo-400">
                        {formatCurrency(project.budget)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate font-mono">
                        {project.start_date ? new Date(project.start_date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US') : (isAr ? 'مفتوح' : 'Open')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="flex-1 bg-slate-850 hover:bg-muted border border-border text-slate-200 hover:text-foreground rounded-lg py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {isAr ? 'عرض التفاصيل' : 'View Details'}
                  </Link>

                  <button
                    onClick={() => openEditModal(project)}
                    className="p-2 bg-slate-850 hover:bg-muted border border-border text-muted-foreground hover:text-indigo-400 rounded-lg transition-all cursor-pointer"
                    title={isAr ? 'تعديل' : 'Edit'}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(project.id, project.name)}
                    className="p-2 bg-slate-850 hover:bg-rose-500/10 border border-border hover:border-rose-500/20 text-muted-foreground hover:text-rose-455 rounded-lg transition-all cursor-pointer"
                    title={isAr ? 'حذف' : 'Delete'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- CREATE / EDIT MODAL --- */}
      {(isCreateOpen || isEditOpen) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button
              onClick={() => {
                setIsCreateOpen(false);
                setIsEditOpen(false);
                setSelectedProject(null);
              }}
              className={`absolute ${isAr ? 'left-4' : 'right-4'} top-4 p-2 text-muted-foreground hover:text-slate-350 hover:bg-muted rounded-xl transition-all cursor-pointer`}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Title */}
            <div className={`mb-6 space-y-1 ${isAr ? 'text-right' : 'text-left'}`}>
              <h2 className="text-lg font-bold text-foreground font-sans">
                {isCreateOpen ? (isAr ? 'إضافة مشروع إنشائي جديد' : 'Create New Construction Project') : (isAr ? `تعديل بيانات مشروع: ${selectedProject?.name}` : `Edit Project: ${selectedProject?.name}`)}
              </h2>
              <p className="text-muted-foreground text-xs">
                {isAr ? 'أدخل تفاصيل المشروع وعقوده المرصودة، الحقول المعلمة بـ (*) مطلوبة.' : 'Enter project details and allocated budgets. Fields marked with (*) are required.'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={isCreateOpen ? handleCreateSubmit : handleEditSubmit} className={`space-y-4 ${isAr ? 'text-right' : 'text-left'}`} dir={isAr ? 'rtl' : 'ltr'}>
              
              {/* Row 1: Name and Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1">
                    <span>{isAr ? 'اسم المشروع' : 'Project Name'}</span>
                    <span className="text-rose-400 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-background border border-border focus:border-indigo-500 text-slate-200 text-sm rounded-xl p-3 outline-none transition-all"
                    placeholder={isAr ? 'مثال: برج الجوهرة السكني' : 'e.g. Al-Jawhara Residential Tower'}
                  />
                  {validationErrors.name && (
                    <p className="text-xs text-rose-500 font-semibold mt-1 animate-in fade-in duration-200">
                      {validationErrors.name[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1">
                    <span>{isAr ? 'رقم المشروع' : 'Project Number'}</span>
                    <span className="text-rose-400 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.project_number}
                    onChange={(e) => setFormData({ ...formData, project_number: e.target.value })}
                    className="w-full bg-background border border-border focus:border-indigo-500 text-slate-200 text-sm rounded-xl p-3 outline-none transition-all"
                    placeholder={isAr ? 'مثال: PRJ-2026-88' : 'e.g. PRJ-2026-88'}
                  />
                  {validationErrors.project_number && (
                    <p className="text-xs text-rose-500 font-semibold mt-1 animate-in fade-in duration-200">
                      {validationErrors.project_number[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: Client and Contractor Select Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Client Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">{isAr ? 'المالك / العميل' : 'Owner / Client'}</label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="w-full bg-background border border-border focus:border-indigo-500 text-slate-200 text-sm rounded-xl p-3 outline-none transition-all cursor-pointer"
                  >
                    <option value="">{isAr ? '-- اختر العميل من قائمة الموظفين --' : '-- Select Client from Employees --'}</option>
                    {availableClients.map((u) => (
                      <option key={u.id} value={u.id} className="bg-card text-foreground">
                        {getUserDisplayName(u)} ({u.role})
                      </option>
                    ))}
                  </select>
                  {validationErrors.client_id && (
                    <p className="text-xs text-rose-500 font-semibold mt-1 animate-in fade-in duration-200">
                      {validationErrors.client_id[0]}
                    </p>
                  )}
                </div>

                {/* Contractor Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">{isAr ? 'المقاول الرئيسي' : 'Main Contractor'}</label>
                  <select
                    value={formData.contractor_id}
                    onChange={(e) => setFormData({ ...formData, contractor_id: e.target.value })}
                    className="w-full bg-background border border-border focus:border-indigo-500 text-slate-200 text-sm rounded-xl p-3 outline-none transition-all cursor-pointer"
                  >
                    <option value="">{isAr ? '-- اختر المقاول الرئيسي من قائمة الموظفين --' : '-- Select Main Contractor --'}</option>
                    {availableContractors.map((u) => (
                      <option key={u.id} value={u.id} className="bg-card text-foreground">
                        {getUserDisplayName(u)} ({u.role})
                      </option>
                    ))}
                  </select>
                  {validationErrors.contractor_id && (
                    <p className="text-xs text-rose-500 font-semibold mt-1 animate-in fade-in duration-200">
                      {validationErrors.contractor_id[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 3: Manager Select and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* PM Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">{isAr ? 'مدير المشروع' : 'Project Manager'}</label>
                  <select
                    value={formData.project_manager_id}
                    onChange={(e) => setFormData({ ...formData, project_manager_id: e.target.value })}
                    className="w-full bg-background border border-border focus:border-indigo-500 text-slate-200 text-sm rounded-xl p-3 outline-none transition-all cursor-pointer"
                  >
                    <option value="">{isAr ? '-- اختر مدير المشروع من قائمة الموظفين --' : '-- Select Project Manager --'}</option>
                    {availablePMs.map((u) => (
                      <option key={u.id} value={u.id} className="bg-card text-foreground">
                        {getUserDisplayName(u)} ({u.role})
                      </option>
                    ))}
                  </select>
                  {validationErrors.project_manager_id && (
                    <p className="text-xs text-rose-500 font-semibold mt-1 animate-in fade-in duration-200">
                      {validationErrors.project_manager_id[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">{isAr ? 'موقع المشروع' : 'Project Location'}</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-background border border-border focus:border-indigo-500 text-slate-200 text-sm rounded-xl p-3 outline-none transition-all"
                    placeholder={isAr ? 'المدينة، الحي أو الإحداثيات' : 'City, district or coordinates'}
                  />
                  {validationErrors.location && (
                    <p className="text-xs text-rose-500 font-semibold mt-1 animate-in fade-in duration-200">
                      {validationErrors.location[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 4: Budget and Contract Value */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1">
                    <span>{isAr ? 'الميزانية المرصودة' : 'Allocated Budget'}</span>
                    <span className="text-rose-400 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full bg-background border border-border focus:border-indigo-500 text-slate-200 text-sm rounded-xl p-3 outline-none transition-all font-mono"
                    placeholder={isAr ? 'مثال: 500000' : 'e.g. 500000'}
                  />
                  {validationErrors.budget && (
                    <p className="text-xs text-rose-500 font-semibold mt-1 animate-in fade-in duration-200">
                      {validationErrors.budget[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">{isAr ? 'قيمة العقد الكلية' : 'Total Contract Value'}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.contract_value}
                    onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })}
                    className="w-full bg-background border border-border focus:border-indigo-500 text-slate-200 text-sm rounded-xl p-3 outline-none transition-all font-mono"
                    placeholder={isAr ? 'مثال: 600000' : 'e.g. 600000'}
                  />
                  {validationErrors.contract_value && (
                    <p className="text-xs text-rose-500 font-semibold mt-1 animate-in fade-in duration-200">
                      {validationErrors.contract_value[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 5: Start / End Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1">
                    <span>{isAr ? 'تاريخ البدء المتوقع' : 'Expected Start Date'}</span>
                    <span className="text-rose-400 font-bold">*</span>
                  </label>
                  <CustomDatePicker
                    value={formData.start_date}
                    onChange={(val) => setFormData({ ...formData, start_date: val })}
                    placeholder={isAr ? 'تاريخ بداية المشروع' : 'Project start date'}
                    isAr={isAr}
                  />
                  {validationErrors.start_date && (
                    <p className="text-xs text-rose-500 font-semibold mt-1 animate-in fade-in duration-200">
                      {validationErrors.start_date[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1">
                    <span>{isAr ? 'تاريخ الانتهاء المتوقع' : 'Expected End Date'}</span>
                    <span className="text-rose-400 font-bold">*</span>
                  </label>
                  <CustomDatePicker
                    value={formData.end_date}
                    onChange={(val) => setFormData({ ...formData, end_date: val })}
                    placeholder={isAr ? 'تاريخ تسليم المشروع' : 'Project delivery date'}
                    isAr={isAr}
                  />
                  {validationErrors.end_date && (
                    <p className="text-xs text-rose-500 font-semibold mt-1 animate-in fade-in duration-200">
                      {validationErrors.end_date[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 6: Status & Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">{isAr ? 'حالة المشروع' : 'Project Status'}</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-background border border-border focus:border-indigo-500 text-slate-200 text-sm rounded-xl p-3 outline-none transition-all cursor-pointer"
                  >
                    {Object.entries(STATUS_MAP).map(([key, value]) => (
                      <option key={key} value={key} className="bg-card text-foreground">
                        {value.label}
                      </option>
                    ))}
                  </select>
                  {validationErrors.status && (
                    <p className="text-xs text-rose-500 font-semibold mt-1 animate-in fade-in duration-200">
                      {validationErrors.status[0]}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">{isAr ? 'وصف المشروع' : 'Project Description'}</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-background border border-border focus:border-indigo-500 text-slate-200 text-sm rounded-xl p-3 outline-none transition-all resize-none"
                  placeholder={isAr ? 'أدخل تفاصيل ومواصفات المشروع الإنشائي...' : 'Enter construction project details...'}
                />
              </div>

              {/* Submit / Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setIsEditOpen(false);
                    setSelectedProject(null);
                  }}
                  className="px-5 py-2.5 bg-muted hover:bg-slate-700 text-foreground rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>
                    {isCreateOpen 
                      ? (isAr ? 'إنشاء المشروع' : 'Create Project') 
                      : (isAr ? 'حفظ التعديلات' : 'Save Changes')}
                  </span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
