import type { Metadata } from 'next';
import { Tajawal } from 'next/font/google';
import { Providers } from '@/components/Providers';
import './globals.css';

const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '700', '800', '900'],
  variable: '--font-tajawal',
});

export const metadata: Metadata = {
  title: 'رافد | منصة إدارة المشاريع الهندسية والإنشائية',
  description: 'منصة هندسية متكاملة لمتابعة سير الأعمال، تنظيم فرق العمل، وإدارة مؤسستك بكفاءة.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
