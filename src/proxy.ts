import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Get the subdomain (if any)
  const parts = hostname.split('.');
  const isLocalhost = hostname.includes('localhost');
  const hasSubdomain = (isLocalhost && parts.length > 1) || (!isLocalhost && parts.length > 2);
  const subdomain = hasSubdomain ? parts[0] : null;

  // 1. If on a subdomain, prevent access to the landing page (root path /)
  if (subdomain && pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Protect the dashboard routes
  const isProtectedPath = pathname.startsWith('/dashboard');

  // Prevent logged-in users from visiting auth pages (login/register)
  const isAuthPath = pathname.startsWith('/login') || pathname.startsWith('/register');

  if (isProtectedPath && !token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/login',
    '/register',
  ],
};
