import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Get the subdomain (if any)
  const parts = hostname.split('.');
  const isLocalhost = hostname.includes('localhost');
  const hasSubdomain = (isLocalhost && parts.length > 1) || (!isLocalhost && parts.length > 2);
  let subdomain = hasSubdomain ? parts[0] : null;
  
  // Ignore specific subdomains that are not tenants
  if (subdomain && ['www', 'api', 'admin'].includes(subdomain)) {
      subdomain = null;
  }

  // 1. If on a subdomain, prevent access to the landing page (root path /)
  if (subdomain && pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Validate tenant and handle auth pages on subdomains
  if (subdomain && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/auth/tenant/verify`, {
        headers: {
          'X-Tenant': subdomain,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        // Tenant is invalid, redirect to not-found-company
        return NextResponse.redirect(new URL('/not-found-company', request.url));
      } else {
        // Tenant is valid
        if (pathname.startsWith('/register')) {
          // Cannot register on a valid subdomain, redirect to login
          return NextResponse.redirect(new URL('/login', request.url));
        }
      }
    } catch (error) {
      console.error('Proxy tenant verification failed:', error);
    }
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
