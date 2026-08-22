'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function NotFoundCompanyPage() {
  const [landingUrl, setLandingUrl] = useState('/');

  useEffect(() => {
    const host = window.location.host;
    const parts = host.split('.');
    
    // Remove the tenant subdomain to go back to the landing page
    if (host.includes('localhost') && parts.length > 1) {
       parts.shift();
       setLandingUrl(`${window.location.protocol}//${parts.join('.')}`);
    } else if (!host.includes('localhost') && parts.length > 2) {
       parts.shift();
       setLandingUrl(`${window.location.protocol}//${parts.join('.')}`);
    } else {
       setLandingUrl('/');
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-4xl font-bold text-red-600 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">الشركة غير موجودة</h2>
        <p className="text-gray-600 mb-8">
          عذراً، الرابط الذي تحاول الوصول إليه غير مرتبط بأي شركة مسجلة في نظام رافد.
          يرجى التأكد من صحة الرابط أو التواصل مع الدعم الفني.
        </p>
        
        <a 
          href={landingUrl} 
          className="inline-block bg-blue-600 text-white font-medium py-3 px-6 rounded-md hover:bg-blue-700 transition-colors"
        >
          العودة لصفحة الهبوط
        </a>
      </div>
    </div>
  );
}
