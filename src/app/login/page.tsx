'use client';

import React, { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from '@/components/ui/toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Lock, LogIn, ArrowRight, ArrowLeft } from 'lucide-react';
import { LanguageSelector } from '@/components/ui/LanguageSelector';

function LoginForm() {
  const { login } = useAuth();
  const { t, isAr } = useLanguage();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [landingUrl, setLandingUrl] = useState('/');

  React.useEffect(() => {
    // If on a subdomain, this will trigger the global 403 redirect if tenant is invalid
    api.get('/auth/tenant/verify').catch(() => {});

    // Calculate correct landing URL
    const host = window.location.host;
    const parts = host.split('.');
    if (host.includes('localhost') && parts.length > 1) {
       parts.shift();
       setLandingUrl(`${window.location.protocol}//${parts.join('.')}`);
    } else if (!host.includes('localhost') && parts.length > 2) {
       parts.shift();
       setLandingUrl(`${window.location.protocol}//${parts.join('.')}`);
    }
  }, []);

  // If redirect was triggered, check for callbackUrl
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const loginSchema = z.object({
    email: z.string().email({ message: t('auth.validation.emailInvalid') }),
    password: z.string().min(1, { message: t('auth.validation.passwordRequired') }),
  });

  type LoginFormValues = z.infer<typeof loginSchema>;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await api.post<{
        success: boolean;
        message: string;
        data: { token: string; user: any };
      }>('/auth/login', values);

      if (response.success && response.data) {
        toast.add({
          title: t('auth.toast.loginSuccessTitle'),
          description: t('auth.toast.loginSuccessDesc'),
          type: 'success',
        });
        login(response.data.token, response.data.user);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        // Show validation errors or authentication failures
        if (error.status === 422 && error.data?.data) {
          const apiErrors = error.data.data;
          Object.keys(apiErrors).forEach((key) => {
            setError(key as keyof LoginFormValues, {
              type: 'server',
              message: apiErrors[key][0],
            });
          });
        }
        
        toast.add({
          title: t('auth.toast.loginFailedTitle'),
          description: error.message || t('auth.toast.loginFailedDesc'),
          type: 'error',
        });
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
    <div className="relative min-h-screen flex items-center justify-center bg-background p-4 overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
        <a href={landingUrl}>
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-card rounded-xl px-4 h-10 gap-2 transition-colors cursor-pointer">
            {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {isAr ? 'العودة للرئيسية' : 'Back to Home'}
          </Button>
        </a>
        <LanguageSelector />
      </div>

      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-md border-border bg-card backdrop-blur-xl text-foreground shadow-2xl relative z-10">
        <CardHeader className="space-y-2 text-center pb-6 border-b border-border">
          <div className="mx-auto w-12 h-12 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-2 border border-indigo-500/30">
            <LogIn className="w-6 h-6 animate-pulse" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-foreground font-sans">{t('auth.loginTitle')}</CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            {t('auth.loginDesc')}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 pt-6">
            
            <div className="space-y-1">
              <Label htmlFor="email" className={`text-foreground flex items-center gap-1.5 mb-1 ${isAr ? 'text-right' : 'text-left'}`}>
                <Mail className="w-4 h-4 text-indigo-400" />
                {t('auth.emailLabel')}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="owner@example.com"
                className="bg-background/40 border-border focus:border-indigo-500 focus:ring-indigo-500/20 transition-all text-foreground font-sans"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-rose-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="password" className={`text-foreground flex items-center gap-1.5 ${isAr ? 'text-right' : 'text-left'}`}>
                  <Lock className="w-4 h-4 text-indigo-400" />
                  {t('auth.passwordLabel')}
                </Label>
                <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline transition-colors font-medium">
                  {isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="bg-background/40 border-border focus:border-indigo-500 focus:ring-indigo-500/20 transition-all text-foreground font-sans"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-rose-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

          </CardContent>

          <CardFooter className="flex flex-col gap-4 border-t border-border pt-6 pb-6 bg-card rounded-b-xl">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white transition-all py-6 font-semibold text-base rounded-xl"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className={`w-5 h-5 ${isAr ? 'ml-2' : 'mr-2'} animate-spin`} />
                  {t('auth.loggingIn')}
                </>
              ) : (
                t('auth.loginBtn')
              )}
            </Button>
            
            <p className="text-center text-sm text-muted-foreground w-full mt-2">
              {t('auth.noAccount')}{' '}
              <Link href="/register" className="text-indigo-400 hover:underline hover:text-indigo-300 font-medium">
                {t('auth.registerLink')}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="relative min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
