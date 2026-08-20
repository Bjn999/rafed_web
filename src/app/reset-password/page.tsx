'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      setError('كلمة المرور غير متطابقة');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await api.post('/auth/reset-password', {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <CardContent className="pt-6">
        <div className="bg-destructive/15 text-destructive p-4 rounded-md text-center">
          رابط غير صالح أو منتهي الصلاحية.
        </div>
      </CardContent>
    );
  }

  return (
    <CardContent>
      {success ? (
        <div className="bg-primary/10 text-primary p-4 rounded-md flex flex-col items-center gap-3 text-center">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <p className="font-medium">تم إعادة تعيين كلمة المرور بنجاح!</p>
          <p className="text-sm">جاري التوجيه إلى صفحة تسجيل الدخول...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-right block w-full">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
              className="text-right"
              readOnly
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-right block w-full">كلمة المرور الجديدة</Label>
            <div className="relative">
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                dir="ltr"
                className="pl-10 text-right"
                disabled={loading}
              />
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password_confirmation" className="text-right block w-full">تأكيد كلمة المرور</Label>
            <div className="relative">
              <Input
                id="password_confirmation"
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                minLength={8}
                dir="ltr"
                className="pl-10 text-right"
                disabled={loading}
              />
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري التحديث...
              </>
            ) : (
              'حفظ كلمة المرور'
            )}
          </Button>
        </form>
      )}
    </CardContent>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-2xl font-bold tracking-tight">إعادة تعيين كلمة المرور</CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            أدخل كلمة المرور الجديدة لحسابك
          </CardDescription>
        </CardHeader>
        
        <Suspense fallback={<div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>}>
          <ResetPasswordForm />
        </Suspense>
        
        <CardFooter className="flex justify-center border-t pt-6 pb-2">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-primary hover:underline flex items-center gap-1 transition-colors">
            العودة إلى تسجيل الدخول
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
