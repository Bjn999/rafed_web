'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const id = searchParams.get('id');
  const hash = searchParams.get('hash');
  const expires = searchParams.get('expires');
  const signature = searchParams.get('signature');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('جاري توثيق بريدك الإلكتروني...');

  useEffect(() => {
    if (!id || !hash) {
      setStatus('error');
      setMessage('رابط التحقق غير صالح أو غير مكتمل');
      return;
    }

    const verifyEmail = async () => {
      try {
        const params: Record<string, string> = {};
        if (expires) params.expires = expires;
        if (signature) params.signature = signature;

        const data = await api.get<{ message: string; success: boolean }>(`/email/verify/${id}/${hash}`, { params });

        setStatus('success');
        setMessage(data.message || 'تم توثيق البريد الإلكتروني بنجاح');
        
        // Redirect to dashboard after a few seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'حدث خطأ أثناء عملية التوثيق');
      }
    };

    verifyEmail();
  }, [id, hash, expires, signature, router]);

  return (
    <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-4">
      {status === 'loading' && (
        <>
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="text-muted-foreground">{message}</p>
        </>
      )}
      
      {status === 'success' && (
        <>
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-medium text-green-800">اكتمل التوثيق</h3>
            <p className="text-green-600">{message}</p>
            <p className="text-sm text-muted-foreground">جاري تحويلك إلى لوحة التحكم...</p>
          </div>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-medium text-destructive">فشل التوثيق</h3>
            <p className="text-destructive/80">{message}</p>
          </div>
          <Link href="/login" className={buttonVariants({ variant: 'outline', className: 'mt-4' })}>
            تسجيل الدخول وطلب رابط جديد
          </Link>
        </>
      )}
    </CardContent>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold tracking-tight">توثيق البريد الإلكتروني</CardTitle>
        </CardHeader>
        
        <Suspense fallback={<div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
          <VerifyEmailContent />
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
