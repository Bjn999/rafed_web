'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from '@/components/ui/toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Building2, User, Mail, Lock, Phone, Briefcase, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { LanguageSelector } from '@/components/ui/LanguageSelector';

export default function RegisterPage() {
  const { login } = useAuth();
  const { t, isAr } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

  React.useEffect(() => {
    const host = window.location.host;
    const parts = host.split('.');
    let isSubdomain = false;
    
    if (host.includes('localhost') && parts.length > 1) {
      isSubdomain = true;
    } else if (!host.includes('localhost') && parts.length > 2) {
      isSubdomain = true;
    }

    if (isSubdomain) {
      api.get('/auth/tenant/verify')
        .then(() => {
          // Valid tenant, but registration is not allowed on subdomains
          window.location.href = '/login';
        })
        .catch(() => {
          // If invalid, api interceptor redirects to /not-found-company
        });
    }
  }, []);

  const registerSchema = z.object({
    company_name: z.string().min(2, { message: t('auth.validation.companyNameRequired') }),
    email: z.string().email({ message: t('auth.validation.emailInvalid') }),
    password: z.string().min(8, { message: t('auth.validation.passwordMin') }),
    password_confirmation: z.string().min(1, { message: t('auth.validation.passwordRequired') }),
    first_name: z.string().min(2, { message: t('auth.validation.firstNameRequired') }),
    last_name: z.string().min(2, { message: t('auth.validation.lastNameRequired') }),
    phone_number: z.string().optional().or(z.literal('')),
  }).refine((data) => data.password === data.password_confirmation, {
    message: t('auth.validation.passwordConfirmMatch'),
    path: ['password_confirmation'],
  });

  type RegisterFormValues = z.infer<typeof registerSchema>;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      company_name: '',
      email: '',
      password: '',
      password_confirmation: '',
      first_name: '',
      last_name: '',
      phone_number: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsSubmitting(true);
    try {
      const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const payload = { ...values, timezone: browserTimezone };

      const response = await api.post<{
        success: boolean;
        message: string;
        data: { token: string; user: any };
      }>('/auth/register-tenant', payload);

      if (response.success && response.data) {
        toast.add({
          title: isAr ? 'تم التسجيل بنجاح' : 'Registration Successful',
          description: isAr ? 'تم إنشاء الحساب بنجاح. يرجى مراجعة بريدك الإلكتروني لتفعيل الحساب.' : 'Account created successfully. Please check your email to verify your account.',
          type: 'success',
        });
        setRegistrationSuccess(true);
        // We do not call login() here because the user must verify their email first
        // login(response.data.token, response.data.user);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        // If there are validation errors from Laravel
        if (error.status === 422 && error.data?.data) {
          const apiErrors = error.data.data;
          Object.keys(apiErrors).forEach((key) => {
            setError(key as keyof RegisterFormValues, {
              type: 'server',
              message: apiErrors[key][0],
            });
          });
          toast.add({
            title: isAr ? 'خطأ في التحقق' : 'Validation Error',
            description: isAr ? 'الرجاء التحقق من الحقول الموضحة أدناه.' : 'Please check the highlighted fields below.',
            type: 'error',
          });
        } else {
          toast.add({
            title: t('auth.toast.registerFailedTitle'),
            description: error.message || (isAr ? 'حدث خطأ غير متوقع. الرجاء المحاولة لاحقاً.' : 'An unexpected error occurred. Please try again later.'),
            type: 'error',
          });
        }
      } else {
        toast.add({
          title: t('auth.toast.connectionErrorTitle'),
          description: t('auth.toast.connectionErrorDesc'),
          type: 'error',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
        <Link href="/">
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-card rounded-xl px-4 h-10 gap-2 transition-colors cursor-pointer">
            {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {isAr ? 'العودة للرئيسية' : 'Back to Home'}
          </Button>
        </Link>
        <LanguageSelector />
      </div>

      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-2xl border-border bg-card backdrop-blur-xl text-foreground shadow-2xl relative z-10">
        <CardHeader className="space-y-2 text-center pb-6 border-b border-border">
          <div className="mx-auto w-12 h-12 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-2 border border-indigo-500/30">
            <Building2 className="w-6 h-6" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-foreground font-sans">{isAr ? 'تسجيل شركة جديدة' : 'Register a New Company'}</CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            {isAr ? 'قم بإنشاء حساب لشركتك وابدأ إدارة مشاريعك الهندسية والمقاولات اليوم' : 'Create an account for your company and start managing your construction projects today'}
          </CardDescription>
        </CardHeader>

        {registrationSuccess ? (
          <CardContent className="space-y-6 pt-10 pb-10 text-center">
            <div className="mx-auto w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-4 border border-green-500/30">
              <Mail className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              {isAr ? 'تم إنشاء الحساب بنجاح!' : 'Account Created Successfully!'}
            </h3>
            <p className="text-foreground">
              {isAr ? 'يرجى مراجعة بريدك الإلكتروني والنقر على رابط التفعيل للبدء باستخدام النظام.' : 'Please check your email and click the verification link to start using the system.'}
            </p>
            <div className="pt-6">
              <Link href="/login">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8">
                  {isAr ? 'الذهاب لتسجيل الدخول' : 'Go to Login'}
                </Button>
              </Link>
            </div>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 pt-6">
            
            {/* Section 1: Company Info */}
            <div className="space-y-3">
              <h3 className={`text-md font-semibold text-indigo-400 flex items-center gap-2 pb-1 border-b border-border ${isAr ? 'text-right' : 'text-left'}`}>
                <Building2 className="w-4 h-4" />
                {isAr ? 'بيانات الشركة' : 'Company Info'}
              </h3>
              <div className="space-y-1">
                <Label htmlFor="company_name" className={`text-foreground flex ${isAr ? 'justify-start' : 'justify-start'}`}>{t('auth.companyNameLabel')}</Label>
                <div className="relative">
                  <Input
                    id="company_name"
                    placeholder={isAr ? 'مثال: شركة المقاولات الحديثة' : 'e.g. Modern Contracting Co.'}
                    className="bg-background/40 border-border focus:border-indigo-500 focus:ring-indigo-500/20 transition-all text-foreground font-sans"
                    {...register('company_name')}
                  />
                </div>
                {errors.company_name && (
                  <p className="text-rose-500 text-xs mt-1">{errors.company_name.message}</p>
                )}
              </div>
            </div>

            {/* Section 2: Account details */}
            <div className="space-y-4">
              <h3 className={`text-md font-semibold text-indigo-400 flex items-center gap-2 pb-1 border-b border-border ${isAr ? 'text-right' : 'text-left'}`}>
                <Mail className="w-4 h-4" />
                {isAr ? 'بيانات الحساب (المالك)' : 'Account Details (Owner)'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1 md:col-span-3">
                  <Label htmlFor="email" className={`text-foreground flex ${isAr ? 'justify-start' : 'justify-start'}`}>{t('auth.emailLabel')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="owner@example.com"
                    className="bg-background/40 border-border focus:border-indigo-500 text-foreground font-sans"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-rose-500 text-xs mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password" className={`text-foreground flex ${isAr ? 'justify-start' : 'justify-start'}`}>{t('auth.passwordLabel')}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={`bg-background/40 border-border focus:border-indigo-500 text-foreground font-sans ${isAr ? 'pl-10' : 'pr-10'}`}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors ${isAr ? 'left-3' : 'right-3'}`}
                      aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-rose-500 text-xs mt-1">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="password_confirmation" className={`text-foreground flex ${isAr ? 'justify-start' : 'justify-start'}`}>{t('auth.passwordConfirmLabel')}</Label>
                  <div className="relative">
                    <Input
                      id="password_confirmation"
                      type={showPasswordConfirmation ? "text" : "password"}
                      placeholder="••••••••"
                      className={`bg-background/40 border-border focus:border-indigo-500 text-foreground font-sans ${isAr ? 'pl-10' : 'pr-10'}`}
                      {...register('password_confirmation')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                      className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors ${isAr ? 'left-3' : 'right-3'}`}
                      aria-label={showPasswordConfirmation ? t('auth.hidePassword') : t('auth.showPassword')}
                    >
                      {showPasswordConfirmation ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password_confirmation && (
                    <p className="text-rose-500 text-xs mt-1">{errors.password_confirmation.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Profile Details */}
            <div className="space-y-4">
              <h3 className={`text-md font-semibold text-indigo-400 flex items-center gap-2 pb-1 border-b border-border ${isAr ? 'text-right' : 'text-left'}`}>
                <User className="w-4 h-4" />
                {isAr ? 'بيانات البروفايل الشخصي' : 'Profile Details'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="first_name" className={`text-foreground flex ${isAr ? 'justify-start' : 'justify-start'}`}>{t('auth.firstNameLabel')}</Label>
                  <Input
                    id="first_name"
                    placeholder={isAr ? 'مثال: خالد' : 'e.g. John'}
                    className="bg-background/40 border-border focus:border-indigo-500 text-foreground font-sans"
                    {...register('first_name')}
                  />
                  {errors.first_name && (
                    <p className="text-rose-500 text-xs mt-1">{errors.first_name.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="last_name" className={`text-foreground flex ${isAr ? 'justify-start' : 'justify-start'}`}>{t('auth.lastNameLabel')}</Label>
                  <Input
                    id="last_name"
                    placeholder={isAr ? 'مثال: العمر' : 'e.g. Doe'}
                    className="bg-background/40 border-border focus:border-indigo-500 text-foreground font-sans"
                    {...register('last_name')}
                  />
                  {errors.last_name && (
                    <p className="text-rose-500 text-xs mt-1">{errors.last_name.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="phone_number" className={`text-foreground flex items-center gap-1 ${isAr ? 'text-right' : 'text-left'}`}>
                    <Phone className="w-3.5 h-3.5 opacity-60" />
                    {t('auth.phoneNumberLabel')}
                  </Label>
                  <Input
                    id="phone_number"
                    placeholder="0566778899"
                    className="bg-background/40 border-border focus:border-indigo-500 text-foreground text-left font-sans"
                    dir="ltr"
                    {...register('phone_number')}
                  />
                  {errors.phone_number && (
                    <p className="text-rose-500 text-xs mt-1">{errors.phone_number.message}</p>
                  )}
                </div>
              </div>
            </div>

          </CardContent>

          <CardFooter className="flex flex-col gap-4 border-t border-border pt-6 pb-6 bg-card rounded-b-xl">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white transition-all py-6 font-semibold text-base rounded-xl cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className={`w-5 h-5 ${isAr ? 'ml-2' : 'mr-2'} animate-spin`} />
                  {isAr ? 'جاري تسجيل شركتك...' : 'Registering your company...'}
                </>
              ) : (
                t('auth.registerBtn')
              )}
            </Button>
            
            <p className="text-center text-sm text-muted-foreground w-full mt-2">
              {t('auth.alreadyHaveAccount')}{' '}
              <Link href="/login" className="text-indigo-400 hover:underline hover:text-indigo-300 font-medium">
                {t('nav.login')}
              </Link>
            </p>
          </CardFooter>
        </form>
        )}
      </Card>
    </div>
  );
}
